import { matchPath } from "react-router";
import type { ProsemirrorData } from "@linear/editor/types";
import { MarkdownTransformer } from "@linear/editor/markdown/MarkdownTransformer";
import { isEmptyEditorJSON } from "@linear/editor/utils/trimEditorJSON";
import type { CustomerNeedSourceMetadata } from "@linear/common/models/CustomerNeedSourceMetadata";
import { stripMarkdown } from "@linear/common/utils/stripMarkdown";
import type { EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import { RoutePaths } from "@linear/common/Routes";
import { ReadOnlyReason } from "@linear/common/models/ReadOnlyReason";
import { Routing } from "#injected/Routing";
import { Comment } from "#models/Comment";
import { Issue } from "#models/Issue";
import {
  ClientModel,
  Property,
  LazyManyToOne,
  LazyOneToOne,
  OneSidedReference,
  OneToMany,
  Computed,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import type { Hydrated } from "#models/base/ModelTypes";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { LazyReference } from "#models/hydration/Lazy";
import { Customer } from "#models/Customer";
import { Project } from "#models/Project";
import { Attachment } from "#models/Attachment";
import { Organization } from "#models/Organization";
import { User } from "#models/User";
import type { TransactionMutation } from "#models/sync/transactions/Transaction";
import { CustomerNeedPriority, CustomerNeedPrioritySerializer } from "#models/CustomerNeedPriority";
import { JSONSerializer } from "#models/serialization/Serialization";
import type { InlineFindable } from "#models/InlineFindable";
import { ProjectAttachment } from "#models/ProjectAttachment";
import { deburr } from "#utils/deburr";
import type { Collection } from "#models/collections/Collection";
import type { ModelSaveOptions } from "#models/sync/SyncClient";
import { Notification } from "./Notification";
/**
 * A model representing a customer need.
 */
@ClientModel("CustomerNeed")
export class CustomerNeed extends DeletableModel implements InlineFindable {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The priority of the need. */
  @Property({ serializer: CustomerNeedPrioritySerializer, default: CustomerNeedPriority.createFromPriority(0) })
  public priority: CustomerNeedPriority;

  /**
   * Optional virtual URL associated with the need, when a need is manually created.
   * Will be used to create an attachment. Consumers should read the URL from attachment.url.
   */
  @Property({ isVirtual: true })
  public attachmentUrl?: string;

  /** The content of the need in Prosemirror document. */
  @Property({ serializer: JSONSerializer, shallowObservation: true })
  public bodyData?: ProsemirrorData;

  /** The creator of the customer need, when a need is manually created. */
  @OneSidedReference(() => User, {
    persistence: "none",
    nullable: true,
  })
  public creator?: User;

  /** Customer associated with this need. */
  @LazyManyToOne(() => Customer, "needs", { nullable: false, optional: true, indexed: true })
  public customer?: LazyReference<Customer>;

  /** Issue associated with this need, if any. */
  @LazyManyToOne(() => Issue, "needs", {
    nullable: false,
    optional: true,
    indexed: true,
    trait: "useForPartialIndex",
  })
  public issue?: LazyReference<Issue>;

  /** Comment associated with this need, if any. */
  @LazyManyToOne(() => Comment, "needs", {
    nullable: false,
    optional: true,
    indexed: true,
    persistence: "createOnly",
  })
  public comment?: LazyReference<Comment>;

  /** Project associated with this need, if any. */
  @LazyManyToOne(() => Project, "needs", {
    nullable: false,
    optional: true,
    indexed: true,
    trait: "useForPartialIndex",
  })
  public project?: LazyReference<Project>;

  /** Attachment associated with this need, if any. */
  @LazyOneToOne(() => Attachment, "need", { nullable: true, indexed: true, persistence: "createOnly" })
  public attachment?: LazyReference<Attachment>;

  /** The project attachment that this need is referencing. */
  @LazyOneToOne(() => ProjectAttachment, "need", { nullable: true, indexed: true, persistence: "none" })
  public projectAttachment?: LazyReference<ProjectAttachment>;

  /** Metadata about what facilitated the creation of the customer need. */
  @Property({ persistence: "none" })
  public sourceMetadata?: CustomerNeedSourceMetadata;

  /** Issue previously associated with this need, if any. */
  @LazyManyToOne(() => Issue, "formerNeeds", {
    nullable: false,
    optional: true,
    indexed: true,
    persistence: "none",
  })
  public originalIssue?: LazyReference<Issue>;

  /** The notifications for customer need. */
  @OneToMany(() => Notification)
  public readonly notifications: Collection<Notification>;

  /** The organization that this need is associated with. */
  @OneSidedReference(() => Organization, { optional: false, nullable: false, persistence: "none" })
  public organization: Organization;

  /**
   * Factory method to create a new customer need.
   *
   * @param props The properties to create the customer need with.
   * @returns The created customer need.
   */
  public static create(props: CreateCustomerNeedProps): Hydrated<CustomerNeed> {
    const customerNeed = CustomerNeed.createEmpty();

    customerNeed.organization = props.organization;
    customerNeed.creator = props.creator;
    customerNeed.priority = CustomerNeedPriority.createFromPriority(0);

    if (props.customer) {
      customerNeed.customer = LazyReference.wrap(props.customer);
    }
    if (props.issue) {
      customerNeed.issue = LazyReference.wrap(props.issue);
    }
    if (props.project) {
      customerNeed.project = LazyReference.wrap(props.project);
    }
    if (props.attachment) {
      customerNeed.attachment = LazyReference.wrap(props.attachment);
    }
    if (props.attachmentUrl) {
      customerNeed.attachmentUrl = props.attachmentUrl;
    }
    if (props.bodyData) {
      customerNeed.bodyData = props.bodyData;
    }

    return customerNeed;
  }

  /**
   * Returns the effective attachment for this need, whether it's an issue attachment or project attachment.
   * A need can only have one type of attachment at a time.
   */
  @Computed
  public get effectiveAttachment(): Attachment | ProjectAttachment | undefined {
    return this.attachment?.value ?? this.projectAttachment?.value;
  }

  /**
   * The effective URL of the need, which is the URL of the attachment linked to the need.
   */
  public get effectiveUrl(): string | undefined {
    return this.effectiveAttachment?.url;
  }

  /**
   * Returns whether the source URL can be edited on this customer request.
   *
   * Source editing is allowed when there is no existing attachment yet, or when the current attachment was created
   * manually from Linear (legacy records without source metadata are treated as editable).
   */
  public get canEditSourceUrl(): boolean {
    const attachmentSource = this.effectiveAttachment?.source?.type;
    return !attachmentSource || attachmentSource === "api";
  }

  /** Returns if a customer need cannot be edited anymore. Expected to be called only on hydrated models. */
  public override get isReadOnly(): ReadOnlyReason | undefined {
    if (this.isArchived) {
      return ReadOnlyReason.archived;
    }
    return this.issue?.value?.isReadOnly ?? this.project?.value?.isReadOnly;
  }

  /**
   * Return whether the need is empty, meaning it has no content, no priority, and no URL.
   */
  public isEmpty(): boolean {
    const isEmpty =
      this.priority.isNoPriority && !this.effectiveUrl && (!this.bodyData || isEmptyEditorJSON(this.bodyData));

    return isEmpty;
  }

  /**
   * Returns whether the need is directly associated with a project, without being linked to a specific issue.
   */
  public get linkedToProjectOnly(): boolean {
    return !!this.project?.id && !this.issue;
  }

  /**
   * Returns whether the need has manual body content.
   */
  public get hasManualBodyContent(): boolean {
    return !!this.bodyData && !isEmptyEditorJSON(this.bodyData);
  }

  /**
   * Returns the body content of the need, if any.
   */
  public get bodyContent(): ProsemirrorData | undefined {
    if (this.hasManualBodyContent) {
      return this.bodyData;
    }

    return this.attachmentBodyContent;
  }

  /**
   * Returns the body content of the need, if any, from the attachment.
   */
  public get attachmentBodyContent(): ProsemirrorData | undefined {
    const firstMessageBody = this.effectiveAttachment?.strippedFirstAttachmentMessageBody;

    const messageData = MarkdownTransformer.parseToProsemirrorData(firstMessageBody || "");

    if (messageData && !isEmptyEditorJSON(messageData)) {
      return messageData;
    }

    return undefined;
  }

  /**
   * Returns whether the need has both manual and attachment content.
   */
  public get hasBothManualAndAttachmentContent(): boolean {
    return this.hasManualBodyContent && this.attachmentBodyContent !== undefined;
  }

  /**
   * The subtitle of the need, used for display purposes.
   */
  public subtitle(truncateLength: number = 100): string {
    if (this.bodyData) {
      return stripMarkdown(MarkdownTransformer.serialize(this.bodyData), { truncateLength, preserveCodeMarks: true });
    }

    const firstMessageBody = this.effectiveAttachment?.strippedFirstAttachmentMessageBody;

    if (firstMessageBody) {
      return stripMarkdown(firstMessageBody, { truncateLength, preserveCodeMarks: true });
    }

    return "";
  }

  /**
   * The source user email of the need.
   */
  public get sourceUserEmail(): string | undefined {
    return (
      this.sourceMetadata?.userMetadata?.email ??
      this.effectiveAttachment?.metadata?.attributes?.find(attr => attr.name === "User email")?.value?.toString()
    );
  }

  /**
   * The customer need source metadata, typed as EntitySourceMetadata.
   * The main difference between EntitySourceMetadata and CustomerNeedSourceMetadata is that type is optional on
   * CustomerNeedSourceMetadata. EntitySourceMetadata is meant to be entirely null for issues/projects/... created
   * manually from the client. But that's not the case for CustomerNeed where we can have some source metadata defined
   * even when the need is created manually. This getter here is only useful if you plan to render the actor of the need
   * using a component that expects EntitySourceMetadata.
   */
  public get externalSourceMetadata(): EntitySourceMetadata | undefined {
    const sourceType = this.sourceMetadata?.type;
    if (!sourceType) {
      return;
    }
    return {
      ...this.sourceMetadata,
      type: sourceType,
      emailIntakeMetadata: undefined,
    };
  }

  @Computed
  private get baseSearchableText(): string {
    const issueTitle = this.issue?.value?.title || "";
    const issueIdentifier = this.issue?.value?.identifier || "";
    const bodyAsMarkdown = this.bodyContent ? MarkdownTransformer.serialize(this.bodyContent) : "";

    return `${issueTitle} ${issueIdentifier} ${bodyAsMarkdown}`;
  }

  @Computed
  private get customerPageSearchableText(): string {
    const projectName = this.project?.value?.name || "";
    return deburr(`${projectName} ${this.baseSearchableText}`).toLowerCase();
  }

  @Computed
  private get projectPageSearchableText(): string {
    const customerName = this.customer?.value?.name || "";
    return deburr(`${customerName} ${this.baseSearchableText}`).toLowerCase();
  }

  /**
   * Returns whether the need matches the query.
   *
   * The searchable text is different depending on the page, as we don't want to match against customer name in the
   * customer page and project name in the project page.
   *
   * Inline search matches a need against:
   * - Customer name (not in customer page)
   * - Project name (not in project page)
   * - Issue title and identifier
   * - Body content.
   */
  public matchInlineFind(query: string): boolean {
    const pathname = Routing.location.pathname;

    if (matchPath({ path: RoutePaths.customer }, pathname)) {
      return this.customerPageSearchableText.includes(query);
    }

    return this.projectPageSearchableText.includes(query);
  }

  public override beforeSave(insert: boolean): void {
    super.beforeSave(insert);

    if (insert) {
      /**
       * Marks the customer need as important if the issue/project already has important needs from the same customer.
       * We want to ensure that if a need is moved from one issue to another, it retains its priority,
       * and doesn't affect the displayed importance at the issue/project level.
       */
      if (
        this.issue?.value?.needs?.some(
          need => need.priority.isImportant && !!this.customer?.id && need.customer?.id === this.customer?.id
        ) ||
        this.project?.value?.needs?.some(
          need => need.priority.isImportant && !!this.customer?.id && need.customer?.id === this.customer?.id
        )
      ) {
        this.priority = CustomerNeedPriority.createFromPriority(1);
      }
    }
  }

  /**
   * Returns a GraphQL mutation string that can be used to create the model.
   *
   * @param usedVariableNames A set of variable names that are already in use. This is used to avoid name collisions.
   * @returns A GraphQL mutation that can be used to create the model.
   */
  public override createMutation(_usedVariableNames: Set<string>): TransactionMutation {
    let mutation;

    function createNeedMutation(mutationName: string, properties: Record<string, string | number>) {
      const mutationArguments = Object.entries(properties)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ");
      return `${mutationName}(input: {${mutationArguments}}) { lastSyncId }`;
    }

    if (this.attachment?.id) {
      // If we create the need out of an attachment, use a dedicated mutation that takes care of creating the need
      // properly
      mutation = createNeedMutation("customerNeedCreateFromAttachment", {
        attachmentId: this.attachment.id,
      });
    } else {
      return super.createMutation(_usedVariableNames);
    }

    this.observePropertyChanges();
    return mutation;
  }

  /**
   * Saves updates to the customer need.
   *
   * @param createIfNecessary If this is set to true, a new model will be added to the store. If this is false and
   * the model hasn't been added to the store, no actions will be undertaken.
   *
   * @param options.additionalUpdateArgs Optionally define whether to clear the existing source attachment.
   *
   * @returns A transaction that is responsible for persisting the model to the backend. Transactions are queued
   * and might not immediately execute.
   */
  public override save(createIfNecessary = false, options?: ModelSaveOptions<{ clearAttachment?: boolean }>) {
    return super.save(createIfNecessary, options);
  }
}

/** Props for creating customer needs. */
type CreateCustomerNeedProps = {
  /** Organization the customer need belongs to. */
  organization: Organization;
  /** The creator of the need, if any. */
  creator?: User;
  /** The customer associated with the need. */
  customer?: Customer;
  /** The issue associated with the need. */
  issue?: Issue;
  /** The project associated with the need. */
  project?: Project;
  /** The attachment backing the need. */
  attachment?: Attachment;
  /** The URL of the attachment backing the need. */
  attachmentUrl?: string;
  /** The body data associated with the need. */
  bodyData?: ProsemirrorData;
};

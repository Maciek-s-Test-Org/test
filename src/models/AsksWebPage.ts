import type { ProsemirrorData } from "@linear/editor/types";
import { Organization } from "#models/Organization";
import { AsksWebSettings } from "#models/AsksWebSettings";
import { AsksWebPageToTemplate } from "#models/AsksWebPageToTemplate";
import { User } from "#models/User";
import {
  ClientModel,
  LazyManyToOne,
  LazyOneToMany,
  ManyToOne,
  OneSidedReference,
  Property,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import type { LazyCollection } from "#models/collections/LazyCollection";
import type { LazyReference } from "#models/hydration/Lazy";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { ModelSaveOptions } from "#models/sync/SyncClient";

/**
 * A model representing a page within an Asks web form.
 */
@ClientModel("AsksWebPage")
export class AsksWebPage extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;

  /** The title of the page. */
  @Property({ persistence: "createAndUpdate", default: "" })
  public title: string;

  /** The page's URL slug. */
  @Property({ persistence: "createAndUpdate", default: "" })
  public slug: string;

  /** The description of the page as a Prosemirror document. */
  @Property({ persistence: "createAndUpdate" })
  public descriptionData?: ProsemirrorData;

  /** The auto-reply message sent when an issue is created. */
  @Property({ persistence: "createAndUpdate" })
  public issueCreatedAutoReply?: string;

  /**
   * Whether the auto-reply for issue creation is enabled.
   *
   * @deprecated The created-issue auto-reply is always sent for Asks Web pages.
   * This field will be removed in a follow-up cleanup.
   */
  @Property({ persistence: "createAndUpdate", default: false })
  public issueCreatedAutoReplyEnabled: boolean;

  /** The auto-reply message sent when an issue is completed. */
  @Property({ persistence: "createAndUpdate" })
  public issueCompletedAutoReply?: string;

  /** Whether the auto-reply for issue completion is enabled. */
  @Property({ persistence: "createAndUpdate", default: false })
  public issueCompletedAutoReplyEnabled: boolean;

  /** The auto-reply message sent when an issue is canceled. */
  @Property({ persistence: "createAndUpdate" })
  public issueCanceledAutoReply?: string;

  /** Whether the auto-reply for issue cancellation is enabled. */
  @Property({ persistence: "createAndUpdate", default: false })
  public issueCanceledAutoReplyEnabled: boolean;

  /** The user who created the page. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public creator?: User;

  /** The organization that this page belongs to. */
  @ManyToOne(() => Organization, "asksWebPages", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public organization: Organization;

  /** The Asks web settings this page belongs to. */
  @LazyManyToOne(() => AsksWebSettings, "pages", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public asksWebSettings: LazyReference<AsksWebSettings>;

  /**
   * Returns the public URL of this asks web page.
   */
  public get url(): string {
    return `${this.asksWebSettings.value!.asksUrl}/${this.slug.trim()}`;
  }

  /** Connections to templates associated with this Asks web page. */
  @LazyOneToMany(() => AsksWebPageToTemplate, { index: "asksWebPageId" })
  public readonly asksWebPageToTemplates: LazyCollection<AsksWebPageToTemplate>;

  /**
   * Saves updates to the AsksWebPage.
   *
   * @param createIfNecessary If true, creates the model when it does not yet exist.
   * @param options.additionalCreationArgs.templateIds Optional template IDs to associate on page creation.
   * @returns A transaction for persisting the model.
   */
  public override save(createIfNecessary: boolean = false, options?: ModelSaveOptions<{ templateIds?: string[] }>) {
    return super.save(createIfNecessary, options);
  }
}

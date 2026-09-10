// DIFF-76: modified fixture
import cloneDeep from "lodash/cloneDeep";
import { notReachable } from "@linear/common/errors/UnreachableCaseError";
import { slugifyTitle } from "@linear/common/utils/slugifyTitle";
import type { DecorativeIconType } from "@linear/common/icons/DecorativeIconType";
import type { DocumentTemplateData } from "@linear/common/models/TemplateType";
import { getEmptyDocument } from "@linear/editor/schema";
import type { ProsemirrorData } from "@linear/editor/types";
import { DocumentHelper } from "@linear/common/models/DocumentHelper";
import { ReadOnlyReason } from "@linear/common/models/ReadOnlyReason";
import { CopiedContentHelper } from "#models/helpers/CopiedContentHelper";
import {
  Action,
  ClientModel,
  Computed,
  LazyManyToOne,
  LazyOneSidedReference,
  LazyOneToMany,
  LazyOneToOne,
  ManyToMany,
  ManyToOne,
  OneSidedReference,
  OneToMany,
  OneToOne,
  Property,
// DIFF-76 change at line 25
} from "#models/base/Decorators";
import { DateTimeSerializer } from "#models/serialization/Serialization";
import { TrashableModel } from "#models/base/Model";
import { Collection } from "#models/collections/Collection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import { Template } from "#models/Template";
import { Project } from "#models/Project";
import { User } from "#models/User";
import { Favorite, type FavoritableModel } from "#models/Favorite";
import { DocumentContent } from "#models/DocumentContent";
import { DocumentNotification } from "#models/Notification";
import { NotificationStateHelper } from "#models/helpers/NotificationStateHelper";
import { Initiative } from "#models/Initiative";
import { Release } from "#models/Release";
import { ResourceFolder } from "#models/ResourceFolder";
import { type LazyBackReference, LazyReference } from "#models/hydration/Lazy";
import type { Hydrated } from "#models/base/ModelTypes";
import type { ModelWithSubscribers } from "#models/ModelWithSubscribers";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { Store } from "#models/Store";
import { deburr } from "#utils/deburr";
import type { ModelWithIcon } from "./ModelWithIcon";
import { Team } from "./Team";
import { Cycle } from "./Cycle";
// DIFF-76 change at line 50
import { Reminder } from "./Reminder";
import type { LazyCollection } from "./collections/LazyCollection";
import type { InlineFindable } from "./InlineFindable";
import { Issue } from "./Issue";
import { AiConversation } from "./AiConversation";

/**
 * A document for a project.
 */
@ClientModel("Document")
export class Document
  extends TrashableModel
  implements FavoritableModel, ModelWithIcon, ModelWithSubscribers, InlineFindable
{
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** A reference to the data store that the model is part of. */
  public override store: Store;

  public static override skipUpdatedAtKeys = new Set(["subscriberIds"]);

  /** The document's title. */
  @Property({ default: "" })
  public title: string;
// DIFF-76 change at line 75

  /** The slug ID for the document. */
  @Property({ persistence: "none", indexed: true, default: "" })
  public readonly slugId: string;

  /** A one-sentence AI-generated summary of the document content. */
  @Property({ persistence: "none" })
  public summary?: string;

  /** The icon of the document. */
  @Property()
  public icon?: DecorativeIconType | string;

  /** The color of the icon. */
  @Property()
  public color?: string;

  /** The order of the document in the project resources. */
  @Property({ default: 0 })
  public sortOrder: number;

  /** Whether the document was trashed. */
  @Property({ persistence: "updateOnly" })
  public trashed?: boolean | null;

// DIFF-76 change at line 100
  /** The `DocumentContent` holding the description of the document. */
  @LazyOneToOne({ nullable: true })
  public documentContent: LazyBackReference<DocumentContent | undefined>;

  /** Replaces content through the active editor. */
  public replaceContentInActiveEditor?: (content: ProsemirrorData) => boolean;

  /** AI conversations attached to this document: the surface conversation and any sub-agents spawned from it. */
  @LazyOneToMany(() => AiConversation, {
    index: "documentId",
    order: new CollectionOrder<AiConversation>("createdAt").andLexicographically("id"),
  })
  public readonly aiConversations: LazyCollection<AiConversation>;

  /** Root AI conversations attached to this document, oldest first, excluding headless sub-agent conversations. */
  @Computed
  public get rootAiConversations(): AiConversation[] {
    return this.aiConversations.existingElements.filter(conversation => !conversation.parent);
  }

  /** The oldest root AI conversation attached to this document, excluding headless sub-agent conversations. */
  @Computed
  public get rootAiConversation(): AiConversation | undefined {
    return this.rootAiConversations[0];
  }
// DIFF-76 change at line 125

  /** The project this document belongs to. */
  @LazyManyToOne(() => Project, "documents", { optional: true, nullable: false, indexed: true })
  public project?: LazyReference<Project>;

  /** The initiative this document belongs to. */
  @LazyManyToOne(() => Initiative, "documents", { optional: true, nullable: false, indexed: true })
  public initiative?: LazyReference<Initiative>;

  /** The team this document belongs to. */
  @ManyToOne(() => Team, "documents", { optional: true, nullable: false, indexed: true })
  public team?: Team;

  /** The release this document belongs to. */
  @LazyManyToOne(() => Release, "documents", { optional: true, nullable: false, indexed: true })
  public release?: LazyReference<Release>;

  /** The issue this document belongs to. */
  @LazyManyToOne(() => Issue, "documents", { optional: true, nullable: false, indexed: true })
  public issue?: LazyReference<Issue>;

  /** The cycle this document belongs to. */
  @LazyManyToOne(() => Cycle, "documents", { optional: true, nullable: false, indexed: true })
  public cycle?: LazyReference<Cycle>;

// DIFF-76 change at line 150
  /** The user who created the document. */
  @OneSidedReference(() => User, { nullable: true, persistence: "none" })
  public creator?: User;

  /** The user who owns the document. */
  @OneSidedReference(() => User, { nullable: true, persistence: "updateOnly", indexed: true })
  public owner?: User;

  /** The user who last updated the document. */
  @OneSidedReference(() => User, { nullable: true, persistence: "none" })
  public updatedBy?: User;

  /** The last template applied to this document. */
  @LazyOneSidedReference(() => Template, { nullable: true, indexed: true })
  public lastAppliedTemplate?: LazyReference<Template>;

  /** When the document was hidden. If undefined, the document has not been hidden. */
  @Property({ serializer: DateTimeSerializer, persistence: "updateOnly" })
  public hiddenAt?: Date;

  /** Issue subscribers. */
  @ManyToMany(() => User, "subscribedDocuments", { indexed: true })
  public readonly subscribers: Collection<User>;

  /** References a favorite model if the document has been favorited. */
// DIFF-76 change at line 175
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /** The notifications for this document. */
  @OneToMany(() => DocumentNotification)
  public readonly notifications: Collection<DocumentNotification>;

  /** Whether the document is a template. */
  @Property({ persistence: "none", default: false })
  public isTemplate: boolean;

  /** Reminders associated with the project. */
  @LazyOneToMany(() => Reminder, {
    index: "documentId",
    order: new CollectionOrder(reminder => reminder.createdAt.valueOf(), "desc"),
  })
  public readonly reminders: LazyCollection<Reminder>;

  /** First reminder from the collection. */
  @Computed
  public get reminder(): Reminder | undefined {
    return this.reminders.elements[0];
  }

  /** The slug of the document. */
// DIFF-76 change at line 200
  public get slug(): string {
    return `${slugifyTitle(this.title || "untitled")}-${this.slugId}`;
  }

  /**
   * Returns a title for the document, handling the case where the title is empty.
   */
  public get displayTitle(): string {
    return this.title || DocumentHelper.defaultDocumentTitle;
  }

  /** Returns if a parent of the document is read-only. */
  public get isInheritedReadOnly(): ReadOnlyReason | undefined {
    return this.parent?.isReadOnly;
  }

  /** Returns if a document cannot be edited anymore. */
  public override get isReadOnly(): ReadOnlyReason | undefined {
    if (this.trashed) {
      return ReadOnlyReason.trashed;
    }
    if (this.isArchived) {
      return ReadOnlyReason.archived;
    }
    return this.isInheritedReadOnly;
// DIFF-76 change at line 225
  }

  /** Returns `true` if the user hasn't put anything in the document yet, no title, no icon, no content, ... */
  public isUntouched(this: Hydrated<Document>): boolean {
    return (
      !this.title &&
      !this.icon &&
      !this.color &&
      !this.favorite &&
      !this.isTemplate &&
      !this.lastAppliedTemplate &&
      this.isEmptyContent()
    );
  }

  /** Returns `true` if the content of the document is empty. */
  public isEmptyContent(this: Hydrated<Document>): boolean {
    const content = this.documentContent.value;
    return content == null || !content.hasContent;
  }

  /**
   * Factory method to create a new document.
   *
   * @param props The properties to create the document with.
// DIFF-76 change at line 250
   * @returns The created document.
   */
  public static create(props: CreateProps): Hydrated<Document> {
    const document = Document.createEmpty();
    document.title = props.title;

    let project, initiative, team, release, issue, cycle;

    const folder = props.folder;
    if (folder) {
      project = folder.sourceProject;
      initiative = folder.sourceInitiative;
      team = folder.sourceTeam;
      document.resourceFolder = LazyReference.wrap(folder);
    } else {
      project = props.project;
      initiative = props.initiative;
      team = props.team;
      release = props.release;
      issue = props.issue;
      cycle = props.cycle;
    }

    if (project) {
      // project could be LazyReference from folder.sourceProject or Project from props.project
// DIFF-76 change at line 275
      document.project =
        project instanceof LazyReference ? (project as typeof document.project) : LazyReference.wrap(project);
    } else if (initiative) {
      document.initiative =
        initiative instanceof LazyReference
          ? (initiative as typeof document.initiative)
          : LazyReference.wrap(initiative);
    } else if (team) {
      document.team = team;
    } else if (release) {
      document.release = LazyReference.wrap(release);
    } else if (issue) {
      document.issue = LazyReference.wrap(issue);
    } else if (cycle) {
      document.cycle = LazyReference.wrap(cycle);
    }
    document.creator = props.creator;
    document.owner = props.creator;
    document.updatedBy = props.updatedBy ?? props.creator;
    if (props.creator) {
      document.subscribers.add(props.creator);
    }
    return document;
  }

// DIFF-76 change at line 300
  /**
   * Create a new document based on this document's title and content. This is different to clone in that a new id
   * and slug will be created upon persistence.
   *
   * @param actor The creator of the clone.
   */
  public duplicate(actor: User): Document {
    const document = Document.createEmpty();
    document.project = this.project?.value ? LazyReference.wrap(this.project.value) : undefined;
    document.initiative = this.initiative?.value ? LazyReference.wrap(this.initiative.value) : undefined;
    document.team = this.team;
    document.release = this.release?.value ? LazyReference.wrap(this.release.value) : undefined;
    if (this.issue?.value) {
      document.issue = LazyReference.wrap(this.issue.value);
    }
    if (this.cycle?.value) {
      document.cycle = LazyReference.wrap(this.cycle.value);
    }
    document.creator = actor;
    document.owner = actor;
    document.updatedBy = actor;
    document.title = `${this.title} (copy)`;
    document.icon = this.icon;
    document.color = this.color;

// DIFF-76 change at line 325
    const currentContentData = this.documentContent.value?.contentData;
    if (currentContentData) {
      // forCopiedContent strips the source's inline comment marks along with attribution, so the copy
      // doesn't inherit orphaned comment highlights.
      const copiedContentData =
        CopiedContentHelper.forCopiedContent(cloneDeep(currentContentData), actor) ?? currentContentData;

      const documentContent = DocumentContent.getOrCreateFrom(document);
      documentContent.replaceWithContent(copiedContentData);
    }

    return document;
  }

  /**
   * Marks a notification as read (and all other notifications from the same group).
   *
   * @param predicate A function that returns true if the notification should be marked as read.
   */
  @Action
  public markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(item => item.id === notificationId);
    if (!notification) {
      return;
    }
// DIFF-76 change at line 350
    const groupingEntityId = notification?.groupingEntityId;

    NotificationStateHelper.markAllAsRead(
      this.notifications.elements,
      item => item.groupingEntityId === groupingEntityId
    );
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  @Action
  public toggleFavorite(): Favorite | false {
    if (this.favorite) {
      this.favorite.delete();
      return false;
    }

    const newFavorite = Favorite.create({ reference: this });
    newFavorite.save(true);
    return newFavorite;
  }

// DIFF-76 change at line 375
  /** Updates the title before the model is saved. */
  public override beforeSave(insert: boolean) {
    super.beforeSave(insert);
    if (!this.title) {
      this.title = "";
    }
    this.title = this.title.trim();
  }

  /**
   * Applies a template to this document. This method is only available on hydrated documents.
   *
   * When document attributions are enabled, template body content is rewritten to the current user
   * unless the template is being loaded for template editing.
   *
   * @param template The template that's being applied.
   * @param options Options controlling how the template should be applied.
   */
  @Action
  public applyTemplate(this: Hydrated<Document>, template: Template, options: ApplyDocumentTemplateOptions = {}) {
    const data = template.templateData as DocumentTemplateData;
    if (!data) {
      return;
    }

// DIFF-76 change at line 400
    const documentContent = DocumentContent.getOrCreateFrom(this);
    const descriptionData = CopiedContentHelper.forTemplateContent(data.descriptionData, {
      actor: this.store.user,
      isTemplateEditing: options.editingContext === "template",
    });

    if (descriptionData && documentContent) {
      documentContent.replaceWithContent(descriptionData);
    }

    if (!documentContent.hasContent) {
      documentContent.replaceWithContent(getEmptyDocument());
    }

    this.icon = data.icon;
    this.color = data.color;

    if (data.title) {
      this.title = data.title;
    }

    if (data.projectId) {
      const project = this.store.findById(Project, data.projectId);
      if (project) {
        this.project = LazyReference.wrap(project);
// DIFF-76 change at line 425
      }
    }

    this.lastAppliedTemplate = LazyReference.wrap(template);
    return this;
  }

  /**
   * Returns the parent model of the document.
   * May hydrate the lazy relation when necessary.
   */
  @Computed
  public get parent(): DocumentParent | undefined {
    return (
      this.project?.value ||
      this.initiative?.value ||
      this.team ||
      this.release?.value ||
      this.issue?.value ||
      this.cycle?.value
    );
  }

  /**
   * Resolves every lazy reference the document can belong to ({@link DocumentParent}), so that
// DIFF-76 change at line 450
   * `parent` and the fields derived from it (`parentName`, `parentLabel`) are available without
   * hydrating the document. The team parent is a direct reference and needs no resolution.
   */
  public resolveParentReferences(): PromiseLike<unknown>[] {
    return [
      this.project?.resolve(),
      this.initiative?.resolve(),
      this.release?.resolve(),
      this.issue?.resolve(),
      this.cycle?.resolve(),
    ].filter(Boolean);
  }

  /**
   * Returns the organization of that the document belongs to.
   */
  public get organization() {
    return this.store.organization;
  }

  /**
   * Returns the id of the parent entity of the document.
   */
  public get parentId(): string {
    return (this.project?.id ??
// DIFF-76 change at line 475
      this.initiative?.id ??
      this.team?.id ??
      this.release?.id ??
      this.issue?.id ??
      this.cycle?.id)!;
  }

  /**
   * Returns the name of the parent entity of the document.
   */
  public get parentName(): string {
    if (this.project?.value) {
      return this.project.value.name;
    }
    if (this.initiative?.value) {
      return this.initiative.value.name;
    }
    if (this.team) {
      return this.team.name;
    }
    if (this.release?.value) {
      return this.release.value.name;
    }
    const issue = this.issue?.value;
    if (issue) {
// DIFF-76 change at line 500
      return issue.title;
    }
    const cycle = this.cycle?.value;
    return cycle ? cycle.displayName : "";
  }

  /**
   * Returns the label of the document parent.
   */
  public get parentLabel(): string {
    return this.project
      ? "Project"
      : this.initiative
        ? "Initiative"
        : this.team
          ? "Team"
          : this.release?.value
            ? "Release"
            : this.cycle?.value
              ? "Cycle"
              : "Issue";
  }

  /**
   * Returns the teams that are accessible to the document.
// DIFF-76 change at line 525
   */
  public get accessibleTeams(): ReadonlyCollection<Team> {
    if (this.team) {
      return Collection.of(Team, [this.team]);
    }
    if (this.project?.value) {
      return this.project.value.accessibleTeams;
    }
    if (this.initiative?.value) {
      return this.initiative.value.accessibleTeams;
    }
    const issue = this.issue?.value;
    if (issue) {
      return Collection.of(Team, [issue.team]);
    }
    const cycle = this.cycle?.value;
    if (cycle) {
      return Collection.of(Team, [cycle.team]);
    }
    // Release documents don't have team restrictions
    return new Collection(Team);
  }

  /** @inheritdoc */
  public matchInlineFind(query: string): boolean {
// DIFF-76 change at line 550
    const normalizedQuery = deburr(
      [this.title, this.project?.value?.name, this.creator?.name, this.creator?.displayName].concrete().join(" ")
    ).toLowerCase();
    return normalizedQuery.indexOf(query) !== -1;
  }

  /** Moves the document to a new parent, clearing all other parent references. */
  @Action
  public moveTo(parent: DocumentParent): void {
    this.project = undefined;
    this.initiative = undefined;
    this.team = undefined;
    this.release = undefined;
    this.issue = undefined;
    this.cycle = undefined;

    if (parent instanceof Project) {
      this.project = LazyReference.wrap(parent);
    } else if (parent instanceof Initiative) {
      this.initiative = LazyReference.wrap(parent);
    } else if (parent instanceof Team) {
      this.team = parent;
    } else if (parent instanceof Release) {
      this.release = LazyReference.wrap(parent);
    } else if (parent instanceof Issue) {
// DIFF-76 change at line 575
      this.issue = LazyReference.wrap(parent);
    } else if (parent instanceof Cycle) {
      this.cycle = LazyReference.wrap(parent);
    } else {
      notReachable(parent);
    }
  }

  /** The resource folder this document belongs to. */
  @LazyManyToOne(() => ResourceFolder, "documents", { nullable: true, indexed: true })
  public resourceFolder?: LazyReference<ResourceFolder>;
}

type CreateProps = {
  /** The document title. */
  title: string;
  /** The project this document belongs to. */
  project?: Project;
  /** The initiative this document belongs to. */
  initiative?: Initiative;
  /** The team this document belongs to. */
  team?: Team;
  /** The release this document belongs to. */
  release?: Release;
  /** The issue this document belongs to. */
// DIFF-76 change at line 600
  issue?: Issue;
  /** The cycle this document belongs to. */
  cycle?: Cycle;
  /** The creator of the document. */
  creator?: User;
  /** Who updated the document last. */
  updatedBy?: User;
  /** The folder inside which to put the document. */
  folder?: ResourceFolder;
};

/**
 * The parent entity type of a document.
 */
export type DocumentParent = Project | Initiative | Team | Release | Issue | Cycle;

/** Options for applying a document template. */
export interface ApplyDocumentTemplateOptions {
  /** Whether the template should be applied in the context of template editing. */
  editingContext?: "template";
}

/**
 * The type of the parent entity type of a document.
 */
// DIFF-76 change at line 625
export type DocumentParentType =
  | typeof Project
  | typeof Initiative
  | typeof Team
  | typeof Release
  | typeof Issue
  | typeof Cycle;

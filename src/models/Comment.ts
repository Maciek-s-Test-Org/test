// DIFF-76: modified fixture
import { CommentTrait } from "@linear/common/models/CommentTrait";
import type { EmojiReactions } from "@linear/common/models/EmojiReactionsType";
import { SlackSyncedCommentSource, type EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import { ExternalEntityType } from "@linear/common/models/ExternalEntityRelation";
import { Quota } from "@linear/common/quotas/QuotaRegistry";
import type { EmailIntakeMessageMetadata } from "@linear/common/utils/EmailHelper";
import { getTrait } from "@linear/common/utils/traits";
import { MarkdownTransformer } from "@linear/editor/markdown/MarkdownTransformer";
import { getEmptyDocument, schema } from "@linear/editor/schema";
import type { ProsemirrorData } from "@linear/editor/types";
import { editorDocTextContent } from "@linear/editor/utils/editorNodeTextContent";
import { EditorParseHelper } from "@linear/editor/utils/EditorParseHelper";
import { notificationTextForNode } from "@linear/editor/utils/notificationTextFromNode";
import { notReachable } from "@linear/common/errors/UnreachableCaseError";
import { IntegrationService } from "@linear/common/models/Integration";
import { ReadOnlyReason } from "@linear/common/models/ReadOnlyReason";
import { UserPresentableError } from "@linear/common/errors/ErrorHelpers";
import type { FileUpload } from "@linear/editor/plugins/FileUploadPlugin";
import { WorkspaceAdminPermission } from "@linear/common/models/WorkspaceAdminPermission";
import { LinearAgentCommentHelpers } from "@linear/common/models/helpers/LinearAgentCommentHelpers";
import { QuotaHelper } from "#utils/QuotaHelper";
import { UserHelper } from "#utils/UserHelper";
import { Attachment } from "#models/Attachment";
import {
// DIFF-76 change at line 25
  Action,
  ClientModel,
  Computed,
  LazyManyToOne,
  LazyOneSidedReference,
  LazyOneToMany,
  LazyOneToOne,
  OneSidedReference,
  OneToMany,
  Property,
  ManyToMany,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode, PartialPreloadForTeam } from "#models/base/ModelLoadStrategy";
import type { Hydrated } from "#models/base/ModelTypes";
import { Collection } from "#models/collections/Collection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { CustomerNeed } from "#models/CustomerNeed";
import { DocumentContent } from "#models/DocumentContent";
import { Draft } from "#models/Draft";
import { ExternalEntityRelation } from "#models/ExternalEntityRelation";
import { ExternalUser } from "#models/ExternalUser";
import { LazyReference, type LazyValue } from "#models/hydration/Lazy";
// DIFF-76 change at line 50
import { InitiativeUpdate } from "#models/InitiativeUpdate";
import { Issue } from "#models/Issue";
import { Notification } from "#models/Notification";
import { NotificationStateHelper } from "#models/helpers/NotificationStateHelper";
import { ProjectUpdate } from "#models/ProjectUpdate";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import type { Store } from "#models/Store";
import { User } from "#models/User";
import { CommentUtils } from "#utils/CommentUtils";
import { AgentSession } from "#models/AgentSession";
import { AiConversation } from "#models/AiConversation";
import { Initiative } from "./Initiative";
import type { Organization } from "./Organization";
import { Post } from "./Post";
import { Project } from "./Project";
import { ProjectMilestone } from "./ProjectMilestone";
import { MediaMetadata } from "./MediaMetadata";
import { AgentActivity } from "./AgentActivity";

/**
 * Type of the parent model of a comment.
 */
export type CommentParentModel =
  | Issue
  | ProjectUpdate
// DIFF-76 change at line 75
  | DocumentContent
  | Post
  | InitiativeUpdate
  | Project
  | Initiative;

const childCommentOrder = new CollectionOrder<Comment>("createdAt");

/**
 * A model representing a comment.
 */
@ClientModel("Comment")
export class Comment extends DeletableModel {
  /** A reference to the data store that the model is part of. */
  public override store: Store;

  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;
  public static override partialPreloadForTeam = PartialPreloadForTeam.secondPriority;

  public static override skipUpdatedAtKeys = new Set(["subscriberIds"]);

  /** The content of the comment in Prosemirror document. */
  @Property({ serializer: JSONSerializer, shallowObservation: true, default: {} })
  public bodyData: ProsemirrorData;
// DIFF-76 change at line 100

  /** Has the comment been edited since it was created. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public editedAt?: Date;

  /** API build cache of the reaction data to avoid syncing Reactions to the client. */
  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public reactionData: EmojiReactions;

  /** The issue that this comment is associated with. */
  @LazyManyToOne(() => Issue, "comments", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
    trait: "useForPartialIndex",
  })
  public issue?: LazyReference<Issue>;

  /** The document content that this comment is associated with. */
  @LazyManyToOne(() => DocumentContent, "comments", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
// DIFF-76 change at line 125
  })
  public documentContent?: LazyReference<DocumentContent>;

  /** The project update that this comment is associated with. */
  @LazyManyToOne(() => ProjectUpdate, "comments", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public projectUpdate?: LazyReference<ProjectUpdate>;

  /** The project update that this comment is associated with. */
  @LazyManyToOne(() => InitiativeUpdate, "comments", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public initiativeUpdate?: LazyReference<InitiativeUpdate>;

  /** The post that this comment is associated with. */
  @LazyManyToOne(() => Post, "comments", {
    optional: true,
    nullable: false,
// DIFF-76 change at line 150
    indexed: true,
    persistence: "createOnly",
  })
  public post?: LazyReference<Post>;

  /** The project that this comment is associated with. */
  @LazyManyToOne(() => Project, "comments", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public project?: LazyReference<Project>;

  /** The initiative that this comment is associated with. */
  @LazyManyToOne(() => Initiative, "comments", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public initiative?: LazyReference<Initiative>;

  /** The media metadata associated with the document content. */
  @LazyOneToMany(() => MediaMetadata, {
// DIFF-76 change at line 175
    index: "commentId",
  })
  public readonly mediaMetadata: LazyCollection<MediaMetadata>;

  /** The parent comment. If undefined, the comment is a top-level comment for the issue. */
  @LazyManyToOne(() => Comment, "children", {
    optional: true,
    nullable: false,
    indexed: true,
    cascadeHydration: true,
    persistence: "createOnly",
    trait: "sameAsSelfPartial",
  })
  public parent?: LazyReference<Comment>;

  /** The children of the comment. */
  @LazyOneToMany(() => Comment, {
    index: "parentId",
    order: childCommentOrder,
    skipHydrationTraitBit: CommentTrait.hasChildren,
  })
  public readonly children: LazyCollection<Comment>;

  /** Drafted (un-submitted) replies to this comment. */
  @OneToMany(() => Draft)
// DIFF-76 change at line 200
  public readonly draftReplies: Collection<Draft>;

  /** User that resolved the thread, only for top-level comments. */
  @OneSidedReference(() => User, { nullable: true, persistence: "updateOnly" })
  public resolvingUser?: User;

  /** Resolving comment, if any. */
  @LazyOneSidedReference(() => Comment, {
    nullable: true,
    indexed: true,
    cascadeHydration: true,
    persistence: "updateOnly",
  })
  public resolvingComment?: LazyReference<Comment>;

  /** The text that this comment references. Only defined for inline comments. */
  @Property()
  public quotedText?: string;

  /** Time the comment was resolved at. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public resolvedAt?: Date;

  /** Attachment this comment was created with. */
  @LazyOneToOne(() => Attachment, "comment", { persistence: "none", optional: true, nullable: false, indexed: true })
// DIFF-76 change at line 225
  public attachment?: LazyReference<Attachment>;

  /** The user who wrote the comment. */
  @OneSidedReference(() => User, { persistence: "none", optional: true, nullable: false })
  public user?: User;

  /**
   * External entity relations associated with the comment.
   * @deprecated Use `activeExternalEntityRelations` instead to filter out relations from archived integrations.
   */
  @LazyOneToMany(() => ExternalEntityRelation, {
    index: "commentId",
    skipHydrationTraitBit: CommentTrait.hasExternalEntityRelations,
  })
  public readonly externalEntityRelations: LazyCollection<ExternalEntityRelation>;

  /** External entity relations associated with the comment that are connected to active (non-archived) integrations. */
  @Computed
  public get activeExternalEntityRelations(): ExternalEntityRelation[] {
    return this.externalEntityRelations.elements.filter(r => r.isConnectedToActiveIntegration);
  }

  /** The external user who wrote the comment. */
  @LazyOneSidedReference(() => ExternalUser, { nullable: true, indexed: true, persistence: "none" })
  public externalUser?: LazyReference<ExternalUser>;
// DIFF-76 change at line 250

  /** Get the author of the comment. */
  public get author(): User | ExternalUser | undefined {
    return this.user ?? this.externalUser?.value;
  }

  /** Returns the user ID this AI comment was posted on behalf of, if any. */
  @Computed
  public get onBehalfOfUserId(): string | undefined {
    return LinearAgentCommentHelpers.getOnBehalfOfUserId(this.sourceMetadata);
  }

  /** Issues created from this comment. */
  @LazyOneToMany(() => Issue, {
    index: "sourceCommentId",
    skipHydrationTraitBit: CommentTrait.hasCreatedIssues,
  })
  public readonly createdIssues: LazyCollection<Issue>;

  /** Comment source metadata. What created the comment. */
  @Property({ persistence: "none" })
  public sourceMetadata?: EntitySourceMetadata;

  /** The thread summary information for this comment. */
  @Property({ persistence: "none" })
// DIFF-76 change at line 275
  public threadSummary?: {
    content: ProsemirrorData;
    updatedAt: string;
    evalLogId: string | undefined;
  };

  /** Whether this comment should lead to subscription to the issue or not. */
  @Property({ isVirtual: true })
  public doNotSubscribeToIssue?: boolean;

  /** Any pending file uploads for this comment. */
  @Property({ persistence: "none" })
  public pendingUploads?: Map<string, FileUpload>;

  /** The notifications for this comment. */
  @OneToMany(() => Notification)
  public readonly notifications: Collection<Notification>;

  /** The users subscriber to this comment. */
  @ManyToMany(() => User)
  public subscribers: Collection<User>;

  /** Customer needs associated with the comment. */
  @LazyOneToMany(() => CustomerNeed, {
    index: "commentId",
// DIFF-76 change at line 300
    skipHydrationTraitBit: CommentTrait.hasCustomerNeeds,
  })
  public readonly needs: LazyCollection<CustomerNeed>;

  /** The agent activities associated with this comment. */
  @LazyOneToMany(() => AgentActivity, {
    index: "sourceCommentId",
  })
  public readonly createdAgentActivities: LazyCollection<AgentActivity>;

  /** Each bit in this number represents a different trait. */
  @Property({ persistence: "none" })
  public traits?: number;

  /** The agent sessions for this comment. */
  @LazyOneToMany(() => AgentSession, {
    index: "commentId",
    skipHydrationTraitBit: CommentTrait.hasAgentSession,
  })
  public readonly agentSessions: LazyCollection<AgentSession>;

  /** Agent sessions spawned from this comment (initiated by this comment but attached to a different thread). */
  @LazyOneToMany(() => AgentSession, {
    index: "sourceCommentId",
    skipHydrationTraitBit: CommentTrait.hasSpawnedAgentSessions,
// DIFF-76 change at line 325
  })
  public readonly spawnedAgentSessions: LazyCollection<AgentSession>;

  /** The AI conversations associated with this comment. */
  @LazyOneToMany(() => AiConversation, {
    index: "commentId",
    skipHydrationTraitBit: CommentTrait.hasAiConversations,
  })
  public readonly aiConversations: LazyCollection<AiConversation>;

  /**
   * All comments in this thread.
   */
  @Computed
  public get threadComments(): LazyValue<ReadonlyCollection<Comment>> {
    if (!this.root) {
      return undefined;
    }
    return Collection.of(Comment, [...new Set<Comment>([this.root, ...this.root.children])]);
  }

  /**
   * Root comment of this thread.
   */
  @Computed
// DIFF-76 change at line 350
  public get root(): LazyValue<Comment> {
    return this.parent?.id ? this.parent.value : this;
  }

  /**
   * All notifications related to this comment's thread.
   */
  @Computed
  public get threadNotifications(): LazyValue<ReadonlyCollection<Notification>> {
    if (!this.threadComments) {
      return undefined;
    }
    return Collection.of(
      Notification,
      this.threadComments.flatMap(c => c.notifications.elements)
    );
  }

  /** Returns a related model to which the comment is associated with. */
  public get parentModel(): LazyValue<CommentParentModel> {
    if (this.issue) {
      return this.issue.value;
    } else if (this.projectUpdate) {
      return this.projectUpdate.value;
    } else if (this.initiativeUpdate) {
// DIFF-76 change at line 375
      return this.initiativeUpdate.value;
    } else if (this.documentContent) {
      return this.documentContent.value;
    } else if (this.post) {
      return this.post.value;
    } else if (this.project) {
      return this.project.value;
    } else if (this.initiative) {
      return this.initiative.value;
    }
    throw new Error("Comment does not belong to any related model");
  }

  /**
   * Only comment authors are able to edit them.
   * Comments created from Slack as part of thread sync can't be edited.
   * Comments created from email intake can't be edited.
   * User comments in agent session threads can't be edited (temporary restriction, LIN-43598).
   */
  public allowEdit(user: User): boolean {
    if (this.user?.id !== user.id && this.onBehalfOfUserId !== user.id) {
      return false;
    }
    if (this.sourceMetadata?.slackSyncMetadata?.commentSource === SlackSyncedCommentSource.Slack) {
      return false;
// DIFF-76 change at line 400
    }
    if (this.isEmailIntakeComment) {
      return false;
    }
    // User comments in agent session threads can't be edited - this is a soft restriction not
    // enforced by the backend since it's a temporary measure. Comments will not be attached to agent sessions
    // in the future, so we will be able to remove this UI limitation soon.
    // TODO(mingjie): LIN-43598 Clean up once UI separates
    if (this.getTrait(CommentTrait.hasAgentSession)) {
      return false;
    }
    const rootComment = this.root;
    if (rootComment && rootComment !== this && rootComment.getTrait(CommentTrait.hasAgentSession)) {
      return false;
    }
    return true;
  }

  /**
   * Only comment authors and admins on non-free plans are able to delete them.
   * Comments created from Slack as part of thread sync can't be deleted.
   * Comments created from email intake can only be deleted by admins.
   */
  public allowDelete(user: User): LazyValue<boolean> {
    const isCurrentUserComment =
// DIFF-76 change at line 425
      this.user?.id === user.id ||
      this.onBehalfOfUserId === user.id ||
      this.sourceMetadata?.aiMetadata?.invokedByUserId === user.id;
    const hasPermission =
      user.organization.activeSubscription !== undefined &&
      user.hasPermission(WorkspaceAdminPermission.entityManagement);

    const isSlackComment = this.sourceMetadata?.slackSyncMetadata?.commentSource === SlackSyncedCommentSource.Slack;
    const slackDeletePermissions = isSlackComment ? this.isRootUnsyncedSlackComment : true;

    const isEmailIntakeComment = this.isEmailIntakeComment;
    const emailIntakeDeletePermissions = isEmailIntakeComment ? hasPermission : true;

    return (isCurrentUserComment || hasPermission) && slackDeletePermissions && emailIntakeDeletePermissions;
  }

  /** Is the comment's body just composed out of emojis. */
  @Computed
  public get hasEmojiOnlyBody(): boolean {
    return CommentUtils.hasEmojiOnlyBody(this);
  }

  /**
   * Returns the first mentioned agent app user in this comment, if any.
   * This is the best-effort guess of the app user that will be invoked by an agent session spawned from this comment.
// DIFF-76 change at line 450
   */
  @Computed
  public get firstAgentUserMentioned(): User | undefined {
    if (!this.bodyData) {
      return undefined;
    }
    const mentionedUserIds = EditorParseHelper.parseUserMentions(this.bodyData);
    if (mentionedUserIds.length === 0) {
      return undefined;
    }
    const agentUserIds = new Set(this.store.organization.agentAppUsers.map(u => u.id));
    const mentionedAgentUserId = mentionedUserIds.find(userId => agentUserIds.has(userId));
    return mentionedAgentUserId
      ? this.store.organization.agentAppUsers.find(u => u.id === mentionedAgentUserId)
      : undefined;
  }

  /** Returns whether the comment can be resolved. */
  public get canResolve(): boolean {
    return this.parent === undefined;
  }

  /** Returns whether the comment cannot be edited anymore. Expected to be called only on hydrated models. */
  public override get isReadOnly(): ReadOnlyReason | undefined {
    if (this.isArchived) {
// DIFF-76 change at line 475
      return ReadOnlyReason.archived;
    }
    return (
      this.issue?.value?.isReadOnly ??
      this.projectUpdate?.value?.isReadOnly ??
      this.initiativeUpdate?.value?.isReadOnly ??
      this.documentContent?.value?.isReadOnly ??
      this.post?.value?.isReadOnly ??
      this.project?.value?.isReadOnly ??
      this.initiative?.value?.isReadOnly
    );
  }

  /** Returns whether the comment has any pending uploads. */
  public get hasPendingUploads(): boolean {
    return !!this.pendingUploads && this.pendingUploads.size > 0;
  }

  /**
   * Returns whether the thread this comment is the root of is resolved or not.
   */
  public get isResolved(): boolean {
    return !!this.resolvedAt || !!this.resolvingUser;
  }

// DIFF-76 change at line 500
  /** Marks all notifications associated with the comment as read. */
  @Action
  public async markNotificationsAsRead() {
    const commentId = this.id;
    const parentId = this.parent?.id;

    /** Marks issue notifications related to a given comment as read. */
    const markCommentNotificationsAsRead = (notifications: Notification[]) => {
      NotificationStateHelper.markAllAsRead(
        notifications,
        notification => notification.comment?.id === commentId || notification.comment?.id === parentId
      );
    };

    if (this.issue?.value) {
      markCommentNotificationsAsRead(this.issue.value.notifications.elements);
      return;
    }
    if (this.projectUpdate?.value) {
      markCommentNotificationsAsRead(this.projectUpdate.value.notifications.elements);
      return;
    }
    if (this.initiativeUpdate?.value) {
      markCommentNotificationsAsRead(this.initiativeUpdate.value.notifications.elements);
      return;
// DIFF-76 change at line 525
    }
    if (this.project?.value) {
      markCommentNotificationsAsRead(this.project.value.notifications.elements);
      return;
    }
    if (this.initiative?.value) {
      markCommentNotificationsAsRead(this.initiative.value.notifications.elements);
      return;
    }
    if (this.documentContent?.value) {
      const documentContent = await this.documentContent.value.hydrate();
      const parentType = documentContent.parentType;

      if (!parentType) {
        return;
      }

      switch (parentType) {
        case "issue": {
          // we don't have inline comments on issues
          return;
        }
        case "document":
          markCommentNotificationsAsRead(documentContent.document?.value.notifications.elements || []);
          return;
// DIFF-76 change at line 550
        case "initiative":
          markCommentNotificationsAsRead(documentContent.initiative?.notifications.elements || []);
          return;
        case "project":
          markCommentNotificationsAsRead(documentContent.project?.value.notifications.elements || []);
          return;
        case "projectMilestone":
          markCommentNotificationsAsRead(documentContent.projectMilestone?.value?.notifications.elements || []);
          return;
        case "aiPromptRules":
          // we don't have inline comments on ai prompt rules
          return;
        case "welcomeMessage":
          // we don't have inline comments on welcome message
          return;
        case "workspaceAnnouncement":
          // we don't have inline comments on workspace announcements
          return;
        case "releaseNote":
          // we don't have inline comments on release notes
          return;
        case "pullRequest":
          // we don't have inline comments on pull request descriptions
          return;
        case "workflowDefinitionDraft":
// DIFF-76 change at line 575
          // we don't have inline comments on workflow definition drafts
          return;
        case "meeting":
          // we don't have inline comments on meeting transcripts
          return;
        default:
          notReachable(parentType);
          return;
      }
    }
  }

  /** Resolves the comment, optionally with a specific child comment. */
  @Action
  public resolve(resolvingUser?: User, resolvingComment?: Comment) {
    this.resolvingUser = resolvingUser;
    this.resolvingComment = resolvingComment ? LazyReference.wrap(resolvingComment) : undefined;
    this.save();
  }

  /** Marks the comment as unresolved. */
  @Action
  public unresolve() {
    this.resolvedAt = null!;
    this.resolvingUser = null!;
// DIFF-76 change at line 600
    this.resolvingComment = null!;
    this.save();
  }

  /** Markdown formatting of the comment body. */
  @Computed
  public get bodyMarkdown(): string {
    return this.bodyData ? MarkdownTransformer.serialize(this.bodyData) : "";
  }

  /** Plain text of the comment body. */
  @Computed
  public get bodyTextContent(): string {
    if (this.bodyData) {
      const doc = schema.nodeFromJSON(this.bodyData);
      return editorDocTextContent(doc);
    }
    return "";
  }

  /** Plain text without certain markdown formatting. */
  @Computed
  public get notificationText(): string | undefined {
    const store = this.store;
    if (this.bodyData) {
// DIFF-76 change at line 625
      return notificationTextForNode(this.bodyData, {
        getDisplayUserLabel(userId, fallback) {
          const user = store.findById(User, userId);
          if (!user) {
            return fallback;
          }
          return UserHelper.getUsername(store.user.settings, user);
        },
      });
    }
    return;
  }

  /** Returns true if that comment is part of a thread, either as the parent or a child. */
  public get isThread(): boolean {
    return Boolean(this.parent) || this.children.length > 0;
  }

  /**
   * Returns true if the comment is an artificial placeholder created to anchor an agent session thread that did not
   * start from a real user-authored kickoff comment.
   */
  public get isArtificialAgentSessionRoot(): boolean {
    return !this.user && !this.onBehalfOfUserId && !this.externalUser && this.getTrait(CommentTrait.hasAgentSession);
  }
// DIFF-76 change at line 650

  /** Returns `true` if this comment is part of a thread currently synced with Slack, at any level. */
  public get isSlackSynced(): LazyValue<boolean> {
    if (this.parent?.value?.isSlackSynced) {
      return true;
    }
    return this.sourceMetadata?.slackSyncMetadata !== undefined;
  }

  /** Returns `true` if this comment is the root comment of a thread synced with Slack. */
  public get isRootSlackSyncedComment(): LazyValue<boolean> {
    return this.isSlackSynced && this.isSyncedExternalThreadRoot;
  }

  /**
   * Returns true if this comment is the root of a thread that was formerly synced with Slack and has since been
   * unsynced
   **/
  public get isRootUnsyncedSlackComment(): LazyValue<boolean> {
    return this.isRootSlackSyncedComment && this.sourceMetadata?.slackSyncMetadata?.unsynced === true;
  }

  /**
   * Returns true if this comment is the root of an email intake thread
   **/
// DIFF-76 change at line 675
  public get isRootEmailIntakeComment(): LazyValue<boolean> {
    return this.parent?.value === undefined && this.sourceMetadata?.emailIntakeMetadata !== undefined;
  }

  /**
   * Returns true if this comment is part of an email intake thread
   **/
  public get isEmailIntakeComment(): LazyValue<boolean> {
    if (this.isRootEmailIntakeComment) {
      return true;
    }

    const rootComment = this.parent?.value;
    return rootComment?.isRootEmailIntakeComment;
  }

  /**
   * Returns the email message metadata for the comment, if one exists.
   */
  public getEmailIntakeMessageMetadata(): EmailIntakeMessageMetadata | undefined {
    return this.activeExternalEntityRelations?.find(r => r.externalEntityType === ExternalEntityType.emailMessage)
      ?.metadata?.emailMessageMetadata;
  }

  /**
// DIFF-76 change at line 700
   * Returns true if this comment is the root comment of a thread synced with an external service.
   */
  public get isSyncedExternalThreadRoot(): LazyValue<boolean> {
    return !!this.sourceMetadata?.externalSyncRoot;
  }

  /**
   * Returns the collection of users subscribed to the thread this comment is part of.
   */
  public get threadSubscribers(): LazyValue<Collection<User>> {
    return this.root?.subscribers;
  }

  /**
   * Returns true if the user is subscribed to the thread this comment is part of.
   *
   * @param user The user to check for subscription.
   * @returns Whether the user is subscribed to the thread.
   */
  public userIsSubscribedToThread(user: User): LazyValue<boolean> {
    return this.threadSubscribers?.contains(user);
  }

  /** Whether the comment is part of an Asks thread. */
  public get isAsksThread(): boolean {
// DIFF-76 change at line 725
    return this.sourceMetadata?.subType === IntegrationService.slackAsks;
  }

  /**
   * Stops syncing a comment if it is a root comment of a comment thread that is synced to a Slack thread.
   *
   * @param context Action context to use.
   * @returns Mutation to stop syncing the attachment.
   */
  public async unsyncSlack(): Promise<Comment | undefined> {
    if (!this.isRootSlackSyncedComment) {
      throw new UserPresentableError("Attachment is not a synced Slack thread");
    }
    if (this.isAsksThread) {
      throw new UserPresentableError("Asks threads cannot be un-synced");
    }
    return await this.store.mutate(Comment, "rootCommentUnsyncSlack", {
      id: this.id,
    });
  }

  /**
   * Stops syncing a comment if it is a root comment of a comment thread that is synced to a Salesforce case.
   *
   * @returns Mutation to stop syncing the comment thread.
// DIFF-76 change at line 750
   */
  public async unsyncSalesforce(): Promise<Comment | undefined> {
    if (!this.isRootSalesforceSyncedComment) {
      throw new UserPresentableError("Comment is not a synced Salesforce thread");
    }
    return await this.store.mutate(Comment, "rootCommentUnsyncSalesforce", {
      id: this.id,
    });
  }

  /** Returns `true` if this comment is the root comment of a thread synced with Salesforce. */
  public get isRootSalesforceSyncedComment(): LazyValue<boolean> {
    return this.isSyncedExternalThreadRoot && this.sourceMetadata?.subType === IntegrationService.salesforce;
  }

  /** Returns `true` if this comment is the root comment of a thread unsynced with Salesforce. */
  public get isRootSalesforceUnSyncedComment(): LazyValue<boolean> {
    return this.isRootSalesforceSyncedComment && this.sourceMetadata?.salesforceMetadata?.unsynced === true;
  }

  /**
   * Checks if the comment has a specific trait.
   *
   * @param trait Trait to get.
   * @returns True if the comment has the given trait, false otherwise.
// DIFF-76 change at line 775
   */
  public getTrait(trait: CommentTrait) {
    return getTrait(this.traits, trait);
  }

  /**
   * Validates the comments per parent model quota.
   *
   * @param parentModel The parent model to check.
   * @returns `true` if the quota is valid, `false` otherwise (toast is shown if not valid).
   */
  public static validateCommentQuota(parentModel: CommentParentModel): boolean {
    if (parentModel instanceof Issue) {
      return QuotaHelper.validateQuotaOrToast(
        parentModel.team.organization,
        Quota.maxCommentsPerIssue,
        parentModel.comments.length
      );
    } else if (parentModel instanceof DocumentContent) {
      if (!parentModel.isHydrated()) {
        return true;
      }
      const parent = parentModel.getParent();
      if (!parent || parent instanceof Issue) {
        return true; // We don't have comments on issue descriptions
// DIFF-76 change at line 800
      }
      let organization: Organization;
      if (parent instanceof ProjectMilestone) {
        if (!parent.project.value) {
          return true;
        }
        organization = parent.project.value.organization;
      } else {
        organization = parent.organization;
      }
      return QuotaHelper.validateQuotaOrToast(
        organization,
        Quota.maxCommentsPerDocumentContent,
        parentModel.comments.length
      );
    } else if (parentModel instanceof ProjectUpdate) {
      if (!parentModel.project.value) {
        return true;
      }
      return QuotaHelper.validateQuotaOrToast(
        parentModel.project.value.organization,
        Quota.maxCommentsPerUpdate,
        parentModel.comments.length
      );
    } else if (parentModel instanceof InitiativeUpdate) {
// DIFF-76 change at line 825
      return QuotaHelper.validateQuotaOrToast(
        parentModel.organization,
        Quota.maxCommentsPerUpdate,
        parentModel.comments.length
      );
    } else if (parentModel instanceof Post) {
      return QuotaHelper.validateQuotaOrToast(
        parentModel.organization,
        Quota.maxCommentsPerPost,
        parentModel.comments.length
      );
    } else if (parentModel instanceof Project) {
      return QuotaHelper.validateQuotaOrToast(
        parentModel.organization,
        Quota.maxCommentsPerProject,
        parentModel.comments.length
      );
    } else if (parentModel instanceof Initiative) {
      return QuotaHelper.validateQuotaOrToast(
        parentModel.organization,
        Quota.maxCommentsPerInitiative,
        parentModel.comments.length
      );
    }
    return false;
// DIFF-76 change at line 850
  }

  /**
   * Factory method to create a new comment.
   *
   * @param props The properties to create the comment with.
   * @returns The new comment.
   */
  @Action
  public static create(props: {
    parentModel: CommentParentModel;
    user: User;
    bodyData?: ProsemirrorData;
    parent?: Comment;
    quotedText?: string;
  }): Hydrated<Comment> {
    const { parentModel, user, bodyData, parent, quotedText } = props;

    const comment = Comment.createEmpty();
    comment.user = user;
    this.setCommentParent(comment, parentModel);
    if (parent) {
      comment.parent = LazyReference.wrap(parent);
    }
    comment.bodyData = bodyData ? bodyData : getEmptyDocument();
// DIFF-76 change at line 875
    comment.quotedText = quotedText;

    return comment;
  }

  /**
   * Sets the parent of the comment.
   *
   * @param comment The comment to set the parent of.
   * @param parentModel The parent model to set.
   */
  public static setCommentParent(comment: Comment, parentModel: CommentParentModel) {
    if (parentModel instanceof Issue) {
      comment.issue = LazyReference.wrap(parentModel);
    } else if (parentModel instanceof ProjectUpdate) {
      comment.projectUpdate = LazyReference.wrap(parentModel);
    } else if (parentModel instanceof InitiativeUpdate) {
      comment.initiativeUpdate = LazyReference.wrap(parentModel);
    } else if (parentModel instanceof DocumentContent) {
      comment.documentContent = LazyReference.wrap(parentModel);
    } else if (parentModel instanceof Post) {
      comment.post = LazyReference.wrap(parentModel);
    } else if (parentModel instanceof Project) {
      comment.project = LazyReference.wrap(parentModel);
    } else if (parentModel instanceof Initiative) {
// DIFF-76 change at line 900
      comment.initiative = LazyReference.wrap(parentModel);
    } else {
      throw new Error("Invalid entity model");
    }
  }
}

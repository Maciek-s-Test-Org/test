// DIFF-76: modified fixture
import { slugifyTitle } from "@linear/common/utils/slugifyTitle";
import type { ExactlyOneOf } from "@linear/common/types";
import type { AiConversationContext, PromptPresetKey } from "@linear/common/models/AiConversationContext";
import { AiConversationTrait } from "@linear/common/models/AiConversationTrait";
import type { AiConversationUserState } from "@linear/common/models/AiConversationUserState";
import {
  AiConversationInitialSource,
  type AiConversationPart,
  type AiConversationPendingMessage,
  type AiConversationPendingUserMessage,
  AiConversationStatus,
  type AiConversationStreamPart,
} from "@linear/common/models/AiConversation";
import {
  Action,
  ClientModel,
  Computed,
  LazyManyToOne,
  LazyOneSidedReference,
  LazyOneToMany,
  LazyOneToOne,
  ManyToOne,
  OneToOne,
  Property,
// DIFF-76 change at line 25
  StreamableProperty,
} from "#models/base/Decorators";
import { DeletableModel, type Model } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { Hydrated } from "#models/base/ModelTypes";
import { type LazyBackReference, LazyReference } from "#models/hydration/Lazy";
import { aiConversationSendMessageMutation } from "#models/queries/ai/aiConversationSendMessageMutation";
import { User } from "#models/User";
import { WorkflowDefinition } from "#models/WorkflowDefinition";
import type { Cycle } from "#models/Cycle";
import { Document } from "#models/Document";
import { Initiative } from "#models/Initiative";
import { Issue } from "#models/Issue";
import { Project } from "#models/Project";
import { PullRequest } from "#models/PullRequest";
import type { Store } from "#models/Store";
import { AiConversationTurn } from "#models/AiConversationTurn";
import type { LoopExecution } from "#models/LoopExecution";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import { type FavoritableModel, Favorite } from "#models/Favorite";
import { Comment } from "#models/Comment";
import { PullRequestComment } from "#models/PullRequestComment";
import { AiConversationPartsStreamHelper } from "#models/helpers/AiConversationPartsStreamHelper";

// DIFF-76 change at line 50
/**
 * A conversation between a user and an LLM.
 */
@ClientModel("AiConversation")
export class AiConversation extends DeletableModel implements FavoritableModel {
  public override store: Store;

  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  public static override skipUpdatedAtKeys = new Set(["userState"]);

  /** A summary of the conversation. */
  @Property({ persistence: "none", default: AiConversationInitialSource.directChat })
  public initialSource: AiConversationInitialSource;

  /** The user who the conversation belongs to. */
  @ManyToOne(() => User, "aiConversations", {
    persistence: "createOnly",
    nullable: true,
    indexed: true,
  })
  public user?: User;

  /** The document this shared conversation is attached to. */
// DIFF-76 change at line 75
  @LazyManyToOne(() => Document, "aiConversations", { persistence: "createOnly", nullable: true, indexed: true })
  public document?: LazyReference<Document>;

  /** The project this shared conversation is attached to. */
  @LazyManyToOne(() => Project, "aiConversations", { persistence: "createOnly", nullable: true, indexed: true })
  public project?: LazyReference<Project>;

  /** The initiative this shared conversation is attached to. */
  @LazyManyToOne(() => Initiative, "aiConversations", { persistence: "createOnly", nullable: true, indexed: true })
  public initiative?: LazyReference<Initiative>;

  /** The issue this shared conversation is attached to. */
  @LazyManyToOne(() => Issue, "aiConversations", {
    persistence: "createOnly",
    nullable: true,
    indexed: true,
    onDelete: "CASCADE",
    onArchive: "CASCADE",
    trait: "useForPartialIndex",
  })
  public issue?: LazyReference<Issue>;

  /** The pull request this shared conversation is attached to. */
  @LazyManyToOne(() => PullRequest, "aiConversations", { persistence: "createOnly", nullable: true, indexed: true })
  public pullRequest?: LazyReference<PullRequest>;
// DIFF-76 change at line 100

  /** The comment that owns this conversation. */
  @LazyManyToOne(() => Comment, "aiConversations", { persistence: "none", nullable: true, indexed: true })
  public comment?: LazyReference<Comment>;

  /** The pull request comment that owns this conversation. */
  @LazyManyToOne(() => PullRequestComment, "aiConversations", {
    persistence: "none",
    nullable: true,
    indexed: true,
  })
  public pullRequestComment?: LazyReference<PullRequestComment>;

  /** The parent conversation this sub-agent conversation was spawned from. Only ever set by the server. */
  @LazyManyToOne(() => AiConversation, "subAgents", { persistence: "none", nullable: true, indexed: true })
  public parent?: LazyReference<AiConversation>;

  /** Each bit in this number represents a different trait. */
  @Property({ persistence: "none" })
  public traits?: number;

  /** Sub-agent conversations spawned from this conversation. */
  @LazyOneToMany(() => AiConversation, {
    index: "parentId",
    skipHydrationTraitBit: AiConversationTrait.hasChildren,
// DIFF-76 change at line 125
  })
  public readonly subAgents: LazyCollection<AiConversation>;

  /** The workflow definition that created this conversation. */
  // One-sided: the workflow definition holds no run collection, because hydrating one would fetch every run with
  // its full transcript. Run lists load through cursor-paginated queries instead (see `fetchAutomationRuns`).
  @LazyOneSidedReference(() => WorkflowDefinition, { persistence: "createOnly", nullable: true, indexed: true })
  public workflowDefinition?: LazyReference<WorkflowDefinition> | undefined;

  /** The Loop execution that created this conversation. */
  @LazyOneToOne({ nullable: true })
  public loopExecution: LazyBackReference<LoopExecution | undefined>;

  /** The persisted turns belonging to this conversation. */
  @LazyOneToMany(() => AiConversationTurn, {
    index: "conversationId",
    order: new CollectionOrder<AiConversationTurn>("position", "asc").andLexicographically("id", "asc"),
  })
  public readonly turns: LazyCollection<AiConversationTurn>;

  /** References the favorite when this conversation is in the sidebar. */
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /** Whether this conversation is attached to a shared entity instead of a private chat. */
// DIFF-76 change at line 150
  @Computed
  public get isPublic(): boolean {
    return Boolean(this.document || this.project || this.initiative || this.issue || this.pullRequest);
  }

  /** Whether this conversation is a loop run, started by a workflow definition rather than by a person. */
  @Computed
  public get isWorkflowRun(): boolean {
    return this.initialSource === AiConversationInitialSource.workflow;
  }

  /** The contexts this conversation is related to. */
  @Property({ default: [] })
  public context: AiConversationContext[];

  /** Built-in prompt preset used to seed this conversation during creation. */
  @Property({ persistence: "createOnly", isVirtual: true })
  public promptPresetKey?: PromptPresetKey;

  /** A summary of the conversation. */
  @Property({ persistence: "none" })
  public summary?: string;

  /** The slug ID for the conversation. */
  @Property({ persistence: "none", default: "", indexed: true })
// DIFF-76 change at line 175
  public readonly slugId: string;

  /** The slug of the conversation. */
  @Computed
  public get slug(): string {
    return `${slugifyTitle(this.summary || "chat")}-${this.slugId}`;
  }

  /**
   * Toggles this conversation in the sidebar favorites.
   *
   * @returns The new favorite, or false when the existing favorite was removed.
   */
  public toggleFavorite = (): Favorite | false => {
    if (this.favorite) {
      this.favorite.delete();
      return false;
    }

    const favorite = Favorite.create({ reference: this });
    favorite.save(true);
    return favorite;
  };

  /** The materialized conversation-level summary used without loading individual turns. */
// DIFF-76 change at line 200
  @Property({ persistence: "none", default: "complete" })
  public status: AiConversationStatus;

  /** The iteration ID of the conversation. */
  @Property({ persistence: "none" })
  public iterationId?: string;

  /** User-specific state for the conversation, including per-user read status. */
  @Property({ persistence: "updateOnly", default: [] })
  public userState: AiConversationUserState[];

  /** The parts of the conversation. */
  @StreamableProperty<AiConversationPart[], AiConversationStreamPart, AiConversation>({
    persistence: "none",
    default: [],
    shouldSubscribe: model => ({
      subscribe: model.status === AiConversationStatus.active,
      trackedProperties: ["iterationId"],
    }),
    reducer: AiConversationPartsStreamHelper.reduce,
    rebaser: AiConversationPartsStreamHelper.rebase,
    shallowObservation: true,
  })
  public parts: AiConversationPart[];

// DIFF-76 change at line 225
  /** Messages received while the agent is mid-turn, waiting to be injected into the conversation. */
  @Property({ persistence: "none", default: [] })
  public pendingMessages: AiConversationPendingMessage[];

  /** The pending user messages waiting to be injected into the conversation, in queue order. */
  @Computed
  public get pendingUserMessages(): AiConversationPendingUserMessage[] {
    return this.pendingMessages.filter(
      (message): message is AiConversationPendingUserMessage => message.type === "user"
    );
  }

  /** Whether a newly sent message will be queued until the agent finishes its current response. */
  @Computed
  public get shouldQueueMessages(): boolean {
    return this.status === AiConversationStatus.active || this.status === AiConversationStatus.pending;
  }

  /**
   * Removes a pending message from the conversation's queue before it is injected.
   *
   * @param messageId The ID of the pending message to remove.
   * @returns The updated conversation once the sync delta has been applied.
   */
  @Action
// DIFF-76 change at line 250
  public async removePendingMessage(messageId: string): Promise<AiConversation | undefined> {
    return await this.store.mutate(AiConversation, "aiConversationRemovePendingMessage", {
      id: this.id,
      messageId,
    });
  }

  /**
   * Promotes a queued pending message to steer mode, so the running agent injects it at its next execution step
   * instead of waiting for the current response to finish. Re-sends the message with the same ID, which replaces
   * the queued entry in place on the server. No-ops when the message is no longer queued.
   *
   * @param messageId The ID of the pending message to steer.
   */
  @Action
  public async steerPendingMessage(messageId: string): Promise<void> {
    const message = this.pendingUserMessages.find(pending => pending.id === messageId);
    if (!message) {
      return;
    }

    const previousPendingMessages = this.pendingMessages;

    // Optimistically flip the local queue entry to steer mode; the sync delta from the mutation confirms it.
    this.pendingMessages = this.pendingMessages.map(pending =>
// DIFF-76 change at line 275
      pending.type === "user" && pending.id === messageId ? { ...pending, mode: "steer" } : pending
    );

    try {
      await aiConversationSendMessageMutation(this.store.graphQLClient, {
        conversationId: this.id,
        userMessageId: messageId,
        assistantMessageId: message.assistantTurnId,
        context: message.context ?? [],
        bodyData: message.bodyData,
        resume: true,
        fallbackMode: "steer",
      });
    } catch (error) {
      this.pendingMessages = previousPendingMessages;
      throw error;
    }
  }

  /** Add a new context to the conversation. */
  public addContext(context: AiConversationContext | AiConversationContext[]) {
    const contexts = Array.isArray(context) ? context : [context];
    for (const c of contexts) {
      if (this.context.some(c2 => c2.type === c.type && c2.id === c.id)) {
        return;
// DIFF-76 change at line 300
      }
      this.context.push(c);
    }
  }

  /**
   * Check if the model is in the context of the conversation.
   *
   * @param model The model to check.
   * @returns True if the model is in the context of the conversation, false otherwise.
   */
  public isInContext(model: Model) {
    return this.context.some(context => context.type === model.modelName && context.id === model.id);
  }

  /**
   * Returns the first model of the given class referenced in this conversation's context that is loaded in the store.
   *
   * @param modelClass The model class to look for in the context.
   * @returns The matching model, or undefined if none is in context or loaded.
   */
  public firstContextModel<T extends typeof Model>(modelClass: T): InstanceType<T> | undefined {
    for (const context of this.context) {
      if (context.type === modelClass.modelName && context.id) {
        const model = this.store.findById(modelClass, context.id);
// DIFF-76 change at line 325
        if (model) {
          return model;
        }
      }
    }
    return undefined;
  }

  /** Return the primary context for the conversation. */
  public mainContext(): AiConversationContext | undefined {
    // Filter out default contextual entities (User, Organization) since they're added to every conversation
    return this.context.find(c => c.type !== "User" && c.type !== "Organization");
  }

  /** The time when the current user last read the conversation. */
  @Computed
  public get lastReadAt(): Date | undefined {
    return AiConversation.normalizeLastReadAt(this.currentUserState()?.lastReadAt);
  }

  /**
   * Whether the conversation has unread updates.
   * True if the conversation has never been read, or if it was updated after the last read time.
   */
  @Computed
// DIFF-76 change at line 350
  public get isUnread(): boolean {
    if (!this.lastReadAt) {
      return true;
    }
    return this.updatedAt > this.lastReadAt;
  }

  /**
   * Marks the conversation as read at the given time.
   * Only updates if the new read time is more recent than the current user's existing read time.
   *
   * @param readAt The time to mark as read. Defaults to the current time.
   */
  @Action
  public markAsRead(readAt: Date = new Date()): void {
    const currentUserLastReadAt = this.currentUserLastReadAt();
    if (currentUserLastReadAt && currentUserLastReadAt >= readAt) {
      return;
    }

    this.setCurrentUserLastReadAt(readAt);
    this.save();
  }

  /** The ID of the elicitation part the current user dismissed, if any. */
// DIFF-76 change at line 375
  @Computed
  public get dismissedElicitationId(): string | undefined {
    return this.currentUserState()?.dismissedElicitationId;
  }

  /** Dismisses an elicitation part for the current user. */
  @Action
  public dismissElicitation(partId: string): void {
    if (this.dismissedElicitationId === partId) {
      return;
    }

    this.updateCurrentUserState({ dismissedElicitationId: partId });
    this.save();
  }

  /**
   * Factory method to create a new AI conversation.
   *
   * @param props The properties to create the conversation with.
   * @returns The new conversation.
   */
  @Action
  public static create(
    props: ExactlyOneOf<{
// DIFF-76 change at line 400
      user: User;
      document: Document;
      project: Project;
      initiative: Initiative;
      issue: Issue;
      pullRequest: PullRequest;
    }> & {
      context?: AiConversationContext[];
      parts?: AiConversationPart[];
      promptPresetKey?: PromptPresetKey;
      status?: AiConversationStatus;
    }
  ): Hydrated<AiConversation> {
    const {
      user,
      document,
      project,
      initiative,
      issue,
      pullRequest,
      context,
      parts = [],
      promptPresetKey,
      status,
    } = props;
// DIFF-76 change at line 425

    const conversation = AiConversation.createEmpty();
    conversation.user = user;
    conversation.document = document ? LazyReference.wrap(document) : undefined;
    conversation.project = project ? LazyReference.wrap(project) : undefined;
    conversation.initiative = initiative ? LazyReference.wrap(initiative) : undefined;
    conversation.issue = issue ? LazyReference.wrap(issue) : undefined;
    conversation.pullRequest = pullRequest ? LazyReference.wrap(pullRequest) : undefined;
    conversation.initialSource = conversation.isPublic
      ? AiConversationInitialSource.entityChat
      : AiConversationInitialSource.directChat;
    conversation.parts = parts;
    conversation.promptPresetKey = promptPresetKey;
    if (status) {
      conversation.status = status;
    }
    if (context) {
      conversation.addContext(context);
    }

    return conversation;
  }

  /**
   * Creates an optimistic conversation for a manually started workflow run.
// DIFF-76 change at line 450
   *
   * @param workflowDefinition The workflow definition starting the run.
   * @param triggerContext The entity the workflow is running on, when it has one.
   * @returns The pending workflow conversation.
   */
  @Action
  public static createWorkflowRun(
    workflowDefinition: WorkflowDefinition,
    triggerContext?: Issue | Project | Initiative | Cycle
  ): Hydrated<AiConversation> {
    const conversation = AiConversation.createEmpty();
    conversation.initialSource = AiConversationInitialSource.workflow;
    conversation.workflowDefinition = LazyReference.wrap(workflowDefinition);
    conversation.context = triggerContext
      ? [
          {
            type:
              triggerContext instanceof Issue
                ? "Issue"
                : triggerContext instanceof Project
                  ? "Project"
                  : triggerContext instanceof Initiative
                    ? "Initiative"
                    : "Cycle",
            id: triggerContext.id,
// DIFF-76 change at line 475
          },
        ]
      : [];
    conversation.status = AiConversationStatus.pending;
    return conversation;
  }

  private currentUserState(): AiConversationUserState | undefined {
    return this.userState.find(state => state.userId === this.store.user.id);
  }

  private currentUserLastReadAt(): Date | undefined {
    return AiConversation.normalizeLastReadAt(this.currentUserState()?.lastReadAt);
  }

  private setCurrentUserLastReadAt(readAt: Date): void {
    this.updateCurrentUserState({ lastReadAt: readAt });
  }

  private updateCurrentUserState(update: Partial<Omit<AiConversationUserState, "userId">>): void {
    const userId = this.store.user.id;
    const state = this.currentUserState();
    const updatedState = { ...state, ...update, userId };

    if (state) {
// DIFF-76 change at line 500
      this.userState = this.userState.map(existingState =>
        existingState.userId === userId ? updatedState : existingState
      );
    } else {
      this.userState = [...this.userState, updatedState];
    }
  }

  private static normalizeLastReadAt(lastReadAt: Date | string | undefined): Date | undefined {
    if (!lastReadAt) {
      return undefined;
    }
    return lastReadAt instanceof Date ? lastReadAt : new Date(lastReadAt);
  }
}

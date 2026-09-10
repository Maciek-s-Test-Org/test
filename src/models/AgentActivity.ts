import {
  AgentActivityExecutionSkippedReason,
  AgentActivityType,
  type IAgentActivityContent,
  type IAgentActivityElicitationContent,
  type IAgentActivityPromptContent,
} from "@linear/common/models/AgentActivity";
import { AgentActivityHelper } from "@linear/common/models/AgentActivityHelper";
import type { AgentActivityContextualMetadata } from "@linear/common/models/AgentActivityContextualMetadata";
import type { AgentActivityPushSummary } from "@linear/common/models/AgentActivityPushSummary";
import { EntityMentionHelper } from "@linear/common/models/helpers/EntityMentionHelper";
import type { ProsemirrorData, ProsemirrorDataNode } from "@linear/common/models/ProsemirrorHelper";
import {
  AgentActivitySignal,
  isValidSignalMetadata,
  type AgentActivityAuthElicitationMetadata,
  type AgentActivitySelectElicitationMetadata,
  type AgentActivitySignalMetadata,
} from "@linear/common/models/AgentActivitySignal";
import type { EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import { AgentSession } from "#models/AgentSession";
import { Comment } from "#models/Comment";
import { ClientModel, LazyManyToOne, Property, Action, LazyOneSidedReference, Computed } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { LazyReference } from "#models/hydration/Lazy";
import type { Store } from "#models/Store";
import { AgentActivityContentSerializer } from "#models/serialization/AgentActivityContentSerializer";
import { DateTimeSerializer } from "#models/serialization/Serialization";
import { TransactionResult, type TransactionMutation } from "#models/sync/transactions/Transaction";
import { User } from "#models/User";

/**
 * A model representing an activity within an agent session.
 */
@ClientModel("AgentActivity")
export class AgentActivity extends DeletableModel {
  /** A reference to the data store that the model is part of. */
  public override store: Store;

  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The agent session that this activity is associated with. */
  @LazyManyToOne(() => AgentSession, "agentActivities", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public agentSession: LazyReference<AgentSession>;

  /** The content of the activity with proper typing and serialization. */
  @Property({
    serializer: AgentActivityContentSerializer,
    default: () => ({ type: "thought", body: "" }) as IAgentActivityContent,
  })
  public content: IAgentActivityContent;

  /** An optional modifier that provides additional instructions on how the activity should be interpreted. */
  @Property({ persistence: "createOnly" })
  public signal?: AgentActivitySignal;

  /** The metadata for the signal. */
  @Property({ persistence: "createOnly" })
  public signalMetadata?: AgentActivitySignalMetadata;

  /** Whether the activity is ephemeral, and should disappear after the next agent activity. */
  @Property({ default: false })
  public ephemeral: boolean;

  /** The comment that contains the content of this activity, if any. */
  @LazyManyToOne(() => Comment, "createdAgentActivities", {
    nullable: true,
    indexed: true,
    persistence: "none",
  })
  public sourceComment?: LazyReference<Comment>;

  /** Attachment source metadata. What created the attachment. */
  @Property({ persistence: "none" })
  public sourceMetadata?: EntitySourceMetadata;

  /** Metadata about user-provided contextual information for this agent activity. */
  @Property({ persistence: "createOnly" })
  public contextualMetadata?: AgentActivityContextualMetadata;

  /** Commits pushed during this activity, captured at push time. */
  @Property({ persistence: "none" })
  public pushSummary?: AgentActivityPushSummary;

  /** Whether the activity is queued for later processing. */
  @Property({ default: false, persistence: "none" })
  public queued: boolean;

  /** The reason this activity was persisted without being sent to the agent runtime. */
  @Property({ enum: AgentActivityExecutionSkippedReason, persistence: "none" })
  public executionSkippedReason?: AgentActivityExecutionSkippedReason | null;

  /**
   * The time at which the prompt actually entered the conversation. Only set when the prompt did not enter
   * the conversation immediately (i.e., it was queued and later dequeued). Null for prompts sent directly
   * and for non-prompt activities.
   */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public sentAt?: Date | null;

  /** The user who created this activity. */
  @LazyOneSidedReference(() => User, {
    nullable: true,
    indexed: true,
    persistence: "none",
  })
  public user: LazyReference<User>;

  /** Pull request comments referenced by this prompt's structured content. */
  @Computed
  public get pullRequestCommentIds(): string[] {
    if (this.content.type !== AgentActivityType.prompt) {
      return [];
    }

    if (this.content.bodyData) {
      return pullRequestCommentIdsFromBodyData(this.content.bodyData);
    }

    return EntityMentionHelper.extractEntities(this.content.body)
      .filter(entity => entity.type === "PullRequestComment")
      .map(entity => entity.id);
  }

  /**
   * Returns a GraphQL mutation string that can be used to create the model.
   * Uses agentActivityCreatePrompt for prompt-type activities and the default mutation for others.
   *
   * @param usedVariableNames A set of variable names that are already in use. This is used to avoid name collisions.
   * @returns A GraphQL mutation that can be used to create the model.
   */
  public override createMutation(usedVariableNames: Set<string>): TransactionMutation {
    // Use the dedicated prompt creation mutation for prompt-type activities
    if (this.content.type === AgentActivityType.prompt) {
      let counter = 1;
      let variableName = "agentActivityCreatePromptInput";
      while (usedVariableNames.has(variableName)) {
        variableName = `agentActivityCreatePromptInput_${++counter}`;
      }

      const input: Record<string, unknown> = {
        agentSessionId: this.agentSession?.id,
        content: this.content.bodyData
          ? {
              type: this.content.type,
              bodyData: JSON.stringify(this.content.bodyData),
            }
          : this.content,
      };

      // Include sourceCommentId if available (it might not be set initially to avoid FK constraint issues)
      if (this.sourceComment?.id) {
        input.sourceCommentId = this.sourceComment.id;
      }

      // Include signal if available
      if (this.signal) {
        input.signal = this.signal;
      }

      // Include contextualMetadata if available
      if (this.contextualMetadata) {
        input.contextualMetadata = this.contextualMetadata;
      }

      if (this.queued) {
        input.queued = true;
      }

      if (this.id) {
        input.id = this.id;
      }

      const mutation = `agentActivityCreatePrompt(input: $${variableName}) { agentActivity { id } lastSyncId }`;
      this.observePropertyChanges();

      return {
        mutationText: mutation,
        variables: { [variableName]: input },
        variableTypes: { [variableName]: "AgentActivityCreatePromptInput" },
      };
    }

    // Use the default mutation for non-prompt activities
    return super.createMutation(usedVariableNames);
  }

  /**
   * Returns true if the activity is a stop request.
   */
  public isStopRequest(): this is AgentActivity & {
    content: IAgentActivityPromptContent;
    signal: AgentActivitySignal.stop;
  } {
    return this.content.type === AgentActivityType.prompt && this.signal === AgentActivitySignal.stop;
  }

  /**
   * Returns true if the activity is a user prompt that begins a new turn: a prompt with no signal (so stop requests
   * and other signalled prompts are excluded) that has entered the conversation.
   *
   * Queued prompts are excluded — until a queued prompt is dequeued (its `sentAt` is set and `queued` clears) it is a
   * draft, not yet part of the timeline, so it must not be treated as a turn boundary.
   */
  public isUserPrompt(): this is AgentActivity & { content: IAgentActivityPromptContent } {
    return this.content.type === AgentActivityType.prompt && !this.signal && !this.queued;
  }

  /**
   * Returns true if the activity ends its turn and yields control back: a terminal-type activity (response,
   * elicitation, or error) that is not a `continue`-signalled response. A `continue` response keeps the session
   * working in the same turn rather than yielding, so it is not turn-ending.
   */
  public get isTurnEnding(): boolean {
    return AgentActivityHelper.terminalTypes.has(this.content.type) && this.signal !== AgentActivitySignal.continue;
  }

  /**
   * Returns true if the activity is an auth elicitation with valid metadata.
   */
  public isAuthElicitation(): this is AuthElicitationActivity {
    return (
      this.content.type === AgentActivityType.elicitation &&
      this.signal === AgentActivitySignal.auth &&
      this.signalMetadata !== undefined &&
      isValidSignalMetadata(this.signal, AgentActivityType.elicitation, this.signalMetadata)
    );
  }

  /**
   * Returns true if the activity is a select elicitation with valid options.
   */
  public isSelectElicitation(): this is SelectElicitationActivity {
    return (
      this.content.type === AgentActivityType.elicitation &&
      this.signal === AgentActivitySignal.select &&
      this.signalMetadata !== undefined &&
      isValidSignalMetadata(this.signal, AgentActivityType.elicitation, this.signalMetadata)
    );
  }

  /**
   * Sends a queued prompt activity immediately.
   *
   * @returns The updated agent activity once the sync delta has been applied.
   */
  @Action
  public async sendQueued(): Promise<AgentActivity | undefined> {
    const createTransactions = this.store
      .transactionsForModel(this)
      .filter(transaction => transaction.type === "create");
    const createResults = await Promise.all(
      createTransactions.map(transaction => transaction.result({ waitForSync: false }))
    );
    if (createResults.includes(TransactionResult.offlined)) {
      return undefined;
    }

    return await this.store.mutate(AgentActivity, "agentActivitySendQueued", {
      id: this.id,
    });
  }

  /**
   * Deletes a queued prompt activity.
   *
   * @returns The archived agent activity once the sync delta has been applied.
   */
  @Action
  public async deleteQueued(): Promise<AgentActivity | undefined> {
    return await this.store.mutate(AgentActivity, "agentActivityDeleteQueued", {
      id: this.id,
    });
  }

  /**
   * Creates a prompt agent activity for the given agent session and user.
   *
   * @param params.agentSession The agent session to create the prompt activity for.
   * @param params.user The user creating the prompt activity.
   * @param params.body The body of the prompt activity (required if no signal).
   * @param params.bodyData The rich-text document used to render the prompt.
   * @param params.signal Optional signal to attach (e.g., stop). If provided without body, body defaults to signal.
   * @param params.sourceComment Optional source comment to link the activity to.
   * @param params.contextualMetadata Optional metadata about user-provided contextual information (e.g., code reviews).
   * @returns The created agent activity (not yet saved).
   */
  @Action
  public static createPromptActivity(
    params: {
      agentSession: AgentSession;
      user: User;
      sourceComment?: Comment;
      contextualMetadata?: AgentActivityContextualMetadata;
      bodyData?: ProsemirrorData;
      queued?: boolean;
    } & ({ body: string; signal?: AgentActivitySignal } | { body?: string; signal: AgentActivitySignal })
  ): AgentActivity {
    const { agentSession, user, body, bodyData, signal, sourceComment, contextualMetadata, queued } = params;

    const agentActivity = new AgentActivity();
    agentActivity.agentSession = LazyReference.wrap(agentSession);
    agentActivity.content = {
      type: AgentActivityType.prompt,
      body: body ?? signal ?? "",
      ...(bodyData ? { bodyData } : {}),
    };
    if (signal) {
      agentActivity.signal = signal;
    }
    if (sourceComment) {
      agentActivity.sourceComment = LazyReference.wrap(sourceComment);
    }
    if (contextualMetadata) {
      agentActivity.contextualMetadata = contextualMetadata;
    }
    if (queued) {
      agentActivity.queued = true;
    }
    agentActivity.user = LazyReference.wrap(user);
    return agentActivity;
  }
}

function pullRequestCommentIdsFromBodyData(bodyData: ProsemirrorData): string[] {
  const commentIds = new Set<string>();

  function visit(nodes: ProsemirrorDataNode[]): void {
    for (const node of nodes) {
      const commentId = node.type === "pullRequestCommentPrompt" ? node.attrs?.pullRequestCommentId : undefined;
      if (typeof commentId === "string" && commentId.length > 0) {
        commentIds.add(commentId);
      }
      if (Array.isArray(node.content)) {
        visit(node.content as ProsemirrorDataNode[]);
      }
    }
  }

  visit(bodyData.content);
  return [...commentIds];
}

/**
 * Type-narrowed definition of an 'auth'-signal agent activity.
 */
export type AuthElicitationActivity = AgentActivity & {
  content: IAgentActivityElicitationContent;
  signal: AgentActivitySignal.auth;
  signalMetadata: AgentActivityAuthElicitationMetadata;
};

/**
 * Type-narrowed definition of a 'select'-signal agent activity.
 */
export type SelectElicitationActivity = AgentActivity & {
  content: IAgentActivityElicitationContent;
  signal: AgentActivitySignal.select;
  signalMetadata: AgentActivitySelectElicitationMetadata;
};

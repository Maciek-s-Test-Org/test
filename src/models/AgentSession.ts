// DIFF-76: modified fixture
import { untracked } from "mobx";
import {
  type AgentSessionModelSelection,
  AgentSessionModelSelectionHelper,
  AgentSessionStatus,
  type AgentSessionAvailableSkills,
  type AgentSessionPlan,
  type AgentSessionExternalUrls,
} from "@linear/common/models/AgentSession";
import type { DiffSummary } from "@linear/common/models/Diff";
import type { AgentSessionUserState } from "@linear/common/models/AgentSessionUserState";
import type { AiConversationContext } from "@linear/common/models/AiConversationContext";
import { AgentActivitySignal } from "@linear/common/models/AgentActivitySignal";
import { AgentActivityType, isAgentActivityContentOfType } from "@linear/common/models/AgentActivity";
import { AgentActivityHelper } from "@linear/common/models/AgentActivityHelper";
import type { EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import {
  ClientModel,
  Computed,
  LazyManyToOne,
  LazyOneSidedReference,
  LazyOneToMany,
  ManyToOne,
  OneSidedReference,
// DIFF-76 change at line 25
  Property,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { LazyReference } from "#models/hydration/Lazy";
import type { Store } from "#models/Store";
import { User } from "#models/User";
import { Comment } from "#models/Comment";
import { CodingEnvironment } from "#models/CodingEnvironment";
import { AgentActivity, type AuthElicitationActivity, type SelectElicitationActivity } from "#models/AgentActivity";
import { Diff } from "#models/Diff";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import { Issue } from "#models/Issue";
import type { Attachment } from "#models/Attachment";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import type { InlineFindable } from "#models/InlineFindable";
import { Organization } from "#models/Organization";
import type { PullRequest } from "#models/PullRequest";
import { AgentSessionToPullRequest } from "#models/AgentSessionToPullRequest";
import { AgentSessionUtils } from "#utils/AgentSessionUtils";
import { UrlHelper } from "#utils/UrlHelper";
import type { Hydrated } from "#models/base/ModelTypes.js";

/**
// DIFF-76 change at line 50
 * A model representing an agent session for activities and state management.
 */
@ClientModel("AgentSession")
export class AgentSession extends DeletableModel implements InlineFindable {
  /** A reference to the data store that the model is part of. */
  public override store: Store;

  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  public static override skipUpdatedAtKeys = new Set(["availableSkills", "userState"]);

  /** The app user that owns this agent session. */
  @OneSidedReference(() => User, { persistence: "createOnly", optional: false, nullable: false })
  public appUser: User;

  /** The user who created this agent session. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public creator?: User;

  /** The user who dismissed (archived) this agent session. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public dismissedBy?: User;

  @ManyToOne(() => Organization, "agentSessions", {
// DIFF-76 change at line 75
    persistence: "none",
    nullable: false,
    optional: false,
    indexed: true,
  })
  public organization: Organization;

  /** The coding environment selected for this session. */
  @LazyOneSidedReference(() => CodingEnvironment, { persistence: "none", nullable: true })
  public codingEnvironment?: LazyReference<CodingEnvironment>;

  /** The comment that this agent session is directly attached to and associated with. */
  @LazyManyToOne(() => Comment, "agentSessions", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public comment?: LazyReference<Comment>;

  /** The comment that this agent session was spawned from, if from a different thread. */
  @LazyManyToOne(() => Comment, "spawnedAgentSessions", {
    optional: true,
    nullable: false,
    indexed: true,
// DIFF-76 change at line 100
    persistence: "none",
  })
  public sourceComment?: LazyReference<Comment>;

  /** The issue that this agent session is associated with. */
  @LazyManyToOne(() => Issue, "agentSessions", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public issue?: LazyReference<Issue>;

  /** The slug ID for the agent session. */
  @Property({ persistence: "none", default: "", indexed: true })
  public readonly slugId: string;

  /** The slug of the agent session. */
  @Computed
  public get slug(): string {
    return `agent-session-${this.slugId}`;
  }

  /** The current status of the agent session. */
  @Property({ default: AgentSessionStatus.pending, persistence: "none" })
// DIFF-76 change at line 125
  public status: AgentSessionStatus;

  /** The time the agent session started. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public startedAt?: Date;

  /** The time the agent session ended. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public endedAt?: Date;

  /** The time the agent session was dismissed. */
  @Property({ serializer: DateTimeSerializer, persistence: "updateOnly" })
  public dismissedAt?: Date;

  /** A generated summary of the agent session. */
  @Property({ persistence: "none" })
  public summary?: string;

  /** Metadata about the external source that created this agent session. */
  @Property({ persistence: "none" })
  public sourceMetadata?: EntitySourceMetadata;

  /** How Adaptive selected the model route used by this coding session. */
  @Property({ persistence: "none", serializer: JSONSerializer })
  public modelSelection?: AgentSessionModelSelection;
// DIFF-76 change at line 150

  /** The activities associated with this agent session. */
  @LazyOneToMany(() => AgentActivity, {
    index: "agentSessionId",
    order: new CollectionOrder<AgentActivity>(activity => activity.sentAt ?? activity.createdAt, "asc"),
  })
  public agentActivities: LazyCollection<AgentActivity>;

  /** Join table for pull requests associated with this agent session. */
  @LazyOneToMany(() => AgentSessionToPullRequest, {
    index: "agentSessionId",
    order: new CollectionOrder("createdAt", "desc"),
  })
  public readonly agentSessionToPullRequests: LazyCollection<AgentSessionToPullRequest>;

  /** The first-class diffs anchored to this agent session. At most one is live (non-archived) at a time. */
  @LazyOneToMany(() => Diff, { index: "agentSessionId" })
  public readonly diffs: LazyCollection<Diff>;

  /**
   * The session's live working-tree diff as a first-class model. Replaces the `workspaceDiff` summary as the
   * underlying model for agent-session code changes.
   */
  @Computed
  public get diff(): Diff | undefined {
// DIFF-76 change at line 175
    return this.diffs.first;
  }

  /**
   * The external link associated with this agent session.
   */
  @Property({ persistence: "none" })
  public externalLink?: string;

  /** URLs of external resources associated with this session. */
  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public externalUrls: AgentSessionExternalUrls;

  /** The agent's plan for the session. */
  @Property({ persistence: "none" })
  public plan?: AgentSessionPlan;

  /** Skills available to the coding agent for this session. */
  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public availableSkills: AgentSessionAvailableSkills;

  /**
   * The coding agent's live working-tree diff metadata (changes not yet pushed to origin), reported by the sandbox.
   * Per-file content is fetched on demand from the workspace-diff-blob route. Null when the sandbox is in sync.
   */
// DIFF-76 change at line 200
  @Property({ persistence: "none" })
  public workspaceDiff?: DiffSummary | null;

  /** The contexts this session is related to (e.g., Issue, Project). Used for direct chat sessions. */
  @Property({ persistence: "createOnly", default: [] })
  public context: AiConversationContext[];

  /** User-specific state for this agent session (e.g., read status). */
  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public userState: AgentSessionUserState[];

  /**
   * Whether the session has unread updates for the current user.
   * True if the user has never read the session, or if it was updated after their last read time.
   */
  @Computed
  public get isUnread(): boolean {
    const lastReadAt = this.getLastReadAt(this.store.user.id);
    if (!lastReadAt) {
      return true;
    }
    return this.updatedAt > lastReadAt;
  }

  /**
// DIFF-76 change at line 225
   * Whether the agent session has a pending stop request (last activity is a stop request).
   */
  public get hasPendingStopRequest(): boolean {
    return this.agentActivities.last?.isStopRequest() ?? false;
  }

  /**
   * Gets the id of the last terminal activity in the session.
   *
   * @returns The id of the last terminal activity, if any.
   */
  @Computed
  public get lastTerminalActivityId(): string | undefined {
    return this.agentActivities.findLast(activity => AgentActivityHelper.terminalTypes.has(activity.content.type))?.id;
  }

  /**
   * Gets the id of the last response activity in the session.
   *
   * @returns The id of the last response activity, if any.
   */
  @Computed
  public get lastResponseActivityId(): string | undefined {
    return this.agentActivities.findLast(activity => activity.content.type === AgentActivityType.response)?.id;
  }
// DIFF-76 change at line 250

  /**
   * Returns external URLs filtered to exclude any PR links that are already shown as a PR badge (via
   * agentSessionToPullRequests or the latestPullRequest fallback).
   */
  @Computed
  public get filteredExternalUrls(): AgentSessionExternalUrls {
    const prUrls = new Set(
      this.agentSessionToPullRequests.elements
        .map(join => join.pullRequest.value?.url)
        .concrete()
        .map(url => UrlHelper.normalizeUrl(url))
    );

    // Add a fallback for the race where the AgentSessionToPullRequest record hasn't been created yet but the agent
    // linked the PR explicitly and later appeared as an issue attachment. See LIN-61582.
    const latestPrUrl = this.latestPullRequest?.url;
    if (latestPrUrl) {
      prUrls.add(UrlHelper.normalizeUrl(latestPrUrl));
    }

    return this.externalUrls.filter(externalUrl => !prUrls.has(UrlHelper.normalizeUrl(externalUrl.url)));
  }

  /**
// DIFF-76 change at line 275
   * Whether the agent session has any external URLs (including legacy externalLink).
   */
  public get hasExternalUrls(): boolean {
    return !!(this.externalLink || this.externalUrls.length > 0);
  }

  /**
   * Hydrates direct and legacy pull request data used by {@link latestPullRequest}.
   *
   * @returns The hydrated agent session.
   */
  public async hydrateLatestPullRequest(): Promise<Hydrated<AgentSession>> {
    const agentSession = await this.hydrate();
    const agentSessionToPullRequests = await agentSession.agentSessionToPullRequests.hydrate();

    await Promise.all(agentSessionToPullRequests.elements.map(join => join.pullRequest.resolve()));

    if (agentSession.latestPullRequest) {
      return agentSession;
    }

    const issue = agentSession.issue?.value;
    if (!issue) {
      return agentSession;
    }
// DIFF-76 change at line 300

    await Promise.all([issue.hydrateAllAttachments(), issue.linkedPullRequests.hydrate()]);

    return agentSession;
  }

  /**
   * Whether the agent session has been acknowledged by the agent.
   *
   * True if an external link is set, or if there are any activities that are not user prompts (i.e., agent-generated
   * activities).
   *
   * This mirrors the backend `AgentSession.hasBeenAcknowledged` method.
   */
  @Computed
  public get hasBeenAcknowledged(): boolean {
    if (this.hasExternalUrls) {
      return true;
    }
    return this.agentActivities.some(activity => activity.content.type !== AgentActivityType.prompt);
  }

  /**
   * Whether the session went stale before the agent produced any activity — the "didn't start" failure case, as
   * opposed to a session that stopped responding after doing some work.
// DIFF-76 change at line 325
   */
  public get isStaleUnacknowledged(): boolean {
    return this.status === AgentSessionStatus.stale && !this.hasBeenAcknowledged;
  }

  /**
   * Whether the agent session can be stopped right now.
   */
  public get isStoppable(): boolean {
    return (
      (this.status === AgentSessionStatus.active || this.status === AgentSessionStatus.pending) &&
      !this.hasPendingStopRequest
    );
  }

  /**
   * Whether new prompts should be queued rather than sent immediately.
   *
   * True when the agent is working (active/pending), or when a queue already exists and the session isn't in
   * `awaitingInput`, so submission order is preserved even when the session has drifted to `stale`, `error`, or
   * `complete`. During elicitations (awaitingInput) this returns false so the user's entered reply is sent immediately
   * as the elicitation answer.
   */
  @Computed
  public get shouldQueuePrompts(): boolean {
// DIFF-76 change at line 350
    if (this.status === AgentSessionStatus.awaitingInput) {
      return false;
    }
    if (this.status === AgentSessionStatus.active || this.status === AgentSessionStatus.pending) {
      return true;
    }
    return this.hasQueuedActivities;
  }

  /** Activities that are currently queued, ordered by creation time ascending. */
  @Computed
  public get queuedActivities(): AgentActivity[] {
    return this.agentActivities.elements
      .filter(activity => activity.queued && !activity.isArchived)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }

  /** Whether the session has any queued activities. */
  @Computed
  public get hasQueuedActivities(): boolean {
    return this.queuedActivities.length > 0;
  }

  /**
   * Whether the agent session has a pending/ongoing elicitation activity (of any type).
// DIFF-76 change at line 375
   */
  public get hasPendingElicitation(): boolean {
    return Boolean(this.pendingElicitation);
  }

  @Computed
  public get pendingElicitation(): AgentActivity | null {
    if (this.status !== AgentSessionStatus.awaitingInput) {
      return null;
    }
    const lastActivity = this.agentActivities.last;
    return lastActivity && isAgentActivityContentOfType(lastActivity.content, AgentActivityType.elicitation)
      ? lastActivity
      : null;
  }

  /**
   * Whether the agent session has a pending/ongoing auth elicitation activity.
   */
  public get hasPendingAuthElicitation(): boolean {
    return Boolean(this.pendingAuthElicitation);
  }

  /**
   * Returns the pending auth elicitation activity, if the latest activity is an auth elicitation.
// DIFF-76 change at line 400
   */
  @Computed
  public get pendingAuthElicitation(): AuthElicitationActivity | null {
    const pendingElicitation = this.pendingElicitation;
    return pendingElicitation?.isAuthElicitation() ? pendingElicitation : null;
  }

  /**
   * Whether the agent session has a pending/ongoing select elicitation activity.
   */
  public get hasPendingSelectElicitation(): boolean {
    return Boolean(this.pendingSelectElicitation);
  }

  /**
   * Returns the pending select elicitation activity, if the latest activity is a select elicitation.
   */
  @Computed
  public get pendingSelectElicitation(): SelectElicitationActivity | null {
    const pendingElicitation = this.pendingElicitation;
    return pendingElicitation?.isSelectElicitation() ? pendingElicitation : null;
  }

  /**
   * Returns true if the agent session matches the inline search query.
// DIFF-76 change at line 425
   */
  public matchInlineFind(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    // Search in summary
    if (this.summary?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in app user name
    if (this.appUser.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in app user username (displayName)
    if (this.appUser.displayName.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in associated issue title
    if (this.issue?.value?.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in associated issue identifier
// DIFF-76 change at line 450
    if (this.issue?.value?.identifier.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  }

  /**
   * Gets the createdAt timestamp of the last terminal activity in this session.
   * Terminal activities are: response (without "continue" signal), error, or elicitation.
   * Falls back to session's createdAt if no terminal activities exist.
   *
   * @returns The timestamp of the last terminal activity, or session's createdAt as fallback.
   */
  @Computed
  public get lastTerminalActivityTimestamp(): Date {
    // Iterate backwards through activities to find the last terminal one
    const activities = Array.from(this.agentActivities);
    for (let i = activities.length - 1; i >= 0; i--) {
      const activity = activities[i];
      if (activity && AgentActivityHelper.terminalTypes.has(activity.content.type)) {
        // Response activities with "continue" signal are non-terminal
        if (activity.content.type === AgentActivityType.response && activity.signal === AgentActivitySignal.continue) {
          continue;
        }
// DIFF-76 change at line 475
        return activity.createdAt;
      }
    }

    // Fallback to createdAt if no terminal activities found
    return this.createdAt;
  }

  /**
   * Gets the start time of the current working period for timer display.
   * Finds the most recent prompt after the last terminal activity, falling back to the terminal activity timestamp,
   * then to session creation time.
   *
   * @returns The timestamp when the current working period started.
   */
  @Computed
  public get latestSegmentStartTime(): Date {
    const lastTerminal = this.lastTerminalActivityTimestamp;
    const activities = Array.from(this.agentActivities);

    // Find the last prompt after the terminal activity
    for (let i = activities.length - 1; i >= 0; i--) {
      const activity = activities[i];
      if (activity.content.type === AgentActivityType.prompt && activity.createdAt > lastTerminal) {
        return activity.createdAt;
// DIFF-76 change at line 500
      }
    }

    return lastTerminal;
  }

  /**
   * Gets the latest pull request entity referenced in this agent session.
   *
   * First checks directly associated pull requests, then falls back to issue PR attachments that match URLs in the
   * session's externalUrls or activities markdown content.
   *
   * @returns The latest pull request entity found, or undefined if none exists.
   */
  @Computed
  public get latestPullRequest(): PullRequest | undefined {
    // Explicitly associated PRs
    const latestJoin = this.agentSessionToPullRequests.first;
    if (latestJoin?.pullRequest.value) {
      return latestJoin.pullRequest.value;
    }

    // Legacy fallback: Match URLs in the session or activities against issue PR attachments
    return this.inferredPullRequestAttachment?.pullRequestEntity;
  }
// DIFF-76 change at line 525

  /** Maps terminal activity IDs to commits pushed during their turns, using pull request timestamps as a fallback. */
  @Computed
  public get commitsByTurnActivityId(): Map<string, AgentSessionUtils.TurnCommit[]> {
    const pullRequest = this.latestPullRequest;
    return AgentSessionUtils.attributeTurnCommits({
      activities: this.agentActivities.elements,
      pullRequestCommits: pullRequest?.commits ?? [],
      pullRequestHeadSha: pullRequest?.headSha,
      sessionCreatedAt: this.createdAt,
    });
  }

  /** Whether any pull request associated with this session was merged. */
  @Computed
  public get hasMergedPullRequest(): boolean {
    return (
      this.agentSessionToPullRequests.some(join => join.pullRequest.value?.isMerged === true) ||
      this.inferredPullRequestAttachment?.pullRequestEntity?.isMerged === true
    );
  }

  /** Whether any pull request associated with this session was closed without merging. */
  @Computed
  public get hasClosedPullRequest(): boolean {
// DIFF-76 change at line 550
    return (
      this.agentSessionToPullRequests.some(join => join.pullRequest.value?.isClosed === true) ||
      this.inferredPullRequestAttachment?.pullRequestEntity?.isClosed === true
    );
  }

  /** Whether this session counts as dismissed for agent session bucketing. */
  @Computed
  public get isDismissedResult(): boolean {
    return this.isDismissed || this.hasClosedPullRequest;
  }

  /** Whether this session counts as errored for agent session bucketing. */
  @Computed
  public get isErroredResult(): boolean {
    return !this.isDismissedResult && this.status === AgentSessionStatus.error;
  }

  /**
   * Gets the issue attachment corresponding to {@link latestPullRequest}, if one exists.
   *
   * @returns The issue attachment whose URL matches the latest pull request, or undefined.
   */
  @Computed
  public get latestPullRequestAttachment(): Attachment | undefined {
// DIFF-76 change at line 575
    const latestPr = this.latestPullRequest;
    if (!latestPr) {
      return undefined;
    }
    return this.issuePrAttachmentsByUrl.get(UrlHelper.normalizeUrl(latestPr.url));
  }

  /**
   * Infers a pull request attachment by matching the session's externalUrls against issue PR attachments, then falling
   * back to scanning activity markdown for PR URLs.
   *
   * @returns The inferred pull request attachment, or undefined if none exists.
   */
  @Computed
  private get inferredPullRequestAttachment(): Attachment | undefined {
    const prAttachmentsByUrl = this.issuePrAttachmentsByUrl;
    if (prAttachmentsByUrl.size === 0) {
      return undefined;
    }

    // Match externalUrls against issue PR attachments (handles the race where the AgentSessionToPullRequest join record
    // hasn't been created yet); see LIN-61582. Search from the end since URLs are appended on upsert, so the last match
    // is the most recent.
    for (const externalUrl of this.externalUrls.toReversed()) {
      const attachment = prAttachmentsByUrl.get(UrlHelper.normalizeUrl(externalUrl.url));
// DIFF-76 change at line 600
      if (attachment) {
        return attachment;
      }
    }

    // Fallback: scan activity markdown for PR URLs.
    // Access .length to track only the collection size, so this computed re-evaluates when new
    // activities arrive. Individual activity content is read inside untracked() to avoid O(N)
    // MobX dependency tracking that causes expensive re-render cascades during incremental
    // activity hydration.
    const activities = this.agentActivities;
    if (activities.length === 0) {
      return undefined;
    }
    return untracked(() => {
      const activityList = Array.from(activities);
      for (let i = activityList.length - 1; i >= 0; i--) {
        const activity = activityList[i];
        if (activity.content.type !== AgentActivityType.response) {
          // Skip non-response activities
          continue;
        }

        const markdown = AgentSessionUtils.getActivityBody(activity);
        if (!markdown) {
// DIFF-76 change at line 625
          continue;
        }

        // Extract URLs from this activity
        const urls = UrlHelper.parseUrlsFromMarkdown(markdown);
        for (const url of urls) {
          const normalizedUrl = UrlHelper.normalizeUrl(url);
          const attachment = prAttachmentsByUrl.get(normalizedUrl);
          if (attachment) {
            return attachment;
          }
        }
      }

      return undefined;
    });
  }

  /**
   * Map of normalized PR URLs to their issue attachments. Empty map if the issue has no PR attachments.
   */
  @Computed
  private get issuePrAttachmentsByUrl(): ReadonlyMap<string, Attachment> {
    const issue = this.issue?.value;
    if (!issue?.hasPullRequestAttachments) {
// DIFF-76 change at line 650
      return new Map();
    }
    return new Map(issue.pullRequestAttachments.elements.map(att => [UrlHelper.normalizeUrl(att.url), att]));
  }

  /**
   * Dismiss (archives) the agent session by setting dismissedAt to current time.
   *
   * Also deletes the current user's draft and clears the delegate from the associated issue if this is the only
   * non-dismissed session for the agent on the issue.
   */
  public dismiss(): void {
    // Clear delegate from issue if applicable. Note: The delegate is cleared first so that if a user undoes this action
    // in the UI, `AgentSession.dismissedAt` is restored before `Issue.delegate`, ensuring the server-side session
    // lookup during re-delegation finds the restored session and won't create a separate new one.
    const issue = this.issue?.value;
    if (issue && issue.delegate?.id === this.appUser.id) {
      const hasOtherActiveSessions = issue.agentSessions.elements.some(
        session => session.id !== this.id && session.appUser.id === this.appUser.id && !session.isDismissed
      );
      if (!hasOtherActiveSessions) {
        issue.delegate = undefined;
        issue.save();
      }
    }
// DIFF-76 change at line 675

    const commentId = this.comment?.id;
    if (commentId) {
      this.store.user.drafts.find(draft => !draft.isArchived && draft.parentComment?.id === commentId)?.delete();
    }

    this.dismissedAt = new Date();
    // Optimistically set dismissedBy to the current user to show this in the UI (though the backend sets this to the
    // current user regardless)
    this.dismissedBy = this.store.user;
    this.save();
  }

  /**
   * Undismiss (unarchives) the agent session by clearing dismissedAt.
   */
  public undismiss(): void {
    this.dismissedAt = undefined;
    this.save();
  }

  /**
   * Whether the session is a "didn't start" failure that can be retried: it went stale before the agent produced any
   * activity, and the issue hasn't since been delegated to a different agent.
   */
// DIFF-76 change at line 700
  public get isRetryable(): boolean {
    const issue = this.issue?.value;
    return (
      this.isStaleUnacknowledged &&
      !this.isDismissed &&
      issue !== undefined &&
      (issue.delegate === undefined || issue.delegate.id === this.appUser.id)
    );
  }

  /** Whether this coding session can be restarted with the default model. */
  public get isRestartableWithDefaultModel(): boolean {
    return (
      Boolean(this.appUser.isLinearAppUser) &&
      !this.isDismissed &&
      AgentSessionModelSelectionHelper.isNonDefault(this.modelSelection)
    );
  }

  /**
   * Retries an unresponsive agent session by archiving it and re-delegating the issue to the same agent, which makes
   * the server create a fresh session.
   *
   * @returns True if the retry was performed, false if the session is not retryable.
   */
// DIFF-76 change at line 725
  public retry(): boolean {
    const issue = this.issue?.value;
    if (!this.isRetryable || !issue) {
      return false;
    }

    this.dismiss();

    if (issue.delegate?.id === this.appUser.id) {
      issue.delegate = undefined;
      issue.save();
    }

    issue.delegate = this.appUser;

    if (!issue.assignee) {
      issue.assignee = this.store.user;
    }
    issue.save();

    return true;
  }

  /**
   * Whether the agent session is dismissed (archived).
// DIFF-76 change at line 750
   */
  public get isDismissed(): boolean {
    return this.dismissedAt !== undefined;
  }

  /**
   * The statuses that are considered terminal.
   */
  public static readonly terminalStates = new Set([
    AgentSessionStatus.complete,
    AgentSessionStatus.error,
    AgentSessionStatus.awaitingInput,
  ]);

  /**
   * Whether the agent session's state is terminal (complete, error, awaitingInput).
   */
  public get isStateTerminal(): boolean {
    return AgentSession.terminalStates.has(this.status);
  }

  /**
   * Determines if a user is involved in the session (either as creator or participant).
   *
   * @param userId The ID of the user to check.
// DIFF-76 change at line 775
   * @returns True if the user is the creator or has participated via agent activities, false otherwise.
   */
  public isUserInvolved(userId: string): boolean {
    // User is the creator
    if (this.creator?.id === userId) {
      return true;
    }

    // User has participated in the session via agent activities
    return this.agentActivities.some(activity => activity.user?.value?.id === userId);
  }

  /**
   * Gets the user state for a specific user.
   *
   * @param userId The ID of the user to get the state for.
   * @returns The user state for the specified user.
   */
  public getUserState(userId: string): AgentSessionUserState {
    return this.userState.find(s => s.userId === userId) ?? { userId };
  }

  /**
   * Sets the user state for a specific user.
   *
// DIFF-76 change at line 800
   * @param state The new state to set.
   */
  public setUserState(state: AgentSessionUserState): void {
    if (!this.userState.some(s => s.userId === state.userId)) {
      this.userState = [...this.userState, state];
    } else {
      this.userState = this.userState.map(s => (s.userId === state.userId ? state : s));
    }
  }

  /**
   * Marks the session as read for a specific user.
   * Only updates if the new readAt time is more recent than the existing one.
   *
   * @param userId The ID of the user to mark as read.
   * @param readAt The time to mark as read. Defaults to the current time.
   */
  public markAsRead(userId: string, readAt: Date = new Date()): void {
    const state = this.getUserState(userId);
    if (state.lastReadAt && state.lastReadAt >= readAt) {
      return;
    }
    this.setUserState({ ...state, lastReadAt: readAt });
    this.save();
  }
// DIFF-76 change at line 825

  /**
   * Gets the last read time for a specific user.
   *
   * @param userId The ID of the user to get the last read time for.
   * @returns The last read time, or undefined if the user hasn't read the session.
   */
  public getLastReadAt(userId: string): Date | undefined {
    return this.getUserState(userId).lastReadAt;
  }

  /** Creates a new agent session, either for direct chat or on an issue. */
  public static create(props: {
    creator: User;
    appUser: User;
    issue?: Issue;
    context?: AiConversationContext[];
  }): Hydrated<AgentSession> {
    const session = AgentSession.createEmpty();
    session.appUser = props.appUser;
    if (props.issue) {
      session.issue = LazyReference.wrap(props.issue);
    }
    session.context = props.context ?? [];
    // These fields are optimistically set to show in the UI, though the server will initialize them regardless
// DIFF-76 change at line 850
    session.creator = props.creator;
    session.organization = props.creator.organization;
    return session;
  }
}

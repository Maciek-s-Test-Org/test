```
import type { PullRequestIssueLink } from "@linear/common/models/PullRequestIssueLink";
import type { PullRequestPreviewLink } from "@linear/common/models/PullRequestPreviewLink";
import { PullRequestCheckStatus, type PullRequestCheck } from "@linear/common/models/PullRequestCheck";
import type { PullRequestDiffStats } from "@linear/common/models/PullRequestDiffStats";
import { PullRequestMergeStatus, PullRequestStatus } from "@linear/common/models/PullRequestStatus";
import type { PullRequestMergeSettings } from "@linear/common/models/PullRequestMergeSettings";
import { PullRequestUserState } from "@linear/common/models/PullRequestUserState";
import type { PullRequestRepository } from "@linear/common/models/PullRequestRepository";
import { notReachable } from "@linear/orbiter/errors/UnreachableCaseError";
import type { EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import { IntegrationService } from "@linear/common/models/Integration";
import { slugifyTitle } from "@linear/common/utils/slugifyTitle";
import { MarkdownTransformer } from "@linear/editor/markdown";
import type { ProsemirrorData } from "@linear/editor/types";
import type { EmojiReactions } from "@linear/common/models/EmojiReactionsType";
import { PullRequestReviewerDecision, type PullRequestReviewer } from "@linear/common/models/PullRequestReviewer";
import type { PullRequestCommit } from "@linear/common/models/PullRequestCommit";
import { deburr } from "~/utils/deburr";
import type { InlineFindable } from "~/models/InlineFindable";
import { type FavoritableModel, Favorite } from "~/models/Favorite";
import { Issue } from "~/models/Issue";
import type { LazyCollection } from "~/models/collections/LazyCollection";
import type { Notification } from "~/models/Notification";
import { PullRequestComment } from "~/models/PullRequestComment";
import { Draft } from "~/models/Draft";
import type { Store } from "~/models/Store";
import { GitAttachmentDisplayPreference } from "~/models/UserSettingsFiles/GitAttachmentDisplayPreference";
import { Feature } from "~/Features";
import { VcsIntegrationHelper } from "~/utils/pull-requests/VcsIntegrationHelper";
import { PullRequestAttachmentAdapter } from "~/utils/pull-requests/PullRequestAttachmentAdapter";
import {
  Action,
  ClientModel,
  Computed,
  LazyManyToMany,
  LazyManyToOne,
  LazyOneSidedReference,
  LazyOneToMany,
  ManyToMany,
  ManyToOne,
  Observable,
  OneSidedReference,
  OneToMany,
  OneToOne,
  Property,
} from "./base/Decorators";
import { Model } from "./base/Model";
import { ModelLoadStrategy, PartialLoadMode, PartialPreloadForTeam } from "./base/ModelLoadStrategy";
import { type Collection, CollectionOrder } from "./collections";
import { ExternalUser } from "./ExternalUser";
import { User } from "./User";
import type { LazyReference } from "./hydration/Lazy";
import { Organization } from "./Organization";
import { CustomJSONSerializer, DateTimeSerializer, JSONSerializer } from "./serialization/Serialization";
import { PullRequestNotification } from "./Notification";
import { PullRequestHistory } from "./PullRequestHistory";
import { PullRequestDiff } from "./PullRequestDiff";
import { PullRequestPendingReview } from "./PullRequestPendingReview";

/** A user's responsibility on a pull request. */
export enum PullRequestResponsibility {
  todo = "todo",
  waiting = "waiting",
  completed = "completed",
}

/** A pull request's estimated size. */
export enum PullRequestSizeEstimate {
  "xs" = "xs",
  "s" = "s",
  "m" = "m",
  "l" = "l",
  "xl" = "xl",
}

/** Sort order rank of pull request statuses. */
export const pullRequestStatusOrder = {
  open: 1,
  inReview: 2,
  approved: 3,
  merged: 4,
  closed: 5,
  draft: 6,
} satisfies Record<PullRequestStatus, number>;

@ClientModel("PullRequest")
export class PullRequest extends Model implements InlineFindable, FavoritableModel {
  public static override loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;
  public static override partialPreloadForTeam = PartialPreloadForTeam.secondPriority;

  public override store: Store;

  /** The organization of the pull request. */
  @ManyToOne(() => Organization, "allPullRequests", { indexed: true, nullable: false, optional: false })
  public organization: Organization;

  /** The slug ID (for use in pull request URLs). */
  @Property({ indexed: true, default: "" })
  public slugId: string;

  /** The title of the pull request. */
  @Property({ default: "" })
  public title: string;

  /** The description of the pull request. */
  @Property()
  public descriptionData?: ProsemirrorData;

  /** The repository containing the pull request. */
  @Property({ default: {} })
  public repository: PullRequestRepository;

  /** The number of the pull request. */
  @Property({ default: 1 })
  public number: number;

  /** The source branch of the pull request. */
  @Property({ default: "" })
  public sourceBranch: string;

  /** The target branch of the pull request. */
  @Property({ default: "" })
  public targetBranch: string;

  /** Statistics about the diff size of the pull request. */
  @Property()
  public diffStats?: PullRequestDiffStats;

  /** Tip of the source branch of the pull request. */
  @Property()
  public headSha?: string;

  /** Base of the target branch of the pull request. */
  @Property()
  public baseSha?: string;

  /** The URL of the pull request. */
  @Property({ default: "" })
  public url: string;

  /** The status of the pull request. */
  @Property({ default: PullRequestStatus.open })
  public status: PullRequestStatus;

  /** The merge status of the pull request. */
  @Property({ default: PullRequestMergeStatus.ready })
  public mergeStatus: PullRequestMergeStatus;

  /** The date when the pull request was opened. */
  @Property({ serializer: DateTimeSerializer, default: () => new Date() })
  public openedAt: Date;

  /** The date when the pull request was closed. */
  @Property({ serializer: DateTimeSerializer })
  public closedAt?: Date;

  /** The date when the pull request was merged. */
  @Property({ serializer: DateTimeSerializer })
  public mergedAt?: Date;

  /** The date when the pull request was last synced. */
  @Property({ serializer: DateTimeSerializer })
  public lastSyncedAt?: Date;

  /** The reviewers of the pull request. */
  @Property({
    serializer: CustomJSONSerializer({
      lastReviewedAt: { serializer: DateTimeSerializer, nullable: true },
    }),
    default: [],
  })
  public reviewers: PullRequestReviewer[];

  /** Links between the pull request and issues. */
  @Property({ default: [] })
  public issueLinks: PullRequestIssueLink[];

  /** Preview links extracted from the pull request. */
  @Property({ default: [] })
  public previewLinks: PullRequestPreviewLink[];

  /** Checks that apply to the pull request. */
  @Property({
    serializer: CustomJSONSerializer({
      startedAt: { serializer: DateTimeSerializer, nullable: true },
      completedAt: { serializer: DateTimeSerializer, nullable: true },
    }),
    default: [],
  })
  public checks: PullRequestCheck[];

  /** Commits associated with the pull request. */
  @Property({ default: [] })
  public commits: PullRequestCommit[];

  /** Whether the pull request has conflicts with the target branch. */
  @Property({ default: false })
  public hasConflicts: boolean;

  /** Whether the pull request has auto-merge enabled. */
  @Property({ default: false })
  public autoMergeEnabled: boolean;

  /** Merge settings for the pull request. */
  @Property()
  public mergeSettings?: PullRequestMergeSettings;

  /** Issues that this pull request is linked to. */
  @LazyManyToMany(() => Issue, "linkedPullRequests", {
    indexed: true,
    order: new CollectionOrder("identifier", "asc"),
  })
  public linkedIssues: LazyCollection<Issue>;

  @LazyManyToOne(() => PullRequest, "stackedPullRequests", { nullable: true, indexed: true, onDelete: "SET NULL" })
  public stackedOnPullRequest?: LazyReference<PullRequest>;

  @LazyOneToMany(() => PullRequest, { index: "stackedOnPullRequestId" })
  public readonly stackedPullRequests: LazyCollection<PullRequest>;

  @LazyManyToOne(() => PullRequest, "revertingPullRequests", { nullable: true, indexed: true, onDelete: "SET NULL" })
  public revertedPullRequest?: LazyReference<PullRequest>;

  @LazyOneToMany(() => PullRequest, { index: "revertedPullRequestId" })
  public readonly revertingPullRequests: LazyCollection<PullRequest>;

  /** Comments associated with the pull request. */
  @LazyOneToMany(() => PullRequestComment, { index: "pullRequestId", order: new CollectionOrder("createdAt", "asc") })
  public readonly comments: LazyCollection<PullRequestComment>;

  /** Pending reviews associated with the pull request. */
  @LazyOneToMany(() => PullRequestPendingReview, {
    index: "pullRequestId",
    order: new CollectionOrder("createdAt", "asc"),
  })
  public readonly pendingReviews: LazyCollection<PullRequestPendingReview>;

  /** Draft (un-submitted) comments associated with the pull request. */
  @LazyOneToMany(() => Draft, { index: "pullRequestId" })
  public readonly draftComments: LazyCollection<Draft>;

  /** List of changes to the pull request. */
  @LazyOneToMany(() => PullRequestHistory, { index: "pullRequestId", order: new CollectionOrder("createdAt", "asc") })
  public readonly history: LazyCollection<PullRequestHistory>;

  /** Diffs related to the pull request (local model only). */
  @LazyOneToMany(() => PullRequestDiff, { index: "pullRequestId" })
  public readonly diffs: LazyCollection<PullRequestDiff>;

  /** The notifications for this pull request. */
  @OneToMany(() => PullRequestNotification)
  public readonly notifications: Collection<PullRequestNotification>;

  /** References a favorite model if the pull request has been favorited. */
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /** The user who created the pull request. */
  @ManyToOne(() => User, "createdPullRequests", { nullable: true, indexed: true })
  public creator?: User;

  /** The external user who created the pull request. */
  @LazyOneSidedReference(() => ExternalUser, { optional: true, nullable: false, indexed: true, onDelete: "SET NULL" })
  public externalCreator?: LazyReference<ExternalUser>;

  /** The users that are reviewers of the pull request. */
  @ManyToMany(() => User, "reviewerOfPullRequests", { indexed: true })
  public reviewerUsers: Collection<User>;

  /** The users that are reviewers of the pull request. */
  @LazyManyToMany(() => ExternalUser, undefined, { indexed: true })
  public reviewerExternalUsers: LazyCollection<ExternalUser>;

  @OneSidedReference(() => User, { nullable: true, indexed: true })
  public mergedByUser?: User;

  @LazyOneSidedReference(() => ExternalUser, { nullable: true, indexed: true })
  public mergedByExternalUser?: LazyReference<ExternalUser>;

  /** API build cache of the reaction data to avoid syncing Reactions to the client. */
  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public reactionData: EmojiReactions;

  /** User-specific pull request state. */
  @Property({
    serializer: CustomJSONSerializer({
      attentionLastNeededAt: { serializer: DateTimeSerializer, nullable: true },
      lastActivityAt: { serializer: DateTimeSerializer, nullable: true },
      lastDismissedAt: { serializer: DateTimeSerializer, nullable: true },
    }),
    default: [],
  })
  public userState: PullRequestUserState[];

  /** Metadata about what created the issue. */
  @Property()
  public readonly sourceMetadata?: EntitySourceMetadata;

  /**
   * The date when pull request was last updated.
   * Used for sorting the list of pull requests, so they do not jump around when the user navigates in split view.
   */
  public updatedAtEphemeral?: Date;

  /**
   * Returns a PullRequestAttachmentAdapter for the pull request.
   */
  public get pullRequestAdapter(): PullRequestAttachmentAdapter {
    return new PullRequestAttachmentAdapter(this);
  }

  /** The short identifier of the pull request (without repository name). */
  public get prNumber(): string {
    return this.pullRequestAdapter.prNumber;
  }

  /** The full identifier of the pull request (including repository name). */
  public get fullIdentifier(): string {
    return this.pullRequestAdapter.fullIdentifier;
  }

  /** The identifier of the pull request (short or full depending on user settings). */
  public get identifier(): string {
    return this.store.user.settings.gitAttachmentDisplayPreference === GitAttachmentDisplayPreference.Option.titleRepo
      ? this.fullIdentifier
      : this.prNumber;
  }

  /** Markdown formatting of the pull request description. */
  @Computed
  public get descriptionMarkdown(): string {
    return this.descriptionData ? MarkdownTransformer.serialize(this.descriptionData) : "";
  }

  /** The slug of the pull request. */
  public get slug(): string {
    return `${slugifyTitle(this.title)}-${this.slugId}`;
  }

  /** Whether the pull request originated from GitHub. */
  public get isSyncedWithGitHub(): boolean {
    return this.sourceMetadata?.subType === IntegrationService.github;
  }

  /** Whether the pull request originated from GitLab. */
  public get isSyncedWithGitLab(): boolean {
    return this.sourceMetadata?.subType === IntegrationService.gitlab;
  }

  /** Whether the pull request is a draft. */
  public get isDraft(): boolean {
    return this.status === PullRequestStatus.draft;
  }

  /** Whether the pull request is merged. */
  public get isMerged(): boolean {
    return this.status === PullRequestStatus.merged;
  }

  @Computed
  public get attentionSet(): ReadonlySet<string> {
    return PullRequestUserState.calculateAttentionSet(this.userState);
  }

  @Computed
  public get currentUserPendingReview(): PullRequestPendingReview | undefined {
    return this.pendingReviews.find(review => review.reviewer.id === this.store.user.id);
  }

  /** URL to view the changes associated with this pull request. */
  public get changesUrl(): string | undefined {
    if (this.isSyncedWithGitHub) {
      return `${this.url}/files`;
    }
    return undefined;
  }

  /** Whether the pull request is currently open. */
  public get isOpen(): boolean {
    switch (this.status) {
      case PullRequestStatus.draft:
      case PullRequestStatus.open:
      case PullRequestStatus.inReview:
      case PullRequestStatus.approved:
        return true;
      case PullRequestStatus.merged:
      case PullRequestStatus.closed:
        return false;
      default:
        notReachable(this.status);
        return true;
    }
  }

  /** Whether the pull request is currently closed. */
  public get isClosed(): boolean {
    switch (this.status) {
      case PullRequestStatus.draft:
      case PullRequestStatus.open:
      case PullRequestStatus.inReview:
      case PullRequestStatus.approved:
        return false;
      case PullRequestStatus.merged:
      case PullRequestStatus.closed:
        return true;
      default:
        notReachable(this.status);
        return false;
    }
  }

  /** Whether the pull request was opened by the current user. */
  @Computed
  public get openedByCurrentUser(): boolean {
    return this.creator?.id === this.store.user.id;
  }

  /** Whether the pull request was approved by the current user. */
  @Computed
  public get approvedByCurrentUser(): boolean {
    const review = this.reviewers.find(reviewer => reviewer.userId === this.store.user.id);
    return review?.decision === PullRequestReviewerDecision.approved;
  }

  /** Determines the responsibility of a given user on this pull request. */
  public responsibilityForUser(userId: string): PullRequestResponsibility {
    // Closed PRs are always done
    if (!this.isOpen) {
      return PullRequestResponsibility.completed;
    }

    const isAuthor = this.creator?.id === userId;

    // Drafts are always in the todo state for the creator, and in progress for everyone else
    if (this.isDraft) {
      return isAuthor ? PullRequestResponsibility.todo : PullRequestResponsibility.waiting;
    }

    // Merge queue PRs are assumed to be in the done state.
    // This can reverse itself if moved out of the merge queue, but is usually accurate.
    if (this.mergeStatus === PullRequestMergeStatus.merging) {
      return PullRequestResponsibility.completed;
    }

    if (isAuthor) {
      if (this.reviewers.length === 0) {
        // Open PRs without reviewers are always on the author's plate
        return PullRequestResponsibility.todo;
      }

      if (
        this.mergeStatus === PullRequestMergeStatus.ready &&
        !this.checks.some(c => c.status === PullRequestCheckStatus.pending)
      ) {
        // Ready-to-merge PRs need the attention of the author
        return PullRequestResponsibility.todo;
      }

      // Failed required checks & merge conflicts need  attention from the author if the PR is approved or auto-merging.
      // The assumption until then is that the author is working on the PR (this may need a setting someday).
      const hasFailedChecks = this.checks.some(c => c.status === PullRequestCheckStatus.failed && c.isRequired);
      if (
        (hasFailedChecks || this.hasConflicts) &&
        (this.status === PullRequestStatus.approved || this.autoMergeEnabled)
      ) {
        return PullRequestResponsibility.todo;
      }
    }

    const review = this.reviewers.find(reviewer => reviewer.userId === userId);
    // Approved reviews are always `completed` for the approving reviewer
    if (review?.decision === PullRequestReviewerDecision.approved) {
      return PullRequestResponsibility.completed;
    }
    // "Changes requested" reviews are always `waiting` for the requesting reviewer (until the author re-requests
    // review)
    if (review?.decision === PullRequestReviewerDecision.changesRequested) {
      return PullRequestResponsibility.waiting;
    }

    const inAttentionSet = this.attentionSet.has(userId);
    if (inAttentionSet) {
      return PullRequestResponsibility.todo;
    }

    // If the current user is the author and attention is not set for them, check
    // whether any reviewer currently has a todo responsibility. If none do, fall
    // back to assigning todo to the author as well.
    if (isAuthor) {
      const anyReviewerTodo = this.reviewers.some(reviewer => {
        const reviewerId = reviewer.userId;
        if (!reviewerId || reviewerId === userId) {
          return false;
        }
        return this.responsibilityForUser(reviewerId) === PullRequestResponsibility.todo;
      });

      if (!anyReviewerTodo) {
        return PullRequestResponsibility.todo;
      }
    }

    return PullRequestResponsibility.waiting;
  }

  /** Estimated s size of the pull request. */
  public get sizeEstimate(): PullRequestSizeEstimate {
    if (!this.diffStats) {
      return PullRequestSizeEstimate.m;
    }

    const changedLines = this.diffStats.additions + this.diffStats.deletions + this.diffStats.changes;
    const changedFiles = this.diffStats.fileCount;
    if (changedLines < 5) {
      return PullRequestSizeEstimate.xs;
    }
    if (changedLines < 50 && changedFiles < 5) {
      return PullRequestSizeEstimate.s;
    }
    if (changedLines < 250 && changedFiles < 15) {
      return PullRequestSizeEstimate.m;
    }
    if (changedLines < 500 && changedFiles < 30) {
      return PullRequestSizeEstimate.l;
    }
    return PullRequestSizeEstimate.xl;
  }

  /** Determines whether the pull request needs attention from the given user. */
  public needsAttentionOfUser(userId: string): boolean {
    return this.responsibilityForUser(userId) === PullRequestResponsibility.todo && !this.isDraft;
  }

  private userHasConnectedIntegration(user: User) {
    const sourceIntegration = VcsIntegrationHelper.integrationForPullRequest(this);
    return sourceIntegration?.userHasMatchingPersonalIntegration(user) ?? false;
  }

  /** Determines whether the user is allowed to comment on this pull request. */
  public allowComment(user: User) {
    return this.userHasConnectedIntegration(user);
  }

  /** Determines whether the user is allowed to react to this pull request. */
  public allowReaction(user: User) {
    return this.userHasConnectedIntegration(user);
  }

  /** Returns the external review tool URL for this pull request. */
  public get externalReviewUrl() {
    return this.pullRequestAdapter.externalReviewUrl;
  }

  /** Returns the external review tool label for this pull request. */
  public get externalReviewToolLabel() {
    return this.pullRequestAdapter.externalReviewToolLabel;
  }

  /** Helper variable used by the content filter. Do not use outside of filters. */
  @Computed
  public get searchableContent(): string {
    const description = this.descriptionData ? MarkdownTransformer.serialize(this.descriptionData) : "";

    return this.title + "\n\n" + description;
  }

  // -- Inline findable implementation

  /**
   * Returns true if the model matches the query.
   *
   * @param query The query to match against.
   * @returns True if the model matches the query, false otherwise.
   */
  public matchInlineFind(query: string): boolean {
    const matchString = deburr(
      ([this.searchableContent, this.fullIdentifier] as (string | undefined)[])
        .concat([this.creator?.name, this.creator?.displayName])
        .concat([this.externalCreator?.value?.name, this.externalCreator?.value?.displayName])
        .concat(
          this.reviewers.map(member => {
            const user = member.userId
              ? this.organization.allUsers.findById(member.userId)
              : member.externalUserId
                ? this.organization.externalUsers.findById(member.externalUserId)
                : undefined;
            return [user?.name, user?.displayName].concrete().join(" ");
          })
        )
        .concrete()
        .join(" ")
    ).toLowerCase();
    return query.split(" ").reduce((memo, subQuery) => memo && matchString.indexOf(subQuery) !== -1, true);
  }

  /**
   * Marks a notification as read (and all other notifications from the same group).
   * @param predicate A function that returns true if the notification should be marked as read.
   */
  @Action
  public markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(item => item.id === notificationId);
    if (!notification) {
      return;
    }
    const groupingEntityId = notification?.groupingEntityId;

    this.notifications.forEach(item => {
      if (item.readAt === undefined && item.groupingEntityId === groupingEntityId) {
        item.markAsRead();
        item.save();
      }
    });
  }

  /**
   * Marks review-related notifications as read.
   */
  @Action
  public markReviewNotificationsAsRead() {
    const isReviewNotification = (_notification: Notification) => {
      // Comments should mark themselves as read only when the user has seen them.
      // TODO(matthijs): Exclude notifications about comments once that data is available.
      return true;
    };

    this.notifications.forEach(notification => {
      if (!isReviewNotification(notification)) {
        return;
      }

      notification.markAsRead();
      notification.save();
    });
  }

  /**
   * Whether the workspace has a connected GitHub integration for this pull request.
   * This checks both that the PR is from GitHub and that there's an active workspace integration.
   */
  public get workspaceHasConnectedGitHubIntegration(): boolean {
    if (!this.isSyncedWithGitHub) {
      return false;
    }

    // Check if there's a workspace-level GitHub integration
    const gitHubIntegrations = this.store.organization.integrations.filter(
      integration =>
        (integration.service === IntegrationService.github ||
          integration.service === IntegrationService.githubEnterpriseServer) &&
        integration.settings.gitHub?.orgLogin === this.repository.owner &&
        !integration.isArchived
    );

    return gitHubIntegrations.length > 0;
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  public toggleFavorite = (): Favorite | false => {
    if (this.favorite) {
      this.favorite.delete();
      return false;
    }
    const newFavorite = Favorite.create({ reference: this });
    newFavorite.save(true);
    return newFavorite;
  };

  /**
   * Get the latest diff on the Pull Request (if available).
   * Should be hydrated during navigation.
   */
  public get latestDiff(): PullRequestDiff | undefined {
    if (!this.baseSha) {
      return;
    }
    if (!this.headSha) {
      return;
    }
    return (
      this.diffs.find(diff => diff.baseSha === this.baseSha && diff.headSha === this.headSha) ??
      PullRequestDiff.create(this, this.baseSha, this.headSha)
    );
  }

  protected override hydrateExtra() {
    if (!Feature.isEnabled(Feature.codeReviews)) {
      return {
        hydrate: async () => {
          // noop
        },
        isHydrated: () => true,
      };
    }
    return {
      hydrate: async () => {
        if (!this.baseSha) {
          return;
        }
        if (!this.headSha) {
          return;
        }

        await this.diffs.hydrate();

        const diff = this.latestDiff;

        if (diff?.needsFetch) {
          await diff.fetchDiff();
        }
      },
      isHydrated: () => {
        if (this.latestDiff) {
          return this.latestDiff.loadingState !== "pending";
        }
        return true;
      },
    };
  }

  /** Whether this pull request is changing its merge status. */
  @Observable()
  public isChangingMergeStatus?: boolean;
}

```

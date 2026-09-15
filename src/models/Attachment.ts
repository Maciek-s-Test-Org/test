// DIFF-76: modified fixture
import type {
  AttachmentForDraft,
  AttachmentMetadata,
  AttachmentSource,
  AttachmentSourceDiscord,
  AttachmentSourceFront,
  PullRequestPayloadForAttachment,
  CommitPayloadForAttachment,
} from "@linear/common/models/Attachment";
import { AttachmentHelper } from "@linear/common/models/AttachmentHelper";
import type { EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import { IntegrationService } from "@linear/common/models/Integration";
import { IntegrationHelper } from "@linear/common/models/IntegrationHelper";
import { ExternalEntityType } from "@linear/common/models/ExternalEntityRelation";
import { AttachmentTrait } from "@linear/common/models/AttachmentTrait";
import { ReadOnlyReason } from "@linear/common/models/ReadOnlyReason";
import { getTrait } from "@linear/common/utils/traits";
import { Feature } from "#Features";
import { Issue } from "#models/Issue";
import { Comment } from "#models/Comment";
import { User } from "#models/User";
import {
  ClientModel,
  Computed,
// DIFF-76 change at line 25
  Property,
  OneSidedReference,
  LazyOneToOne,
  LazyManyToOne,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode, PartialPreloadForTeam } from "#models/base/ModelLoadStrategy";
import { formatDateAndTimeRelative, formatDateAndTimeWithYear, timeSinceLong } from "#utils/time";
import type { TransactionMutation } from "#models/sync/transactions/Transaction";
import type { Hydrated } from "#models/base/ModelTypes";
import type { CustomerNeed } from "#models/CustomerNeed";
import { type LazyBackReference, LazyReference } from "#models/hydration/Lazy";
import type { Store } from "#models/Store";
import type { PullRequest } from "#models/PullRequest";
import { Logger } from "#logging/Logger";
import { PullRequestAttachmentAdapter } from "#utils/pull-requests/PullRequestAttachmentAdapter";
import { VcsIntegrationHelper } from "#utils/pull-requests/VcsIntegrationHelper";
import { PullRequestsFeatureHelper } from "./helpers/PullRequestsFeatureHelper";

/**
 * A model representing an issue attachment.
 */
@ClientModel("Attachment")
export class Attachment extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
// DIFF-76 change at line 50
  public static override partialLoadMode = PartialLoadMode.regular;
  public static override partialPreloadForTeam = PartialPreloadForTeam.firstPriority;

  public override store: Store;

  @Property({ default: "" })
  public title: string;

  @Property()
  public subtitle?: string;

  @Property({ persistence: "createOnly", default: "" })
  public url: string;

  @Property({ default: {} })
  public metadata: AttachmentMetadata;

  @Property({ persistence: "none" })
  public source?: AttachmentSource;

  @Property({ persistence: "createOnly", default: false })
  public groupBySource: boolean;

  @LazyManyToOne(
    () => Issue,
// DIFF-76 change at line 75
    // @ts-expect-error since Issue.attachments is protected field, it's not considered valid
    "attachments",
    {
      persistence: "none",
      optional: false,
      nullable: false,
      indexed: true,
      trait: "useForPartialIndex",
    }
  )
  public issue: LazyReference<Issue>;

  @LazyOneToOne({ nullable: true })
  public comment: LazyBackReference<Comment | undefined>;

  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public creator?: User;

  /** The Customer Need associated with this attachment, if any. */
  @LazyOneToOne({
    nullable: true,
    skipHydrationTraitBit: AttachmentTrait.hasCustomerNeed,
  })
  public need: LazyBackReference<CustomerNeed | undefined>;

// DIFF-76 change at line 100
  /** Attachment source metadata. What created the attachment. */
  @Property({ persistence: "none" })
  public sourceMetadata?: EntitySourceMetadata;

  @LazyManyToOne(
    () => Issue,
    // @ts-expect-error since Issue.formerAttachments is protected field, it's not considered valid
    "formerAttachments",
    {
      nullable: true,
      indexed: true,
      persistence: "none",
    }
  )
  public originalIssue?: LazyReference<Issue>;

  /** Each bit in this number represents a different trait. */
  @Property({ persistence: "none" })
  public traits?: number;

  /** Creates attachment from attachment draft attachment. */
  public static createFromDraftAttachment(draftAttachment: AttachmentForDraft, issue: Issue): Attachment {
    const attachment = Attachment.create({
      url: draftAttachment.url,
      title: draftAttachment.title,
// DIFF-76 change at line 125
      issue,
    });
    attachment.save();
    return attachment;
  }

  /** Returns if an attachment cannot be edited anymore. Expected to be called only on hydrated models. */
  public override get isReadOnly(): ReadOnlyReason | undefined {
    if (this.isArchived) {
      return ReadOnlyReason.archived;
    }
    return this.issue?.value?.isReadOnly;
  }

  /**
   * Gets a consistent source type for an attachment.
   */
  public get sourceType(): string {
    return AttachmentHelper.getSourceType(this);
  }

  /**
   * Returns true for GitHub, GitLab, and Origin pull request attachments, and false for all others.
   */
  public get isPullRequest(): boolean {
// DIFF-76 change at line 150
    const isValidSource =
      this.sourceType === IntegrationService.gitlab ||
      this.sourceType === IntegrationService.github ||
      this.sourceType === IntegrationService.origin;
    return isValidSource && !!this.source && "pullRequestId" in this.source;
  }

  /**
   * Returns true for Sentry issue attachments, and false for all other attachments.
   */
  public get isSentryIssue(): boolean {
    return this.sourceType === IntegrationService.sentry;
  }

  /**
   * Returns true for Jira issue attachments, and false for all other attachments.
   */
  public get isJiraIssue(): boolean {
    return this.sourceType === IntegrationService.jira;
  }

  /**
   * Returns true for Slack Asks attachments, and false for all other attachments.
   */
  public get isAsksThread(): boolean {
// DIFF-76 change at line 175
    if (this.source?.type !== IntegrationService.slack) {
      return false;
    }

    const syncedCommentId = this.source?.syncedCommentId;

    return !!syncedCommentId && !!this.store.findById(Comment, syncedCommentId)?.isAsksThread;
  }

  /**
   * Returns the ID of a comment explaining why the linked issue could not be synced.
   */
  public get syncErrorCommentId(): string | undefined {
    if (this?.source?.type === IntegrationService.jira) {
      return this.source?.syncErrorCommentId;
    }
    return;
  }

  /**
   * Returns true for attachments that are synced with an external system, and false for all other attachments.
   */
  public get isSynced(): boolean {
    return (
      this.isSyncedGithubIssue || this.isSyncedJiraIssue || this.isSyncedSlackThread || this.isSyncedSalesforceCase
// DIFF-76 change at line 200
    );
  }

  /**
   * Returns true for Salesforce case attachments that have a synced thread.
   */
  public get isSyncedSalesforceCase(): boolean {
    return (
      this.sourceType === IntegrationService.salesforce &&
      !!this.source &&
      "syncedCommentId" in this.source &&
      !!this.source.syncedCommentId
    );
  }

  /** Finds the root synced Salesforce comment tied to this attachment, if any. */
  public syncedSalesforceComment(): Comment | undefined {
    if (!this.isSyncedSalesforceCase || !this.source || !("syncedCommentId" in this.source)) {
      return undefined;
    }

    const syncedCommentId = this.source.syncedCommentId;
    if (!syncedCommentId) {
      return undefined;
    }
// DIFF-76 change at line 225

    return this.store.findById(Comment, syncedCommentId) ?? undefined;
  }

  /**
   * Returns true for JIRA issue attachments that are synced, and false for all other attachments.
   */
  public get isSyncedJiraIssue(): boolean {
    if (!this.isJiraIssue) {
      return false;
    }
    const issue = this.issue.value;
    if (!issue) {
      return false;
    }

    const externalId = this.metadata.id === undefined ? undefined : String(this.metadata.id);
    const integrationId = this.metadata.integrationId;
    const hasIntegrationId = typeof integrationId === "string";
    const requiresExternalIdMatch = hasIntegrationId || externalId !== undefined;

    return issue.activeExternalEntityRelations.some(relation => {
      if (relation.externalEntityType !== ExternalEntityType.jiraIssue) {
        return false;
      }
// DIFF-76 change at line 250

      const integration = relation.integration;
      if (hasIntegrationId && integration?.id !== integrationId) {
        return false;
      }
      if (requiresExternalIdMatch && relation.externalId !== externalId) {
        return false;
      }

      const projectId = relation.metadata?.jiraIssueMetadata?.projectId;
      const projectMappings = integration?.settings.jira?.projectMapping;
      return projectMappings?.some(mapping => mapping.jiraProjectId === projectId) ?? false;
    });
  }

  /**
   * Returns true for GitHub issue attachments that are synced, and false for all other attachments.
   */
  public get isSyncedGithubIssue(): boolean {
    const match = IntegrationHelper.GitHub.parseIssueUrl(this.url);
    if (!match) {
      return false;
    }
    const { owner, repo, number } = match;

// DIFF-76 change at line 275
    return !!(
      this.isGithubIssue &&
      this.issue.value?.activeExternalEntityRelations.find(
        relation =>
          relation.externalEntityType === ExternalEntityType.githubIssue &&
          relation.metadata?.githubIssueMetadata?.number === number &&
          relation.metadata?.githubIssueMetadata?.owner === owner &&
          relation.metadata?.githubIssueMetadata?.repo === repo &&
          relation.isConnectedToActiveIntegration
      )
    );
  }

  /**
   * Returns true for GitHub issue attachments, and false for all other attachments.
   */
  public get isGithubIssue(): boolean {
    return this.sourceType === IntegrationService.github && !this.isPullRequest;
  }

  /**
   * Returns true for GitHub commit attachments, and false for all other attachments.
   */
  public get isGithubCommit(): boolean {
    return this.sourceType === IntegrationService.githubCommit;
// DIFF-76 change at line 300
  }

  /**
   * Returns true for Email Intake attachments, and false for all other attachments.
   */
  public get isEmailIntake(): boolean {
    return this.sourceType === IntegrationService.email;
  }

  /**
   * Returns a PullRequestAttachmentAdapter for the attachment.
   */
  public get pullRequestAdapter(): PullRequestAttachmentAdapter {
    return new PullRequestAttachmentAdapter(this);
  }

  /**
   * Returns the pull request payload if the attachment is a pull request, and undefined for all other attachments.
   * We should have a more generic solution for this instead of having a free form AttachmentMetadata.
   */
  public get pullRequestAttachment(): PullRequestPayloadForAttachment | undefined {
    if (!this?.isPullRequest) {
      return undefined;
    }

// DIFF-76 change at line 325
    return this.metadata as PullRequestPayloadForAttachment;
  }

  /**
   * Returns the linked pull request entity for the attachment, regardless of whether Reviews is enabled.
   */
  @Computed
  public get linkedPullRequestEntity(): PullRequest | undefined {
    if (!this.isPullRequest) {
      return undefined;
    }

    const matches = (pr: PullRequest) => VcsIntegrationHelper.pullRequestMatchesAttachment(pr, this);

    // Search the linked PRs of the attachment's current issue first, then fall back to the
    // attachment's original issue (where it was previously attached). This handles the
    // duplicate / reparented-attachment case where the attachment is rendered through an
    // issue's `formerAttachments` while the canonical PR link lives on the other side.
    const candidateIssues = [this.issue.value, this.originalIssue?.value].concrete();

    for (const issue of candidateIssues) {
      issue.linkedPullRequests.observeHydrationState();

      const match = issue.linkedPullRequests.find(matches);
      if (match) {
// DIFF-76 change at line 350
        return match;
      }
    }

    return undefined;
  }

  /**
   * Returns the pull request entity for the attachment when Reviews is enabled.
   */
  @Computed
  public get pullRequestEntity(): PullRequest | undefined {
    if (!PullRequestsFeatureHelper.areReviewsEnabledForUser(this.store.user)) {
      return undefined;
    }

    return this.linkedPullRequestEntity;
  }

  /**
   * Factory method to create an attachment. This model will miss some properties that is added on the server.
   *
   * @param props The properties to create the attachment with.
   * @returns The created attachment.
   */
// DIFF-76 change at line 375
  public static create(props: { url: string; issue: Issue; title: string }): Hydrated<Attachment> {
    const { url, title, issue } = props;

    const attachment = Attachment.createEmpty();
    attachment.issue = LazyReference.wrap(issue);
    attachment.url = url;
    attachment.title = title;
    attachment.metadata = {
      title,
      messages: [],
    };

    const integrations = issue.team.organization.integrations;

    // Let's try to see if this URL will match one of our helpers and we can make a rich attachment rather than
    // a generic one
    const availableIntegrations = integrations.filter(
      i => IntegrationHelper.AttachmentLinkIntegrations.find(service => service === i.service) !== undefined
    );

    const integrationBaseUrls = availableIntegrations.reduce((acc, i) => {
      if (i.service === IntegrationService.gitlab) {
        acc[i.service] = i.settings?.gitLab?.url;
      }
      return acc;
// DIFF-76 change at line 400
    }, {} as IntegrationHelper.IntegrationBaseUrls);

    const result = IntegrationHelper.findIntegrationMatches(
      url,
      availableIntegrations.map(i => i.service as IntegrationHelper.AttachmentLinkIntegration),
      integrationBaseUrls
    );

    if (result?.match) {
      const { match, integrationType } = result;
      switch (integrationType) {
        case IntegrationService.discord:
          const [channelId, messageId] = match;
          attachment.source = { type: IntegrationService.discord, channelId, messageId };
          break;
        case IntegrationService.front:
          attachment.source = { type: IntegrationService.front, conversationId: match };
          break;
        case IntegrationService.intercom:
          attachment.source = { type: IntegrationService.intercom };
          break;
        case IntegrationService.zendesk:
          attachment.source = { type: IntegrationService.zendesk };
          break;
        case IntegrationService.gitlab:
// DIFF-76 change at line 425
          attachment.source = { type: integrationType, pullRequestId: String(match.number) };
          break;
        case IntegrationService.github: {
          if (result.type === "pr") {
            attachment.source = { type: integrationType, pullRequestId: String(match.number) };
          } else {
            attachment.source = { type: integrationType };
          }
          break;
        }
        case IntegrationService.jira: {
          attachment.source = { type: IntegrationService.jira };
          break;
        }
        default:
          break;
      }
    }

    return attachment;
  }

  /**
   * Gets the stripped first attachment message body.
   */
// DIFF-76 change at line 450
  public get strippedFirstAttachmentMessageBody(): string | undefined {
    return AttachmentHelper.getStrippedFirstAttachmentMessageBody(this);
  }

  /**
   * Returns a GraphQL mutation string that can be used to create the model.
   *
   * @param usedVariableNames A set of variable names that are already in use. This is used to avoid name collisions.
   * @returns A GraphQL mutation that can be used to create the model.
   */
  public override createMutation(_usedVariableNames: Set<string>): TransactionMutation {
    let mutation;

    function createAttachmentMutation(mutationName: string, properties: Record<string, string | number>) {
      const mutationArguments = Object.entries(properties)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ");
      return `${mutationName}(${mutationArguments}) { lastSyncId }`;
    }

    // This should always be present on a well-formed attachment
    // Worst case if it's not, the mutation will fail
    const issueId = this.issue.id!;

    switch (this.source?.type) {
// DIFF-76 change at line 475
      case IntegrationService.discord: {
        mutation = createAttachmentMutation("attachmentLinkDiscord", {
          id: this.id,
          messageId: (this.source as AttachmentSourceDiscord).messageId,
          channelId: (this.source as AttachmentSourceDiscord).channelId,
          url: this.url,
          issueId,
          title: this.title,
        });
        break;
      }
      case IntegrationService.front: {
        const conversationId = (this.source as AttachmentSourceFront).conversationId;
        if (!conversationId) {
          throw new Error("invariant: expected conversationId for front");
        }
        mutation = createAttachmentMutation("attachmentLinkFront", {
          id: this.id,
          issueId,
          conversationId,
          title: this.title,
        });
        break;
      }
      case IntegrationService.zendesk: {
// DIFF-76 change at line 500
        const ticketId = IntegrationHelper.Zendesk.parseTicketUrl(this.url);
        if (!ticketId) {
          throw new Error("invariant: expected ticketId for Zendesk");
        }
        mutation = createAttachmentMutation("attachmentLinkZendesk", {
          id: this.id,
          ticketId,
          issueId,
          title: this.title,
        });
        break;
      }
      case IntegrationService.intercom: {
        const { conversationId, partId } = IntegrationHelper.Intercom.parseConversationUrl(this.url) ?? {};
        if (!conversationId) {
          throw new Error("invariant: expected conversationId for Intercom");
        }
        const args = {
          id: this.id,
          conversationId,
          partId: partId ?? "",
          issueId,
          title: this.title,
        };
        mutation = createAttachmentMutation("attachmentLinkIntercom", partId ? { ...args, partId } : args);
// DIFF-76 change at line 525
        break;
      }
      case IntegrationService.github: {
        const prMatch = IntegrationHelper.GitHub.parsePullRequestUrl(this.url);
        if (prMatch) {
          mutation = createAttachmentMutation("attachmentLinkGitHubPR", {
            id: this.id,
            issueId,
            title: this.title,
            url: this.url,
          });
          break;
        }

        const issueMatch = IntegrationHelper.GitHub.parseIssueUrl(this.url);
        if (issueMatch) {
          mutation = createAttachmentMutation("attachmentLinkGitHubIssue", {
            id: this.id,
            issueId,
            url: this.url,
          });
          break;
        }

        throw new Error("invariant: expected owner, repo and number for GitHub");
// DIFF-76 change at line 550
      }
      case IntegrationService.jira: {
        const jiraIssueKey = IntegrationHelper.jira.parseIssueUrl(this.url);
        if (!jiraIssueKey) {
          throw new Error("invariant: expected issue key for Jira");
        }
        mutation = createAttachmentMutation("attachmentLinkJiraIssue", {
          id: this.id,
          jiraIssueId: jiraIssueKey,
          issueId,
          url: this.url,
          title: this.title,
        });
        break;
      }
      default: {
        mutation = createAttachmentMutation("attachmentLinkURL", {
          url: this.url,
          title: this.title,
          issueId,
          id: this.id,
        });
        break;
      }
    }
// DIFF-76 change at line 575

    this.observePropertyChanges();
    return mutation;
  }

  /**
   * Returns true for Slack attachments that are synced, and false for all other attachments.
   */
  public get isSyncedSlackThread(): boolean {
    return !!this.syncedSlackComment();
  }

  /** Finds the root synced Slack comment tied to the same Slack thread as this attachment, if any. */
  public syncedSlackComment(): Comment | undefined {
    // No syncing of Slack messages if this flag is on
    if (Feature.isEnabled(Feature.slackIntegrationOptOutOfReadingMessageHistory)) {
      return undefined;
    }

    if (!this.issue.value) {
      Logger.warning("Attachment has no issue", { attachmentId: this.id });
      return undefined;
    }

    return this.issue.value.comments.transientlyHydratedElements.find(
// DIFF-76 change at line 600
      comment =>
        comment.isRootSlackSyncedComment &&
        comment.sourceMetadata?.slackSyncMetadata?.messageUrl === this.url &&
        !comment.isRootUnsyncedSlackComment
    );
  }

  /**
   * Gets the attachment's subtitle. For Slack, we use the first line of the first message in the metadata, if present.
   * For everything else, we use the subtitle attribute directly.
   *
   * @returns The subtitle to use in the UI.
   */
  @Computed
  public get subtitleWithMessage(): string | undefined {
    if (this.sourceType === IntegrationService.slack || !this.subtitle) {
      return this.strippedFirstAttachmentMessageBody;
    }
    return this.subtitle;
  }

  /** The name of the branch. */
  public get branchName(): string {
    if (this.isPullRequest) {
      const metadata = this.metadata as PullRequestPayloadForAttachment;
// DIFF-76 change at line 625
      return metadata.branch;
    }
    if (this.isGithubCommit) {
      const commitData = this.metadata as CommitPayloadForAttachment;
      const branchRef = commitData.branchRef;
      let branch = commitData.branch;
      if (!branch && branchRef && branchRef.startsWith("refs/heads/")) {
        branch = branchRef.replace("refs/heads/", "");
      }
      return branch ?? "";
    }
    return "";
  }

  /** The name of the repository. */
  public get repoName(): string {
    if (this.isPullRequest || this.isGithubCommit) {
      const metadata = this.metadata as PullRequestPayloadForAttachment | CommitPayloadForAttachment;
      return metadata.repoName ?? "";
    }
    return "";
  }

  /**
   * Searches for any of the variable formatting options we support, and will swap in the formatted variables for the
// DIFF-76 change at line 650
   * matched regexps.
   *
   * Currently supported formats are:
   *   {variableName__since} - formats a timestamp with human readable difference to now, e.g. 29 days ago
   *   {variableName__relativeTimestamp} - If within a week will format date and time with day differences such as
   *     yesterday at 9:51 AM, but will do Sep 30, 9:51AM for dates farther away
   *
   * @returns The formatted subtitle.
   */
  public formatSubtitle(options?: { absolute?: boolean }) {
    const { absolute = false } = options ?? {};

    const subtitle = this.subtitleWithMessage;
    if (!subtitle) {
      return subtitle;
    }
    const replaceFunc = (match: string, variableName: string, formatter: (m: Date) => string) => {
      if (!Object.hasOwn(this.metadata, variableName)) {
        return match;
      }

      const variable = this.metadata[variableName];
      if (!variable) {
        return match;
      }
// DIFF-76 change at line 675
      const formattedMatch = formatter(new Date(variable));
      return formattedMatch ?? match;
    };
    const formattedSubtitle = subtitle.replace(/{(\w+?)__since}/gm, (m, v) =>
      replaceFunc(m, v, absolute ? formatDateAndTimeWithYear : timeSinceLong)
    );
    return formattedSubtitle.replace(/{(\w+?)__relativeTimestamp}/gm, (m, v) =>
      replaceFunc(m, v, absolute ? formatDateAndTimeWithYear : formatDateAndTimeRelative)
    );
  }

  /**
   * Checks if the attachment has a specific trait.
   *
   * @param trait Trait to get.
   * @returns True if the attachment has the given trait, false otherwise.
   */
  public getTrait(trait: AttachmentTrait) {
    return getTrait(this.traits, trait);
  }
}

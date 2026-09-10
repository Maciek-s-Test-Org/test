// DIFF-76: modified fixture
import { gql } from "graphql-request";
import assign from "lodash/assign";
import cloneDeep from "lodash/cloneDeep";
import orderBy from "lodash/orderBy";
import { runInAction } from "mobx";
import {
  type IntegrationAuthErrorMetadata,
  type IntegrationMetadata,
  IntegrationService,
  IntegrationServiceHelper,
  type GitHubRepo,
  type GitHubRepoMapping,
  type CustomerVisibilityMode,
} from "@linear/common/models/Integration";
import { IntegrationTemplateHelper } from "@linear/common/models/IntegrationTemplate";
import { TemplateType } from "@linear/common/models/TemplateType";
import type { UserRoleType } from "@linear/common/models/UserRoleType";
import { PlanFeature } from "@linear/common/subscription/PlanFeature";
import type { GithubOrgType } from "@linear/common/types/Github";
import { WorkspaceAdminPermission } from "@linear/common/models/WorkspaceAdminPermission";
import { Feature } from "#Features";
import { CustomView } from "#models/CustomView";
import { FeatureFlag } from "#models/FeatureFlag";
import { FeatureFlagRolloutStage } from "#models/FeatureFlagRolloutStage";
// DIFF-76 change at line 25
import { AiPromptRules } from "#models/AiPromptRules";
import { IntegrationTemplate } from "#models/IntegrationTemplate";
import type { ITransaction } from "#models/sync/transactions/Transaction";
import { Organization } from "#models/Organization";
import { Project } from "#models/Project";
import { Team } from "#models/Team";
import type { Template } from "#models/Template";
import { TimeSchedule } from "#models/TimeSchedule";
import { User } from "#models/User";
import { WorkflowDefinition } from "#models/WorkflowDefinition";
import { WorkflowDefinitionDraft } from "#models/WorkflowDefinitionDraft";
import {
  ClientModel,
  LazyManyToOne,
  LazyOneSidedReference,
  LazyOneToMany,
  ManyToOne,
  OneSidedReference,
  OneToMany,
  Property,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import type { Collection } from "#models/collections/Collection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import type { LazyCollection } from "#models/collections/LazyCollection";
// DIFF-76 change at line 50
import type { GraphQLClient } from "#models/graphQL/GraphQLClient";
import { JSONSerializer } from "#models/serialization/Serialization";
import { requiredSlackScopes, SlackScopes, type SlackScope } from "#utils/oauth/slackAuthUrl";
import type { LazyReference } from "#models/hydration/Lazy";
import { LoadStrategyMigration } from "#models/base/ModelLoadStrategy.js";
import { Initiative } from "./Initiative";

/**
 * Integration settings for support integrations like Intercom, Front, and Zendesk.
 */
export type SupportIntegrationSettings = {
  sendNoteOnStatusChange?: boolean;
  sendNoteOnComment?: boolean;
  automateTicketReopeningOnCompletion?: boolean;
  automateTicketReopeningOnCancellation?: boolean;
  automateTicketReopeningOnProjectCompletion?: boolean;
  automateTicketReopeningOnProjectCancellation?: boolean;
  automateTicketReopeningOnComment?: boolean;
  disableCustomerRequestsAutoCreation?: boolean;
};

type SupportIntakeAgentSettings = {
  /** Whether Linear Agent should be enabled for this integration. */
  enableAiIntake?: boolean;
  /** Whether Linear Agent should process supported attachments during AI intake. */
// DIFF-76 change at line 75
  enableAiIntakeAttachmentProcessing?: boolean;
};

/**
 * Integration settings for the Intercom integration.
 */
type IntercomIntegrationSettings = SupportIntegrationSettings &
  SupportIntakeAgentSettings & {
    /** Whether new Intercom conversations should automatically create Linear issues with Linear Agent. */
    enableAutomaticConversationIntake?: boolean;
    /** An optional destination team ID for issues created by automatic Intercom conversation intake. */
    automaticConversationIntakeTeamId?: string;
  };

/**
 * Integration settings for the Front integration.
 */
type FrontIntegrationSettings = SupportIntegrationSettings;

/**
 * Integration settings for the Zendesk integration.
 */
type ZendeskIntegrationSettings = SupportIntegrationSettings &
  SupportIntakeAgentSettings & {
    /** The Zendesk subdomain. */
// DIFF-76 change at line 100
    subdomain: string;
    /** The URL of the connected Zendesk organization. Links into Zendesk use this, not `customApiUrl`. */
    url: string;
    /** Custom base URL for Zendesk API requests, such as a proxy in front of Zendesk. OAuth always uses the subdomain. */
    customApiUrl?: string;
    /** Whether API requests authenticate with a user-provided bearer token instead of OAuth. Requires `customApiUrl`. */
    bearerTokenAuth?: boolean;
    /** Temporary flag indicating if the integration has the necessary scopes for Customers. */
    canReadCustomers?: boolean;
    /** Flag indicating if the integration supports OAuth refresh tokens (has modern OAuth scopes). */
    supportsOAuthRefresh?: boolean;
  };

/**
 * Metadata about a Jira project used in integration settings.
 */
export type JiraProjectMetadata = {
  id: string;
  key: string;
  name: string;
};

/**
 * Tuple for mapping Jira projects to Linear teams.
 */
// DIFF-76 change at line 125
export type JiraLinearProjectMapping = {
  jiraProjectId: string;
  linearTeamId: string;
  bidirectional: boolean;
  default?: boolean;
  /** Whether the mapping uses legacy unidirectional sync behavior where no changes sync from Linear to Jira. */
  legacyUnidirectional?: boolean;
};

/**
 * Integration settings for the Jira integration.
 */
export type JiraIntegrationSettings = {
  projects: JiraProjectMetadata[];
  /** Jira project id to Linear team id. */
  projectMapping?: JiraLinearProjectMapping[];
  /** Whether the integration is for a Jira Server installation or not. */
  isJiraServer?: boolean;
  /** Whether the user needs to provide manual webhook information to complete the integration setup. */
  setupPending?: boolean;
  /** Whether this integration is using a manual setup flow. */
  manualSetup?: boolean;
  /** Whether this integration uses custom OAuth authentication (enterprise SSO). */
  isCustomOAuth?: boolean;
  /** Whether this integration authenticates with a Jira Cloud service account API key. */
// DIFF-76 change at line 150
  isCloudServiceAccount?: boolean;
  /** The OAuth client ID for the personal connection OAuth app, when using custom OAuth. */
  personalOAuthClientId?: string;
  /** The custom OAuth server token endpoint URL (enterprise SSO). */
  customOAuthServerUrl?: string;
  /** The label of the Jira instance, for visual identification purposes only. */
  label?: string;
};

/**
 * Integration settings for the Jira personal integration.
 */
type JiraPersonalIntegrationSettings = {
  /** Jira site name, i.e. sitename.atlassian.net, for the Jira cloud instance the user belongs to. */
  siteName?: string;
  /** Id of the workspace Jira integration this personal integration authenticates through. */
  workspaceIntegrationId?: string;
};

/**
 * Integration settings and metadata for the GitHub integration.
 */
type GitHubIntegrationSettings = {
  orgLogin?: string;
  externalOrgId?: string;
// DIFF-76 change at line 175
  orgAvatarUrl?: string;
  repositoriesMapping?: GitHubRepoMapping[];
  repositories?: GitHubRepo[];
  codeAccess?: boolean;
  /** The enterprise URL if this is a GitHub Enterprise Cloud integration. */
  enterpriseUrl?: string;
  /** Set when a user removes this archived row from the reconnect list; hides it without deleting. */
  reconnectDismissed?: boolean;
};

/**
 * Integration settings and metadata for the GitHub import integration.
 */
type GitHubImportIntegrationSettings = {
  orgLogin?: string;
  orgAvatarUrl?: string;
  repositories?: GitHubRepo[];
  orgType?: GithubOrgType;
  labels?: { [key: number]: string[] };
  /** When the repository list was last loaded from GitHub. Unset while the first load is still in progress. */
  repositoriesSyncedAt?: Date;
  /** How many repositories the installation can access. Known before the repository list itself has loaded. */
  repositoryCount?: number;
};

// DIFF-76 change at line 200
/**
 * Integration settings for the GitHub personal integration.
 */
type GitHubPersonalIntegrationSettings = {
  /** GitHub username for the connected GitHub account. */
  login?: string;
  /** The enterprise URL for GEC personal integrations. Absent for github.com. */
  enterpriseUrl?: string;
};

/**
 * Integration settings and metadata for the GitLab integration.
 */
type GitLabIntegrationSettings = {
  /** The URL where the GitLab instance is hosted. */
  url?: string;
  /** Whether the token is limited to a read-only scope. */
  readonly?: boolean;
  /** The ISO timestamp when the API token expires. */
  expiresAt?: string;
  /**
   * Path or numeric ID of a project to use for the setup health check. Set this when the GitLab tenant blocks
   * non-project API endpoints; the setup check then validates against this single project instead of the personal
   * access token endpoint.
   */
// DIFF-76 change at line 225
  validationProjectPath?: string;
};

/**
 * Integration settings for the Launch Darkly integration.
 */
type LaunchDarklyIntegrationSettings = {
  /** The project key of the LaunchDarkly integration. */
  projectKey: string;
  /** The environment of the LaunchDarkly integration. */
  environment: string;
};

/**
 * The Linear team id and any other settings for a team connected to a particular Slack channel for Asks.
 */
export type SlackAsksTeamSettings = {
  /** The ID for the team. */
  id: string;
  /** If the team allows for Asks to be created in a Slack channel without a template. */
  hasDefaultAsk: boolean;
};

/**
 * The Slack id and Slack name for a Slack channel that is used in the Asks integration.
// DIFF-76 change at line 250
 */
export type SlackChannelNameMapping = {
  /** The name of the Slack channel. */
  name: string;
  /** The ID of the Slack channel. */
  id: string;
  /** List of team IDs with team-specific settings that have been added to the Slack channel. */
  teams: SlackAsksTeamSettings[];
  /** If the Slack channel is private. */
  isPrivate?: boolean;
  /** If the Slack channel is shared with an external org. */
  isShared?: boolean;
  /** True if we know the Linear Asks bot has been added to the Slack channel. */
  botAdded?: boolean;
  /** True if the channel should auto-create an Ask for every top-level message. */
  autoCreateOnMessage?: boolean;
  /** True if the channel should auto-create an Ask for the designated :ticket: emoji. */
  autoCreateOnEmoji?: boolean;
  /** True if `@-mentioning` the bot should auto-create an Ask with the message. */
  autoCreateOnBotMention?: boolean;
  /**
   * The optional template ID to use for Asks auto-created in this channel. If not set, auto-created Asks won't use any
   * template.
   */
  autoCreateTemplateId?: string;
// DIFF-76 change at line 275
  /** True if we should post a message and emoji to the synced Slack thread when its linked Ask is canceled. */
  postCancellationUpdates?: boolean;
  /** True if we should post a message and emoji to the synced Slack thread when its linked Ask is completed. */
  postCompletionUpdates?: boolean;
  /** True if we should post a message to the synced Slack thread when its linked Ask is accepted from triage. */
  postAcceptedFromTriageUpdates?: boolean;
  /** Whether or not to use AI to generate titles for Asks created in this channel. */
  aiTitles?: boolean;
  /** True if we should post a message to the synced Slack thread when its linked Ask is assigned. */
  postAssignmentUpdates?: boolean;
  /** True if we should post a message to the synced Slack thread when its linked Ask's SLA is at risk or breached. */
  postSlaUpdates?: boolean;
};

/**
 * Slack settings shared across multiple types of Slack integrations.
 */
type SharedSlackSettings = {
  /** Slack workspace name. */
  teamName?: string;
  /** Slack workspace id. */
  teamId?: string;
  /** Slack enterprise name. */
  enterpriseName?: string;
  /** Slack enterprise id, set for Enterprise Grid installs. */
// DIFF-76 change at line 300
  enterpriseId?: string;
  /** Whether to unfurl previews in Slack. */
  shouldUnfurl?: boolean;
  /** Whether to allow external users to take actions on issues that are shared in Slack. */
  externalUserActions?: boolean;
};

/**
 * Integration settings for the Slack integration.
 */
type SlackIntegrationSettings = {
  /** Whether Linear should respond with issue unfurls when an issue identifier is mentioned in a Slack message. */
  linkOnIssueIdMention: boolean;
  /** Whether Linear Agent should be enabled for this Slack integration. */
  enableAgent?: boolean;
  /**
   * Whether Loops may read and send messages through this Slack integration. Defaults to enabled but requires Linear Agent.
   */
  enableLoops?: boolean;
  /** Whether Linear Agent may respond in private channels for this Slack integration. */
  allowAgentInPrivateChannels?: boolean;
  /** Whether Linear Agent should automatically sync threads in private channels for this Slack integration. */
  syncAgentThreadsInPrivateChannels?: boolean;
  /** Whether Linear Agent should be given Org-wide access within Slack workflows. */
  enableLinearAgentWorkflowAccess?: boolean;
// DIFF-76 change at line 325
  /** Whether Code Intelligence should be enabled for this Slack integration. */
  enableCodeIntelligence?: boolean;
} & SharedSlackSettings;

/**
 * Integration settings for the Slack Asks integration.
 */
type SlackAsksIntegrationSettings = {
  /** The list of Slack channels that have been connected to the Asks integration. */
  slackChannelMapping: SlackChannelNameMapping[];
  /** The user role type that is allowed to manage Asks settings. */
  canAdministrate: UserRoleType;
  /** Whether to show unfurls as Work Objects in Slack. */
  shouldUseDefaultUnfurl?: boolean;
  /** Controls who can see and set Customers when creating Asks in Slack. */
  customerVisibility?: CustomerVisibilityMode;
  /** Whether Linear Agent should be enabled for this Slack Asks integration. */
  enableAgent?: boolean;
  /** Whether Linear Agent should be given Org-wide access within Slack workflows. */
  enableLinearAgentWorkflowAccess?: boolean;
} & SharedSlackSettings;

/**
 * Integration settings for all the "slack post" integrations which create webhooks to post to Slack.
 */
// DIFF-76 change at line 350
type SlackPostSettings = {
  channel: string;
  channelId: string;
  configurationUrl: string;
  /** Slack workspace id. */
  teamId?: string;
  /** The type of the Slack channel, when available from the backend. */
  channelType?: "directmessage" | "multipersondirectmessage" | "private" | "privategroup" | "public";
};

/**
 * Integration settings for the Notion integration.
 */
type NotionIntegrationSettings = {
  workspaceId?: string;
  workspaceName?: string;
};

/**
 * Integration settings for the Opsgenie integration.
 */
type OpsgenieIntegrationSettings = {
  /** The date when the integration failed with an unauthorized error. */
  apiFailedWithUnauthorizedErrorAt?: Date;
};
// DIFF-76 change at line 375

/**
 * Integration settings for the PagerDuty integration.
 */
type PagerDutyIntegrationSettings = {
  /** The date when the integration failed with an unauthorized error. */
  apiFailedWithUnauthorizedErrorAt?: Date;
};

/**
 * Integration settings for the Sentry integration.
 */
type SentryIntegrationSettings = {
  /** The Sentry organization slug (user-modifiable). */
  organizationSlug: string;
  /** The Sentry organization id (unique). */
  organizationId: number;
  /** Whether a Sentry issue changing to Resolved closes Linear issues. */
  resolvingCompletesIssues: boolean;
  /** Whether a Sentry issue changing to Unresolved reopens Linear issues. */
  unresolvingReopensIssues: boolean;
};

/**
 * Settings for an individual Google Sheets export type.
// DIFF-76 change at line 400
 */
export type GoogleSheetsIntegrationExportSettings = {
  enabled?: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetId?: number;
  updatedAt?: Date;
};

/**
 * Integration settings for the Google Sheets integration.
 */
export type GoogleSheetsIntegrationSettings = {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetId?: number;
  updatedIssuesAt?: Date;
  issue?: GoogleSheetsIntegrationExportSettings;
  project?: GoogleSheetsIntegrationExportSettings;
  initiative?: GoogleSheetsIntegrationExportSettings;
};

/**
 * Integration settings for the Salesforce integration.
 */
// DIFF-76 change at line 425
type SalesforceIntegrationSettings = SupportIntegrationSettings & {
  /** The Salesforce subdomain. */
  subdomain: string;
  /** The Salesforce instance URL. */
  url: string;
  /** The Salesforce case status to use when a case will be automatically reopened. */
  reopenCaseStatus?: string;
  /** Whether to restrict visibility of the integration to issues that have been either created from Salesforce or linked to Salesforce. */
  restrictVisibility?: boolean;
  /** The Salesforce team to use when a template doesn't specify a team. */
  defaultTeam?: string;
};

/**
 * Integration settings for the Gong integration.
 */
type GongIntegrationSettings = {
  importConfig?: {
    teamId?: string;
  };
  tagParticipantsInIssues?: boolean;
};

/**
 * Integration settings for the Microsoft Teams integration.
// DIFF-76 change at line 450
 */
type MicrosoftTeamsIntegrationSettings = {
  /** The display name of the Azure AD tenant. */
  tenantName?: string;
  /** Whether Code Intelligence should be enabled for this Microsoft Teams integration. */
  enableCodeIntelligence?: boolean;
};

/**
 * Integration settings for a Microsoft Teams project post channel connection.
 */
type MicrosoftTeamsProjectPostSettings = {
  /** AAD group id of the Team. */
  teamId: string;
  /** Display name of the Team. */
  teamName: string;
  /** Microsoft Teams channel id. */
  channelId: string;
  /** Display name of the channel. */
  channelName: string;
  /** Membership type of the channel: standard, private, or shared. */
  membershipType: "standard" | "private" | "shared";
  /** Azure AD tenant id the team belongs to. */
  tenantId: string;
};
// DIFF-76 change at line 475

/**
 * Integration specific settings.
 */
export interface IntegrationSettings {
  googleSheets?: GoogleSheetsIntegrationSettings;
  slack?: SlackIntegrationSettings;
  slackAsks?: SlackAsksIntegrationSettings;
  slackCustomViewNotifications?: SlackPostSettings;
  slackPost?: SlackPostSettings;
  slackProjectPost?: SlackPostSettings;
  slackInitiativePost?: SlackPostSettings;
  slackProjectUpdatePost?: SlackPostSettings;
  slackOrgProjectUpdatesPost?: SlackPostSettings;
  slackOrgInitiativeUpdatesPost?: SlackPostSettings;
  sentry?: SentryIntegrationSettings;
  zendesk?: ZendeskIntegrationSettings;
  gitHub?: GitHubIntegrationSettings;
  gitHubImport?: GitHubImportIntegrationSettings;
  gitHubPersonal?: GitHubPersonalIntegrationSettings;
  gitLab?: GitLabIntegrationSettings;
  front?: FrontIntegrationSettings;
  launchDarkly?: LaunchDarklyIntegrationSettings;
  loom?: {}; // DEPRECATED
  intercom?: IntercomIntegrationSettings;
// DIFF-76 change at line 500
  jira?: JiraIntegrationSettings;
  jiraPersonal?: JiraPersonalIntegrationSettings;
  notion?: NotionIntegrationSettings;
  opsgenie?: OpsgenieIntegrationSettings;
  pagerDuty?: PagerDutyIntegrationSettings;
  salesforce?: SalesforceIntegrationSettings;
  gong?: GongIntegrationSettings;
  microsoftTeams?: MicrosoftTeamsIntegrationSettings;
  microsoftTeamsProjectPost?: MicrosoftTeamsProjectPostSettings;
}

type IntegrationSettingsProperty<
  K extends keyof IntegrationSettings,
  P extends keyof NonNullable<IntegrationSettings[K]>,
> = NonNullable<NonNullable<IntegrationSettings[K]>[P]>;

/**
 * A model representing a service integration.
 */
@ClientModel("Integration")
export class Integration extends DeletableModel {
  // TODO: Integration is treated as both instant and lazy in client code. Migration needed
  public static override readonly loadStrategy = LoadStrategyMigration.toLazy(false);

  /** Integration service. */
// DIFF-76 change at line 525
  @Property({ default: "email", persistence: "none" })
  public service: IntegrationService;

  /** The service ID. */
  @Property({ default: "", persistence: "none" })
  public serviceId: string;

  /** The team to which the integration belongs to. */
  @OneSidedReference(() => Team, { optional: true, nullable: false, indexed: true, persistence: "none" })
  public team?: Team;

  /** The project to which the integration belongs to. */
  @LazyOneSidedReference(() => Project, { optional: true, nullable: false, indexed: true, persistence: "none" })
  public project?: LazyReference<Project>;

  /** The initiative to which the integration belongs to. */
  @OneSidedReference(() => Initiative, { optional: true, nullable: false, indexed: true, persistence: "none" })
  public initiative?: Initiative;

  /** The workflow definition to which the integration belongs to. */
  @LazyManyToOne(() => WorkflowDefinition, "integrations", {
    optional: true,
    nullable: false,
    indexed: true,
  })
// DIFF-76 change at line 550
  public workflowDefinition?: LazyReference<WorkflowDefinition>;

  /** The workflow definition draft to which the integration belongs to. */
  @LazyManyToOne(() => WorkflowDefinitionDraft, "integrations", {
    optional: true,
    nullable: false,
    indexed: true,
  })
  public workflowDefinitionDraft?: LazyReference<WorkflowDefinitionDraft>;

  /** The custom view to which the integration belongs to. */
  @LazyOneSidedReference(() => CustomView, { optional: true, nullable: false, indexed: true, persistence: "none" })
  public customView?: LazyReference<CustomView>;

  /** The user who enabled the integration. */
  @OneSidedReference(() => User, { optional: false, nullable: false, persistence: "none" })
  public creator: User;

  /** The organization to which the integration belongs to. */
  @ManyToOne(() => Organization, "integrations", { optional: false, nullable: false, persistence: "none" })
  public organization: Organization;

  /** Integration settings. Only used for synchronization, should not be manipulated directly. */
  @Property({ default: {}, persistence: "updateOnly" })
  public settings: IntegrationSettings;
// DIFF-76 change at line 575

  /** The feature flag this integration is associated with. */
  @OneToMany(() => FeatureFlag)
  public readonly featureFlags: Collection<FeatureFlag>;

  /** The feature flag rollout stages this integration is associated with. */
  @OneToMany(() => FeatureFlagRolloutStage)
  public readonly rolloutStages: Collection<FeatureFlagRolloutStage>;

  /** The AI prompt rules scoped to this integration. */
  @LazyOneToMany(() => AiPromptRules, { index: "integrationId" })
  public readonly aiPromptRules: LazyCollection<AiPromptRules>;

  /** The templates this integration is associated with. */
  @LazyOneToMany(() => IntegrationTemplate, { index: "integrationId" })
  public readonly integrationTemplates: LazyCollection<IntegrationTemplate>;

  /** The time schedules this integration is associated with. */
  @LazyOneToMany(() => TimeSchedule, { index: "integrationId", order: new CollectionOrder("name") })
  public readonly timeSchedules: LazyCollection<TimeSchedule>;

  /**
   * Metadata about an unresolved auth error encountered by the Integration.
   */
  @Property({ serializer: JSONSerializer, persistence: "none" })
// DIFF-76 change at line 600
  public authError?: IntegrationAuthErrorMetadata;

  /**   * Metadata about the integration.   */
  @Property({ serializer: JSONSerializer, persistence: "none" })
  public metadata?: IntegrationMetadata;

  // -- Public methods

  /** The user presentable name of the integration. */
  public get name(): string {
    return IntegrationServiceHelper.getDisplayName(this.service);
  }

  /** Is this a GitHub/GitLab integration with integration pull request config. */
  public get isPullRequestIntegration(): boolean {
    return (
      this.service === IntegrationService.github ||
      this.service === IntegrationService.githubEnterpriseServer ||
      this.service === IntegrationService.gitlab ||
      this.service === IntegrationService.origin
    );
  }

  /**
   * Checks if this is a legacy Zendesk integration that lacks OAuth refresh support.
// DIFF-76 change at line 625
   * Such integrations will continue working until Zendesk enforces token expiration (April 2026)
   * but should be reconnected to enable automatic token refresh. Integrations that authenticate
   * with a user-provided bearer token don't use OAuth at all and are not legacy.
   */
  public get isLegacyZendeskIntegration(): boolean {
    if (this.service !== IntegrationService.zendesk) {
      return false;
    }
    return !this.settings?.zendesk?.supportsOAuthRefresh && !this.settings?.zendesk?.bearerTokenAuth;
  }

  /** Is this an integration that has templates enabled for it. */
  public get isTemplateEnabledIntegration(): boolean {
    return IntegrationTemplateHelper.isTemplateEnabledIntegration(this.service);
  }

  /**
   * All templates tied to this integration, sorted by team name, sort order, and creation date (to break ties, since
   * default sort order is 0 for templates that haven't been manually reordered). Used to display templates in the
   * correct order across the client.
   */
  public sortedTemplates(): Template[] {
    return orderBy(
      this.integrationTemplates.map(it => it.template.value).concrete(),
      [t => t.team?.name, "sortOrder", "createdAt"],
// DIFF-76 change at line 650
      ["asc", "asc", "asc"]
    );
  }

  /**
   * Whether the integration is available for a specific template.
   *
   * @param template The template to check.
   * @returns True if the integration is available for the template.
   */
  public isAvailableForTemplate(template: Template): boolean {
    const hasAccess =
      this.service === IntegrationService.slackAsks
        ? this.organization.canAccessSome([PlanFeature.asksLimited, PlanFeature.asks])
        : true;
    const hasTemplatesAvailable =
      this.service === IntegrationService.slackAsks
        ? // For Slack Asks, we need to check if the integration has any channels connected to add templates
          !!this.settings?.slackAsks?.slackChannelMapping?.length
        : this.isTemplateEnabledIntegration;
    const canHaveWorkspaceTemplates = IntegrationTemplateHelper.isWorkspaceTemplatesEnabledIntegration(this.service);
    const canHavePrivateTemplates = IntegrationTemplateHelper.isPrivateTemplateEnabledIntegration(this.service);
    return (
      template.type === TemplateType.issue &&
      hasAccess &&
// DIFF-76 change at line 675
      hasTemplatesAvailable &&
      (template.team || canHaveWorkspaceTemplates) &&
      (template.team ? template.team.public || canHavePrivateTemplates : true)
    );
  }

  /**
   * Whether the integration needs to be reinstalled, usually to receive new scopes.
   *
   * @returns True if the integration needs to be reinstalled.
   */
  public shouldReinstall = (): Promise<boolean> => {
    if (this.service !== IntegrationService.slack) {
      return Promise.resolve(false);
    }

    if (Feature.isEnabled(Feature.forceSlackUpdate)) {
      return Promise.resolve(true);
    }

    const bundle = Feature.isEnabled(Feature.slackStagingApp) ? SlackScopes().LinearStaging : SlackScopes().Linear;

    return checkIntegrationForMissingScopes(this.store.graphQLClient, {
      scopes: requiredSlackScopes(bundle),
      integrationId: this.id,
// DIFF-76 change at line 700
    }).then(result => !result.integrationHasScopes.hasAllScopes);
  };

  /**
   * Whether the integration is missing any of the given scopes.
   *
   * @param scopes The scopes to check for.
   * @returns True if the integration is missing at least one of the scopes.
   */
  public isMissingScopes = (scopes: readonly SlackScope[]): Promise<boolean> => {
    return checkIntegrationForMissingScopes(this.store.graphQLClient, {
      scopes: [...scopes],
      integrationId: this.id,
    }).then(result => !result.integrationHasScopes.hasAllScopes);
  };

  /**
   * Whether the current user may grant a workflow chat message access through this integration.
   *
   * @returns True when the server accepts the integration as a chat message capability grant.
   */
  public canGrantChatMessagesCapability = (): Promise<boolean> => {
    return checkChatMessagesCapabilityGrantEligibility(this.store.graphQLClient, this.id).then(
      result => result.integrationEligibleForChatMessagesCapabilityGrant
    );
// DIFF-76 change at line 725
  };

  /**
   * Whether the user can manage settings for the workspace's Asks integration.
   *
   * @param user The user to check.
   * @param integration The integration to check.
   * @returns `true` if the user can manage settings, `false` otherwise.
   */
  public userCanManageAsksSettings = (user: User, integration: Integration): boolean => {
    if (integration.service !== IntegrationService.slackAsks || !integration.settings?.slackAsks) {
      throw new Error("Integration is not a Slack Asks integration");
    }

    return user.hasPermission(WorkspaceAdminPermission.integrationManagement, {
      [WorkspaceAdminPermission.integrationManagement]: integration.settings.slackAsks.canAdministrate,
    });
  };

  /**
   * Set settings for the integration. New value will be merged in so the fully defined settings object doesn't need to
   * be passed.
   *
   * Callers must not mutate `this.settings` in place before invoking this method. Change detection in
   * `markPropertyChanged` uses deep equality on serialized values (since #71076), so an in-place mutation poisons the
// DIFF-76 change at line 750
   * MobX setter's previousValue and silently drops the update. See LIN-70961 for the Asks regression where channel
   * team settings stopped saving for this exact reason.
   *
   * @param settings The new settings to change.
   * @returns The save transaction, or undefined when the integration service does not support settings.
   */
  public setSettings = async (
    settings:
      | Partial<FrontIntegrationSettings>
      | Partial<IntercomIntegrationSettings>
      | Partial<JiraIntegrationSettings>
      | Partial<SentryIntegrationSettings>
      | Partial<SlackIntegrationSettings>
      | Partial<SlackAsksIntegrationSettings>
      | Partial<ZendeskIntegrationSettings>
      | Partial<GitHubIntegrationSettings>
      | Partial<GoogleSheetsIntegrationSettings>
      | Partial<SalesforceIntegrationSettings>
      | Partial<MicrosoftTeamsIntegrationSettings>
  ): Promise<ITransaction | undefined> => {
    if (
      ![
        IntegrationService.front,
        IntegrationService.intercom,
        IntegrationService.jira,
// DIFF-76 change at line 775
        IntegrationService.sentry,
        IntegrationService.slack,
        IntegrationService.slackAsks,
        IntegrationService.zendesk,
        IntegrationService.github,
        IntegrationService.googleSheets,
        IntegrationService.salesforce,
        IntegrationService.microsoftTeams,
      ].includes(this.service)
    ) {
      return;
    }

    // Deep clone the incoming partial so the value we assign to `this.settings` never shares object references with
    // the caller's settings object. Without this, callers that build up the partial by reading and mutating values
    // from `this.settings` would end up with the new live settings still pointing at their pre-existing nested
    // references, which is the exact shape that defeats change detection (see method docstring).
    const incomingSettings = cloneDeep(settings);

    let updatedSettings = cloneDeep(this.settings);

    // Unfortunately the enum for github does not match between client and server going back 3 years, we can probably
    // backfill this, but for now it's a special case.
    const key = this.service === IntegrationService.github ? ("gitHub" as const) : this.service;
    updatedSettings = { [key]: assign(updatedSettings[key as keyof typeof updatedSettings], incomingSettings) };
// DIFF-76 change at line 800

    return runInAction(() => {
      this.settings = updatedSettings;
      return this.save();
    });
  };

  /**
   * Returns a deep copy of a nested integration settings property so callers can safely mutate and persist the copy
   * with `setSettings`.
   *
   * @param settingsKey The integration settings namespace.
   * @param propertyKey The nested settings property to copy.
   * @param fallback The fallback value to copy when the property has not been initialized.
   * @returns A mutable copy of the settings property.
   */
  public getSettingsPropertyCopy<
    K extends keyof IntegrationSettings,
    P extends keyof NonNullable<IntegrationSettings[K]>,
  >(settingsKey: K, propertyKey: P, fallback: IntegrationSettingsProperty<K, P>): IntegrationSettingsProperty<K, P> {
    // Cast through a Partial<Record> because indexing a union of settings shapes with a generic `P`
    // (a key of the union) defeats TS's value-type inference even though the lookup is safe.
    const namespace = this.settings[settingsKey] as Partial<Record<P, IntegrationSettingsProperty<K, P>>> | undefined;
    return cloneDeep(namespace?.[propertyKey] ?? fallback);
  }
// DIFF-76 change at line 825

  /**
   * Checks if the user has a matching personal integration.
   *
   * @param user The user to check.
   * @returns True if the user has a matching personal integration, false otherwise.
   */
  public userHasMatchingPersonalIntegration(user: User) {
    const personalIntegrations = user.createdIntegrations;
    switch (this.service) {
      case IntegrationService.github:
        const personalIntegrationType = this.settings.gitHub?.codeAccess
          ? IntegrationService.githubCodeAccessPersonal
          : IntegrationService.githubPersonal;
        const enterpriseUrl = this.settings.gitHub?.enterpriseUrl;
        return personalIntegrations.some(
          integration =>
            integration.service === personalIntegrationType &&
            !integration.authError &&
            integration.settings.gitHubPersonal?.enterpriseUrl === enterpriseUrl
        );
      case IntegrationService.jira:
        return personalIntegrations.some(
          integration => integration.service === IntegrationService.jiraPersonal && !integration.authError
        );
// DIFF-76 change at line 850
      // TODO: For now this only supports GitHub & Jira, but we should include other services in the future.
      default:
        return false;
    }
  }

  // -- Integration-specific settings helpers

  /**
   * Whether the Slack Agent is enabled for the integration.
   */
  public isSlackAgentEnabled(): boolean {
    return this.settings.slack?.enableAgent ?? true;
  }

  /**
   * Whether Loops access is enabled for the Slack integration.
   *
   * This setting defaults to enabled. Callers must check {@link Integration.isSlackAgentEnabled}
   * separately when Slack Agent is also required.
   */
  public isSlackLoopsEnabled(): boolean {
    return this.settings.slack?.enableLoops ?? true;
  }

// DIFF-76 change at line 875
  /**
   * Every key this Asks integration's Slack user mappings may be stored under, most specific first.
   *
   * @returns The candidate keys.
   */
  public get slackAsksTeamKeys(): string[] {
    const settings = this.settings.slackAsks;
    return [settings?.enterpriseId, settings?.teamId].filter((key): key is string => Boolean(key));
  }

  /**
   * Whether the Slack Asks Agent is enabled for the integration.
   */
  public isSlackAsksAgentEnabled(): boolean {
    return this.settings.slackAsks?.enableAgent ?? true;
  }

  /**
   * Whether Code Intelligence is enabled for the Slack integration.
   */
  public isSlackCodeIntelligenceEnabled(): boolean {
    return this.settings.slack?.enableCodeIntelligence ?? true;
  }

  /**
// DIFF-76 change at line 900
   * Whether Code Intelligence is enabled for the Microsoft Teams integration.
   */
  public isMicrosoftTeamsCodeIntelligenceEnabled(): boolean {
    return this.settings.microsoftTeams?.enableCodeIntelligence ?? true;
  }
}

type CheckIntegrationForMissingScopesResult = {
  integrationHasScopes: {
    hasAllScopes: boolean;
    missingScopes: string[];
  };
};

function checkIntegrationForMissingScopes(
  graphQLClient: GraphQLClient,
  variables: {
    scopes: string[];
    integrationId: string;
  }
): Promise<CheckIntegrationForMissingScopesResult> {
  return graphQLClient.query<CheckIntegrationForMissingScopesResult>(
    gql`
      query CheckScopes($integrationId: String!, $scopes: [String!]!) {
        integrationHasScopes(integrationId: $integrationId, scopes: $scopes) {
// DIFF-76 change at line 925
          hasAllScopes
          missingScopes
        }
      }
    `,
    variables
  );
}

type CheckChatMessagesCapabilityGrantEligibilityResult = {
  integrationEligibleForChatMessagesCapabilityGrant: boolean;
};

function checkChatMessagesCapabilityGrantEligibility(
  graphQLClient: GraphQLClient,
  integrationId: string
): Promise<CheckChatMessagesCapabilityGrantEligibilityResult> {
  return graphQLClient.query<CheckChatMessagesCapabilityGrantEligibilityResult>(
    gql`
      query CheckChatMessagesCapabilityGrantEligibility($integrationId: String!) {
        integrationEligibleForChatMessagesCapabilityGrant(integrationId: $integrationId)
      }
    `,
    { integrationId }
  );
// DIFF-76 change at line 950
}

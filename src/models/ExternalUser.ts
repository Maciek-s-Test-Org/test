import { initials } from "@linear/common/utils/initials";
import type { ExternalUserMetadata } from "@linear/common/models/ExternalUserMetadata";
import { ExternalUserHelper } from "@linear/common/models/ExternalUserHelper";
import { AgentsByLogin, agentMentionTriggerForReviewer, knownAgentForUser } from "@linear/common/models/KnownAgents";
import { GITHUB_DEFAULT_HOST } from "@linear/common/models/ExternalUserMapping";
import { Organization } from "#models/Organization";
import type { User } from "#models/User";
import { ClientModel, ManyToOne, Property, Computed } from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";

/**
 * A model representing an external user.
 */
@ClientModel("ExternalUser")
export class ExternalUser extends Model {
  public static override readonly loadStrategy = ModelLoadStrategy.lazy;

  /** Builds the key identifying a GitHub account, since GitHub user ids are only unique within a host. */
  public static gitHubIdentityKey(host: string, gitHubUserId: string): string {
    return `${host}/${gitHubUserId}`;
  }

  /** User's full name. */
  @Property({ default: "" })
  public name: string;

  /** User's display name (nickname). */
  @Property({ default: "" })
  public displayName: string;

  /** Gets the display name for this external user, using agent display names when applicable. */
  @Computed
  public get effectiveDisplayName(): string {
    return knownAgentForUser(this)?.displayName || this.displayName || this.name;
  }

  /** Gets the full name for this external user, using agent full names when applicable. */
  @Computed
  public get effectiveFullName(): string {
    return knownAgentForUser(this)?.fullName || this.name;
  }

  /** Unique email. */
  @Property({ default: "" })
  public email: string;

  /** Optional profile picture. */
  @Property()
  public avatarUrl?: string;

  /** The users organization. */
  @ManyToOne(() => Organization, "externalUsers", { optional: false, nullable: false, indexed: true })
  public organization: Organization;

  /** The same organization as `organization`, set by the backend only for external users with a GitHub identity. */
  @ManyToOne(() => Organization, "githubExternalUsers", { nullable: true, indexed: true })
  public gitHubIdentityOrganization?: Organization;

  /** User's Atlassian account id. */
  @Property()
  public atlassianAccountId?: string;

  /** User's GitHub user id. Only unique within a GitHub host, so pair it with `gitHubHost`. */
  @Property()
  public gitHubUserId?: string;

  /** The GitHub Enterprise Cloud host this user's GitHub account lives on, or undefined for github.com. */
  @Property()
  public gitHubEnterpriseHost?: string;

  /** The GitHub login (e.g. "cursor[bot]") for this external user. */
  @Property()
  public gitHubLogin?: string;

  /** Service-specific metadata, including bot/agent flags. */
  @Property()
  public metadata?: ExternalUserMetadata;

  // -- Computed variables

  /** The initials of the user. */
  public get initials(): string {
    return initials(this.name);
  }

  /** The first name of the user. */
  public get firstName(): string {
    return this.name.split(" ").shift() || this.name;
  }

  /** The GitHub host this user's account lives on. */
  public get gitHubHost(): string {
    return this.gitHubEnterpriseHost ?? GITHUB_DEFAULT_HOST;
  }

  /** The workspace user whose GitHub mapping covers this external user's account, or this external user if none. */
  public get mappedUserOrSelf(): User | ExternalUser {
    if (!this.gitHubUserId) {
      return this;
    }
    return (
      this.organization.usersByGitHubIdentity.get(ExternalUser.gitHubIdentityKey(this.gitHubHost, this.gitHubUserId)) ??
      this
    );
  }

  /**
   * Whether this external user is a bot or agent rather than a human. For rows saved before we
   * started persisting the flag, falls back to the GitHub `[bot]` login suffix and to the known
   * agent list, which also covers agents whose logins lack that suffix (e.g. `cursoragent`).
   */
  @Computed
  public get isBot(): boolean {
    return ExternalUserHelper.isBot(this);
  }

  /** Whether the GitHub account behind this external user is an organization. */
  @Computed
  public get isOrganization(): boolean {
    return this.metadata?.isOrganization === true;
  }

  /** Whether this is a human account: not a bot, an organization, or anything resolving to a known agent. */
  public get isHuman(): boolean {
    return !(this.isOrganization || knownAgentForUser(this) || this.isBot);
  }

  /** The curated GitHub login to render for this external user. */
  @Computed
  public get effectiveGitHubLogin(): string | undefined {
    const agent = this.gitHubLogin ? AgentsByLogin[this.gitHubLogin.toLowerCase()] : undefined;
    return agent ? agent.logins[0].replace(/\[bot\]$/, "") : this.gitHubLogin;
  }

  /**
   * Text to render inside an `@`-mention chip for this GitHub-backed external user, matching the
   * `@<login>` form GitHub shows in PR comments. Known agents mention by their trigger (e.g.
   * `claude`, not `claude[bot]`) so the mention summons the agent on GitHub. Returns `undefined`
   * for non-GitHub external users so callers can fall back to `displayName` for headers/popovers.
   */
  @Computed
  public get mentionText(): string | undefined {
    if (!this.gitHubLogin) {
      return undefined;
    }
    // Only bot rows swap to the trigger — a human whose name matches an agent keeps their login.
    return (this.isBot ? agentMentionTriggerForReviewer(this) : undefined) ?? this.gitHubLogin;
  }
}

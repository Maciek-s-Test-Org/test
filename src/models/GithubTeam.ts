import { initials } from "@linear/common/utils/initials";
import type { GithubTeamMetadata } from "@linear/common/models/GithubTeamMetadata";
import { Organization } from "#models/Organization";
import { PullRequest } from "#models/PullRequest";
import { ClientModel, Computed, LazyOneToMany, ManyToOne, Property } from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import type { LazyCollection } from "#models/collections/LazyCollection";

/**
 * A client-side model for a GitHub team discovered through the GitHub integration. Shaped compatibly
 * with `ExternalUser` so that UI surfaces (assignment, review, mention) can render users and teams
 * with the same components.
 */
@ClientModel("GithubTeam")
export class GithubTeam extends Model {
  public static override readonly loadStrategy = ModelLoadStrategy.lazy;

  /** The team's display name (e.g. "Frontend Team"). */
  @Property({ default: "" })
  public name: string;

  /** The team's slug (e.g. "frontend-team"). Used as the team's at-mention handle. */
  @Property({ default: "" })
  public slug: string;

  /** Description of the team, when set on GitHub. */
  @Property()
  public description?: string;

  /** A URL to the team's avatar image. */
  @Property()
  public avatarUrl?: string;

  /** The numeric GitHub team id, stored as a string for safety with large integers. */
  @Property()
  public gitHubTeamId?: string;

  /** The login of the GitHub organization that owns this team. */
  @Property({ default: "" })
  public organizationLogin: string;

  /** The GitHub Enterprise Cloud host this team lives on (e.g. "acme.ghe.com"), or undefined for github.com. */
  @Property()
  public gitHubEnterpriseHost?: string;

  /** The GitHub node id of the owning organization. Stable across org renames; used to scope teams to an org. */
  @Property()
  public externalOwnerId?: string;

  /** Linear users that are currently known members of this GitHub team. */
  @Property({ default: [] })
  public memberUserIds: string[];

  /** External users (GitHub members not mapped to a Linear user) that are members of this GitHub team. */
  @Property({ default: [] })
  public memberExternalUserIds: string[];

  /** Service-specific metadata captured from GitHub. */
  @Property()
  public metadata?: GithubTeamMetadata;

  /** The workspace this team was discovered for. */
  @ManyToOne(() => Organization, "githubTeams", { optional: false, nullable: false, indexed: true })
  public organization: Organization;

  /** Pull requests where this GitHub team is a requested reviewer. */
  @LazyOneToMany(() => PullRequest, {
    index: "reviewerGithubTeamIds",
    order: new CollectionOrder("openedAt", "desc"),
  })
  public readonly reviewerOfPullRequests: LazyCollection<PullRequest>;

  // -- Computed variables

  /**
   * Known member Linear user ids as a set, for constant-time membership checks. Memoized so callers
   * that only need to test a single user don't scan the (potentially very large) member array.
   */
  @Computed
  public get memberUserIdSet(): ReadonlySet<string> {
    return new Set(this.memberUserIds);
  }

  /** The initials of the team, derived from its display name. */
  public get initials(): string {
    return initials(this.name);
  }

  /**
   * A display name compatible with the User/ExternalUser interfaces consumed by reviewer/assignee
   * surfaces. Always returns a string so it is safe to use in `<UserAvatar>`-style components.
   */
  public get displayName(): string {
    return this.name || this.slug;
  }
}

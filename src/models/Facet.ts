import { notReachable } from "@linear/common/errors/UnreachableCaseError";
import type { RemoveOptionality } from "@linear/common/types";
import {
  FacetType,
  type InitiativeFacetProperties,
  type FacetTypeDependentProperties,
  type ProjectFacetProperties,
  type TeamPageFacetProperties,
  type WorkspacePageFacetProperties,
  type FacetPageSource,
  type FeedPageFacetProperties,
} from "@linear/common/types/Facet";
import { SortOrderHelper } from "#utils/SortOrderHelper";
import { Logger } from "#logging/Logger";
import { CustomView } from "#models/CustomView";
import { Favorite } from "#models/Favorite";
import type { FeedItem } from "#models/FeedItem";
import { Initiative } from "#models/Initiative";
import type { Issue } from "#models/Issue";
import { Organization } from "#models/Organization";
import { Project } from "#models/Project";
import { Team } from "#models/Team";
import { User } from "#models/User";
import { ClientModel, LazyManyToOne, LazyOneToOne, ManyToOne, OneToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { Hydrated } from "#models/base/ModelTypes";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import { LazyReference } from "#models/hydration/Lazy";

/**
 * A facet. Facets are joins between entities. A facet can tie a custom view to a project, for example.
 *
 * Facets are sorted by the `sortOrder` field, which must be scoped to the owning entity. E.g. targeted custom views connected to
 * an owning project are sorted scoped by the projectId. This means that the sortOrder is unique per owning entity.
 */
@ClientModel("Facet")
export class Facet extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /**
   * The sortOrder of the facet. Scoped to it's owning entity.
   */
  @Property({ default: 0 })
  public sortOrder: number;

  /** The creator of the facet. */
  @ManyToOne(() => User, "facets", { nullable: true, indexed: true, persistence: "createOnly" })
  public creator?: User | undefined;

  /** The related favorite. */
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /**
   * The type of the facet. This is a computed field based on the source fields to avoid duplicating this information in
   * the database. This is a helper field to make it easier to work with facets.
   */
  public get type(): FacetType {
    if (!this.targetCustomView) {
      // We have seen crashing in production due to missing targetCustomView.
      Logger.warning(
        "facet.targetCustomView is missing",
        {
          facetId: this.id,
          isPersisted: this.persisted,
          isPersistedOnBackend: this.persistedOnBackend,
          hasSourceProject: !!this.sourceProject,
          hasSourceInitiative: !!this.sourceInitiative,
          hasSourceTeam: !!this.sourceTeam,
          hasSourceOrganization: !!this.sourceOrganization,
          hasSourceFeedUser: !!this.sourceFeedUser,
        },
        { skipBeforeInitialDeltaSync: true }
      );
      return FacetType.Unknown;
    }
    if (this.sourceProject) {
      return FacetType.Project;
    }
    if (this.sourceInitiative) {
      return FacetType.Initiative;
    }
    if (this.sourceTeam) {
      return FacetType.TeamPage;
    }
    if (this.sourceOrganization) {
      return FacetType.WorkspacePage;
    }
    if (this.sourceFeedUser) {
      return FacetType.Feed;
    }

    Logger.info("Unknown facet type on client", { facetId: this.id });

    return FacetType.Unknown;
  }

  // -- Owning entities

  /**
   * Organization owning this facet.
   * This is only set for workspace level facets that don't have some other entity to be owned by.
   */
  @ManyToOne(() => Organization, "facets", { nullable: true, indexed: true, persistence: "createOnly" })
  public sourceOrganization?: Organization | undefined;

  /** Team owning this facet. Should be combined with `sourcePage` to determine which page. */
  @ManyToOne(() => Team, "facets", { nullable: true, indexed: true, persistence: "createOnly" })
  public sourceTeam?: Team | undefined;

  /** Project owning this facet. */
  @LazyManyToOne(() => Project, "facets", { nullable: true, indexed: true, persistence: "createOnly" })
  public sourceProject?: LazyReference<Project> | undefined;

  /** Initiative owning this facet. */
  @LazyManyToOne(() => Initiative, "facets", {
    nullable: true,
    indexed: true,
    persistence: "createOnly",
  })
  public sourceInitiative?: LazyReference<Initiative> | undefined;

  /** User owning this facet. */
  @ManyToOne(() => User, "feedFacets", {
    nullable: true,
    indexed: true,
    persistence: "createOnly",
  })
  public sourceFeedUser?: User | undefined;

  /**
   * The fixed page (e.g. Projects page) the facet is owned by.
   *
   * This can be on a workspace level or an entity level. For example you can have facets with a sourceOrganization
   * and a sourcePage of "projects" to indicate that the facet is owned by the workspace and is on the projects page.
   *
   * And similarly you can have a facet with a sourceTeam and a sourcePage of "projects" to indicate that the facet is
   * owned by the team and is on the projects page of that team.
   */
  @Property({ persistence: "createOnly" })
  public sourcePage?: FacetPageSource;

  // -- Target entities

  /** Custom view targeted by this facet. */
  @LazyOneToOne(() => CustomView, "facet", {
    optional: true,
    nullable: false,
    indexed: true,
    cascadeHydration: true,
    persistence: "createOnly",
  })
  public targetCustomView?: LazyReference<CustomView>;

  /** Whether the facet is safe to link to; deletion archives the facet or its target view optimistically. */
  public get isNavigable(): boolean {
    return !this.isArchived && this.targetCustomView?.value?.isArchived !== true;
  }

  /** The description of the facet. */
  public getTargetDescription(this: Hydrated<Facet>): string | undefined {
    const [type, facet] = resolveFacetType(this);
    switch (type) {
      case FacetType.Feed:
      case FacetType.Project:
        // No descriptions for facets in these pages.
        return undefined;
      case FacetType.Initiative:
      case FacetType.TeamPage:
      case FacetType.WorkspacePage:
        return facet.targetCustomView.value?.description;
      case FacetType.Unknown:
        return undefined;
      default:
        throw notReachable(type);
    }
  }

  /**
   * Returns the collection of issues associated with the facet. For example if this is a facet on a project this will
   * return the issues of that project.
   */
  public getIssues(this: Hydrated<Facet>): ReadonlyCollection<Issue> | undefined {
    const [type, facet] = resolveFacetType(this);
    switch (type) {
      case FacetType.Project:
        return facet.sourceProject.value?.issues;
      case FacetType.Initiative:
      case FacetType.TeamPage:
      case FacetType.WorkspacePage:
      case FacetType.Feed:
        return undefined;
      case FacetType.Unknown:
        return undefined;
      default:
        throw notReachable(type);
    }
  }

  /**
   * Returns the collection of projects associated with the facet. For example if this is a facet on an initiative this will
   * return the projects of that initiative.
   */
  public getProjects(this: Hydrated<Facet>): ReadonlyCollection<Project> | undefined {
    const [type, facet] = resolveFacetType(this);
    switch (type) {
      case FacetType.Project:
        return undefined;
      case FacetType.Initiative:
        return facet.sourceInitiative.value?.projectsInherited;
      case FacetType.TeamPage:
        return facet.sourceTeam.projectsInherited;
      case FacetType.WorkspacePage:
        return facet.sourceOrganization.projects;
      case FacetType.Feed:
      case FacetType.Unknown:
        return undefined;
      default:
        throw notReachable(type);
    }
  }

  /**
   * Returns the collection of initiatives associated with the facet. Both team and workspace page facets are org
   * scoped (every initiative in the org) so a team facet's removable default team filter can be cleared to go
   * workspace-wide; the base team initiatives page keeps its team scope through its own provider.
   */
  public getInitiatives(this: Hydrated<Facet>): ReadonlyCollection<Initiative> | undefined {
    const [type, facet] = resolveFacetType(this);
    switch (type) {
      case FacetType.TeamPage:
        return facet.sourceTeam.organization.initiatives;
      case FacetType.WorkspacePage:
        return facet.sourceOrganization.initiatives;
      case FacetType.Project:
      case FacetType.Initiative:
      case FacetType.Feed:
      case FacetType.Unknown:
        return undefined;
      default:
        throw notReachable(type);
    }
  }

  /**
   * Returns the collection of feedItems associated with the facet.
   */
  public getFeedItems(this: Hydrated<Facet>): ReadonlyCollection<FeedItem> | undefined {
    const [type, facet] = resolveFacetType(this);
    switch (type) {
      case FacetType.Feed:
        return facet.sourceFeedUser.organization.feed;
      case FacetType.Project:
      case FacetType.Initiative:
      case FacetType.TeamPage:
      case FacetType.WorkspacePage:
      case FacetType.Unknown:
        return undefined;
      default:
        throw notReachable(type);
    }
  }

  /**
   * Whether to hide description for this facet.
   */
  public get hideDescription(): boolean {
    return [FacetType.Feed, FacetType.Project].includes(this.type);
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  public toggleFavorite = (): false | Favorite => {
    if (this.favorite) {
      this.favorite.delete();
      return false;
    } else {
      const newFavorite = Favorite.create({ reference: this });
      newFavorite.save(true);
      return newFavorite;
    }
  };

  /**
   * Create a project facet.
   */
  public static createProjectFacet(props: {
    creator: User;
    customView: CustomView;
    project: Project;
  }): Hydrated<Facet> {
    const facet = Facet.createEmpty();
    facet.creator = props.creator;
    facet.targetCustomView = LazyReference.wrap(props.customView);
    facet.sortOrder = SortOrderHelper.lastSortOrder(props.project.facets, "sortOrder");
    facet.sourceProject = LazyReference.wrap(props.project);
    return facet;
  }

  /**
   * Create an initiative facet.
   */
  public static createInitiativeFacet(props: {
    creator: User;
    customView: CustomView;
    initiative: Initiative;
  }): Hydrated<Facet> {
    const facet = Facet.createEmpty();
    facet.creator = props.creator;
    facet.targetCustomView = LazyReference.wrap(props.customView);
    facet.sortOrder = SortOrderHelper.lastSortOrder(props.initiative.facets, "sortOrder");
    facet.sourceInitiative = LazyReference.wrap(props.initiative);
    return facet;
  }

  /**
   * Create a team page facet.
   */
  public static createTeamPageFacet(props: {
    creator: User;
    customView: CustomView;
    team: Team;
    sourcePage: FacetPageSource;
  }): Hydrated<Facet> {
    const facet = Facet.createEmpty();
    facet.creator = props.creator;
    facet.targetCustomView = LazyReference.wrap(props.customView);
    facet.sortOrder = SortOrderHelper.lastSortOrder(props.team.facets, "sortOrder");
    facet.sourceTeam = props.team;
    facet.sourcePage = props.sourcePage;
    return facet;
  }

  /**
   * Create a workspace page facet.
   */
  public static createWorkspacePageFacet(props: {
    creator: User;
    customView: CustomView;
    sourcePage: FacetPageSource;
  }) {
    const facet = Facet.createEmpty();
    facet.creator = props.creator;
    facet.targetCustomView = LazyReference.wrap(props.customView);
    facet.sortOrder = SortOrderHelper.lastSortOrder(props.creator.organization.facets, "sortOrder");
    facet.sourceOrganization = props.creator.organization;
    facet.sourcePage = props.sourcePage;
    return facet;
  }

  /**
   * Create a feed facet.
   */
  public static createFeedFacet(props: { creator: User; customView: CustomView }) {
    const facet = Facet.createEmpty();
    facet.creator = props.creator;
    facet.targetCustomView = LazyReference.wrap(props.customView);
    facet.sourceFeedUser = props.creator;
    return facet;
  }
}

/**
 *
 * Resolve the type of a facet. This is a helper function to make it easier to work with facets. It will return a tuple
 * containing the type of the facet and the facet itself with types properly resolved/narrowed.
 *
 * Use `resolveFacetType` to narrow the type of the facet. You can then use normal control flow to work with
 * the facet.
 *
 * Note that the fact that these properties are available is in the end enforced by database constraints, so
 * make sure to update the database schema if you add new facet types. The TS types are not the final guarantee, but
 * mirror what the database is enforcing so should hold up.
 *
 *
 * @example
 * facet.sourceProject; // Promise<Project | undefined>
 * facet.sourcePage; // FacetPageSource | undefined
 *
 * const [type, resolvedFacet] = resolveFacetType(facet);
 * switch (type) {
 *  case FacetType.Project:
 *    resolvedFacet.sourceProject; // Promise<Project>
 *    resolvedFacet.sourcePage; // TS error
 *    break;
 *  case FacetType.Initiative:
 *    resolvedFacet.sourceProject; // TS error
 *    resolvedFacet.sourcePage; // FacetPageSource
 *    break;
 *  case default:
 *    notReachable(type); // will complain if not all cases are handled
 * }
 *
 * @param facet The facet to resolve the type of.
 * @returns A tuple containing the type of the facet and the facet itself with types properly resolved/narrowed.
 */
export function resolveFacetType(facet: Hydrated<Facet>): FacetTypeResolution<true>;
/** Narrows an unresolved facet to the concrete tuple type keyed by its `type` field. */
export function resolveFacetType(facet: Facet): FacetTypeResolution<false>;
/** Narrows a facet to the concrete tuple type keyed by its `type` field. */
export function resolveFacetType(facet: Facet): FacetTypeResolution<boolean> {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  return [facet.type, facet as any];
}

type FacetTypeResolution<Hydrate extends boolean> =
  | [FacetType.Project, Hydrate extends true ? Hydrated<ProjectFacet> : ProjectFacet]
  | [FacetType.Initiative, Hydrate extends true ? Hydrated<InitiativeFacet> : InitiativeFacet]
  | [FacetType.TeamPage, Hydrate extends true ? Hydrated<TeamPageFacet> : TeamPageFacet]
  | [FacetType.WorkspacePage, Hydrate extends true ? Hydrated<WorkspacePageFacet> : WorkspacePageFacet]
  | [FacetType.Feed, Hydrate extends true ? Hydrated<FeedPageFacet> : FeedPageFacet]
  // This is a special case for facets that the client doesn't know about. Should just be ignored by the client.
  | [FacetType.Unknown, unknown];

// -- The final types for each facet type --
type ProjectFacet = FacetTypeFromProperties<Extract<ProjectFacetProperties, keyof Facet>>;
type InitiativeFacet = FacetTypeFromProperties<Extract<InitiativeFacetProperties, keyof Facet>>;
type TeamPageFacet = FacetTypeFromProperties<Extract<TeamPageFacetProperties, keyof Facet>>;
type WorkspacePageFacet = FacetTypeFromProperties<Extract<WorkspacePageFacetProperties, keyof Facet>>;
type FeedPageFacet = FacetTypeFromProperties<Extract<FeedPageFacetProperties, keyof Facet>>;

/**
 * This removes the properties that are not available for the given facet type and removes the optionality of the
 * properties that are available specifically for this type of facet.
 */
type FacetTypeFromProperties<Props extends keyof Facet> = Facet &
  RemoveOptionality<
    Omit<Facet, Exclude<FacetTypeDependentProperties, Props>>,
    // @ts-expect-error Can't make TS happy here, but the resulting types are correct
    Props
  >;

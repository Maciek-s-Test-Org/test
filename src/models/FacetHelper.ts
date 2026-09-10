import { runInAction } from "mobx";
import { notReachable } from "@linear/common/errors/UnreachableCaseError";
import { CustomViewTrait } from "@linear/common/models/CustomViewTrait";
import { FacetPageSource, FacetType } from "@linear/common/types/Facet";
import { getTrait, setTrait } from "@linear/common/utils/traits";
import type { Hydrated } from "#models/base/ModelTypes";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import type { CustomView } from "#models/CustomView";
import { Facet, resolveFacetType } from "#models/Facet";
import { CustomViewsViewType } from "#models/helpers/CustomViewsViewType";
import type { Organization } from "#models/Organization";
import type { Team } from "#models/Team";
import type { User } from "#models/User";

/**
 * Helper class for facets.
 */
export class FacetHelper {
  /**
   * Returns a label for the facet.
   *
   * @param facet the facet to get a label for.
   * @returns a label for the facet.
   */
  public static labelForFacet(facet: Hydrated<Facet>): string {
    return facet.targetCustomView?.value?.name ?? "";
  }

  /**
   * Returns the facet collection that backs a custom views page.
   *
   * @param owner The team or workspace that owns the page.
   * @param viewType The type of custom views shown on the page.
   * @returns The matching facet collection, if the owner has that page.
   */
  public static facetsForCustomViewsPage(
    owner: Team | Organization,
    viewType: CustomViewsViewType.issues | CustomViewsViewType.projects | CustomViewsViewType.initiatives
  ): ReadonlyCollection<Facet> | undefined {
    if (viewType === CustomViewsViewType.projects) {
      return owner.projectsPageFacets;
    }
    if (viewType === CustomViewsViewType.initiatives) {
      return owner.initiativesPageFacets;
    }
    if (viewType === CustomViewsViewType.issues && "issuesPageFacets" in owner) {
      return owner.issuesPageFacets;
    }
    return undefined;
  }

  /**
   * Returns whether a facet pins its target to a team or workspace page tab bar.
   *
   * @param facet The facet to inspect.
   * @returns Whether the facet is a page pin.
   */
  public static isPagePin(facet: Facet): boolean {
    const [type] = resolveFacetType(facet);
    return type === FacetType.TeamPage || type === FacetType.WorkspacePage;
  }

  /**
   * Returns whether a custom view already has an attached facet.
   *
   * Reading the relation starts hydration while the trait preserves the attached state until that hydration completes.
   *
   * @param customView The view to inspect.
   * @returns Whether the view has an attached facet.
   */
  public static hasAttachedFacet(customView: CustomView): boolean {
    return customView.facet.value !== undefined || getTrait(customView.traits, CustomViewTrait.hasFacet);
  }

  /**
   * Returns the page tab bar to which a custom view can be pinned.
   *
   * @param customView The view to inspect.
   * @param organization The view's workspace.
   * @returns The matching page pin target, if the view can be pinned.
   */
  public static pinTargetForView(customView: CustomView, organization: Organization): CustomViewPinTarget | undefined {
    if (customView.project || customView.initiative) {
      return undefined;
    }

    const team = customView.team;
    switch (customView.modelType) {
      case "issue":
        return team ? { kind: "teamPage", team, sourcePage: FacetPageSource.teamIssues } : undefined;
      case "project":
        return team
          ? { kind: "teamPage", team, sourcePage: FacetPageSource.projects }
          : { kind: "workspacePage", sourcePage: FacetPageSource.projects };
      case "initiative":
        if (!organization.initiativeFacetsEnabled) {
          return undefined;
        }
        if (team) {
          return organization.isTeamInitiativesAccessible
            ? { kind: "teamPage", team, sourcePage: FacetPageSource.initiatives }
            : undefined;
        }
        return { kind: "workspacePage", sourcePage: FacetPageSource.initiatives };
      case "feedItem":
        return undefined;
      default:
        throw notReachable(customView.modelType);
    }
  }

  /**
   * Pins a custom view to its page and applies all optimistic model state together.
   *
   * @param customView The view to pin.
   * @param creator The user creating the pin.
   * @param options.sortOrder Where the pin lands in the page order. Defaults to the end of the page.
   * @returns The created facet, if the view can be pinned.
   */
  public static pinCustomViewToPage(
    customView: CustomView,
    creator: User,
    options?: { sortOrder?: number }
  ): Hydrated<Facet> | undefined {
    const target = FacetHelper.pinTargetForView(customView, creator.organization);
    if (!target || FacetHelper.hasAttachedFacet(customView)) {
      return undefined;
    }

    const facet =
      target.kind === "teamPage"
        ? Facet.createTeamPageFacet({ customView, sourcePage: target.sourcePage, team: target.team, creator })
        : Facet.createWorkspacePageFacet({ customView, sourcePage: target.sourcePage, creator });
    if (options?.sortOrder !== undefined) {
      facet.sortOrder = options.sortOrder;
    }
    const shouldShare = !customView.shared;

    runInAction(() => {
      customView.shared = true;
      customView.traits = setTrait(customView.traits, CustomViewTrait.hasFacet, true);
    });
    if (shouldShare) {
      customView.save();
    }
    const transaction = facet.save(true);
    void transaction.result().catch(() => {
      runInAction(() => {
        if (shouldShare) {
          customView.shared = false;
        }
        customView.traits = setTrait(customView.traits, CustomViewTrait.hasFacet, false);
      });
      if (shouldShare) {
        customView.save();
      }
    });

    return facet;
  }

  /**
   * Deletes a page pin and applies its optimistic view state together.
   *
   * @param facet The page pin to delete.
   */
  public static unpinCustomViewFromPage(facet: Hydrated<Facet>): void {
    const customView = facet.targetCustomView?.value;
    if (!customView || !FacetHelper.isPagePin(facet)) {
      return;
    }

    runInAction(() => {
      customView.traits = setTrait(customView.traits, CustomViewTrait.hasFacet, false);
    });
    const transaction = facet.delete();
    void transaction.result().catch(() => {
      runInAction(() => {
        customView.traits = setTrait(customView.traits, CustomViewTrait.hasFacet, true);
      });
    });
  }
}

type CustomViewPinTarget =
  | {
      /** The pin belongs to a team page. */
      kind: "teamPage";
      /** The team whose page hosts the pin. */
      team: Team;
      /** The page that hosts the pin. */
      sourcePage: FacetPageSource;
    }
  | {
      /** The pin belongs to a workspace page. */
      kind: "workspacePage";
      /** The page that hosts the pin. */
      sourcePage: FacetPageSource;
    };

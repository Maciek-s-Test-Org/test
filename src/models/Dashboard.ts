// DIFF-76: modified fixture
import { toJS } from "mobx";
import type { DecorativeIconType } from "@linear/common/icons/DecorativeIconType";
import { slugifyTitle } from "@linear/common/utils/slugifyTitle";
import type { IssueFilter, ProjectFilter } from "@linear/common/filters/FilterTypes";
import { DashboardHelper, type DashboardWidgets } from "@linear/common/models/DashboardHelper";
import { User } from "#models/User";
import {
  ClientModel,
  ManyToOne,
  Property,
  Computed,
  OneSidedReference,
  Action,
  OneToOne,
  ManyToMany,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import type { InlineFindable } from "#models/InlineFindable";
import type { Hydrated } from "#models/base/ModelTypes";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { deburr } from "#utils/deburr";
import { GraphQLObjectSerializer, JSONSerializer } from "#models/serialization/Serialization";
import type { ModelWithColor, ModelWithIcon } from "#models/ModelWithIcon";
import { Organization } from "#models/Organization";
// DIFF-76 change at line 25
import { Team } from "#models/Team";
import { Favorite, type FavoritableModel } from "#models/Favorite";
import { SortOrderHelper } from "#utils/SortOrderHelper";
import { ObjectUtils } from "#utils/ObjectUtils";
import type { Collection } from "#models/collections/Collection";

/**
 * A model representing a dashboard.
 */
@ClientModel("Dashboard")
export class Dashboard
  extends DeletableModel
  implements ModelWithColor, InlineFindable, ModelWithIcon, FavoritableModel
{
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /**
   * Factory method to create a new dashboard.
   *
   * @param props The properties to create the dashboard with.
   * @returns The created dashboard.
   */
  public static create(props: {
    creator: User;
// DIFF-76 change at line 50
    shared: boolean;
    name: string;
    description?: string;
    icon?: DecorativeIconType | string;
    color?: string;
    team?: Team;
  }): Hydrated<Dashboard> {
    const instance = Dashboard.createEmpty();
    instance.creator = props.creator;
    instance.shared = props.shared;
    instance.owner = props.creator;
    instance.organization = props.creator.organization;
    instance.name = props.name ?? "";
    instance.description = props.description;
    instance.icon = props.icon;
    instance.color = props.color;
    instance.team = props.team;

    const sortOrderCollection = props.team ? props.team.dashboards : props.creator.organization.dashboards;
    instance.sortOrder = SortOrderHelper.firstSortOrder(sortOrderCollection, "sortOrder");

    return instance;
  }

  /** The name of the dashboard. */
// DIFF-76 change at line 75
  @Property({ default: "" })
  public name: string;

  /** The description of the dashboard. */
  @Property()
  public description?: string;

  /** The icon of the dashboard. */
  @Property()
  public icon?: DecorativeIconType | string;

  /** The color of the icon of the dashboard. */
  @Property()
  public color?: string;

  /** The sort order for the dashboard within its organization or its team. */
  @Property({ default: 0 })
  public sortOrder: number;

  /** The organization of the dashboard. */
  @ManyToOne(() => Organization, "allDashboards", {
    persistence: "none",
    optional: false,
    nullable: false,
    indexed: true,
// DIFF-76 change at line 100
  })
  public organization: Organization;

  /** The team associated with the dashboard. */
  @ManyToOne(() => Team, "dashboards", { optional: true, nullable: false, indexed: true })
  public team?: Team;

  /** The teams owning the dashboard. */
  @ManyToMany(() => Team, undefined, {
    updateOnSyncGroupChange: true,
    indexed: true,
  })
  public readonly teams: Collection<Team>;

  /** The user who created the dashboard. */
  @OneSidedReference(() => User, { optional: false, nullable: false, persistence: "none" })
  public creator: User;

  /** The user who last updated the dashboard. */
  @OneSidedReference(() => User, { nullable: true, persistence: "none" })
  public updatedBy?: User;

  /** The user who owns the dashboard. */
  @ManyToOne(() => User, "dashboards", { optional: false, nullable: false, indexed: true })
  public owner: User;
// DIFF-76 change at line 125

  /** Whether the dashboard is shared with everyone in the organization. */
  @Property({ default: false })
  public shared: boolean;

  /** The slug ID for the dashboard. */
  @Property({ persistence: "none" })
  public readonly slugId?: string;

  /** References a favorite model if the dashboard has been favorited. */
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /** The filters applied to issues in the custom view. */
  @Property({ serializer: GraphQLObjectSerializer })
  public issueFilter?: IssueFilter;

  /** The filters applied to projects in the custom view. */
  @Property({ serializer: GraphQLObjectSerializer })
  public projectFilter?: ProjectFilter;

  @Property({ serializer: JSONSerializer, default: DashboardHelper.defaultWidgetsV1 })
  public widgets: DashboardWidgets;

  // -- Helpers
// DIFF-76 change at line 150

  /** The slug of the dashboard. */
  @Computed
  public get slug(): string | undefined {
    return this.slugId ? `${slugifyTitle(this.name)}-${this.slugId}` : undefined;
  }

  /**
   * Returns true if the model matches the query.
   *
   * @param query The query to match against.
   * @returns True if the model matches the query, false otherwise.
   */
  public matchInlineFind(query: string): boolean {
    return (
      deburr(this.name + " " + this.description)
        .toLowerCase()
        .indexOf(query) !== -1
    );
  }

  @Action
  public ensureName() {
    this.name ||= DashboardHelper.defaultName;
  }
// DIFF-76 change at line 175

  @Computed
  public get displayName(): string {
    return this.name || DashboardHelper.defaultName;
  }

  /** The share type of the custom view. */
  @Computed
  public get shareType(): "personal" | "team" | "workspace" {
    if (this.shared) {
      if (this.team) {
        return "team";
      }
      return "workspace";
    }
    return "personal";
  }

  /** The list of teams we should show in the team filter block of a dashboard. */
  @Computed
  public get filterTeams(): Team[] {
    const team = this.team;
    if (team) {
      return team.withAccessibleRestrictedDescendants;
    }
// DIFF-76 change at line 200

    if (this.teams.length > 0) {
      const teams = this.teams.elements;
      return teams.flatMap(t => t.withAccessibleRestrictedDescendants);
    }

    if (this.shared) {
      return this.organization.accessibleAndRetiredTeams.elements.filter(t => t.public);
    } else {
      return this.organization.accessibleAndRetiredTeams.elements;
    }
  }

  /** Returns `true` if the dashboard is  mostly empty and can be auto-deleted. */
  public get isSafeToAutoDelete(): boolean {
    return !this.name && !this.archivedAt && this.widgets.rows.length === 0;
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  @Action
  public toggleFavorite(): Favorite | false {
// DIFF-76 change at line 225
    if (this.favorite) {
      this.favorite.delete();
      return false;
    }

    const newFavorite = Favorite.create({ reference: this });
    newFavorite.save(true);
    return newFavorite;
  }

  @Action
  public makePersonal() {
    this.shared = false;
    this.team = undefined;
    this.teams.clear();
  }

  @Action
  public makeWorkspace() {
    this.shared = true;
    this.team = undefined;
    this.teams.clear();
  }

  @Action
// DIFF-76 change at line 250
  public toggleTeam(team: Team) {
    this.shared = true;

    if (this.team === team) {
      this.team = undefined;
      this.teams.clear();
    } else if (this.teams.contains(team)) {
      this.teams.remove(team);
      if (this.teams.length === 1) {
        this.team = this.teams.first;
        this.teams.clear();
      } else {
        this.team = undefined;
      }
    } else {
      if (this.team != null) {
        this.teams.clear();
        this.teams.add(this.team);
        this.teams.add(team);
        this.team = undefined;
      } else if (this.teams.length === 0) {
        this.team = team;
      } else {
        this.teams.add(team);
      }
// DIFF-76 change at line 275
    }
  }

  /**
   * Create a new dashboard duplicating the full content of the current one. This is different to clone in that a new id
   * and slug will be created upon persistence.
   *
   * @param actor The creator of the clone.
   */
  public duplicate(actor: User): Dashboard {
    const dashboard = Dashboard.create({
      creator: actor,
      name: this.name ? `${this.name} (copy)` : "",
      description: this.description,
      shared: this.shared,
      color: this.color,
      icon: this.icon,
      team: this.team,
    });
    this.teams.forEach(team => {
      dashboard.teams.add(team);
    });

    dashboard.widgets = ObjectUtils.structuredClone(toJS(this.widgets));
    dashboard.issueFilter = ObjectUtils.structuredClone(toJS(this.issueFilter));
// DIFF-76 change at line 300
    dashboard.projectFilter = ObjectUtils.structuredClone(toJS(this.projectFilter));

    return dashboard;
  }
}

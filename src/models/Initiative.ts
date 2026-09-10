// DIFF-76: modified fixture
import { runInAction } from "mobx";
import { ViewPreferencesType } from "@linear/common/models/ViewPreferencesType";
import { ViewType } from "@linear/common/views/ViewType";
import { slugifyTitle } from "@linear/common/utils/slugifyTitle";
import type { TimelessDate } from "@linear/common/types/TimelessDate";
import { InitiativeStatus, isDoneInitiativeStatus } from "@linear/common/models/InitiativeStatus";
import { InitiativeVisibility } from "@linear/common/models/InitiativeVisibility";
import { EntityIdentifierFormat } from "@linear/common/models/EntityIdentifierFormat";
import { InitiativeHelper } from "@linear/common/models/InitiativeHelper";
import { InitiativePriority } from "@linear/common/models/InitiativePriority";
import type { DateResolutionType } from "@linear/common/models/DateResolutionType";
import type { DecorativeIconType } from "@linear/common/icons/DecorativeIconType";
import type { EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import {
  UpdateHealthType,
  UpdateAgedHealthType,
  type UpdateHealthTypeWithAge,
} from "@linear/common/models/UpdateHealthType";
import type { InitiativeTab } from "@linear/common/models/InitiativeTab";
import { notReachable } from "@linear/common/errors/UnreachableCaseError";
import { InitiativeTrait } from "@linear/common/models/InitiativeTrait";
import { getTrait } from "@linear/common/utils/traits";
import { Day } from "@linear/common/extensions/DateExtensions";
import { FrequencyResolutionType } from "@linear/common/models/ProjectUpdateReminderFrequency";
// DIFF-76 change at line 25
import { UpdateHealthHelper } from "@linear/common/models/helpers/UpdateHealthHelper";
import { ActivityHelper, type ActivityType } from "@linear/common/models/helpers/ActivityHelper";
import { ColorPickerColors } from "@linear/common/icons/ColorPickerColors";
import type { IntegrationService } from "@linear/common/models/Integration";
import type { IssuesProgressHistoryEntry } from "@linear/common/models/IssuesProgressHistoryEntry";
import { AiConversation } from "#models/AiConversation";
import { Comment } from "#models/Comment";
import { User } from "#models/User";
import { Organization } from "#models/Organization";
import { Project } from "#models/Project";
import { Favorite, type FavoritableModel } from "#models/Favorite";
import { Team } from "#models/Team";
import {
  ClientModel,
  ManyToOne,
  OneToMany,
  Property,
  Action,
  Computed,
  LazyOneToOne,
  LazyOneToMany,
  LazyManyToMany,
  OneToOne,
  LazyOneSidedReference,
} from "#models/base/Decorators";
// DIFF-76 change at line 50
import { TrashableModel } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { ViewPreferences } from "#models/ViewPreferences";
import { Collection } from "#models/collections/Collection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import { InitiativeCollectionOrder } from "#models/collections/InitiativeCollectionOrder";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import type { InlineFindable } from "#models/InlineFindable";
import { InitiativeLabel } from "#models/InitiativeLabel";
import { InitiativeToProject } from "#models/InitiativeToProject";
import { Meeting } from "#models/Meeting";
import { Document } from "#models/Document";
import { LazyReference, type LazyBackReference } from "#models/hydration/Lazy";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { Facet } from "#models/Facet";
import type { Hydrated } from "#models/base/ModelTypes";
import { SortOrderHelper } from "#utils/SortOrderHelper";
import { CustomView } from "#models/CustomView";
import type { NotificationSubscription } from "#models/NotificationSubscription";
import { deburr } from "#utils/deburr";
import { NotificationStateHelper } from "#models/helpers/NotificationStateHelper";
import { InitiativeRelationGraph } from "#models/helpers/InitiativeRelationGraph";
import { InitiativeUpdate } from "#models/InitiativeUpdate";
import { Draft } from "#models/Draft";
import type { ModelWithColor } from "./ModelWithIcon";
// DIFF-76 change at line 75
import type { SortableModel } from "./SortableModel";
import { DateTimeSerializer, TimelessDateSerializer } from "./serialization/Serialization";
import { InitiativePrioritySerializer } from "./serialization/PrioritySerializer";
import type { DocumentContent } from "./DocumentContent";
import { Template } from "./Template";
import { EntityExternalLink } from "./EntityExternalLink";
import { InitiativeNotification } from "./Notification";
import type { IntegrationsSettings } from "./IntegrationsSettings";
import { InitiativeHistory } from "./InitiativeHistory";
import { Reminder } from "./Reminder";
import { InitiativeRelation } from "./InitiativeRelation";
import { ResourceFolder } from "./ResourceFolder";
import { CombinedCollection } from "./collections/CombinedCollection";

/** Props for creating initiatives. */
type CreateInitiativeProps = {
  /** Name of the initiative. */
  name?: string;
  /** Description of the initiative. */
  description?: string;
  /** Status of the initiative. */
  status?: InitiativeStatus;
  /** Creator of the initiative. */
  creator: User;
  /** Optional view preferences. */
// DIFF-76 change at line 100
  viewPreferences?: ViewPreferences;
  /** Color for the initiative icon. */
  color?: string;
};

/**
 * A model representing an initiative.
 */
@ClientModel("Initiative")
export class Initiative
  extends TrashableModel
  implements InlineFindable, FavoritableModel, ModelWithColor, SortableModel
{
  public static override readonly loadStrategy = ModelLoadStrategy.lazy;

  /** The name of the initiative. */
  @Property({ default: "" })
  public name: string;

  /** The description of the initiative. */
  @Property()
  public description?: string;

  /** The slug ID for the initiative. */
  @Property({ persistence: "none", default: "" })
// DIFF-76 change at line 125
  public readonly slugId: string;

  /** Monotonic workspace-scoped sequence number used to build the default identifier `<prefix>-<number>`. */
  @Property({ persistence: "none", indexed: true })
  public number?: number;

  /** Optional override of the default `<prefix>-<number>` identifier. Set via a dedicated mutation, not create/update. */
  @Property({ persistence: "none" })
  public customIdentifier?: string;

  /** Identifier strings (`<prefix>-<number>` and prior `customIdentifier` values) this initiative has previously held. */
  @Property({ persistence: "none", indexed: true, multiEntry: true, default: [] })
  public previousIdentifiers: string[];

  /**
   * The user-friendly identifier of the initiative. Returns the `customIdentifier` override when set, otherwise the
   * default `<prefix>-<number>` built from the workspace prefix and sequence number. Null until those are available.
   */
  @Computed
  public get identifier(): string | null {
    if (this.customIdentifier) {
      return this.customIdentifier;
    }
    if (!this.organization.initiativeIdPrefix || this.number == null) {
      return null;
// DIFF-76 change at line 150
    }
    return EntityIdentifierFormat.formatIdentifier(this.organization.initiativeIdPrefix, this.number);
  }

  /** The sort order for the initiative within its organization. */
  @Property({ default: 0 })
  public sortOrder: number;

  /** The sort order for the initiative within its organization, when ordered by priority. */
  @Property({ default: 0 })
  public prioritySortOrder: number;

  /** The priority of the initiative. */
  @Property({ serializer: InitiativePrioritySerializer, default: () => InitiativePriority.createFromPriority(0) })
  public priority: InitiativePriority;

  /** The color of the initiative. */
  @Property({ default: "#bec2c8" })
  public color: string;

  /** The icon of the initiative. */
  @Property()
  public icon?: DecorativeIconType | string;

  /** Whether the initiative was trashed. */
// DIFF-76 change at line 175
  @Property({ persistence: "updateOnly" })
  public trashed?: boolean | null;

  /** Initiative source metadata. What created the initiative. */
  @Property({ persistence: "none" })
  public readonly sourceMetadata?: EntitySourceMetadata;

  /** The organization of the initiative. */
  @ManyToOne(() => Organization, "initiatives", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public organization: Organization;

  /** The user who created the initiative. */
  @ManyToOne(() => User, "initiatives", { optional: false, nullable: false, indexed: true, persistence: "none" })
  public creator: User;

  /** Returns a collection of all direct parent initiatives. */
  @Computed
  public get parents(): ReadonlyCollection<Initiative> {
    if (!this.organization.subInitiativesAvailable) {
      return Collection.of(Initiative, []);
// DIFF-76 change at line 200
    }
    return Collection.of(Initiative, InitiativeRelationGraph.directParents(this));
  }

  /** Child initiatives of this initiative. */
  @Computed
  public get children(): Collection<Initiative> {
    if (!this.organization.subInitiativesAvailable) {
      return new Collection(Initiative, []);
    }
    return new Collection(Initiative, InitiativeRelationGraph.directChildren(this));
  }

  /** All active descendants, bridging unresolved intermediate initiative IDs. */
  @Computed({ keepAlive: true })
  public get descendants(): ReadonlyCollection<Initiative> {
    return new Collection(Initiative, InitiativeRelationGraph.descendants(this), {
      order: InitiativeCollectionOrder,
    });
  }

  /** The user who owns the initiative. */
  @ManyToOne(() => User, "initiatives", { nullable: true, persistence: "createAndUpdate" })
  public owner?: User;

// DIFF-76 change at line 225
  /** The team that leads the initiative, if any. */
  @ManyToOne(() => Team, "ledInitiatives", { optional: true, nullable: false, indexed: true })
  public leadTeam?: Team;

  /** Whether this initiative is private. */
  @Computed
  public get private(): boolean {
    return this.visibility === InitiativeVisibility.private;
  }

  /** Whether this initiative is public. */
  @Computed
  public get public(): boolean {
    return this.visibility === InitiativeVisibility.public;
  }

  /** The visibility of this initiative, derived from its lead team. */
  @Computed
  public get visibility(): InitiativeVisibility {
    return InitiativeHelper.visibilityFromLeadTeam(this.leadTeam?.visibility);
  }

  /** Custom views associated with the initiative. */
  @LazyOneToMany(() => CustomView, {
    index: "initiativeId",
// DIFF-76 change at line 250
    order: new CollectionOrder("name"),
  })
  public readonly customViews: LazyCollection<CustomView>;

  /** Meetings attached to this initiative, newest first. */
  @LazyOneToMany(() => Meeting, {
    index: "initiativeId",
    order: new CollectionOrder<Meeting>("createdAt", "desc").andLexicographically("id"),
  })
  public readonly meetings: LazyCollection<Meeting>;

  /** Updates associated with the initiative. */
  @LazyOneToMany(() => InitiativeUpdate, {
    index: "initiativeId",
    order: new CollectionOrder("createdAt", "desc"),
  })
  public readonly initiativeUpdates: LazyCollection<InitiativeUpdate>;

  /** References to the last posted update. */
  @LazyOneSidedReference(() => InitiativeUpdate, {
    nullable: true,
    indexed: true,
    onDelete: "SET NULL",
    persistence: "none",
  })
// DIFF-76 change at line 275
  public lastUpdate?: LazyReference<InitiativeUpdate>;

  /** The settings for all integrations associated with this initiative. */
  @LazyOneToOne({ nullable: true })
  public integrationsSettings: LazyBackReference<IntegrationsSettings | undefined>;

  /** Draft (un-submitted) updates or comments associated with the initiative. */
  @OneToMany(() => Draft, { order: new CollectionOrder("createdAt", "desc") })
  public readonly draftInitiativeUpdatesOrComments: Collection<Draft>;

  /** The history of the initiative. */
  @LazyOneToMany(() => InitiativeHistory, { index: "initiativeId" })
  public readonly history: LazyCollection<InitiativeHistory>;

  /** Relations associated with the initiative. */
  @OneToMany(() => InitiativeRelation, {
    order: new CollectionOrder<InitiativeRelation>("sortOrder"),
  })
  public readonly childRelations: Collection<InitiativeRelation>;

  /** Inverse relations associated with the initiative. */
  @OneToMany(() => InitiativeRelation, {
    order: new CollectionOrder<InitiativeRelation>("sortOrder"),
  })
  public readonly parentRelations: Collection<InitiativeRelation>;
// DIFF-76 change at line 300

  /** Reminders associated with the initiative. */
  @LazyOneToMany(() => Reminder, {
    index: "initiativeId",
    order: new CollectionOrder("createdAt", "desc"),
  })
  public readonly reminders: LazyCollection<Reminder>;

  /** Resource folders owned by the initiative. */
  @LazyOneToMany(() => ResourceFolder, {
    index: "sourceInitiativeId",
    order: new CollectionOrder("sortOrder"),
    // Skip hydration as we are not using the resource folders yet. Once we do, we should add a
    // trait or only hydrate if having documents or links.
    canSkipHydration: () => true,
  })
  public readonly resourceFolders: LazyCollection<ResourceFolder>;

  /**
   * Document content holding the description of the issue.
   */
  @LazyOneToOne({ nullable: true })
  public documentContent: LazyBackReference<DocumentContent | undefined>;

  /** AI conversations attached to this initiative: the surface conversation and any sub-agents spawned from it. */
// DIFF-76 change at line 325
  @LazyOneToMany(() => AiConversation, {
    index: "initiativeId",
    order: new CollectionOrder<AiConversation>("createdAt").andLexicographically("id"),
  })
  public readonly aiConversations: LazyCollection<AiConversation>;

  /** Root AI conversations attached to this initiative, oldest first, excluding headless sub-agent conversations. */
  @Computed
  public get rootAiConversations(): AiConversation[] {
    return this.aiConversations.existingElements.filter(conversation => !conversation.parent);
  }

  /** The oldest root AI conversation attached to this initiative, excluding headless sub-agent conversations. */
  @Computed
  public get rootAiConversation(): AiConversation | undefined {
    return this.rootAiConversations[0];
  }

  /** The planned target date of the initiative. */
  @Property({ serializer: TimelessDateSerializer })
  public targetDate?: TimelessDate;

  /** The resolution of the initiative's planned target date.*/
  @Property()
  public targetDateResolution?: DateResolutionType;
// DIFF-76 change at line 350

  /** When the model was moved to started state. If undefined, the model has not been started. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public startedAt?: Date;

  /** When the model was moved to completed state. If undefined, the model has not been completed. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public completedAt?: Date;

  /** When the model was moved to canceled state. If undefined, the model has not been canceled. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public canceledAt?: Date;

  /** The status of the initiative. */
  @Property({ default: InitiativeStatus.Active })
  public status: InitiativeStatus;

  /** Each bit in this number represents a different trait. */
  @Property({ persistence: "none" })
  public traits?: number;

  /** The related favorites. */
  @OneToMany(() => Favorite)
  public readonly favorites: Collection<Favorite>;

// DIFF-76 change at line 375
  /** Documents associated with the initiative. */
  @LazyOneToMany(() => Document, {
    index: "initiativeId",
    order: new CollectionOrder("createdAt", "desc"),
    skipHydrationTraitBit: InitiativeTrait.hasDocuments,
  })
  public readonly documents: LazyCollection<Document>;

  /** External links associated with the initiative. */
  @LazyOneToMany(() => EntityExternalLink, {
    index: "initiativeId",
    order: new CollectionOrder("createdAt", "desc"),
  })
  public readonly links: LazyCollection<EntityExternalLink>;

  /** References a notification subscription linked to a user. */
  @OneToOne({ nullable: true })
  public readonly subscription?: NotificationSubscription;

  /** Facets owned by the initiative. */
  @LazyOneToMany(() => Facet, { index: "sourceInitiativeId", order: new CollectionOrder("sortOrder") })
  public readonly facets: LazyCollection<Facet>;

  /** Labels associated with this initiative. */
  @LazyManyToMany(() => InitiativeLabel, "initiatives", {
// DIFF-76 change at line 400
    indexed: true,
    order: new CollectionOrder(label => `${label.parent ? `0${label.parent.value?.name ?? ""}` : 1}${label.name}`),
  })
  public readonly labels: LazyCollection<InitiativeLabel>;

  /** The health of the last initiative update. */
  @Property({ persistence: "none" })
  public health?: UpdateHealthType;

  /** The time of the last update health update. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public readonly healthUpdatedAt?: Date;

  /** The frequency at which updates are sent. If 0, update reminders are off. If undefined, org level config. */
  @Property({ persistence: "updateOnly" })
  public updateReminderFrequency?: number;

  /** The update reminder frequency resolution. */
  @Property({ persistence: "updateOnly" })
  public frequencyResolution?: FrequencyResolutionType;

  /** The day at which updates are sent. */
  @Property({ enum: Day, persistence: "updateOnly" })
  public updateRemindersDay?: Day;

// DIFF-76 change at line 425
  /** The hour at which updates are sent. */
  @Property({ persistence: "updateOnly" })
  public updateRemindersHour?: number;

  /** The org-level default reminder frequency. */
  public get orgReminderFrequency(): number | undefined {
    return this.organization.initiativeUpdateReminderFrequencyInWeeks;
  }

  /** The effective frequency of reminders for initiative updates, with fallback to org level config. */
  public get effectiveUpdateReminderFrequency(): number {
    return this.updateReminderFrequency ?? this.organization.initiativeUpdateReminderFrequencyInWeeks ?? 0;
  }

  /** The effective hour at which updates are sent, with fallback to org level config. */
  public get effectiveUpdateReminderHour(): number {
    if (this.updateReminderFrequency != null && this.updateRemindersHour != null) {
      return this.updateRemindersHour;
    }
    return this.organization.initiativeUpdateRemindersHour;
  }

  /** The effective day at which updates are sent, with fallback to org level config. */
  public get effectiveUpdateReminderDay(): Day {
    if (this.updateReminderFrequency != null && this.updateRemindersDay != null) {
// DIFF-76 change at line 450
      return this.updateRemindersDay;
    }
    return this.organization.initiativeUpdateRemindersDay;
  }

  /** The effective frequency resolution. If frequency defaults to org config, it is always weekly. */
  public get effectiveUpdateReminderFrequencyResolution(): FrequencyResolutionType {
    if (this.updateReminderFrequency != null) {
      return this.frequencyResolution!;
    } else {
      return FrequencyResolutionType.weekly;
    }
  }

  /** The slug of the initiative. */
  public get slug(): string {
    return `${slugifyTitle(this.name)}-${this.slugId}`;
  }

  /** The age of the last initiative health update. */
  public get healthAgeInDays(): number | undefined {
    return UpdateHealthHelper.getHealthAgeInDays(this);
  }

  /** The aged health of the initiative. */
// DIFF-76 change at line 475
  public get healthWithAge(): UpdateHealthTypeWithAge {
    return UpdateHealthHelper.getHealthWithAge(this);
  }

  /** If the initiative update health is stale (four reminders missed). */
  public get healthIsStale(): boolean {
    return UpdateHealthHelper.healthIsOutdated(this);
  }

  /** If the project update health is slightly stale (two reminders missed). */
  public get healthIsSlightlyOutdated(): boolean {
    return UpdateHealthHelper.healthIsSlightlyOutdated(this);
  }

  /** Whether the initiative is active. */
  public get isActive(): boolean {
    return this.status === InitiativeStatus.Active;
  }

  /**
   * Returns `true` if the user is expected to write an update for the initiative.
   */
  public isUserExpectedToWriteUpdate(user: User): boolean {
    return this.isActive && user.memberOf(this);
  }
// DIFF-76 change at line 500

  /** Connections to projects in this initiative. */
  @LazyOneToMany(() => InitiativeToProject, {
    index: "initiativeId",
    order: new CollectionOrder("sortOrder"),
  })
  public readonly initiativeToProjects: LazyCollection<InitiativeToProject>;

  /** View preferences associated with the initiative. */
  @LazyOneToMany(() => ViewPreferences, {
    index: "initiativeId",
    canSkipHydration: self => self.organization.viewPreferences.isHydrated(),
  })
  public readonly viewPreferences: LazyCollection<ViewPreferences>;

  /** View preferences for the initiative. */
  public getViewPreferences(
    this: Hydrated<Initiative>,
    viewType: ViewType.initiative | ViewType.initiativeOverview | ViewType.initiativeOverviewSubInitiatives
  ) {
    if (viewType === ViewType.initiativeOverview) {
      return this._projectsViewPreferencesOverview;
    } else if (viewType === ViewType.initiativeOverviewSubInitiatives) {
      return this._subInitiativesViewPreferences;
    } else {
// DIFF-76 change at line 525
      return this._projectsViewPreferences;
    }
  }

  /** Keep it private and expose it through a function to be able to type `this` as Hydrated. */
  @Computed
  private get _projectsViewPreferences(): ViewPreferences {
    return ViewPreferences.getOrCreateFrom(this.viewPreferences, ViewType.initiative, { initiative: this });
  }

  /** Keep it private and expose it through a function to be able to type `this` as Hydrated. */
  @Computed
  private get _projectsViewPreferencesOverview(): ViewPreferences {
    return ViewPreferences.getOrCreateFrom(this.viewPreferences, ViewType.initiativeOverview, { initiative: this });
  }

  /** Keep it private and expose it through a function to be able to type `this` as Hydrated. */
  @Computed
  private get _subInitiativesViewPreferences(): ViewPreferences {
    return ViewPreferences.getOrCreateFrom(this.viewPreferences, ViewType.initiativeOverviewSubInitiatives, {
      initiative: this,
    });
  }

  /** All progress history entries across all projects in the initiative. */
// DIFF-76 change at line 550
  @Computed
  public get progressHistoryEntries(): IssuesProgressHistoryEntry[] {
    return this.projectsInherited.flatMap(project => project.progressHistoryEntries);
  }

  /** First reminder from the collection. */
  @Computed
  public get reminder(): Reminder | undefined {
    return this.reminders.elements[0];
  }

  // -- Helpers

  /** View preferences for the initiative. */
  @Computed
  public get organizationViewPreferences(): ViewPreferences {
    const existingPreferences = this.organization.viewPreferences.find(
      pref => pref.initiative?.id === this.id && pref.type === ViewPreferencesType.organization
    );

    if (existingPreferences) {
      return existingPreferences;
    } else if (this.temporaryViewPreferences) {
      return this.temporaryViewPreferences;
    }
// DIFF-76 change at line 575
    return runInAction(() => {
      const preferences = new ViewPreferences();
      preferences.initiative = LazyReference.wrap(this);
      preferences.organization = this.organization;
      preferences.viewType = ViewType.initiative;
      preferences.type = ViewPreferencesType.organization;
      this.temporaryViewPreferences = preferences;
      return preferences;
    });
  }

  /** Returns all the projects in the initiative. */
  @Computed
  public get projects(): ReadonlyCollection<Project> {
    return Collection.of(
      Project,
      this.initiativeToProjects.map(join => join.project.value).filter((p): p is Project => p !== undefined)
    );
  }

  /** All projects associated with the initiative, including those inherited from sub-initiatives. */
  @Computed
  public get projectsInherited(): ReadonlyCollection<Project> {
    if (this.organization.subInitiativesAvailable) {
      return new CombinedCollection(Project, [this.projects, ...this.descendants.map(t => t.projects)], {
// DIFF-76 change at line 600
        dedupe: true,
      });
    } else {
      return this.projects;
    }
  }

  /** Only inherited projects from sub-initiatives. */
  @Computed
  public get projectsInheritedOnly(): ReadonlyCollection<Project> {
    if (this.organization.subInitiativesAvailable) {
      const inheritedProjects = new CombinedCollection(
        Project,
        this.descendants.map(t => t.projects),
        {
          dedupe: true,
        }
      );
      const directProjects = this.projects.elements;
      if (directProjects.length === 0) {
        return inheritedProjects;
      }
      const directProjectIds = new Set(directProjects.map(project => project.id));
      return inheritedProjects.filterNot(project => directProjectIds.has(project.id));
    }
// DIFF-76 change at line 625
    return Collection.of(Project, []);
  }

  /** Returns all the projects in the initiative, grouped by health. */
  @Computed
  public get projectsGroupedByHealth(): Record<UpdateHealthTypeWithAge, Project[]> {
    const retVal: Record<UpdateHealthTypeWithAge, Project[]> = {
      [UpdateHealthType.onTrack]: [],
      [UpdateHealthType.offTrack]: [],
      [UpdateHealthType.atRisk]: [],
      [UpdateAgedHealthType.outdated]: [],
      [UpdateAgedHealthType.noUpdate]: [],
    };

    for (const project of this.projectsInherited.elements) {
      const healthWithAge = UpdateHealthHelper.getHealthWithAge({
        health: project.health,
        healthAgeInDays: project.healthAgeInDays,
        isActive: project.isActive,
        isDone: project.isDone,
        updateReminderFrequency: project.updateReminderFrequency,
        frequencyResolution: project.frequencyResolution,
        orgReminderFrequency: this.organization.projectUpdateReminderFrequencyInWeeks,
      });
      retVal[healthWithAge].push(project);
// DIFF-76 change at line 650
    }
    return retVal;
  }

  /** Comments directly associated with the initiative. */
  @LazyOneToMany(() => Comment, { index: "initiativeId" })
  public readonly comments: LazyCollection<Comment>;

  /** The notifications for this initiative. */
  @OneToMany(() => InitiativeNotification)
  public readonly notifications: Collection<InitiativeNotification>;

  /**
   * Returns the "velocity" of the initiative.
   */
  @Computed
  public get velocity(): number {
    return this.projectsInherited
      .filter(p => p.activity > (p.isActive ? 0 : 3))
      .reduce((acc, p) => acc + p.currentVelocity, 0);
  }

  /**
   * Returns the "activity" of the initiative.
   */
// DIFF-76 change at line 675
  @Computed
  public get activity(): number {
    const velocity = this.velocity;
    const deciles = this.organization.initiativeVelocityDeciles;
    if (deciles.length <= 8) {
      return 0;
    }
    for (let i = 0; i < deciles.length; i++) {
      if (velocity <= deciles[i]) {
        return i;
      }
    }
    return 9;
  }

  /**
   * The "activity type" of the project. Based on the activity number, this shows how active a project is compared to others in the organization.
   * */
  @Computed
  public get activityType(): ActivityType {
    return ActivityHelper.getActivityType(this.activity);
  }

  /**
   * Returns all accessible teams. The own lead team and its accessible parents come first, followed by exact lead
// DIFF-76 change at line 700
   * teams inherited from the initiative hierarchy and then direct or inherited project teams.
   */
  @Computed
  public get accessibleTeams(): ReadonlyCollection<Team> {
    const teamCounts = new Map<string, { team: Team; count: number }>();
    const user = Organization.store.user;

    for (const project of this.projectsInherited) {
      for (const team of project.administrableTeams.elements) {
        const existing = teamCounts.get(team.id);
        if (existing) {
          existing.count++;
        } else {
          teamCounts.set(team.id, { team, count: 1 });
        }
      }
    }

    const involvedLeadTeams: Team[] = [];
    const involvedLeadTeamIds = new Set<string>();
    const isTeamInitiativesAccessible = this.organization.isTeamInitiativesAccessible;
    const visibleAncestors = isTeamInitiativesAccessible
      ? InitiativeRelationGraph.completeAncestorPaths(this)
          .flat()
          .filter((element): element is Initiative => element instanceof Initiative)
// DIFF-76 change at line 725
      : [];
    let involvedTeam = this.leadTeam;
    while (involvedTeam && involvedTeam.userCanAccessTeam(user)) {
      involvedLeadTeams.push(involvedTeam);
      involvedLeadTeamIds.add(involvedTeam.id);
      teamCounts.delete(involvedTeam.id);
      involvedTeam = isTeamInitiativesAccessible ? involvedTeam.parent : undefined;
    }
    for (const initiative of visibleAncestors) {
      const leadTeam = initiative.leadTeam;
      if (leadTeam && !involvedLeadTeamIds.has(leadTeam.id) && leadTeam.userCanAccessTeam(user)) {
        involvedLeadTeams.push(leadTeam);
        involvedLeadTeamIds.add(leadTeam.id);
        teamCounts.delete(leadTeam.id);
      }
    }

    const projectTeams = Array.from(teamCounts.values())
      .sort((a, b) => b.count - a.count)
      .map(({ team }) => team)
      .filter(team => team.userCanAccessTeam(user));

    return Collection.of(Team, [...involvedLeadTeams, ...projectTeams]);
  }

// DIFF-76 change at line 750
  /**
   * Returns all the teams connected to the initiative.
   * @deprecated Use `accessibleTeams` instead.
   */
  @Computed
  public get teams(): ReadonlyCollection<Team> {
    return this.accessibleTeams;
  }

  /** All active ancestors, bridging unresolved intermediate initiative IDs. */
  @Computed({ keepAlive: true })
  public get ancestors(): ReadonlyCollection<Initiative> {
    return Collection.of(Initiative, InitiativeRelationGraph.ancestors(this));
  }

  /** Whether the initiative has sub-initiatives. */
  @Computed
  public get hasSubInitiatives(): boolean {
    return this.children.length > 0 || (this.childRelations.length > 0 && this.descendants.length > 0);
  }

  /** Whether the initiative is completed. */
  public get isDone(): boolean {
    return isDoneInitiativeStatus(this.status);
  }
// DIFF-76 change at line 775

  /** The date when this initiative was considered done. */
  public get doneAt(): Date | undefined {
    return this.status === InitiativeStatus.Completed ? this.completedAt : this.canceledAt;
  }

  /**
   * All document templates that the initiative can use. This collections contains workspace's templates.
   */
  @Computed
  public get allDocumentTemplates(): ReadonlyCollection<Template> {
    const collection = new Collection(Template, [], {
      order: new CollectionOrder<Template>(template => !template.isTeamTemplate).and(template =>
        template.name.toLowerCase()
      ),
    });
    return collection
      .concat(
        this.accessibleTeams.reduce((memo, team) => memo.concat(team.documentTemplates.elements), [] as Template[])
      )
      .concat(this.organization.documentTemplates.elements);
  }

  /** A number that can be used to sort initiative by status. */
  @Computed
// DIFF-76 change at line 800
  public get statusSortOrder(): number {
    switch (this.status) {
      case InitiativeStatus.Active:
        return 0;
      case InitiativeStatus.Planned:
        return 1;
      case InitiativeStatus.Proposed:
        return 2;
      case InitiativeStatus.Completed:
        return 3;
      case InitiativeStatus.Canceled:
        return 4;
      default:
        throw notReachable(this.status);
    }
  }

  /** Whether the initiative has any update drafts. */
  public get hasUpdateDrafts(): boolean {
    return this.draftInitiativeUpdatesOrComments.some(d => d.isInitiativeUpdateDraft);
  }

  /** The last created update draft. */
  public get lastDraft(): Draft | undefined {
    // the drafts are sorted by createdAt in descending order, so the first one is the latest
// DIFF-76 change at line 825
    return this.draftInitiativeUpdatesOrComments.find(d => d.isInitiativeUpdateDraft);
  }

  /** The latest posted initiative update. */
  public get lastPostedUpdate() {
    // the initiative updates are sorted by createdAt in descending order, so the first one is the latest
    return this.lastUpdate?.value ?? this.initiativeUpdates.first;
  }

  /**
   * Default color for a newly created initiative.
   *
   * @param id Initiative identifier used to keep the default stable.
   * @returns A deterministic color from the color picker palette.
   */
  public static defaultColorForId(id: string): string {
    return ColorPickerColors.stableColorForId(id);
  }

  /**
   * Factory method to create a new initiative.
   *
   * @param props The properties to create the initiative with.
   * @returns The created initiative.
   */
// DIFF-76 change at line 850
  public static create(props: CreateInitiativeProps): Initiative {
    const instance = Initiative.createEmpty();
    return Initiative.applyDefaultValues(instance, props);
  }

  /**
   * Applies default values to an initiative instance.
   *
   * @param instance The initiative instance to apply the default values to.
   * @param props The properties to apply the default values to.
   * @returns The initiative instance with the default values applied.
   */
  public static applyDefaultValues(instance: Initiative, props: CreateInitiativeProps) {
    instance.temporaryViewPreferences = props.viewPreferences;
    instance.creator = props.creator;
    instance.name = props.name ?? "";
    instance.status = props.status ?? InitiativeStatus.Active;
    instance.description = props.description;
    instance.organization = props.creator.organization;
    instance.sortOrder = SortOrderHelper.firstSortOrder(props.creator.organization.initiatives, "sortOrder");
    instance.color = props.color ?? Initiative.defaultColorForId(instance.id);
    return instance;
  }

  /**
// DIFF-76 change at line 875
   * Returns `true` is the root of the initiative is favorited, such favorite opens the last seen tab of the initiative.
   */
  @Computed
  public get isRootFavorited() {
    return this.favorites.some(fav => fav.initiativeTab == null);
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  @Action
  public toggleFavorite(data: { initiativeTab?: InitiativeTab } = {}): Favorite | false {
    const { initiativeTab } = data;
    const existingFavorites = initiativeTab
      ? this.favorites.filter(fav => {
          return fav.initiativeTab === initiativeTab;
        })
      : this.favorites.filter(fav => {
          return fav.initiativeTab == null;
        });
    if (existingFavorites.length > 0) {
      existingFavorites.forEach(favorite => favorite.delete());
      return false;
// DIFF-76 change at line 900
    } else {
      const newFavorite = Favorite.create({ reference: this, initiativeTab });
      newFavorite.save(true);
      return newFavorite;
    }
  }

  /**
   * Marks a notification as read (and all other notifications from the same group).
   *
   * @param predicate A function that returns true if the notification should be marked as read.
   */
  @Action
  public markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(item => item.id === notificationId);
    if (!notification) {
      return;
    }
    const groupingEntityId = notification?.groupingEntityId;

    NotificationStateHelper.markAllAsRead(
      this.notifications.elements,
      item => item.groupingEntityId === groupingEntityId
    );
  }
// DIFF-76 change at line 925

  /**
   * Returns true if the model matches the query.
   *
   * @param query The query to match against.
   * @returns True if the model matches the query, false otherwise.
   */
  public matchInlineFind(query: string): boolean {
    const matchString = deburr(
      [this.name].concat([this.owner?.name, this.owner?.displayName].concrete()).join(" ")
    ).toLowerCase();

    return query.split(" ").reduce((memo, subQuery) => memo && matchString.indexOf(subQuery) !== -1, true);
  }

  /**
   * Checks if the initiative has a specific trait.
   *
   * @param trait Trait to get.
   * @returns True if the issue has the given trait, false otherwise.
   */
  public getTrait(trait: InitiativeTrait) {
    return getTrait(this.traits, trait);
  }

// DIFF-76 change at line 950
  /**
   * Finds an integration for the initiative.
   *
   * @param service The service to find the integration for.
   * @returns A found integration or undefined, if no integration with the given service could be found.
   */
  public getIntegration(service: IntegrationService.slackInitiativePost) {
    return this.organization.getIntegration(service, i => i.initiative?.id === this.id);
  }

  // Private interface

  /**
   * Used before the initiative has been saved,
   * since we can't persist the view preferences until the initiative exists on the server
   * */
  private temporaryViewPreferences?: ViewPreferences;
}

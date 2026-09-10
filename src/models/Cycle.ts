import { PredefinedViewType } from "@linear/common/models/PredefinedViewType";
import { StateType } from "@linear/common/models/WorkflowStateType";
import { CycleHelper } from "@linear/common/models/CycleHelper";
import { IssueProgressHelper } from "@linear/common/models/helpers/IssueProgressHelper";
import { ONE } from "@linear/common/utils/time";
import type { CurrentIssuesProgress } from "@linear/common/models/IssuesProgressHistoryEntry";
import { nowIfVisible } from "#utils/time";
import { Favorite, type FavoritableModel } from "#models/Favorite";
import { Issue } from "#models/Issue";
import { Team } from "#models/Team";
import { Document } from "#models/Document";
import { EntityExternalLink } from "#models/EntityExternalLink";
import type { Template } from "#models/Template";
import {
  ClientModel,
  ManyToOne,
  OneToOne,
  LazyOneToMany,
  Property,
  Computed,
  LazyManyToMany,
  LazyManyToOne,
  LazyOneSidedReference,
} from "#models/base/Decorators";
import { ArchivableModel } from "#models/base/Model";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import type { Store } from "#models/Store";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import type { LazyReference, LazyValue } from "#models/hydration/Lazy";
import type { InlineFindable } from "#models/InlineFindable";
import { deburr } from "#utils/deburr";
import { LazyArray } from "#models/hydration/LazyArray";
import { LazyCombinedCollection } from "./collections/LazyCombinedCollection";

/**
 * A model representing a Cycle.
 */
@ClientModel("Cycle")
export class Cycle extends ArchivableModel implements FavoritableModel, InlineFindable {
  public static override readonly loadStrategy = ModelLoadStrategy.lazy;

  /** A reference to the data store that the model is part of. */
  public override store: Store;

  /** The number of the cycle. */
  @Property({ persistence: "none", default: 1 })
  public number: number;

  /** The custom name of the cycle. */
  @Property()
  public name?: string;

  /** The description of the cycle. */
  @Property()
  public description?: string;

  /** The start time of the cycle. */
  @Property({ serializer: DateTimeSerializer, default: () => new Date() })
  public startsAt: Date;

  /** The end time of the cycle. */
  @Property({ serializer: DateTimeSerializer, default: () => new Date() })
  public endsAt: Date;

  /** The completion time of the cycle. If undefined, the cycle hasn't been completed. */
  @Property({ serializer: DateTimeSerializer })
  public completedAt?: Date;

  /** The team that this cycle is associated with. */
  @ManyToOne(() => Team, "cycles", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public team: Team;

  /** References a favorite model if the cycle has been favorited.
   * Avoid using directly, since cycles can also be favorited without a direct link to the cycle model (used for active & upcoming cycles) */
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /**
   * Get the favorite tied to the cycle. Prefer this over `favorite`.
   *
   * @returns the favorite connected to this cycle, if any.
   */
  public getFavorite(): Favorite | undefined {
    return (
      this.favorite ??
      this.store.user.favorites.find(
        fav => fav.predefinedViewTeam === this.team && this.favoriteViewType === fav.predefinedViewType
      )
    );
  }

  /** The predefined view a favorite of this cycle uses, if the cycle is the team's current or upcoming one. */
  public get favoriteViewType(): PredefinedViewType | undefined {
    return this.isActive ? PredefinedViewType.activeCycle : this.isNext ? PredefinedViewType.upcomingCycle : undefined;
  }

  /**
   * Issues associated with the cycle.
   * @deprecated Use `issuesInherited` instead.
   */
  @LazyOneToMany(() => Issue, {
    index: "cycleId",
    order: new CollectionOrder("sortOrder"),
    canSkipHydration: self => self.team.issues.isHydrated(),
  })
  public readonly issues: LazyCollection<Issue>;

  /**
   * All issues associated with this cycle, including inherited cycles.
   */
  public get issuesInherited(): LazyCombinedCollection<Issue> {
    return new LazyCombinedCollection(Issue, this.lazyInheritedIssueCollections);
  }

  /**
   * Issues that weren't completed when the cycle was closed.
   * @deprecated Use `allUncompletedIssuesUponClose` instead.
   */
  @LazyManyToMany(() => Issue, undefined, { persistence: "none", onDelete: "NO ACTION", indexed: true })
  public readonly uncompletedIssuesUponClose: LazyCollection<Issue>;

  /** All issues that weren't completed when the cycle was closed, including deeply inherited cycles. */
  public get allUncompletedIssuesUponClose(): LazyCombinedCollection<Issue> {
    return new LazyCombinedCollection(Issue, [
      this.uncompletedIssuesUponClose,
      ...this.inheritedBy.map(c => c.allUncompletedIssuesUponClose),
    ]);
  }

  /**
   * The total number of issues in the cycle after each day.
   * @deprecated Use `allIssueCountHistory` instead.
   */
  @Property({ persistence: "none", default: [] })
  public issueCountHistory: number[];

  /** The total number of issues in the cycle after each day, including inherited cycles. */
  @Computed
  public get allIssueCountHistory(): number[] {
    return aggregateCycleHistory(this, "issueCountHistory");
  }

  /**
   * The number of completed issues in the cycle after each day.
   * @deprecated Use `allCompletedIssueCountHistory` instead.
   */
  @Property({ persistence: "none", default: [] })
  public completedIssueCountHistory: number[];

  /** The number of completed issues in the cycle after each day, including inherited cycles. */
  @Computed
  public get allCompletedIssueCountHistory(): number[] {
    return aggregateCycleHistory(this, "completedIssueCountHistory");
  }

  /**
   * The total number of estimation points after each day.
   * @deprecated Use `allScopeHistory` instead.
   */
  @Property({ persistence: "none", default: [] })
  public scopeHistory: number[];

  /** The total number of estimation points after each day, including inherited cycles. */
  @Computed
  public get allScopeHistory(): number[] {
    return aggregateCycleHistory(this, "scopeHistory");
  }

  /**
   * The number of completed estimation points after each day.
   * @deprecated Use `allCompletedScopeHistory` instead.
   */
  @Property({ persistence: "none", default: [] })
  public completedScopeHistory: number[];

  /** The number of completed estimation points after each day, including inherited cycles. */
  @Computed
  public get allCompletedScopeHistory(): number[] {
    return aggregateCycleHistory(this, "completedScopeHistory");
  }

  /**
   * The number of in progress estimation points after each day.
   * @deprecated Use `allInProgressScopeHistory` instead.
   */
  @Property({ persistence: "none", default: [] })
  public inProgressScopeHistory: number[];

  /** The number of in progress estimation points after each day, including inherited cycles. */
  @Computed
  public get allInProgressScopeHistory(): number[] {
    return aggregateCycleHistory(this, "inProgressScopeHistory");
  }

  /**
   * Record about current progress of the cycle.
   * @deprecated Use `allCurrentProgress` instead.
   */
  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public currentProgress: CurrentIssuesProgress;

  /** The current progress of the cycle, including deeply inherited cycles. */
  @Computed
  public get allCurrentProgress(): CurrentIssuesProgress {
    const aggregatedProgress = this.inheritedBy
      .map(cycle => cycle.allCurrentProgress)
      .reduce(
        (total, progress) => {
          for (const key in progress) {
            const value = progress[key as keyof CurrentIssuesProgress];
            const totalValue = total[key as keyof CurrentIssuesProgress] ?? 0;
            if (typeof value === "number") {
              total[key as keyof CurrentIssuesProgress] = totalValue + value;
            }
          }
          return total;
        },
        { ...this.currentProgress }
      );
    return aggregatedProgress;
  }

  /** The original cycle this is inherited from. */
  @LazyManyToOne(() => Cycle, "inheritedBy", { optional: true, nullable: false, indexed: true, persistence: "none" })
  public inheritedFrom?: LazyReference<Cycle>;

  /** The original cycle at the top of the `inheritedFrom` chain. Null if the cycle is not inherited. Server-owned. */
  @LazyOneSidedReference(() => Cycle, {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "none",
    // Mirror the server FK: deletes null the root reference, archives leave it untouched.
    onDelete: "SET NULL",
    onArchive: "NO ACTION",
  })
  public inheritedFromRoot?: LazyReference<Cycle>;

  /** The ID of the original cycle at the top of the `inheritedFrom` chain. */
  declare public inheritedFromRootId?: string;

  /** A list of cycles that inherit from this label. */
  @LazyOneToMany(() => Cycle, { index: "inheritedFromId" })
  public readonly inheritedBy: LazyCollection<Cycle>;

  /** Documents associated with the cycle. */
  @LazyOneToMany(() => Document, {
    index: "cycleId",
    order: new CollectionOrder("sortOrder"),
  })
  public readonly documents: LazyCollection<Document>;

  /** External links associated with the cycle. */
  @LazyOneToMany(() => EntityExternalLink, {
    index: "cycleId",
    order: new CollectionOrder("sortOrder"),
  })
  public readonly links: LazyCollection<EntityExternalLink>;

  /**
   * All document templates that the cycle can use. This returns the team's document templates
   * combined with the workspace's templates.
   */
  @Computed
  public get allDocumentTemplates(): LazyCombinedCollection<Template> {
    return this.team.allDocumentTemplates;
  }

  // - Helper

  /** The number name of the cycle. */
  @Computed
  public get numberName(): string {
    return `Cycle ${this.displayNumber}`;
  }

  /** The name of the cycle. */
  @Computed
  public get displayName(): string {
    return this.name ? this.name : this.numberName;
  }

  /** The name the team wrote for the cycle, unless the name only repeats a generated cycle number. */
  @Computed
  public get customName(): string | undefined {
    return this.name && !CycleHelper.isGeneratedCycleName(this.name) ? this.name : undefined;
  }

  /** The cycle number. */
  @Computed
  public get displayNumber(): number | undefined {
    if (!this.name) {
      return this.number;
    }
    const parsedNameValues = CycleHelper.parseCycleNameAndNumber(this.name);
    if (!parsedNameValues) {
      return this.number;
    }
    // Ignore years (e.g. November 2020)
    const currentYear = new Date().getFullYear();
    if (parsedNameValues.number > currentYear - 5 && parsedNameValues.number < currentYear + 5) {
      return this.number;
    }

    return parsedNameValues.number;
  }

  /** Short name used in issue badges. */
  public get shortCycleName(): string {
    // If the display number would just be our default cycle number and the cycle has a custom name,
    // then prefer displaying the custom name.

    // If the cycle is inherited, use the short cycle name of the source cycle since inherited cycles `number` is guaranteed to line up
    const rootCycle = this.inheritedFromRoot?.value ?? this.inheritedFrom?.value;
    if (rootCycle) {
      return rootCycle.shortCycleName;
    }

    // TODO 2023-03-01: When there are no longer any active cycles in the database named "Cycle X", we can remove the last part of this check.
    return this.displayNumber === this.number && this.name && this.name !== `Cycle ${this.displayNumber}`
      ? this.displayName
      : `${this.displayNumber}`;
  }

  /** The identifier of the cycle. */
  public get identifier(): string {
    return `${this.number}`;
  }

  /** A string representing whether the cycle is planned, active or completed. */
  @Computed
  public get statusTitle(): string {
    if (this.isActive) {
      return "Current";
    }
    if (this.isNext) {
      return "Upcoming";
    }
    if (this.isPlanned) {
      return "Planned";
    }
    return "Completed";
  }

  /** Weekdays left in the cycle. Returns 0 if the cycle is completed or planned.  */
  @Computed
  public get weekDaysLeft(): number {
    const time = nowIfVisible(ONE.MINUTE);
    let days = this.calendarDaysLeft;
    const weeks = Math.floor(days / 7);
    days -= weeks * 7;
    let workDays = weeks * 5;

    for (let i = 0; i < days; i++) {
      const day = new Date(time + i * ONE.DAY).getDay();
      if (day !== 0 && day !== 6) {
        workDays += 1;
      }
    }
    return workDays;
  }

  /** Calendar days left in the cycle. Returns 0 if the cycle is completed or planned.  */
  @Computed
  public get calendarDaysLeft(): number {
    if (this.isCompleted || this.isPlanned) {
      return 0;
    }
    const days = Math.ceil((this.endsAt.getTime() - nowIfVisible(ONE.MINUTE)) / ONE.DAY);
    if (days <= 0) {
      return 0;
    }
    return days;
  }

  /**
   * The overall progress of the cycle. This metric is locked in place once the cycle completes and will return the
   * last historic value, only counting completed estimate points.
   */
  @Computed
  public get progress(): number {
    return IssueProgressHelper.completionProgress(this.allCurrentProgress);
  }

  /** How much of the cycle's capacity has been filled, from 0 to 1. */
  @Computed
  public get capacityFilled(): LazyValue<number> {
    const velocity = this.team.cycleVelocity;
    if (!velocity) {
      return undefined;
    }
    return this.totalEstimatePoints / velocity.velocity;
  }

  /**
   * The in progress estimate points of in this cycle. This metric return 0 after the cycle completes has been
   * completed.
   */
  @Computed
  public get inProgressEstimatePoints(): number {
    return IssueProgressHelper.inProgressEstimatePoints(this.allCurrentProgress, this.team.estimationEnabled);
  }

  /**
   * The completed estimate points of in this cycle. This metric is locked in place once the cycle completes
   * and will return the last historic value.
   */
  @Computed
  public get completedEstimatePoints(): number {
    return IssueProgressHelper.completedEstimatePoints(this.allCurrentProgress, this.team.estimationEnabled);
  }

  /**
   * The progress estimate points. This counts completed and in progress estimate points for the cycle. In progress
   * estimate points are calculated with a multiplier of 0.25. This metric is locked in place once the cycle completes
   * and will return the last historic value, only counting completed estimate points.
   */
  @Computed
  public get progressEstimatePoints(): number {
    return IssueProgressHelper.progressEstimatePoints(this.allCurrentProgress, this.team.estimationEnabled);
  }

  /**
   * The total estimate points of all issues in the cycle. This metric is locked in place once the cycle completes
   * and will return the last historic value.
   */
  @Computed
  public get totalEstimatePoints(): number {
    return IssueProgressHelper.totalEstimatePoints(this.allCurrentProgress, {
      estimationEnabled: this.team.estimationEnabled,
    });
  }

  /**
   * Returns if the cycle graph should show the "Started" line.
   * This will be `false` for old cycles before we started recording `inProgressScopeHistory`.
   */
  @Computed
  public get hasStartedLine(): boolean {
    return this.allInProgressScopeHistory.length > 0 || this.startsAt > new Date("2022-08-18");
  }

  /** All open issues in the cycle. */
  @Computed
  public get openIssues(): ReadonlyCollection<Issue> {
    return this.issuesInherited.filter(
      issue =>
        issue.state.type === StateType.backlog ||
        issue.state.type === StateType.unstarted ||
        issue.state.type === StateType.started
    );
  }

  /** All completed issues in the cycle. */
  @Computed
  public get completedIssues(): ReadonlyCollection<Issue> {
    return this.issuesInherited.filter(issue => issue.state.type === StateType.completed);
  }

  /** All canceled issues in the cycle. */
  @Computed
  public get canceledIssues(): ReadonlyCollection<Issue> {
    return this.issuesInherited.filter(issue => issue.state.type === StateType.canceled);
  }

  /** The overall progress of the cycle as percentage. */
  public get progressPercent(): number {
    return IssueProgressHelper.progressToPercent(this.progress);
  }

  /** The overall progress of the cycle as a presentable string. */
  public get progressText(): string {
    return this.progressPercent + "%";
  }

  /** Whether the cycle has not yet begun. */
  @Computed
  public get isPlanned(): boolean {
    return new Date(nowIfVisible(ONE.MINUTE)) < this.startsAt && !this.completedAt;
  }

  /** Whether the cycle is next up. */
  public get isNext(): boolean {
    if (this.completedAt !== undefined) {
      return false;
    }
    const nowMs = nowIfVisible(ONE.MINUTE);
    if (this.startsAt.getTime() <= nowMs) {
      return false;
    }
    // When cycles are hydrated, check precisely against the team's first upcoming cycle.
    // Otherwise fall back to a time-window heuristic that doesn't require iteration.
    if (this.team.cycles.isHydrated()) {
      return this.team.upcomingCycle(0) === this;
    }
    const periodMs = (this.team.cycleDuration + this.team.cycleCooldownTime) * 7 * ONE.DAY;
    return this.startsAt.getTime() - nowMs <= periodMs;
  }

  /** Whether the cycle is previous to the current one. */
  public get isPrevious(): boolean {
    return this.team.previousCycle === this;
  }

  /** Whether the cycle is a past cycle. */
  public get isPast(): boolean {
    return this.completedAt !== undefined;
  }

  /** Whether the cycle is a future cycle. */
  public get isFuture(): boolean {
    return this.startsAt >= new Date(nowIfVisible(ONE.MINUTE));
  }

  /** Whether the cycle is active. */
  public get isActive(): boolean {
    const nowTimestamp = nowIfVisible(ONE.MINUTE);
    return (
      this.completedAt === undefined && this.startsAt.getTime() <= nowTimestamp && nowTimestamp < this.endsAt.getTime()
    );
  }

  /** Whether the cycle is completed. */
  public get isCompleted(): boolean {
    return this.completedAt !== undefined;
  }

  /** Whether the cycle is in cooldown. */
  @Computed
  public get isInCooldown(): boolean {
    if (!this.isCompleted) {
      return false;
    }
    const nextCycle = this.nextCycle;
    if (!nextCycle) {
      return false;
    }

    const currentTime = new Date();
    return currentTime > this.endsAt && currentTime < nextCycle.startsAt;
  }

  /** Whether the cycle has a cooldown period. */
  @Computed
  public get hasCooldown(): boolean {
    const nextCycle = this.nextCycle;
    if (!nextCycle) {
      return this.team.cycleCooldownTime > 0;
    }

    return this.endsAt < nextCycle.startsAt;
  }

  /** The previous cycle. */
  @Computed
  public get previousCycle(): Cycle | undefined {
    const index = this.team.cycles.indexOf(this);
    return index >= 0 ? this.team.cycles.elements[index + 1] : undefined;
  }

  /** The next cycle. */
  @Computed
  public get nextCycle(): Cycle | undefined {
    const index = this.team.cycles.indexOf(this);
    return index >= 0 ? this.team.cycles.elements[index - 1] : undefined;
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  public toggleFavorite = (): Favorite | false => {
    const existingFavorite = this.getFavorite();
    if (existingFavorite) {
      existingFavorite.delete();
      return false;
    } else {
      const newFavorite = Favorite.create(
        this.favoriteViewType
          ? { predefinedViewTeam: this.team, predefinedViewType: this.favoriteViewType }
          : { reference: this }
      );
      newFavorite.save(true);
      return newFavorite;
    }
  };

  /** @inheritdoc */
  public matchInlineFind(query: string): boolean {
    return (
      deburr(this.name + " " + this.description + " " + this.number)
        .toLowerCase()
        .indexOf(query) !== -1
    );
  }

  // -- Private interface

  private lazyInheritedIssueCollections = new LazyArray(async () => {
    await Promise.all(this.team.children.map(subTeam => subTeam.cycles.hydrate()));
    const inheritedBy = this.team.children
      .map(subTeam => subTeam.cycles.find(c => c.inheritedFrom?.id === this.id))
      .concrete();
    return [this.issues, ...inheritedBy.map(c => c.issuesInherited)];
  });
}

type CycleHistoryProperty = NonNullable<{ [K in keyof Cycle]: Cycle[K] extends number[] ? K : never }[keyof Cycle]>;

/** Aggregate the history of a cycle by summing the values of the history of the cycle and its deeply inherited cycles. */
function aggregateCycleHistory(cycle: Cycle, property: CycleHistoryProperty): number[] {
  return cycle.inheritedBy.reduce((total, subTeamCycle) => {
    const subTeamValue = aggregateCycleHistory(subTeamCycle, property);
    // Teams can be nested mid-cycle resulting in mismatched history lengths. The endsAt of the cycles will always be
    // the same though so we should align arrays at the end before aggregating.
    return alignAndSumArrays(total, subTeamValue);
  }, cycle[property]);
}

/**
 * Aligns two arrays of different lengths by padding the shorter one with zeros at the beginning,
 * then returns the sum of corresponding elements.
 */
export function alignAndSumArrays(arr1: number[], arr2: number[]): number[] {
  const [shorter, longer] = arr1.length < arr2.length ? [arr1, arr2] : [arr2, arr1];
  const paddingLength = longer.length - shorter.length;

  return longer.map((value, index) => {
    const shorterIndex = index - paddingLength;
    return value + (shorterIndex >= 0 ? shorter[shorterIndex] : 0);
  });
}

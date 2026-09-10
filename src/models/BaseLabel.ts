import type { Quota } from "@linear/common/quotas/QuotaRegistry";
import type { LazyReference } from "#models/hydration/Lazy";
import { IssueLabel } from "#models/IssueLabel";
import { InitiativeLabel } from "#models/InitiativeLabel";
import type { Organization } from "#models/Organization";
import { ProjectLabel } from "#models/ProjectLabel";
import type { Team } from "#models/Team";
import type { Collection } from "#models/collections/Collection";
import { Initiative } from "./Initiative";
import { Issue } from "./Issue";
import { Project } from "./Project";

/** The types of labels (IssueLabel, ProjectLabel, or InitiativeLabel) that can be used interchangeably. */
export type BaseLabelType = IssueLabel | ProjectLabel | InitiativeLabel;

/** The types of labels (IssueLabel or ProjectLabel) that can be scoped to a team. */
export type TeamLabelType = IssueLabel | ProjectLabel;

/** The class of labels (IssueLabel, ProjectLabel, or InitiativeLabel) that can be used interchangeably. */
export type BaseLabelClass = typeof IssueLabel | typeof ProjectLabel | typeof InitiativeLabel;

/** The models that can have a label applied to them. */
export type DestinationModel = Issue | Project | Initiative;

/** The classes of models that can have a label applied to them. */
export type DestinationModelClass = typeof Issue | typeof Project | typeof Initiative;

/** The model that a label belongs to. */
export type ModelForLabelType<T extends BaseLabelType> = T extends IssueLabel
  ? Issue
  : T extends ProjectLabel
    ? Project
    : T extends InitiativeLabel
      ? Initiative
      : never;

/** Returns the model class corresponding to the given label class. */
export function getModelForLabelClass(labelClass: BaseLabelClass) {
  if (labelClass === IssueLabel) {
    return Issue;
  } else if (labelClass === ProjectLabel) {
    return Project;
  } else {
    return Initiative;
  }
}

/**
 * Returns whether the label is an IssueLabel.
 *
 * @param label The label to check.
 * @returns Whether the label is an IssueLabel.
 */
export const isIssueLabel = (label: BaseLabelType): label is IssueLabel => label instanceof IssueLabel;

/**
 * Returns whether the label is a ProjectLabel.
 *
 * @param label The label to check.
 * @returns Whether the label is a ProjectLabel.
 */
export const isProjectLabel = (label: BaseLabelType): label is ProjectLabel => label instanceof ProjectLabel;

/**
 * Returns whether the label is an InitiativeLabel.
 *
 * @param label The label to check.
 * @returns Whether the label is an InitiativeLabel.
 */
export const isInitiativeLabel = (label: BaseLabelType): label is InitiativeLabel => label instanceof InitiativeLabel;

/** Models implementing this interface can be used interchangeably with IssueLabel and ProjectLabel. */
export interface BaseLabel<T extends BaseLabelType> {
  /** Whether the label is retired. */
  readonly isRetired: boolean;

  /** The team that the label belongs to. */
  readonly team?: Team;

  /** The label that the label is inherited from. */
  readonly inheritedFrom?: LazyReference<T>;

  /** The original label at the top of the `inheritedFrom` chain. Null if the label is not inherited. */
  readonly inheritedFromRoot?: LazyReference<T>;

  /** The ID of the original label at the top of the `inheritedFrom` chain. */
  readonly inheritedFromRootId?: string;

  /** A list of labels that inherit from this label. */
  readonly inheritedBy: Collection<T>;

  /**
   * Returns the actual label object you want to interact with.
   * This is used to get the original label when the label is inherited, if applicable.
   */
  getActualLabel(): T;

  /**
   * Returns the owner of the label.
   * This is the team (if applicable) or organization that the label belongs to.
   */
  getOwner(): Team | Organization;

  /**
   * Returns the number of objects that are using the label.
   *
   * @param options.hydrated If true, hydrates the full collection for an accurate count when the approximate count is
   * small. Only IssueLabel has a non-hydrated count option available.
   */
  getUsedByCount(options?: { hydrated?: boolean }): number;

  /**
   * Returns the models that are associated with the label.
   */
  getAssociatedModels(): ModelForLabelType<T>[];

  /**
   * Returns whether the label is tied to an external model.
   */
  getIsExternal(): boolean;

  /**
   * Returns the maximum number of labels per group.
   */
  getMaxLabelsPerGroupQuota(): Quota;

  /**
   * Returns the number of SLA rules that are associated with the label.
   */
  usedBySLARuleCount: number;

  /**
   * Returns the number of triage rules that are associated with the label.
   */
  usedByTriageRuleCount: number;
}

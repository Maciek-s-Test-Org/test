import { GitAutomationStates } from "@linear/common/models/AutomationStateType";
import { GitAutomationTargetBranch } from "#models/GitAutomationTargetBranch";
import { Team } from "#models/Team";
import { WorkflowState } from "#models/WorkflowState";
import { ClientModel, LazyManyToOne, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import type { LazyReference } from "#models/hydration/Lazy";

/** A model representing a team's Git automation state. */
@ClientModel("GitAutomationState")
export class GitAutomationState extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  @ManyToOne(() => WorkflowState, "gitAutomationStates", { optional: true, nullable: false, indexed: true })
  public state?: WorkflowState;

  @ManyToOne(() => Team, "gitAutomationStates", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public team: Team;

  @LazyManyToOne(() => GitAutomationTargetBranch, "automationStates", {
    nullable: false,
    optional: true,
    indexed: true,
  })
  public targetBranch?: LazyReference<GitAutomationTargetBranch>;

  @Property({ default: GitAutomationStates.start })
  public event: GitAutomationStates;

  /**
   * Categories a list of automation states by the Git event for a single branch. If there are duplicate states for the
   * same event (more than one branch pattern), an error is thrown.
   *
   * @param states The automation states to categorize.
   * @returns A map of the states categorized by the Git event.
   */
  public static groupByEventsForBranch(states: GitAutomationState[] | ReadonlyCollection<GitAutomationState>) {
    return states.reduce(
      (acc, state) => {
        const { event } = state;
        if (acc[event]) {
          throw new Error(`Duplicate automation state for type: ${event}`);
        }

        acc[event] = state;
        return acc;
      },
      {} as { [key in GitAutomationStates]?: GitAutomationState }
    );
  }
}

import { type AgentTriggerCondition, AgentTriggerEvent, AgentTriggerType } from "@linear/common/models/AgentTrigger";
import { AiConversation } from "#models/AiConversation";
import { User } from "#models/User";
import { ClientModel, Computed, LazyOneSidedReference, OneSidedReference, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import type { LazyReference } from "#models/hydration/Lazy";
import { GraphQLObjectSerializer } from "#models/serialization/Serialization";

/**
 * A trigger that invokes the Linear agent when filter conditions are met on issues, comments, or pull requests.
 */
@ClientModel("AgentTrigger")
export class AgentTrigger extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.instant;

  /** The type of entity that the trigger monitors. */
  @Property({ enum: AgentTriggerType, persistence: "createOnly", default: AgentTriggerType.issue })
  public triggerType: AgentTriggerType;

  /** The event that fires the trigger. */
  @Property({ enum: AgentTriggerEvent, persistence: "createOnly", default: AgentTriggerEvent.entityCreated })
  public triggerEvent: AgentTriggerEvent;

  /** The conditions that must match for the trigger to fire. */
  @Property({ serializer: GraphQLObjectSerializer })
  public conditions?: AgentTriggerCondition[];

  /** The message to send to the agent when the trigger fires. */
  @Property({ default: "" })
  public message: string;

  /** The AI conversation that this trigger invokes. */
  @LazyOneSidedReference(() => AiConversation, {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public aiConversation: LazyReference<AiConversation>;

  /** The user who created the trigger. */
  @OneSidedReference(() => User, { persistence: "none", optional: false, nullable: false })
  public creator: User;

  /**
   * Entity IDs that this trigger explicitly targets, extracted from the `id` comparator in the trigger's conditions.
   *
   * Returns an empty array for triggers with broad filter conditions (e.g. project-wide or team-wide filters)
   * that do not reference specific entity IDs.
   */
  @Computed
  public get targetedEntityIds(): string[] {
    if (!this.conditions?.length) {
      return [];
    }

    const filterKey = filterKeyForTriggerType(this.triggerType);
    const ids: string[] = [];

    for (const condition of this.conditions) {
      const filter = condition[filterKey];
      if (!filter) {
        continue;
      }

      const idComparator = filter.id;
      if (!idComparator) {
        continue;
      }

      if (idComparator.eq) {
        ids.push(idComparator.eq);
      }

      if (idComparator.in) {
        const inValues = idComparator.in instanceof Set ? [...idComparator.in] : idComparator.in;
        ids.push(...inValues);
      }
    }

    return [...new Set(ids)];
  }
}

/** Maps a trigger type to the corresponding condition filter key. */
function filterKeyForTriggerType(triggerType: AgentTriggerType): keyof AgentTriggerCondition {
  switch (triggerType) {
    case AgentTriggerType.issue:
      return "issueFilter";
    case AgentTriggerType.comment:
      return "commentFilter";
    case AgentTriggerType.pullRequest:
      return "pullRequestFilter";
    default:
      return "issueFilter";
  }
}

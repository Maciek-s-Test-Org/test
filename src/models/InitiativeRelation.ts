import { Initiative } from "#models/Initiative";
import { ClientModel, LazyManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { SortOrderHelper } from "#utils/SortOrderHelper";
import type { Hydrated } from "#models/base/ModelTypes";
import { LazyReference } from "#models/hydration/Lazy";
import type { SortableModel } from "./SortableModel";

/**
 * A model representing a relation between two initiatives.
 */
@ClientModel("InitiativeRelation")
export class InitiativeRelation extends DeletableModel implements SortableModel {
  /**
   * Factory method to create a new initiative relation.
   *
   * @param props The properties to create the initiative relation with.
   * @returns The created initiative relation.
   */
  public static create(props: {
    initiative: Initiative;
    relatedInitiative: Initiative;
    sortOrder?: number;
  }): Hydrated<InitiativeRelation> {
    const instance = InitiativeRelation.createEmpty();
    instance.initiative = LazyReference.wrap(props.initiative);
    instance.relatedInitiative = LazyReference.wrap(props.relatedInitiative);
    instance.sortOrder = props.sortOrder ?? SortOrderHelper.lastSortOrder(props.initiative.childRelations, "sortOrder");
    return instance;
  }

  /** The parent initiative. */
  @LazyManyToOne(() => Initiative, "childRelations", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public initiative: LazyReference<Initiative>;

  /** The child initiative. */
  @LazyManyToOne(() => Initiative, "parentRelations", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public relatedInitiative: LazyReference<Initiative>;

  /** The sort order of the relation within the initiative. */
  @Property({ default: 0 })
  public sortOrder: number;
}

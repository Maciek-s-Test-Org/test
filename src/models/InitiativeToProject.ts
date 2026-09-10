import { Project } from "#models/Project";
import { ClientModel, LazyManyToOne, Property } from "#models/base/Decorators";
import { LazyReference } from "#models/hydration/Lazy";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { SortOrderHelper } from "#utils/SortOrderHelper";
import { Initiative } from "#models/Initiative";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import type { SortableModel } from "./SortableModel";

/**
 * A model representing a initiative.
 */
@ClientModel("InitiativeToProject")
export class InitiativeToProject extends DeletableModel implements SortableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;

  /**
   * Preload initiative-to-project relations for a collection of projects.
   *
   * @param projects The projects to preload relations for.
   */
  public static preloadForProjects(projects: ReadonlyCollection<Project>): Promise<void> {
    return InitiativeToProject.preloadFor("project", { skipAddingToMemory: true }).for(projects.elements);
  }

  /**
   * Factory method to create a new initiative to project.
   *
   * @param props The properties to create the initiative to project with.
   * @returns The created initiative to project.
   */
  public static create(props: { project: Project; initiative: Initiative }): InitiativeToProject {
    const existing = props.project.initiativeToProjects.find(join_ => join_.initiative.value === props.initiative);
    if (existing) {
      return existing;
    }

    // We cannot create a relation with a parent initiative
    // if there are existing relations with descendants
    const hasDescendantRelation = InitiativeToProject.hasConnectionToInitiativeDescendant({
      project: props.project,
      initiative: props.initiative,
    });

    if (hasDescendantRelation.hasConnection) {
      InitiativeToProject.removeFromAllDescendants({
        initiative: props.initiative,
        project: props.project,
      });
    }

    const instance = InitiativeToProject.createEmpty();
    instance.project = LazyReference.wrap(props.project);
    instance.initiative = LazyReference.wrap(props.initiative);
    instance.sortOrder = SortOrderHelper.lastSortOrder(
      props.initiative.initiativeToProjects.existingElements,
      "sortOrder"
    );
    return instance;
  }

  /**
   * Removes the project from the initiative.
   */
  public static removeProjectFromInitiative(props: { initiative: Initiative; project: Project }): void {
    props.project.initiativeToProjects.find(join_ => join_.initiative.value === props.initiative)?.delete();
  }

  /**
   * Removes the project from all initiatives.
   */
  public static removeProjectFromAllInitiatives(props: { project: Project }): void {
    props.project.initiativeToProjects.forEach(join_ => join_.delete());
  }

  /**
   * Removes the project from all descendants of the initiative.
   */
  public static removeFromAllDescendants(props: { initiative: Initiative; project: Project }): void {
    props.initiative.descendants.forEach(descendant => {
      descendant.initiativeToProjects.find(join_ => join_.project.value === props.project)?.delete();
    });
  }

  /**
   * Checks if the project has a connection to an initiative descendant.
   */
  public static hasConnectionToInitiativeDescendant(props: { project: Project; initiative: Initiative }): {
    hasConnection: boolean;
    initiative: Initiative | undefined;
  } {
    const relation = props.project.initiativeToProjects.find(
      item => item.initiative.value != null && props.initiative.descendants.contains(item.initiative.value)
    );
    return {
      hasConnection: relation != null,
      initiative: relation?.initiative.value,
    };
  }

  /**
   * Checks if the project has a connection to an initiative ancestor.
   */
  public static hasConnectionToInitiativeAncestor(props: { project: Project; initiative: Initiative }): {
    hasConnection: boolean;
    initiative: Initiative | undefined;
  } {
    const relation = props.project.initiativeToProjects.find(
      item => item.initiative.value != null && props.initiative.ancestors.contains(item.initiative.value)
    );
    return {
      hasConnection: relation != null,
      initiative: relation?.initiative.value,
    };
  }

  /** The initiative. */
  @LazyManyToOne(() => Initiative, "initiativeToProjects", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
    trait: "useForPartialIndex",
  })
  public initiative: LazyReference<Initiative>;

  /** The project. */
  @LazyManyToOne(() => Project, "initiativeToProjects", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
    trait: "useForPartialIndex",
  })
  public project: LazyReference<Project>;

  /** The sort order of the initiative. */
  @Property({ default: 0 })
  public sortOrder: number;
}

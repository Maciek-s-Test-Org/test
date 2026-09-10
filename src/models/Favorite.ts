import { FavoriteType } from "@linear/common/models/FavoriteType";
import {
  type LiveFavoriteFolderDefinition,
  type LiveFavoriteFolderPreset,
  LiveFavoriteFolderPresetHelper,
} from "@linear/common/models/LiveFavoriteFolder";
import type { PredefinedViewType } from "@linear/common/models/PredefinedViewType";
import { notReachable } from "@linear/common/errors/UnreachableCaseError";
import type { ProjectTab } from "@linear/common/models/ProjectTab";
import type { InitiativeTab } from "@linear/common/models/InitiativeTab";
import type { PipelineTab } from "@linear/common/models/PipelineTab";
import { EmojiHelper } from "@linear/common/models/EmojiHelper";
import { getStore } from "#store";
import { Cycle } from "#models/Cycle";
import { Issue } from "#models/Issue";
import { IssueLabel } from "#models/IssueLabel";
import { Project } from "#models/Project";
import { Team } from "#models/Team";
import { User } from "#models/User";
import { CustomView } from "#models/CustomView";
import { Document } from "#models/Document";
import { Initiative } from "#models/Initiative";
import {
  ClientModel,
  LazyManyToOne,
  LazyOneToOne,
  ManyToOne,
  OneToMany,
  OneToOne,
  Property,
  OneSidedReference,
  Computed,
} from "#models/base/Decorators";
import { DeletableModel, Model } from "#models/base/Model";
import { SortOrderHelper } from "#utils/SortOrderHelper";
import type { Collection } from "#models/collections/Collection";
import { Facet } from "#models/Facet";
import { LazyReference } from "#models/hydration/Lazy";
import type { Hydrated } from "#models/base/ModelTypes";
import type { SortableModel } from "#models/SortableModel";
import type { Emoji } from "#models/Emoji";
import type { ModelWithIcon } from "#models/ModelWithIcon";
import { Customer } from "#models/Customer";
import { Dashboard } from "#models/Dashboard";
import { ProjectLabel } from "#models/ProjectLabel";
import { InitiativeLabel } from "#models/InitiativeLabel";
import { PullRequest } from "#models/PullRequest";
import { AiConversation } from "#models/AiConversation";
import { Release } from "#models/Release";
import { ReleaseNote } from "#models/ReleaseNote";
import { ReleasePipeline } from "#models/ReleasePipeline";
import { WorkflowDefinition } from "#models/WorkflowDefinition";
import { GraphQLObjectSerializer } from "#models/serialization/Serialization";

/** Model that can be favorited. */
export interface FavoritableModel {
  /** Toggles favorite. */
  toggleFavorite: (data?: unknown) => Favorite | false;
  /** An optional favorite. */
  favorite?: Favorite;
}

/**
 * A model representing a favorited model.
 */
@ClientModel("Favorite")
export class Favorite extends DeletableModel implements SortableModel {
  /** The type of the favorite. */
  @Property({ persistence: "none", default: FavoriteType.folder })
  public type: FavoriteType;

  /** Parent favorite folder. */
  @ManyToOne(() => Favorite, "children", { optional: true, nullable: false, indexed: true })
  public parent?: Favorite;

  /** The children of the favorite. Will only ever be populated for favorites of type folder. */
  @OneToMany(() => Favorite)
  public readonly children: Collection<Favorite>;

  /** The name of the favorite. Only applicable favorites of type folder. */
  @Property()
  public folderName?: string;

  /** The preset used to create this live favorite folder. */
  @Property({ persistence: "createOnly" })
  public liveFolderPreset?: LiveFavoriteFolderPreset;

  /** The versioned root and filter for this live favorite folder. */
  @Property({ persistence: "none", serializer: GraphQLObjectSerializer })
  public liveFolderDefinition?: LiveFavoriteFolderDefinition;

  /** The order of the favorite in the favorites list. */
  @Property({ default: 0 })
  public sortOrder: number;

  /** Favorited issue. */
  @LazyOneToOne(() => Issue, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public issue?: LazyReference<Issue>;

  /** Favorited predefined view team. */
  @OneSidedReference(() => Team, { optional: true, nullable: false, indexed: true, persistence: "createOnly" })
  public predefinedViewTeam?: Team;

  /** Favorited predefined view type. */
  @Property({ persistence: "createOnly" })
  public predefinedViewType?: PredefinedViewType;

  /** Favorited project. */
  @LazyManyToOne(() => Project, "favorites", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public project?: LazyReference<Project>;

  /** Favorited sub page of the project. */
  @Property({ persistence: "createOnly" })
  public projectTab?: ProjectTab;

  /** Favorited facet. */
  @LazyOneToOne(() => Facet, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public facet?: LazyReference<Facet>;

  /** Favorited cycle. */
  @LazyOneToOne(() => Cycle, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public cycle?: LazyReference<Cycle>;

  /** Favorited custom view. */
  @LazyOneToOne(() => CustomView, "favorite", {
    optional: true,
    nullable: false,
    indexed: true,
    cascadeHydration: true,
    persistence: "createOnly",
  })
  public customView?: LazyReference<CustomView>;

  /** Favorited document. */
  @LazyOneToOne(() => Document, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public document?: LazyReference<Document>;

  /** Favorited initiative. */
  @LazyManyToOne(() => Initiative, "favorites", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public initiative?: LazyReference<Initiative>;

  /** Favorited sub page of the initiative. */
  @Property({ persistence: "createOnly" })
  public initiativeTab?: InitiativeTab;

  /** Favorited label. */
  @LazyOneToOne(() => IssueLabel, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public label?: LazyReference<IssueLabel>;

  /** Favorited label. */
  @LazyOneToOne(() => ProjectLabel, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public projectLabel?: LazyReference<ProjectLabel>;

  /** Favorited initiative label. */
  @LazyOneToOne(() => InitiativeLabel, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public initiativeLabel?: LazyReference<InitiativeLabel>;

  /** Favorited user. */
  @OneToOne(() => User, "favorite", { optional: true, nullable: false, persistence: "createOnly" })
  public user?: User;

  /** Favorited customer. */
  @LazyOneToOne(() => Customer, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public customer?: LazyReference<Customer>;

  /** Favorited dashboard. */
  @LazyOneToOne(() => Dashboard, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public dashboard?: LazyReference<Dashboard>;

  /** Favorited pull request. */
  @LazyOneToOne(() => PullRequest, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public pullRequest?: LazyReference<PullRequest>;

  /** Favorited Agent conversation. */
  @LazyOneToOne(() => AiConversation, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public aiConversation?: LazyReference<AiConversation>;

  /** Favorited release. */
  @LazyOneToOne(() => Release, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public release?: LazyReference<Release>;

  /** Favorited release pipeline. */
  @LazyManyToOne(() => ReleasePipeline, "favorites", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public releasePipeline?: LazyReference<ReleasePipeline>;

  /** Favorited sub page of the release pipeline. */
  @Property({ persistence: "createOnly" })
  public pipelineTab?: PipelineTab;

  /** Favorited release note. */
  @LazyOneToOne(() => ReleaseNote, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public releaseNote?: LazyReference<ReleaseNote>;

  /** Favorited team. */
  @OneToOne(() => Team, "favorite", { optional: true, nullable: false, persistence: "createOnly" })
  public team?: Team;

  /** Favorited loop. */
  @LazyOneToOne(() => WorkflowDefinition, "favorite", {
    optional: true,
    nullable: false,
    cascadeHydration: true,
    indexed: true,
    persistence: "createOnly",
  })
  public workflowDefinition?: LazyReference<WorkflowDefinition>;

  /** The owner of the favorite. */
  @ManyToOne(() => User, "favorites", { persistence: "none", optional: false, nullable: false })
  public owner: User;

  /** Does the favorited model still exist? */
  @Computed
  public get isActive() {
    const targetModel = this.targetModel;
    const isClone = targetModel instanceof Model && targetModel.isClone;

    // Check whether the target model is hydrated and available.
    // This is possible because we don't always clean up favorites when a user loses access to the associated model.
    const isTargetModelHydrated = targetModel instanceof LazyReference ? targetModel.value !== undefined : true;

    return targetModel !== undefined && isTargetModelHydrated && !isClone;
  }

  /** Hydrate the emoji icon for the favorited model, if one exists. */
  public async hydrateEmojiIcon(): Promise<Emoji | undefined> {
    if (
      [FavoriteType.customView, FavoriteType.project, FavoriteType.document, FavoriteType.initiative].includes(
        this.type
      )
    ) {
      const iconName = (this.targetModel as ModelWithIcon | undefined)?.icon;
      if (iconName && EmojiHelper.isEmojiCode(iconName)) {
        return this.owner.organization.getEmojiByName(iconName);
      }
    }

    return undefined;
  }

  /**
   * Kicks off full hydration of the favorited target model, including its cascading relations. Used to warm data
   * for favorited destinations in the background after the favorite itself was hydrated with
   * `skipCascadeHydration`.
   *
   * Only lazily referenced targets hydrate — those are the references marked with `cascadeHydration`, matching
   * what a full favorite hydration cascades into. Directly referenced targets (user, team) never cascaded, and
   * deep-hydrating a user would load all of their issues, drafts and documents.
   */
  public hydrateTarget(): void {
    const target = this.targetModel;
    if (target instanceof LazyReference) {
      void target
        .resolve()
        .then(model => model?.hydrate())
        .catch(() => undefined);
    }
  }

  /** Moves the favorite to the end of a folder, or to the root when no folder is given. */
  public moveToFolder(folder: Favorite | undefined): void {
    if (folder && folder.type !== "folder") {
      throw new Error("Favorite item as a folder should have type=folder");
    }
    if (folder?.liveFolderDefinition) {
      throw new Error("A live favorite folder cannot contain persisted favorites");
    }
    if (this.parent === folder) {
      return;
    }
    const siblings = this.owner.activeFavorites.filter(favorite => favorite.parent === folder);
    this.sortOrder = SortOrderHelper.lastSortOrder(siblings, "sortOrder");
    this.parent = folder;
  }

  public override get naturalIdentity() {
    const target = typeof this.targetModel === "string" ? this.targetModel : this.targetModel?.id;
    return [this.type, this.owner.id, target];
  }

  /**
   * Creates a new folder.
   *
   * @param props props to create a new folder.
   * @returns a new instance of folder.
   */
  public static createFolder(props: { folderName: string }) {
    const favorite = new Favorite();
    const currentUser = getStore().user;
    favorite.owner = currentUser;
    favorite.sortOrder = SortOrderHelper.firstSortOrder(currentUser.activeFavorites, "sortOrder");
    favorite.folderName = props.folderName;
    favorite.type = FavoriteType.folder;

    return favorite;
  }

  /**
   * Creates a predefined live folder.
   *
   * @param preset preset to create.
   * @returns a new live folder instance.
   */
  public static createLiveFolder(preset: LiveFavoriteFolderPreset) {
    const favorite = new Favorite();
    const currentUser = getStore().user;
    const metadata = LiveFavoriteFolderPresetHelper.metadata(preset);
    favorite.owner = currentUser;
    favorite.sortOrder = SortOrderHelper.firstSortOrder(currentUser.activeFavorites, "sortOrder");
    favorite.folderName = metadata.name;
    favorite.liveFolderPreset = preset;
    favorite.liveFolderDefinition = metadata.definition;
    favorite.type = FavoriteType.folder;

    return favorite;
  }

  /**
   * Factory method to create a new favorite.
   *
   * @param props The properties to create the favorite with.
   * @returns The created favorite.
   */
  public static create(props: {
    parent?: Favorite;
    projectTeam?: Team;
    projectTab?: ProjectTab;
    initiativeTab?: InitiativeTab;
    pipelineTab?: PipelineTab;
    predefinedViewTeam?: Team;
    predefinedViewType?: PredefinedViewType;
    reference?:
      | Cycle
      | Project
      | CustomView
      | Document
      | IssueLabel
      | ProjectLabel
      | InitiativeLabel
      | Issue
      | Initiative
      | User
      | Facet
      | Customer
      | Dashboard
      | PullRequest
      | AiConversation
      | Release
      | ReleasePipeline
      | ReleaseNote
      | Team
      | WorkflowDefinition;
  }): Hydrated<Favorite> {
    const favorite = Favorite.createEmpty();
    const currentUser = getStore().user;
    favorite.owner = currentUser;
    favorite.sortOrder = SortOrderHelper.firstSortOrder(currentUser.activeFavorites, "sortOrder");

    if (props.predefinedViewTeam && props.predefinedViewType) {
      favorite.type = FavoriteType.predefinedView;
      favorite.predefinedViewTeam = props.predefinedViewTeam;
      favorite.predefinedViewType = props.predefinedViewType;
    } else if (props.reference instanceof Cycle) {
      favorite.type = FavoriteType.cycle;
      favorite.cycle = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof IssueLabel) {
      favorite.type = FavoriteType.label;
      favorite.label = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof ProjectLabel) {
      favorite.type = FavoriteType.projectLabel;
      favorite.projectLabel = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof InitiativeLabel) {
      favorite.type = FavoriteType.initiativeLabel;
      favorite.initiativeLabel = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof Issue) {
      favorite.type = FavoriteType.issue;
      favorite.issue = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof Project) {
      favorite.type = FavoriteType.project;
      favorite.project = LazyReference.wrap(props.reference);
      favorite.projectTab = props.projectTab;
    } else if (props.reference instanceof Initiative) {
      favorite.type = FavoriteType.initiative;
      favorite.initiative = LazyReference.wrap(props.reference);
      favorite.initiativeTab = props.initiativeTab;
    } else if (props.reference instanceof CustomView) {
      favorite.type = FavoriteType.customView;
      favorite.customView = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof Document) {
      favorite.type = FavoriteType.document;
      favorite.document = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof User) {
      favorite.type = FavoriteType.user;
      favorite.user = props.reference;
    } else if (props.reference instanceof Facet) {
      favorite.type = FavoriteType.facet;
      favorite.facet = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof Customer) {
      favorite.type = FavoriteType.customer;
      favorite.customer = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof Dashboard) {
      favorite.type = FavoriteType.dashboard;
      favorite.dashboard = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof PullRequest) {
      favorite.type = FavoriteType.pullRequest;
      favorite.pullRequest = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof AiConversation) {
      favorite.type = FavoriteType.aiConversation;
      favorite.aiConversation = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof Release) {
      favorite.type = FavoriteType.release;
      favorite.release = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof ReleasePipeline) {
      favorite.type = FavoriteType.releasePipeline;
      favorite.releasePipeline = LazyReference.wrap(props.reference);
      favorite.pipelineTab = props.pipelineTab;
    } else if (props.reference instanceof ReleaseNote) {
      favorite.type = FavoriteType.releaseNote;
      favorite.releaseNote = LazyReference.wrap(props.reference);
    } else if (props.reference instanceof Team) {
      favorite.type = FavoriteType.team;
      favorite.team = props.reference;
    } else if (props.reference instanceof WorkflowDefinition) {
      favorite.type = FavoriteType.workflowDefinition;
      favorite.workflowDefinition = LazyReference.wrap(props.reference);
    } else if (props.reference !== undefined) {
      notReachable(props.reference);
    }

    if (props.parent) {
      favorite.parent = props.parent;
    }

    return favorite;
  }

  /** The target model of the favorite. */
  @Computed
  private get targetModel() {
    return (
      this.initiative ||
      this.customView ||
      this.document ||
      this.issue ||
      this.project ||
      this.facet ||
      this.cycle ||
      this.label ||
      this.projectLabel ||
      this.initiativeLabel ||
      this.user ||
      this.customer ||
      this.dashboard ||
      this.pullRequest ||
      this.aiConversation ||
      this.release ||
      this.releasePipeline ||
      this.releaseNote ||
      this.team ||
      this.workflowDefinition ||
      this.folderName ||
      (this.predefinedViewTeam && this.predefinedViewType)
    );
  }
}

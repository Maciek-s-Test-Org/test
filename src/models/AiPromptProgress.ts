import {
  AiPromptType,
  AiPromptProgressStatus,
  type AiPromptProgressMetadata,
} from "@linear/common/models/AiPromptProgress";
import { ClientModel, LazyManyToOne, LazyOneSidedReference, LazyOneToMany, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import type { LazyReference } from "#models/hydration/Lazy";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import { Issue } from "#models/Issue";
import { Comment } from "#models/Comment";
import { PullRequestComment } from "#models/PullRequestComment.js";

/**
 * A model representing a prompt workflow progress.
 */
@ClientModel("AiPromptProgress")
export class AiPromptProgress extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;

  @LazyManyToOne(() => Issue, "aiPromptProgresses", {
    nullable: false,
    optional: true,
    indexed: true,
    trait: "useForPartialIndex",
    persistence: "none",
  })
  public issue?: LazyReference<Issue>;

  @LazyOneSidedReference(() => Comment, {
    nullable: false,
    optional: true,
    indexed: true,
    persistence: "none",
  })
  public comment?: LazyReference<Comment>;

  @LazyOneSidedReference(() => PullRequestComment, {
    nullable: false,
    optional: true,
    indexed: true,
    persistence: "none",
  })
  public pullRequestComment?: LazyReference<PullRequestComment>;

  /** The parent progress. If undefined, this is a top-level progress. */
  @LazyManyToOne(() => AiPromptProgress, "children", {
    optional: true,
    nullable: false,
    indexed: true,
    cascadeHydration: true,
    persistence: "createOnly",
  })
  public parent?: LazyReference<AiPromptProgress>;

  /** The children of the progress. */
  @LazyOneToMany(() => AiPromptProgress, {
    index: "parentId",
    order: new CollectionOrder("createdAt"),
  })
  public readonly children: LazyCollection<AiPromptProgress>;

  /** The type of the prompt workflow. */
  @Property({ persistence: "none", default: AiPromptType.productIntelligence })
  public type: AiPromptType;

  /** The status of the prompt workflow. */
  @Property({ persistence: "none", default: AiPromptProgressStatus.created })
  public status: AiPromptProgressStatus;

  /** The metadata of the prompt workflow progress. */
  @Property({ persistence: "none", default: {} })
  public metadata: AiPromptProgressMetadata;

  /**
   * Whether the prompt workflow is currently active (in progress).
   */
  public get isActive(): boolean {
    return this.status === AiPromptProgressStatus.created || this.status === AiPromptProgressStatus.inProgress;
  }

  /**
   * Whether the prompt workflow has finished successfully.
   */
  public get isFinished(): boolean {
    return this.status === AiPromptProgressStatus.finished;
  }

  /**
   * Whether the prompt workflow has failed.
   */
  public get isFailed(): boolean {
    return this.status === AiPromptProgressStatus.failed;
  }

  /**
   * Whether the prompt workflow has been canceled.
   */
  public get isCanceled(): boolean {
    return this.status === AiPromptProgressStatus.canceled;
  }
}

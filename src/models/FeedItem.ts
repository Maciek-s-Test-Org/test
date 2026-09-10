import { PostType } from "@linear/common/models/PostType";
import { FeedUtils, FeedItemUpdateType } from "@linear/common/utils/FeedUtils";
import { Organization } from "#models/Organization";
import { ProjectUpdate } from "#models/ProjectUpdate";
import { ClientModel, Computed, LazyOneSidedReference, ManyToOne } from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { LazyReference } from "#models/hydration/Lazy";
import { InitiativeUpdate } from "#models/InitiativeUpdate";
import type { Initiative } from "#models/Initiative";
import { Team } from "#models/Team";
import type { InlineFindable } from "#models/InlineFindable";
import { deburr } from "#utils/deburr";
import { Post } from "./Post";

/**
 * A model representing an item in a users feed.
 */
@ClientModel("FeedItem")
export class FeedItem extends Model implements InlineFindable {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The project update for this item. */
  @LazyOneSidedReference(() => ProjectUpdate, { optional: true, nullable: false, indexed: true })
  public projectUpdate?: LazyReference<ProjectUpdate>;

  /** The initiative update for this item. */
  @LazyOneSidedReference(() => InitiativeUpdate, { optional: true, nullable: false, indexed: true })
  public initiativeUpdate?: LazyReference<InitiativeUpdate>;

  /** The post for this item. */
  @LazyOneSidedReference(() => Post, { optional: true, nullable: false, indexed: true })
  public post?: LazyReference<Post>;

  /** The organization this feed item is targeting. */
  @ManyToOne(() => Organization, "feed", { optional: true, nullable: false, indexed: true })
  public organization?: Organization;

  /** The team this feed item is targeting. */
  @ManyToOne(() => Team, "feed", { optional: true, nullable: false, indexed: true })
  public team?: Team;

  /** The popularity ranking of the feed item. */
  @Computed
  public get popularity(): number {
    const entity = (this.projectUpdate || this.initiativeUpdate || this.post)?.value;

    return FeedUtils.getPopularityScore({
      createdAt: this.createdAt,
      commentsCount: entity?.numberOfComments ?? 0,
      reactionData: entity?.reactionData ?? [],
    });
  }

  @Computed
  public get updateType() {
    if (this.projectUpdate) {
      return FeedItemUpdateType.project;
    }
    if (this.initiativeUpdate) {
      return FeedItemUpdateType.initiative;
    }
    if (this.post?.value) {
      return {
        [PostType.summary]: FeedItemUpdateType.summary,
        [PostType.update]: FeedItemUpdateType.team,
      }[this.post.value.postType];
    }
    return undefined;
  }

  @Computed
  public get author() {
    return this.post?.value?.creator ?? this.initiativeUpdate?.value?.user ?? this.projectUpdate?.value?.user;
  }

  @Computed
  public get relatedInitiatives() {
    const directInitiatives = [
      this.initiativeUpdate?.value?.initiative.value,
      ...(this.projectUpdate?.value?.project.value?.initiatives ?? []),
    ].concrete();

    // Include all ancestors for each initiative to support parent-child filtering
    const allInitiatives = new Set<Initiative>();

    for (const initiative of directInitiatives) {
      allInitiatives.add(initiative);
      // Add all ancestors of this initiative
      for (const ancestor of initiative.ancestors) {
        allInitiatives.add(ancestor);
      }
    }

    return Array.from(allInitiatives);
  }

  @Computed
  public get relatedTeams() {
    return [
      this.post?.value?.team,
      ...(this.projectUpdate?.value?.project.value?.accessibleTeams.elements ?? []),
    ].concrete();
  }

  @Computed
  public get updateHealth() {
    return this.initiativeUpdate?.value?.health ?? this.projectUpdate?.value?.health;
  }

  /**
   * @inheritdoc
   */
  public matchInlineFind(query: string): boolean {
    let values: (string | undefined)[] = [];
    const update = this.projectUpdate?.value || this.initiativeUpdate?.value || this.post?.value;

    if (update instanceof ProjectUpdate) {
      values = [update.project.value?.name, update.bodyMarkdown, update.user?.displayName];
    }
    if (update instanceof InitiativeUpdate) {
      values = [update.initiative.value?.name, update.bodyMarkdown, update.user?.name, update.user?.displayName];
    }
    if (update instanceof Post) {
      values = [update.title, update.body, update.creator?.name, update.creator?.displayName];
    }
    return deburr(values.concrete().join(" ")).toLowerCase().indexOf(query.toLowerCase()) !== -1;
  }
}

import type { FeatureFlagRolloutStageType } from "@linear/common/models/FeatureFlagRolloutStageType";
import { ClientModel, ManyToOne, OneToMany, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import type { Collection } from "#models/collections/Collection";
import { FeatureFlag } from "#models/FeatureFlag";
import { Integration } from "#models/Integration";
import { Organization } from "#models/Organization";

/**
 * A model representing feature flag rollout stage (e.g. Beta, Public).
 */
@ClientModel("FeatureFlagRolloutStage")
export class FeatureFlagRolloutStage extends DeletableModel {
  /** The name of the feature flag rollout stage. */
  @Property({ default: "" })
  public name: string;

  /** The description of the feature flag rollout stage. */
  @Property()
  public description?: string;

  /** Which feature flag provider segments this rollout stage is associated with. */
  @Property({ default: [] })
  public segmentKeys: string[];

  /** The type of the feature flag rollout stage. */
  @Property({ default: "dev" })
  public type: FeatureFlagRolloutStageType;

  /** The sort order for the feature flag rollout stage within its organization. */
  @Property({ default: 0 })
  public sortOrder: number;

  /** The feature flags in this rollout stage. */
  @OneToMany(() => FeatureFlag)
  public readonly featureFlags: Collection<FeatureFlag>;

  /** The organization of the feature flag rollout stage. */
  @ManyToOne(() => Organization, "rolloutStages", {
    persistence: "none",
    optional: false,
    nullable: false,
    indexed: true,
  })
  public organization: Organization;

  /** The integration the stage belongs to. */
  @ManyToOne(() => Integration, "rolloutStages", {
    persistence: "none",
    optional: false,
    nullable: false,
    indexed: true,
  })
  public integration: Integration;

  /**
   * Factory method to create a new feature flag rollout stage.
   */
  public static create(args: {
    name: string;
    description?: string;
    segmentKeys: string[];
    type: FeatureFlagRolloutStageType;
    organization: Organization;
  }) {
    const stage = new FeatureFlagRolloutStage();
    stage.name = args.name;
    stage.description = args.description;
    stage.segmentKeys = args.segmentKeys;
    stage.type = args.type;
    stage.organization = args.organization;
    return stage;
  }

  /**
   * Check if a given rollout stage is behind the current one in the rollout progression.
   *
   * @param otherRolloutStage Rollout stage to compare.
   * @returns Whether this is ahead of the given stage in rollout progression.
   */
  public isAheadOf(otherRolloutStage: FeatureFlagRolloutStage) {
    const rolloutStages = this.organization.orderedRolloutStages;
    return rolloutStages.indexOf(this) > rolloutStages.indexOf(otherRolloutStage);
  }
}

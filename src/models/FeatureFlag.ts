import { FeatureFlagStatusType } from "@linear/common/models/FeatureFlagStatusType";
import {
  ClientModel,
  LazyManyToOne,
  LazyOneToOne,
  ManyToOne,
  OneSidedReference,
  Property,
  Computed,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { FeatureFlagRolloutStage } from "#models/FeatureFlagRolloutStage";
import { Integration } from "#models/Integration";
import { Organization } from "#models/Organization";
import { Project } from "#models/Project";
import { DateTimeSerializer } from "#models/serialization/Serialization";
import { User } from "#models/User";
import { Issue } from "#models/Issue";
import type { LazyReference } from "#models/hydration/Lazy";

/**
 * A model representing feature flag.
 */
@ClientModel("FeatureFlag")
export class FeatureFlag extends DeletableModel {
  /** The project to which the feature flag belongs to. */
  @LazyManyToOne(() => Project, "featureFlags", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public project?: LazyReference<Project>;

  /** The issue to which the feature flag belongs to. */
  @LazyOneToOne(() => Issue, "featureFlag", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public issue?: LazyReference<Issue>;

  /** The rollout stage of the feature flag. */
  @ManyToOne(() => FeatureFlagRolloutStage, "featureFlags", { optional: true, nullable: false })
  public rolloutStage?: FeatureFlagRolloutStage;

  /** The unique key as defined by the feature flag provider. */
  @Property({ persistence: "createOnly" })
  public key?: string;

  /** The default key to use when creating a new feature flag. Only used when creating a flag for a project. */
  @Property({ persistence: "createOnly", isVirtual: true })
  public defaultKey?: string;

  /** Url to the feature flag provider's page about the feature flag. */
  @Property({ persistence: "none", default: "" })
  public externalUrl: string;

  /** The status of the feature flag. */
  @Property({ persistence: "none", default: FeatureFlagStatusType.active })
  public status: FeatureFlagStatusType;

  /** Date when the stage was last changed. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public lastStageUpdatedAt?: Date;

  /** The user who last changed the stage of the feature flag. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public lastStageUpdatedBy?: User;

  /** The organization of the feature flag. */
  @ManyToOne(() => Organization, "featureFlags", {
    persistence: "none",
    optional: false,
    nullable: false,
    indexed: true,
  })
  public organization: Organization;

  /** The integration of the feature flag. */
  @ManyToOne(() => Integration, "featureFlags", {
    persistence: "none",
    optional: false,
    nullable: false,
    indexed: true,
  })
  public integration: Integration;

  /** The name of associated project or issue. */
  public get entityName(): string {
    return this.project?.value?.name ?? this.issue?.value?.identifier ?? "";
  }

  @Computed
  public get displayedKey(): string | undefined {
    return this.key ?? this.defaultKey;
  }
}

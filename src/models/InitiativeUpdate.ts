// DIFF-76: modified fixture
import type { ProsemirrorData } from "@linear/editor/types";
import { UpdateHealthType } from "@linear/common/models/UpdateHealthType";
import type { EmojiReactions } from "@linear/common/models/EmojiReactionsType";
import type { InitiativeUpdateInfoSnapshot } from "@linear/common/models/UpdateInfoSnapshot";
import { UpdateHealthHelper } from "@linear/common/models/helpers/UpdateHealthHelper";
import { MarkdownExporter } from "@linear/common/export/MarkdownExporter";
import {
  ClientModel,
  LazyManyToOne,
  OneSidedReference,
  Computed,
  Property,
  LazyOneToMany,
  OneToMany,
} from "#models/base/Decorators";
import { Initiative } from "#models/Initiative";
import { Organization } from "#models/Organization";
import { Comment } from "#models/Comment";
import { BaseUpdate } from "#models/Updates/BaseUpdate";
import { initiativeUrl } from "#utils/urls";
import { User } from "#models/User";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import { InitiativeUpdateNotification, type Notification } from "#models/Notification";
import type { Collection } from "#models/collections/Collection";
// DIFF-76 change at line 25
import type { LazyCollection } from "#models/collections/LazyCollection";
import type { LazyReference } from "#models/hydration/Lazy";
import { Draft } from "#models/Draft";
import { ExternalEntityRelation } from "#models/ExternalEntityRelation";
import type { InitiativeUpdateInfoSnapshotDiff } from "#models/Updates/InitiativeUpdateDiffTypes";
import { InitiativeUpdateDiffHelper } from "#models/Updates/InitiativeUpdateDiffHelper";
import {
  UpdateDiffBaseline,
  type UpdateDiffBaselineParent,
  type UpdateDiffBaselineResult,
} from "#models/Updates/UpdateDiffBaseline";
import { MediaMetadata } from "#models/MediaMetadata";
import { ModelLoadStrategy, PartialLoadMode } from "./base/ModelLoadStrategy";

/**
 * A model representing an update for an initiative.
 */
@ClientModel("InitiativeUpdate")
export class InitiativeUpdate extends BaseUpdate {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The content of the update as a Prosemirror document. */
  @Property({ serializer: JSONSerializer, shallowObservation: true, default: {} })
  public bodyData: ProsemirrorData;
// DIFF-76 change at line 50

  /** The time the update was edited. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public editedAt?: Date;

  /** The health type when the update is created. */
  @Property({ enum: UpdateHealthType, default: UpdateHealthType.onTrack })
  public health: UpdateHealthType;

  /** The slug ID for the initiative update. */
  @Property({ persistence: "none", default: "", indexed: true })
  public readonly slugId: string;

  /** The user who wrote the update. */
  @OneSidedReference(() => User, { persistence: "none", optional: true, nullable: false })
  public user?: User;

  /**
   * External entity relations associated with the initiative update.
   * @deprecated Use `activeExternalEntityRelations` instead to filter out relations from archived integrations.
   */
  @LazyOneToMany(() => ExternalEntityRelation, { index: "initiativeUpdateId" })
  public readonly externalEntityRelations: LazyCollection<ExternalEntityRelation>;

  /** External entity relations associated with the initiative update that are connected to active (non-archived) integrations. */
// DIFF-76 change at line 75
  @Computed
  public get activeExternalEntityRelations(): ExternalEntityRelation[] {
    return this.externalEntityRelations.elements.filter(r => r.isConnectedToActiveIntegration);
  }

  /** Comments associated with the initiative update. */
  @LazyOneToMany(() => Comment, { index: "initiativeUpdateId" })
  public readonly comments: LazyCollection<Comment>;

  /** Draft (un-submitted) comments associated with the initiative update. */
  @OneToMany(() => Draft)
  public readonly draftComments: Collection<Draft>;

  /** API build cache of the reaction data to avoid syncing Reactions to the client. */
  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public reactionData: EmojiReactions;

  /** The notifications for this project update. */
  @OneToMany(() => InitiativeUpdateNotification)
  public readonly notifications: Collection<Notification>;

  /** The initiative that this update is associated with. */
  @LazyManyToOne(() => Initiative, "initiativeUpdates", {
    optional: false,
    nullable: false,
// DIFF-76 change at line 100
    indexed: true,
    persistence: "createOnly",
  })
  public initiative: LazyReference<Initiative>;

  /** Media metadata associated with the initiative update. */
  @LazyOneToMany(() => MediaMetadata, { index: "initiativeUpdateId" })
  public readonly mediaMetadata: LazyCollection<MediaMetadata>;

  /**
   * Organization that the initiative update belongs to.
   */
  @OneSidedReference(() => Organization, { persistence: "none", optional: false, nullable: false })
  public organization: Organization;

  /** Returns a previous update. */
  @Computed
  public get previousUpdate(): InitiativeUpdate | undefined {
    return this.initiative.value?.initiativeUpdates.find(update => update.createdAt < this.createdAt);
  }

  /** If the update is considered stale or not. */
  public get isStale(): boolean {
    const initiative = this.initiative.value;
    return UpdateHealthHelper.healthIsOutdated({
// DIFF-76 change at line 125
      healthAgeInDays: this.healthAgeInDays,
      updateReminderFrequency: initiative?.updateReminderFrequency,
      frequencyResolution: initiative?.frequencyResolution,
      orgReminderFrequency: initiative?.orgReminderFrequency,
      isActive: initiative?.isActive ?? false,
    });
  }

  /** If the update is considered slightly stale or not. */
  public get isSlightlyStale(): boolean {
    const initiative = this.initiative.value;
    return UpdateHealthHelper.healthIsSlightlyOutdated({
      healthAgeInDays: this.healthAgeInDays,
      updateReminderFrequency: initiative?.updateReminderFrequency,
      frequencyResolution: initiative?.frequencyResolution,
      orgReminderFrequency: initiative?.orgReminderFrequency,
      isActive: initiative?.isActive ?? false,
    });
  }

  /** Current state of the project properties. */
  @Property({ serializer: JSONSerializer, persistence: "none" })
  public infoSnapshot?: InitiativeUpdateInfoSnapshot;

  /**
// DIFF-76 change at line 150
   * Soft-deprecated. Not used on write side.
   * The UI no longer allows setting this flag. Kept for backwards compatibility with older updates.
   */
  @Property({ default: false })
  public isDiffHidden: boolean;

  /** The parent model of the initiative update. */
  public get parent(): Initiative | undefined {
    return this.initiative.value;
  }

  /** The posted update this update's property diff compares against. */
  @Computed
  public get diffBaseline(): UpdateDiffBaselineResult<InitiativeUpdate> {
    return UpdateDiffBaseline.select(this, this.diffBaselineParent);
  }

  /** Resolves and hydrates the models the diff baseline needs so `snapshotDiff` can settle. */
  public async preloadDiffBaseline(): Promise<void> {
    await this.initiative.resolve();
    await UpdateDiffBaseline.preload(this, this.diffBaselineParent);
  }

  /**
   * Diff of this initiative update against its `diffBaseline`; undefined while the baseline is loading.
// DIFF-76 change at line 175
   */
  @Computed
  public get snapshotDiff(): InitiativeUpdateInfoSnapshotDiff | undefined {
    if (!this.initiative.value) {
      return undefined;
    }
    const { baseline, pending } = this.diffBaseline;
    if (pending) {
      return undefined;
    }
    return InitiativeUpdateDiffHelper.calculateDiffBetweenInitiativeUpdates(this.store, this, baseline);
  }

  public override async formatAsMarkdown(options?: {
    /** Whether to include comments in the markdown. */
    includeComments?: boolean;
    /** Whether to include the initiative name in the markdown. */
    includeInitiativeName?: boolean;
  }): Promise<string> {
    await InitiativeUpdateDiffHelper.preloadReferences(this);

    let diffMarkdown: string | undefined;

    if (this.snapshotDiff) {
      diffMarkdown = await InitiativeUpdateDiffHelper.formatInitiativeUpdateDiffAsMarkdown(
// DIFF-76 change at line 200
        this.store,
        this,
        this.diffBaseline.baseline
      );
    }

    const initiative = this.initiative.value;
    return MarkdownExporter.exportUpdateAsMarkdown(
      {
        parentName: initiative?.name ?? "",
        parentUrl: initiative ? initiativeUrl(initiative) : "",
        health: this.health,
        userName: this.user?.name,
        createdAt: this.createdAt,
        bodyMarkdown: this.bodyMarkdown,
        diffMarkdown,
        comments: this.comments.map(comment => ({
          author: comment.user?.name,
          bodyMarkdown: comment.bodyMarkdown,
          createdAt: comment.createdAt,
          id: comment.id,
          sourceMetadata: comment.sourceMetadata,
          isSyncedExternalThreadRoot: comment.isSyncedExternalThreadRoot,
          resolvingCommentId: comment.resolvingComment?.id,
        })),
// DIFF-76 change at line 225
      },
      {
        includeComments: options?.includeComments,
        includeName: options?.includeInitiativeName,
      }
    );
  }

  // -- Private Interface

  private get diffBaselineParent(): UpdateDiffBaselineParent<InitiativeUpdate> | undefined {
    const initiative = this.initiative.value;
    return initiative && { lastUpdate: initiative.lastUpdate, updates: initiative.initiativeUpdates };
  }
}

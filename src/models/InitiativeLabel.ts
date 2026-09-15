// DIFF-76: modified fixture
import sample from "lodash/sample";
import { ViewType } from "@linear/common/views/ViewType";
import { SortHelper } from "@linear/common/utils/SortHelper";
import { ColorPickerColors } from "@linear/common/icons/ColorPickerColors";
import { LabelType } from "@linear/common/models/BaseLabelHelper";
import { Quota } from "@linear/common/quotas/QuotaRegistry";
import { BatchOperationStatus, BatchOperationType } from "@linear/common/models/BatchOperation";
import { ReadOnlyReason } from "@linear/common/models/ReadOnlyReason";
import { Organization } from "#models/Organization";
import type { Team } from "#models/Team";
import { User } from "#models/User";
import {
  ClientModel,
  ManyToOne,
  LazyManyToOne,
  LazyOneToMany,
  Property,
  OneSidedReference,
  Computed,
  OneToOne,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import type { LazyCollection } from "#models/collections/LazyCollection";
// DIFF-76 change at line 25
import { Collection } from "#models/collections/Collection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import { LazyReference } from "#models/hydration/Lazy";
import type { InlineFindable } from "#models/InlineFindable";
import { deburr } from "#utils/deburr";
import { LazyCombinedCollection } from "#models/collections/LazyCombinedCollection";
import { Initiative } from "#models/Initiative";
import type { BaseLabel } from "#models/BaseLabel";
import { type FavoritableModel, Favorite } from "#models/Favorite";
import { ViewPreferences } from "#models/ViewPreferences";
import type { Hydrated } from "#models/base/ModelTypes";
import { DateTimeSerializer } from "#models/serialization/Serialization";

/**
 * A model representing an initiative label.
 */
@ClientModel("InitiativeLabel")
export class InitiativeLabel
  extends DeletableModel
  implements FavoritableModel, InlineFindable, BaseLabel<InitiativeLabel>
{
  public static override readonly loadStrategy = ModelLoadStrategy.lazy;

  /**
   * Hydrate a collection of initiative labels and resolve their parent and
// DIFF-76 change at line 50
   * children references.
   */
  public static async hydrateWithLabelGroups(collection: LazyCollection<InitiativeLabel>): Promise<void> {
    await collection.hydrate();
    await Promise.all(
      collection.elements.flatMap(label => {
        const promises: PromiseLike<unknown>[] = [];
        if (label.parent) {
          promises.push(label.parent.resolve());
        }
        promises.push(label.children.hydrate());
        return promises;
      })
    );
  }

  /** The label's name. */
  @Property({ default: "" })
  public name: string;

  /** The label's description. */
  @Property()
  public description?: string;

  /** The label's color. */
// DIFF-76 change at line 75
  @Property({ default: "#f00" })
  public color: string;

  /** The date when the label was last applied to an initiative. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public lastAppliedAt?: Date;

  /** When the label was retired. */
  @Property({ serializer: DateTimeSerializer })
  public retiredAt?: Date;

  /** The user who retired the label. */
  @OneSidedReference(() => User, {
    persistence: "none",
    optional: true,
    nullable: false,
  })
  public retiredBy?: User;

  /** Whether the label is a group. */
  @Property({ default: false })
  public isGroup: boolean;

  /** The organization with which the label is associated with. */
  @ManyToOne(() => Organization, "allInitiativeLabels", {
// DIFF-76 change at line 100
    optional: false,
    nullable: false,
    persistence: "none",
    indexed: true,
  })
  public organization: Organization;

  /** References a favorite model if the label has been favorited. */
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /** Initiatives associated with this label. */
  @LazyOneToMany(() => Initiative, { index: "labelIds" })
  public readonly initiatives: LazyCollection<Initiative>;

  /** The user who created the label. */
  @OneSidedReference(() => User, {
    persistence: "none",
    optional: true,
    nullable: false,
  })
  public creator?: User;

  /** The parent label, if the label is a child. */
  @LazyManyToOne(() => InitiativeLabel, "children", {
// DIFF-76 change at line 125
    optional: true,
    nullable: false,
    indexed: true,
    cascadeHydration: true,
  })
  public parent?: LazyReference<InitiativeLabel>;

  /** Child labels for this label. */
  @LazyOneToMany(() => InitiativeLabel, { index: "parentId", order: new CollectionOrder("name") })
  public readonly children: LazyCollection<InitiativeLabel>;

  /** View preferences associated with the initiative label. */
  @LazyOneToMany(() => ViewPreferences, {
    index: "initiativeLabelId",
    canSkipHydration: self => self.organization.viewPreferences.isHydrated(),
  })
  public readonly viewPreferences: LazyCollection<ViewPreferences>;

  /** The URL identifier for the label. */
  public get identifier(): string {
    return this.name.toLowerCase().replace(/[^\w]/g, "_");
  }

  /** @inheritdoc */
  public get team() {
// DIFF-76 change at line 150
    return undefined;
  }

  /** @inheritdoc */
  public get inheritedFrom() {
    return undefined;
  }

  /** @inheritdoc */
  public get inheritedBy(): Collection<InitiativeLabel> {
    return new Collection(InitiativeLabel);
  }

  /**
   * Returns the normalized name of the label for sorting purposes.
   *
   * @returns The normalized name of the label.
   */
  @Computed
  public get sortName() {
    return SortHelper.normalizeString(this.name);
  }

  /**
   * Returns all initiatives associated with a label. If the label has child labels their initiatives will be included.
// DIFF-76 change at line 175
   *
   * @returns A collection of initiatives.
   */
  @Computed
  public get allInitiatives(): LazyCombinedCollection<Initiative> {
    return new LazyCombinedCollection(Initiative, [this.initiatives, ...this.children.map(c => c.initiatives)]);
  }

  /**
   * Whether the label is a group, child, or root label.
   *
   * @returns The type of label it is.
   */
  @Computed
  public get type(): LabelType {
    return this.children.length > 0 ? LabelType.Group : this.parent ? LabelType.Child : LabelType.Root;
  }

  /**
   * Returns whether the label is retired.
   */
  @Computed
  public get isRetired(): boolean {
    return !!this.retiredAt || !!this.parent?.value?.isRetired;
  }
// DIFF-76 change at line 200

  /** Initiative labels do not have a team, so they will not inherit read-only states. */
  public get isInheritedReadOnly(): ReadOnlyReason | undefined {
    return undefined;
  }

  public override get isReadOnly(): ReadOnlyReason | undefined {
    if (this.isArchived) {
      return ReadOnlyReason.archived;
    }
    if (this.isRetired) {
      return ReadOnlyReason.archived;
    }
    return this.isInheritedReadOnly;
  }

  /** @inheritdoc */
  @Computed
  public get usedByTriageRuleCount(): number {
    return 0;
  }

  /** @inheritdoc */
  @Computed
  public get usedBySLARuleCount(): number {
// DIFF-76 change at line 225
    return 0;
  }

  @Computed
  public get isInBatchOperation(): boolean {
    if (this.parent?.value?.isInBatchOperation) {
      return true;
    }

    const batchOperations = this.organization?.batchOperations;
    if (!batchOperations) {
      return false;
    }

    const operationTypes = [BatchOperationType.LabelMerge];
    const operations = batchOperations.filter(operation => {
      return operation.status !== BatchOperationStatus.finished && operationTypes.includes(operation.type);
    });

    return !!operations.find(operation => {
      if (operation.type === BatchOperationType.LabelMerge) {
        const { toLabelId, fromLabelIds = [] } = operation.parameters?.labelMergeParameters || {};
        return toLabelId === this.id || fromLabelIds.includes(this.id);
      }
      return false;
// DIFF-76 change at line 250
    });
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  public toggleFavorite = (): Favorite | false => {
    if (this.favorite) {
      this.favorite.delete();
      return false;
    } else {
      const newFavorite = Favorite.create({ reference: this });
      newFavorite.save(true);
      return newFavorite;
    }
  };

  /** View preferences for the label. */
  public getViewPreferences(this: Hydrated<InitiativeLabel>): ViewPreferences {
    return this._viewPreferences;
  }

  /** Keep it private and expose it through a function to be able to type `this` as Hydrated. */
// DIFF-76 change at line 275
  @Computed
  private get _viewPreferences(): ViewPreferences {
    return ViewPreferences.getOrCreateFrom(this.viewPreferences, ViewType.initiativeLabel, { initiativeLabel: this });
  }

  /** @inheritdoc */
  public getActualLabel(): InitiativeLabel {
    return this;
  }

  /** @inheritdoc */
  public getOwner(): Team | Organization {
    return this.organization;
  }

  /** @inheritdoc */
  public getUsedByCount(_options?: { hydrated?: boolean }): number {
    return this.allInitiatives.length;
  }

  /** @inheritdoc */
  public getAssociatedModels(): Initiative[] {
    return this.initiatives.elements;
  }

// DIFF-76 change at line 300
  /** @inheritdoc */
  public getIsExternal(): boolean {
    return false;
  }

  /** @inheritdoc */
  public getMaxLabelsPerGroupQuota(): Quota {
    return Quota.maxInitiativeLabelsPerGroup;
  }

  /** Create a new initiative label. */
  public static create({
    parent,
    owner,
    isGroup,
  }: {
    parent?: InitiativeLabel;
    owner: Team | Organization;
    isGroup?: boolean;
  }): InitiativeLabel {
    const label = InitiativeLabel.createEmpty();
    label.parent = parent ? LazyReference.wrap(parent) : undefined;
    label.name = "";
    label.organization = owner instanceof Organization ? owner : owner.organization;
    label.color = parent?.color ?? sample(ColorPickerColors.colorsList) ?? ColorPickerColors.defaultTeamIconBackground;
// DIFF-76 change at line 325
    label.isGroup = isGroup ?? false;
    return label;
  }

  /** @inheritdoc */
  public matchInlineFind(query: string) {
    const name = [this.name, this.parent?.value?.name].concrete().join("   ");
    return deburr(name).toLowerCase().indexOf(query) !== -1;
  }
}

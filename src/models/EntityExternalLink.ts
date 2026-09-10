// DIFF-76: modified fixture
import { EntityExternalLinkHelper } from "@linear/common/models/EntityExternalLinkHelper";
import { Config } from "#config";
import { getStore } from "#store";
import { RoutesHelper } from "#utils/RoutesHelper";
import { ClientModel, Computed, ManyToOne, Property, OneSidedReference, LazyManyToOne } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { Document } from "#models/Document";
import { User } from "#models/User";
import { Project } from "#models/Project";
import { Initiative } from "#models/Initiative";
import { Issue } from "#models/Issue";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { Team } from "#models/Team";
import { Release } from "#models/Release";
import { Cycle } from "#models/Cycle";
import { CustomView } from "#models/CustomView";
import { Dashboard } from "#models/Dashboard";
import { ResourceFolder } from "#models/ResourceFolder";
import type { LazyReference } from "#models/hydration/Lazy";
import { deburr } from "#utils/deburr";
import type { InlineFindable } from "#models/InlineFindable";

/**
 * A link for an external resource.
// DIFF-76 change at line 25
 */
@ClientModel("EntityExternalLink")
export class EntityExternalLink extends DeletableModel implements InlineFindable {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;

  /** Link URL. */
  @Property({ default: "" })
  public url: string;

  /** Link label. */
  @Property({ default: "" })
  public label: string;

  /** The order of the link in the project resources. */
  @Property({ default: 0 })
  public sortOrder: number;

  /** The initiative this link belongs to. */
  @LazyManyToOne(() => Initiative, "links", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public initiative?: LazyReference<Initiative>;
// DIFF-76 change at line 50

  /** The project this link belongs to. */
  @LazyManyToOne(() => Project, "links", { optional: true, nullable: false, indexed: true, persistence: "createOnly" })
  public project?: LazyReference<Project>;

  /** The team this link belongs to. */
  @ManyToOne(() => Team, "links", { optional: true, nullable: false, indexed: true, persistence: "createOnly" })
  public team?: Team;

  /** The release this link belongs to. */
  @LazyManyToOne(() => Release, "links", { optional: true, nullable: false, indexed: true, persistence: "createOnly" })
  public release?: LazyReference<Release>;

  /** The cycle this link belongs to. */
  @LazyManyToOne(() => Cycle, "links", { optional: true, nullable: false, indexed: true, persistence: "createOnly" })
  public cycle?: LazyReference<Cycle>;

  /** The resource folder this link belongs to. */
  @LazyManyToOne(() => ResourceFolder, "links", { nullable: true, indexed: true })
  public resourceFolder?: LazyReference<ResourceFolder>;

  /** The user who created the link. */
  @OneSidedReference(() => User, { nullable: true, persistence: "none" })
  public creator?: User;

// DIFF-76 change at line 75
  /**
   * Returns the parent entity of the link.
   */
  public get parent(): EntityExternalLinkParent | undefined {
    return this.initiative?.value ?? this.project?.value ?? this.team ?? this.release?.value ?? this.cycle?.value;
  }

  /**
   * Get the label of the link. If the label is still the generic URL-derived placeholder for an internal link, try to
   * find a better label from a local model.
   */
  @Computed
  public get enrichedLabel() {
    const derivedLabel = EntityExternalLinkHelper.deriveLabelFromUrl(this.url);
    const hasGenericLabel = this.label === Config.CLIENT_HOSTNAME || this.label === derivedLabel;

    if (!hasGenericLabel) {
      return this.label;
    }

    const model = RoutesHelper.getModelFromUrl(getStore(), this.url);

    if (model) {
      if (model instanceof Issue) {
        return model.title;
// DIFF-76 change at line 100
      } else if (model instanceof Document) {
        return model.displayTitle;
      } else if (model instanceof Cycle) {
        return model.displayName;
      } else if (model instanceof Dashboard) {
        return model.displayName;
      } else if (
        model instanceof CustomView ||
        model instanceof Initiative ||
        model instanceof Project ||
        model instanceof Team ||
        model instanceof Release
      ) {
        return model.name;
      }
    }

    return derivedLabel;
  }

  /**
   * The local document this link points to, if the URL is an internal document URL and the document is in memory.
   */
  @Computed
  public get resolvedDocument(): Document | undefined {
// DIFF-76 change at line 125
    const model = RoutesHelper.getModelFromUrl(getStore(), this.url);
    return model instanceof Document ? model : undefined;
  }

  // -- Helpers

  /**
   * Sets the label to the provided value or falls back to the URL for a label. Can throw errors.
   */
  public setLabel(label?: string) {
    if (label) {
      this.label = label;
    } else if (this.url) {
      this.label = EntityExternalLinkHelper.deriveLabelFromUrl(this.url);
    }
  }

  /** @inheritdoc */
  public matchInlineFind(query: string): boolean {
    return deburr(this.enrichedLabel).toLowerCase().indexOf(query) !== -1;
  }
}

/**
 * The parent entity type of an external link.
// DIFF-76 change at line 150
 */
export type EntityExternalLinkParent = Initiative | Project | Team | Release | Cycle;

/**
 * The type of the parent entity type of an external link.
 */
export type EntityExternalLinkParentType =
  | typeof Initiative
  | typeof Project
  | typeof Team
  | typeof Release
  | typeof Cycle;

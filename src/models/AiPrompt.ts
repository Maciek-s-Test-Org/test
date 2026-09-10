import { getEmptyDocument } from "@linear/editor/schema";
import type { ProsemirrorData } from "@linear/editor/types";
import {
  Action,
  ClientModel,
  LazyManyToOne,
  LazyOneSidedReference,
  LazyOneToMany,
  ManyToOne,
  OneSidedReference,
  Property,
} from "#models/base/Decorators";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { User } from "#models/User";
import { Organization } from "#models/Organization";
import { Team } from "#models/Team";
import type { LazyCollection } from "#models/collections/LazyCollection";
import type { LazyReference } from "#models/hydration/Lazy";

@ClientModel("AiPrompt")
export class AiPrompt extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /**
   * Factory method to create a new AI Prompt.
   *
   * @param props The properties to create the AI Prompt with.
   * @returns The created AI Prompt.
   */
  @Action
  public static create({
    bodyData = getEmptyDocument(),
    color,
    icon,
    owner,
    creator,
    team,
    title = "",
  }: {
    bodyData?: ProsemirrorData;
    color?: string;
    icon?: string;
    owner?: User;
    creator: User;
    team?: Team;
    title?: string;
  }): AiPrompt {
    const prompt = AiPrompt.createEmpty();
    prompt.title = title;
    prompt.owner = owner ?? creator;
    prompt.creator = creator;
    prompt.team = team;
    prompt.icon = icon;
    prompt.color = color;
    prompt.bodyData = bodyData;
    return prompt;
  }

  /** The ai prompt's organization. */
  @ManyToOne(() => Organization, "skills", { optional: false, nullable: false, indexed: true, persistence: "none" })
  public organization: Organization;

  /** The team that this ai prompt belongs to, if any. */
  @ManyToOne(() => Team, "skills", { optional: true, nullable: false, indexed: true })
  public team?: Team;

  /** The original parent-team skill this skill was inherited from. Server-owned. */
  @LazyManyToOne(() => AiPrompt, "inheritedBy", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public inheritedFrom?: LazyReference<AiPrompt>;

  /** The original skill at the top of the `inheritedFrom` chain. Null if the skill is not inherited. Server-owned. */
  @LazyOneSidedReference(() => AiPrompt, {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "none",
    // Mirror the server FK: deletes null the root reference, archives leave it untouched.
    onDelete: "SET NULL",
    onArchive: "NO ACTION",
  })
  public inheritedFromRoot?: LazyReference<AiPrompt>;

  /** The ID of the original skill at the top of the `inheritedFrom` chain. */
  declare public inheritedFromRootId?: string;

  /** The skills inherited from this skill by sub-teams. */
  @LazyOneToMany(() => AiPrompt, { index: "inheritedFromId" })
  public readonly inheritedBy: LazyCollection<AiPrompt>;

  /** The owner of the ai prompt entry. */
  @OneSidedReference(() => User, { optional: false, nullable: false, indexed: true, persistence: "none" })
  public owner: User;

  /** The user who created the prompt. */
  @OneSidedReference(() => User, { optional: false, nullable: false, indexed: true, persistence: "none" })
  public creator: User;

  /** The user who last updated the prompt. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true, indexed: true })
  public lastUpdatedBy: User;

  /**
   * Whether the prompt is shared with everyone in the organization. Server-owned: hydrated from sync but never set on
   * the client, so it is not sent in create/update mutations (`persistence: "none"`).
   */
  @Property({ default: false, persistence: "none" })
  public shared: boolean;

  /** The content of the prompt as a ProseMirror document. */
  @Property({ serializer: JSONSerializer, shallowObservation: true, default: () => getEmptyDocument() })
  public bodyData: ProsemirrorData;

  /** The description of the skill. */
  @Property({ persistence: "none" })
  public readonly description?: string;

  /** Hash of the skill content that should be described. */
  @Property({ persistence: "none" })
  public readonly contentHash?: string;

  /** Hash of the skill content that the description describes. */
  @Property({ persistence: "none" })
  public readonly descriptionContentHash?: string;

  /** The title of the prompt. */
  @Property({ default: "" })
  public title: string;

  /** The icon of the prompt. */
  @Property()
  public icon?: string;

  /** The color of the prompt icon. */
  @Property()
  public color?: string;

  /** The slug ID for the prompt. */
  @Property({ persistence: "none", default: "", indexed: true })
  public readonly slugId: string;

  /** When the skill was last used by anyone in the workspace. Server-owned. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public readonly lastUsedAt?: Date;

  /** The number of times the skill was used by anyone in the workspace in the last 30 days. Server-owned. */
  @Property({ persistence: "none", default: 0 })
  public readonly recentUsageCount: number;

  /** Resolves an inherited copy to its source — falling back to the highest ancestor currently loaded — for deduping; else itself. */
  public getActualSkill(): AiPrompt {
    return this.inheritedFromRoot?.value ?? this.inheritedFrom?.value?.getActualSkill() ?? this;
  }

  /** Whether description generation is pending for the current skill content. */
  public get isDescriptionPending(): boolean {
    return Boolean(this.contentHash) && this.descriptionContentHash !== this.contentHash;
  }
}

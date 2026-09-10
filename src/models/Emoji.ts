import type { EmojiSource } from "@linear/common/models/EmojiSource";
import { Organization } from "#models/Organization";
import { User } from "#models/User";
import { ClientModel, ManyToOne, Property, OneSidedReference } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { HydrateAfterStartupPriority } from "#models/hydration/AfterStartupPrehydrator";
import { deburr } from "#utils/deburr";

/**
 * A model representing an emoji.
 */
@ClientModel("Emoji")
export class Emoji extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  @Property({ indexed: true, default: "", static: true })
  public name: string;

  @Property({ default: "", static: true })
  public url: string;

  @Property({ persistence: "none" })
  public color?: string;

  @Property({ persistence: "none", default: "user", static: true })
  public readonly source: EmojiSource;

  /** The user who added the emoji. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public creator?: User;

  /** The organization to which the emoji belongs to. */
  @ManyToOne(() => Organization, "emojis", { optional: false, nullable: false, indexed: true, persistence: "none" })
  public organization: Organization;

  /**
   * Returns true if the model matches the query.
   *
   * @param query The query to match against.
   * @returns True if the model matches the query, false otherwise.
   */
  public matchInlineFind(query: string): boolean {
    return (
      deburr([this.name, this.creator?.name, this.creator?.displayName].concrete().join(" "))
        .toLowerCase()
        .indexOf(query) !== -1
    );
  }

  /** inheritdoc */
  public static override hydrateAfterStartupConfig = {
    priority: HydrateAfterStartupPriority.low,
    execute: async (organization: Organization) => {
      await organization.emojis.hydrate();
    },
  };
}

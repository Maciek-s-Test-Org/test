// DIFF-76: modified fixture
import type { ActivityEvent } from "@linear/common/models/Activity";
import type { EmojiHelper as EmojiHelperType } from "#utils/EmojiHelper";
import type { InlineFindable } from "#models/InlineFindable";
import { Issue } from "#models/Issue";
import { User } from "#models/User";
import { ClientModel, Property, ManyToOne, LazyManyToOne } from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import type { LazyReference } from "#models/hydration/Lazy";
import { Logger } from "#logging/Logger";

// Lazy load EmojiHelper to avoid bloating the initial bundle with emoji data.
let EmojiHelper: typeof EmojiHelperType | undefined;
void import("#utils/EmojiHelper").then(module => {
  EmojiHelper = module.EmojiHelper;
});

/**
 * A record of users activity.
 */
@ClientModel("Activity")
export class Activity extends Model implements InlineFindable {
  /** User who triggered this activity. */
  @ManyToOne(() => User, "activities", { persistence: "none", optional: true, nullable: false, indexed: true })
  public readonly user?: User;
// DIFF-76 change at line 25

  /** The issue that the activity is connected to. */
  @LazyManyToOne(() => Issue, "activities", {
    persistence: "none",
    nullable: true,
    indexed: true,
  })
  public issue?: LazyReference<Issue>;

  /**
   * The ID of the issue that the activity is connected to.
   * Created by the LazyManyToOne decorator - do NOT add a Property decorator.
   */
  declare public issueId?: string;

  /**
   * The activity events.
   * Multiple events belonging to the same issue in certain time period are grouped under one Activity.
   */
  @Property({ default: [] })
  public events: ActivityEvent[];

  /**
   * Returns true if the model matches the query.
   *
// DIFF-76 change at line 50
   * @param query The query to match against.
   * @returns True if the model matches the query, false otherwise.
   */
  public matchInlineFind(query: string): boolean {
    if (this.issue?.value?.matchInlineFind(query)) {
      return true;
    }
    return this.events.some(event => {
      if ("issueTitle" in event && event.issueTitle.toLowerCase().includes(query)) {
        return true;
      }
      if ("commentText" in event && event.commentText.toLowerCase().includes(query)) {
        return true;
      }
      if ("reactions" in event) {
        if (!EmojiHelper) {
          Logger.warning("EmojiHelper not loaded, skipping emoji search");
          return false;
        }
        const emoji = EmojiHelper.findNativeBySymbol(query);
        if (
          event.reactions.some(
            r => r.emoji.toLowerCase().includes(query) || (emoji && r.emoji.toLowerCase().includes(emoji.name))
          )
        ) {
// DIFF-76 change at line 75
          return true;
        }
      }

      return false;
    });
  }
}

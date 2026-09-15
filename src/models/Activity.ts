import type { ActivityEvent } from "@linear/common/models/Activity";
import type { EmojiHelper as EmojiHelperType } from "#utils/EmojiHelper";
import type { InlineFindable } from "#models/InlineFindable";
import { Issue } from "#models/Issue";
import { User } from "#models/User";
import { ClientModel, Property, ManyToOne, LazyManyToOne, Computed } from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import type { LazyReference } from "#models/hydration/Lazy";

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
  /** Maximum number of events shown before expanding an activity. */
  public static readonly previewLimit = 5;

  /** User who triggered this activity. */
  @ManyToOne(() => User, "activities", { persistence: "none", optional: true, nullable: false, indexed: true })
  public readonly user?: User;

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
   * @param query The query to match against.
   * @returns True if the model matches the query, false otherwise.
   */
  public matchInlineFind(query: string): boolean {
    query = query.trim().toLowerCase();
    if (!query) {
      return true;
    }

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
          return false;
        }
        const emoji = EmojiHelper.findNativeBySymbol(query);
        if (
          event.reactions.some(
            r => r.emoji.toLowerCase().includes(query) || (emoji && r.emoji.toLowerCase().includes(emoji.name))
          )
        ) {
          return true;
        }
      }

      return false;
    });
  }

  /** Events shown in the collapsed activity row. */
  @Computed
  public get previewEvents(): ActivityEvent[] {
    return this.events.slice(-Activity.previewLimit);
  }

  /** Number of events hidden by the collapsed view. */
  @Computed
  public get hiddenEventCount(): number {
    return Math.max(0, this.events.length - Activity.previewLimit);
  }
}

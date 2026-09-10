import { getWeek } from "date-fns";
import type { ProsemirrorData } from "@linear/editor/types";
import { MarkdownTransformer } from "@linear/editor/markdown/MarkdownTransformer";
import type { TimelessDate } from "@linear/common/types/TimelessDate";
import { Computed, ClientModel, Property, ManyToOne } from "#models/base/Decorators";
import { JSONSerializer, TimelessDateSerializer } from "#models/serialization/Serialization";
import { DeletableModel } from "#models/base/Model";
import { User } from "#models/User";
import type { Hydrated } from "#models/base/ModelTypes";

/**
 * A document for a project.
 */
@ClientModel("DiaryEntry")
export class DiaryEntry extends DeletableModel {
  /** The content of the diary entry in Prosemirror document. */
  @Property({ serializer: JSONSerializer, shallowObservation: true })
  public bodyData?: ProsemirrorData;

  /** The owner of the diary entry. */
  @ManyToOne(() => User, "diaryEntries", { persistence: "none", optional: false, nullable: false })
  public user: User;

  /** The estimated completion date of the project. */
  @Property({ serializer: TimelessDateSerializer, default: () => new Date().toTimelessDate() })
  public date: TimelessDate;

  /** Get document content in Markdown format. */
  @Computed
  public get markdownContent(): string {
    return this.bodyData ? MarkdownTransformer.serialize(this.bodyData) : "";
  }

  /** Get a unique key for the week of the entry. */
  @Computed
  public get weekKey(): string {
    return "" + getWeek(this.date.toLocalDate()) + this.date.toLocalDate().getFullYear();
  }

  /**
   * Factory method to create a new document.
   *
   * @param props The properties to create the document with.
   * @returns The created document.
   */
  public static create(props: CreateProps): Hydrated<DiaryEntry> {
    const diaryEntry = DiaryEntry.createEmpty();
    diaryEntry.user = props.user;
    diaryEntry.date = new Date().toTimelessDate();
    return diaryEntry;
  }
}

type CreateProps = {
  /** The creator of the diary. */
  user: User;
};

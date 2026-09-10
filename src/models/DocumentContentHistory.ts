import type { ProsemirrorData } from "@linear/editor/types";
import type { DocumentContentHistoryMetadata } from "@linear/common/models/DocumentContentHistoryEntry";
import { Model } from "#models/base/Model";
import { ClientModel, Property, ManyToMany, LazyOneSidedReference } from "#models/base/Decorators";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import { DocumentContent } from "#models/DocumentContent";
import { User } from "#models/User";
import type { Collection } from "#models/collections/Collection";
import type { LazyReference } from "#models/hydration/Lazy";

/** Entity representing a history item for document content.  */
@ClientModel("DocumentContentHistory")
export class DocumentContentHistory extends Model {
  public static override readonly loadStrategy = ModelLoadStrategy.explicitlyRequested;

  /** The document content that this history item is associated with. */
  @LazyOneSidedReference(() => DocumentContent, { nullable: false, optional: false, indexed: true })
  public documentContent: LazyReference<DocumentContent>;

  /** The document content as Prosemirror document. */
  @Property({ serializer: JSONSerializer, shallowObservation: true, persistence: "none" })
  public readonly contentData?: ProsemirrorData;

  /** The actors which have contributed edits to the document content. */
  @ManyToMany(() => User)
  public readonly actors: Collection<User>;

  @Property({ serializer: DateTimeSerializer, default: () => new Date() })
  public contentDataSnapshotAt: Date;

  /**
   * Metadata associated with the history item.
   */
  @Property({ persistence: "none" })
  public readonly metadata?: DocumentContentHistoryMetadata;
}

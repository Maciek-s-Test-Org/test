// DIFF-76: modified fixture
import type { DocumentContentAgentCheckpointChanges } from "@linear/common/models/DocumentContentAgentCheckpointChanges";
import type { EntitySourceMetadata } from "@linear/common/models/EntitySourceMetadata";
import type { ProsemirrorData } from "@linear/editor/types";
import { Model } from "#models/base/Model";
import { ClientModel, LazyOneSidedReference, Property } from "#models/base/Decorators";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import { DocumentContent } from "#models/DocumentContent";
import type { LazyReference } from "#models/hydration/Lazy";

/** Whether a document-content agent checkpoint tracks live or draft content. */
export type DocumentContentAgentCheckpointMode = "draft" | "live";

/**
 * An AI-authored checkpoint for document content that can be restored from the client.
 */
@ClientModel("DocumentContentAgentCheckpoint")
export class DocumentContentAgentCheckpoint extends Model {
  public static override readonly loadStrategy = ModelLoadStrategy.explicitlyRequested;

  /** The document content that this checkpoint belongs to. */
  @LazyOneSidedReference(() => DocumentContent, {
    optional: false,
    nullable: false,
// DIFF-76 change at line 25
    indexed: true,
    persistence: "none",
  })
  public documentContent: LazyReference<DocumentContent>;

  /** Whether this checkpoint tracks live or draft content. */
  @Property({ default: "live" })
  public mode: DocumentContentAgentCheckpointMode;

  /** The AI conversation that produced the checkpoint. */
  @Property({ default: "" })
  public aiConversationId: string;

  /** The AI conversation turn that produced the checkpoint. */
  @Property({ default: "" })
  public aiConversationTurnId: string;

  /** Whether this checkpoint is the active head for its document, conversation, and mode. */
  @Property({ default: false })
  public isActive: boolean;

  /** Changed ranges for this checkpoint. */
  @Property({ serializer: JSONSerializer, shallowObservation: true })
  public changes?: DocumentContentAgentCheckpointChanges;

// DIFF-76 change at line 50
  /** The checkpoint snapshot as Prosemirror document content. */
  @Property({ serializer: JSONSerializer, shallowObservation: true, persistence: "none" })
  public readonly contentData?: ProsemirrorData;

  /** The document state immediately before the checkpoint edits were applied. */
  @Property({ serializer: JSONSerializer, shallowObservation: true, persistence: "none" })
  public readonly previousContentData?: ProsemirrorData;

  /** When the checkpoint snapshot was captured. */
  @Property({ serializer: DateTimeSerializer, default: () => new Date(), persistence: "none" })
  public contentDataSnapshotAt: Date;

  /** The user that invoked the agent for this checkpoint, if user-scoped. */
  @Property({ persistence: "none" })
  public invokedByUserId?: string;

  /** The workflow definition that owns this checkpoint, if workflow-scoped. */
  @Property({ persistence: "none" })
  public workflowDefinitionId?: string;

  /** Source metadata describing the agent or workflow that produced the checkpoint. */
  @Property({ persistence: "none" })
  public sourceMetadata?: EntitySourceMetadata;
}

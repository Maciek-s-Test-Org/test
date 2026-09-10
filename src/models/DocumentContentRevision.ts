import { Action, ClientModel, LazyOneToOne, Property } from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { YjsStateOptimizer } from "#models/serialization/ValueOptimizer";
import { DocumentContent } from "#models/DocumentContent";
import type { LazyReference } from "#models/hydration/Lazy";

/**
 * A pending revision of document content.
 */
@ClientModel("DocumentContentRevision")
export class DocumentContentRevision extends Model {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;

  /** The pending revision content state as a base64-encoded Yjs state update. */
  @Property({ optimizer: YjsStateOptimizer, default: "" })
  public contentState: string;

  /** The live document state that this revision was last refreshed from. */
  @Property({ optimizer: YjsStateOptimizer, persistence: "none", default: "" })
  public baseContentState: string;

  /** Workflow definition IDs that contributed to this revision. */
  @Property({ persistence: "none", default: [] })
  public contributorWorkflowDefinitionIds: string[];

  /** AI conversation (Loop run) IDs that contributed to this revision. */
  @Property({ persistence: "none", default: [] })
  public contributorAiConversationIds: string[];

  /** Short summary of the pending revision changes. */
  @Property({ persistence: "none" })
  public summary?: string;

  /** Hash of the revision state that should be summarized. */
  @Property({ persistence: "none" })
  public contentHash?: string;

  /** Hash of the revision state that the summary describes. */
  @Property({ persistence: "none" })
  public summaryContentHash?: string;

  /** Whether the summary describes the current revision content. */
  public get hasCurrentSummary(): boolean {
    return Boolean(this.summary) && Boolean(this.contentHash) && this.summaryContentHash === this.contentHash;
  }

  /** Whether summary generation is still pending for the current revision content. */
  public get isSummaryPending(): boolean {
    return !this.hasCurrentSummary;
  }

  /** The document content this revision targets. */
  @LazyOneToOne(() => DocumentContent, "revision", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public documentContent: LazyReference<DocumentContent>;

  /** Applies the revision to the original document and deletes the revision. */
  @Action
  public async apply(force: boolean = false): Promise<void> {
    const res = await this.store.graphQLClient.mutate<{
      documentContentRevisionApply: { lastSyncId: number };
    }>(
      `mutation { documentContentRevisionApply(id: "${this.id}", force: ${force ? "true" : "false"}) { success lastSyncId } }`
    );
    await this.store.syncClient.waitUntilSyncId(res.documentContentRevisionApply.lastSyncId);
  }

  /** Discards the revision and deletes it. */
  @Action
  public async discard(): Promise<void> {
    const res = await this.store.graphQLClient.mutate<{
      documentContentRevisionDiscard: { lastSyncId: number };
    }>(`mutation { documentContentRevisionDiscard(id: "${this.id}") { success lastSyncId } }`);
    await this.store.syncClient.waitUntilSyncId(res.documentContentRevisionDiscard.lastSyncId);
  }
}

import type { AiConversationPart, AiConversationStreamPart } from "@linear/common/models/AiConversation";
import { AiConversationTurnRole, AiConversationTurnStatus } from "@linear/common/models/AiConversationTurn";
import { Feature } from "#Features";
import { AiConversation } from "#models/AiConversation";
import { User } from "#models/User";
import {
  ClientModel,
  LazyManyToOne,
  LazyOneSidedReference,
  Property,
  StreamableProperty,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { LazyReference } from "#models/hydration/Lazy";
import { AiConversationPartsStreamHelper } from "#models/helpers/AiConversationPartsStreamHelper";

/**
 * A persisted turn within an AI conversation.
 */
@ClientModel("AiConversationTurn")
export class AiConversationTurn extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The conversation that this turn belongs to. */
  @LazyManyToOne(() => AiConversation, "turns", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public conversation: LazyReference<AiConversation>;

  /** The canonical insertion and display position of this turn in the conversation. */
  @Property({ persistence: "none", default: 0 })
  public position: number;

  /** The visible user or event turn this assistant turn responds to. */
  @LazyOneSidedReference(() => AiConversationTurn, {
    nullable: true,
    indexed: true,
    onDelete: "SET NULL",
    onArchive: "NO ACTION",
    persistence: "none",
  })
  public responseToTurn?: LazyReference<AiConversationTurn>;

  /** The ordered persisted and live-streamed parts belonging to this turn. */
  @StreamableProperty<AiConversationPart[], AiConversationStreamPart, AiConversationTurn>({
    persistence: "none",
    default: [],
    shouldSubscribe: model => ({
      subscribe:
        Feature.isEnabled(Feature.aiConversationTurnStreaming) &&
        model.role === AiConversationTurnRole.assistant &&
        model.status === AiConversationTurnStatus.active,
    }),
    reducer: AiConversationPartsStreamHelper.reduce,
    rebaser: AiConversationPartsStreamHelper.rebase,
    shouldUseStoredValueOnUnsubscribe: model => model.status !== AiConversationTurnStatus.active,
    shallowObservation: true,
  })
  public parts: AiConversationPart[];

  /** The authoritative lifecycle status of this assistant response. */
  @Property({ enum: AiConversationTurnStatus, persistence: "none" })
  public status?: AiConversationTurnStatus | null;

  /** The author role represented by this turn. */
  @Property({ enum: AiConversationTurnRole, persistence: "none", default: AiConversationTurnRole.user })
  public role: AiConversationTurnRole;

  /** The Linear user who authored this turn. */
  @LazyOneSidedReference(() => User, {
    nullable: true,
    indexed: true,
    persistence: "none",
  })
  public user?: LazyReference<User>;

  /** The external user identifier for the author. */
  @Property({ persistence: "none" })
  public externalUserId?: string | null;

  /** The display-name fallback for the author. */
  @Property({ persistence: "none" })
  public authorDisplayName?: string | null;
}

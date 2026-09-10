import {
  BatchOperationType,
  BatchOperationStatus,
  type BatchOperationResultUnionType,
  type BatchOperationParametersUnionType,
  type IssueSuggestionsParametersType,
  type LabelMoveParametersType,
  type LabelMergeParametersType,
  type IssueMoveTeamParametersType,
  type IssueCancelParametersType,
  type BatchOperationProgressType,
} from "@linear/common/models/BatchOperation";
import { ClientModel, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { Organization } from "#models/Organization";
import { User } from "#models/User";

/**
 * A model representing a batch operation.
 */
@ClientModel("BatchOperation")
export class BatchOperation extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  @ManyToOne(() => Organization, "batchOperations", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public organization: Organization;

  /** The user who created the batch operation. */
  @ManyToOne(() => User, "batchOperations", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public creator?: User;

  /** The type of the batch operation. */
  @Property({ persistence: "createOnly", default: BatchOperationType.IssueSuggestions })
  public type: BatchOperationType;

  /** The status of the batch operation. */
  @Property({ persistence: "none", default: BatchOperationStatus.created })
  public status: BatchOperationStatus;

  /** The parameters of the batch operation. */
  @Property({ persistence: "createOnly" })
  public parameters?: BatchOperationParametersUnionType;

  /** The result of the batch operation. */
  @Property({ persistence: "none" })
  public result?: BatchOperationResultUnionType;

  /** The progress of the batch operation. */
  @Property({ persistence: "none" })
  public progress?: BatchOperationProgressType;

  /**
   * Creates a new batch operation for issue suggestions.
   *
   * @param parameters The parameters of the batch operation.
   * @returns The created batch operation.
   */
  public static createIssueSuggestionsBatchOperation(parameters: IssueSuggestionsParametersType): BatchOperation {
    return BatchOperation.create({
      type: BatchOperationType.IssueSuggestions,
      parameters: {
        issueSuggestionsParameters: parameters,
      },
    });
  }

  /**
   * Creates a new batch operation for moving labels.
   *
   * @param parameters The parameters of the batch operation.
   * @returns The created batch operation.
   */
  public static createLabelMoveBatchOperation(parameters: LabelMoveParametersType): BatchOperation {
    return BatchOperation.create({
      type: BatchOperationType.LabelMove,
      parameters: {
        labelMoveParameters: parameters,
      },
    });
  }

  /**
   * Creates a new batch operation for merging labels.
   *
   * @param parameters The parameters of the batch operation.
   * @returns The created batch operation.
   */
  public static createLabelMergeBatchOperation(parameters: LabelMergeParametersType): BatchOperation {
    return BatchOperation.create({
      type: BatchOperationType.LabelMerge,
      parameters: {
        labelMergeParameters: parameters,
      },
    });
  }

  /**
   * Creates a new batch operation for moving issues to another team.
   *
   * @param parameters The parameters of the batch operation.
   * @returns The created batch operation.
   */
  public static createIssueMoveTeamBatchOperation(parameters: IssueMoveTeamParametersType): BatchOperation {
    return BatchOperation.create({
      type: BatchOperationType.IssueMoveTeam,
      parameters: {
        issueMoveTeamParameters: parameters,
      },
    });
  }

  /**
   * Creates a new batch operation for canceling issues.
   *
   * @param parameters The parameters of the batch operation.
   * @returns The created batch operation.
   */
  public static createIssueCancelBatchOperation(parameters: IssueCancelParametersType): BatchOperation {
    return BatchOperation.create({
      type: BatchOperationType.IssueCancel,
      parameters: {
        issueCancelParameters: parameters,
      },
    });
  }

  /**
   * Creates a new batch operation.
   *
   * @param props The properties of the batch operation.
   * @returns The created batch operation.
   */
  public static create(props: {
    type: BatchOperationType;
    parameters: BatchOperationParametersUnionType;
  }): BatchOperation {
    const { type, parameters } = props;
    const batchOperation = BatchOperation.createEmpty();
    batchOperation.type = type;
    batchOperation.parameters = parameters;
    return batchOperation;
  }
}

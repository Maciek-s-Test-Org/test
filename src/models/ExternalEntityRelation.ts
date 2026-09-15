// DIFF-76: modified fixture
import {
  type ExternalEntityRelationMetadata,
  type ExternalEntitySyncErrorMap,
  ExternalEntityType,
} from "@linear/common/models/ExternalEntityRelation";
import { Comment } from "#models/Comment";
import { Issue } from "#models/Issue";
import { Project } from "#models/Project";
import { ProjectUpdate } from "#models/ProjectUpdate";
import { ClientModel, LazyManyToOne, OneSidedReference, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { IssueLabel } from "#models/IssueLabel";
import type { LazyReference } from "#models/hydration/Lazy";
import { InitiativeUpdate } from "#models/InitiativeUpdate";
import { Integration } from "#models/Integration";
import { PullRequestComment } from "#models/PullRequestComment";

/**
 * An ExternalEntityRelation represents a relation between an internal entity and an external entity. For example, a comment
 * in Linear and a thread in Slack. The relation is bidirectional, so you can always get from the internal entity to the
 * external entity and back.
 *
 * You should use this entity to store relations between internal and external entities, instead of storing information
// DIFF-76 change at line 25
 * about the external entity directly on the internal entity. For example, instead of storing the Slack thread id on
 * the comment, you should create an ExternalEntityRelation connecting the two.
 */
@ClientModel("ExternalEntityRelation")
export class ExternalEntityRelation extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /**
   * The external entity type, e.g. "slackMessage", "githubPullRequest", etc.
   */
  @Property({ default: ExternalEntityType.slackMessage })
  public externalEntityType: ExternalEntityType;

  /**
   * The id of the external entity. You should always be able to get from this id to the external entity and back. For
   * example, if the external entity type is "slackThread", this could be a combination of the Slack channel id and the
   * message timestamp.
   */
  @Property({ default: "" })
  public externalId: string;

  /**
   * Metadata about the relation, e.g. the Slack channel id and message timestamp for a Slack thread.
   */
// DIFF-76 change at line 50
  @Property()
  public metadata?: ExternalEntityRelationMetadata;

  /**
   * Sync error data about relation.
   */
  @Property()
  public syncErrors?: ExternalEntitySyncErrorMap;

  // -- Internal entities

  /** Comment associated with this relation. */
  @LazyManyToOne(() => Comment, "externalEntityRelations", { optional: true, nullable: false, indexed: true })
  public comment?: LazyReference<Comment>;

  /** Issue associated with this relation. */
  @LazyManyToOne(() => Issue, "externalEntityRelations", { optional: true, nullable: false, indexed: true })
  public issue?: LazyReference<Issue>;

  /** Project associated with this relation. */
  @LazyManyToOne(() => Project, "externalEntityRelations", { optional: true, nullable: false, indexed: true })
  public project?: LazyReference<Project>;

  /** Project update associated with this relation. */
  @LazyManyToOne(() => ProjectUpdate, "externalEntityRelations", { optional: true, nullable: false, indexed: true })
// DIFF-76 change at line 75
  public projectUpdate?: LazyReference<ProjectUpdate>;

  /** Project update associated with this relation. */
  @LazyManyToOne(() => InitiativeUpdate, "externalEntityRelations", { optional: true, nullable: false, indexed: true })
  public initiativeUpdate?: LazyReference<InitiativeUpdate>;

  /** Issue label associated with this relation. */
  @LazyManyToOne(() => IssueLabel, "externalEntityRelations", { optional: true, nullable: false, indexed: true })
  public label?: LazyReference<IssueLabel>;

  /** Pull request comment associated with this relation. */
  @LazyManyToOne(() => PullRequestComment, "externalEntityRelations", {
    optional: true,
    nullable: false,
    indexed: true,
  })
  public pullRequestComment?: LazyReference<PullRequestComment>;

  /** The integration that managed the relation. */
  @OneSidedReference(() => Integration, {
    persistence: "none",
    optional: true,
    nullable: false,
    indexed: true,
    onArchive: "NO ACTION",
// DIFF-76 change at line 100
  })
  public integration?: Integration;

  /** Whether this relation is managed by an integration which is not archived. */
  public get isConnectedToActiveIntegration(): boolean {
    if (!!this.metadata?.emailMessageMetadata) {
      // email intake EER are not tied to integrations
      // assume they're always active
      return true;
    }
    return !!this.integration && !this.integration.isArchived;
  }
}

// DIFF-76: modified fixture
import { AiPromptMemoryType, type AiPromptMemoryMetadata } from "@linear/common/models/AiPromptMemory";
import { getEmptyDocument } from "@linear/editor/schema";
import type { ProsemirrorData } from "@linear/editor/types";
import { prosemirrorDataToPromptInput } from "@linear/editor/utils/prosemirrorDataToPromptInput";
import {
  ClientModel,
  Computed,
  LazyManyToOne,
  LazyOneSidedReference,
  ManyToOne,
  OneSidedReference,
  Property,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import type { LazyReference } from "#models/hydration/Lazy";
import { Integration } from "#models/Integration";
import { Issue } from "#models/Issue";
import { IssueLabel } from "#models/IssueLabel";
import { Organization } from "#models/Organization";
import { Project } from "#models/Project";
import { PullRequest } from "#models/PullRequest";
import { Team } from "#models/Team";
// DIFF-76 change at line 25
import { User } from "#models/User";
import { WorkflowDefinition } from "#models/WorkflowDefinition";
import { JSONSerializer } from "#models/serialization/Serialization";

type SignalImportance = "low" | "medium" | "high";

/** A buffered signal that still needs to be folded into the memory body. */
export type AiPromptMemorySignalEntry = {
  type: "signal";
  timestamp: string;
  actor?: string;
  summary: string;
  importance: SignalImportance;
  assetUrls?: string[];
};

/** A changelog entry produced after signals have been distilled into a summary. */
export type AiPromptMemoryChangelogEntry = {
  type: "changelog";
  timestamp: string;
  contentData: ProsemirrorData;
  importance?: SignalImportance;
  assetUrls?: string[];
};

// DIFF-76 change at line 50
type AiPromptMemoryChangeEntry = AiPromptMemorySignalEntry | AiPromptMemoryChangelogEntry;

@ClientModel("AiPromptMemory")
export class AiPromptMemory extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;

  @ManyToOne(() => Organization, "aiPromptMemories", {
    indexed: true,
    nullable: false,
    optional: false,
    persistence: "none",
  })
  public organization: Organization;

  @ManyToOne(() => Team, "aiPromptMemories", {
    indexed: true,
    nullable: true,
    persistence: "none",
  })
  public team?: Team;

  @LazyManyToOne(() => Project, "aiPromptMemories", {
    indexed: true,
    nullable: true,
    persistence: "none",
// DIFF-76 change at line 75
  })
  public project?: LazyReference<Project>;

  @ManyToOne(() => User, "aiPromptMemories", {
    indexed: true,
    nullable: true,
    persistence: "none",
    onDelete: "CASCADE",
    onArchive: "CASCADE",
  })
  public user?: User;

  @LazyManyToOne(() => WorkflowDefinition, "aiPromptMemories", {
    indexed: true,
    nullable: true,
    persistence: "none",
    onDelete: "CASCADE",
    onArchive: "CASCADE",
  })
  public workflowDefinition?: LazyReference<WorkflowDefinition>;

  @Property({ enum: AiPromptMemoryType, persistence: "none", default: AiPromptMemoryType.productIntelligence })
  public type: AiPromptMemoryType;

  @Property({ persistence: "none", default: () => getEmptyDocument() })
// DIFF-76 change at line 100
  public bodyData: ProsemirrorData;

  @Property({ persistence: "none", serializer: JSONSerializer, default: [] })
  public changes: AiPromptMemoryChangeEntry[];

  @Property({ persistence: "none", serializer: JSONSerializer })
  public metadata?: AiPromptMemoryMetadata | null;

  @OneSidedReference(() => User, {
    nullable: true,
    persistence: "none",
  })
  public subjectUser?: User;

  @OneSidedReference(() => Team, {
    indexed: true,
    nullable: true,
    persistence: "none",
  })
  public subjectTeam?: Team;

  @LazyOneSidedReference(() => Project, {
    indexed: true,
    nullable: true,
    persistence: "none",
// DIFF-76 change at line 125
  })
  public subjectProject?: LazyReference<Project>;

  @LazyOneSidedReference(() => IssueLabel, {
    indexed: true,
    nullable: true,
    persistence: "none",
  })
  public subjectLabel?: LazyReference<IssueLabel>;

  @LazyOneSidedReference(() => Issue, {
    indexed: true,
    nullable: true,
    persistence: "none",
  })
  public subjectIssue?: LazyReference<Issue>;

  @LazyOneSidedReference(() => PullRequest, {
    indexed: true,
    nullable: true,
    persistence: "none",
  })
  public subjectPullRequest?: LazyReference<PullRequest>;

  @LazyOneSidedReference(() => Integration, {
// DIFF-76 change at line 150
    indexed: true,
    nullable: true,
    persistence: "none",
  })
  public subjectIntegration?: LazyReference<Integration>;

  @Computed
  public get asMarkdown(): string {
    return prosemirrorDataToPromptInput(this.bodyData).trim();
  }
}

/** Builds the default sort order for AI prompt memory collections. */
export function aiPromptMemoryCollectionOrder() {
  return new CollectionOrder<AiPromptMemory>(memory => {
    // Order by subject type: team -> project -> label -> user
    if (memory.subjectTeam) {
      return 0;
    }
    if (memory.subjectUser) {
      return 1;
    }
    if (memory.subjectProject) {
      return 2;
    }
// DIFF-76 change at line 175
    if (memory.subjectLabel) {
      return 3;
    }
    return 999;
  }).and("createdAt", "desc"); // Most recent first within each subject type
}

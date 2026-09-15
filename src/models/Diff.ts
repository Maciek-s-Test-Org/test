// DIFF-76: modified fixture
import type { DiffContentState } from "@linear/common/models/Diff";
import { Feature } from "#Features";
import { AgentSession } from "#models/AgentSession";
import { CodeRepository } from "#models/CodeRepository";
import { Organization } from "#models/Organization";
import { PullRequest } from "#models/PullRequest";
import { TransientReviewComment } from "#models/TransientReviewComment";
import { PullRequestRevision } from "#models/PullRequestRevision";
import { User } from "#models/User";
import {
  ClientModel,
  Computed,
  LazyManyToOne,
  LazyOneToMany,
  ManyToOne,
  OneSidedReference,
  Property,
} from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { LazyCollection } from "#models/collections/LazyCollection";
import type { LazyReference } from "#models/hydration/Lazy";

/**
// DIFF-76 change at line 25
 * A first-class code diff. A diff starts as the live, mutable working-tree state of a coding session — updated in
 * place on each sandbox sync — and is "promoted" when opened for review by linking it 1:1 to a pull request, while
 * continuing to represent the local, uncommitted changes.
 *
 * The summary (counts and an opaque content hash) syncs with the row. The per-file metadata (paths, states, line
 * counts) is not synced — it is fetched on demand via `diffFilesQuery`, gated on per-user repository read access —
 * and file contents stream from code.storage behind the same gate, like `AgentSession.workspaceDiff` before it.
 */
@ClientModel("Diff")
export class Diff extends Model {
  // Partial like AgentSession itself: diffs are per-session children whose live rows persist for every session
  // that ever synced one, so they must not ride along in every bootstrap.
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The diff's unique URL slug. */
  @Property({ persistence: "none", default: "", indexed: true })
  public readonly slugId: string;

  /** The opaque content hash identifying the diff's content in code.storage. */
  @Property({ default: "", persistence: "none" })
  public contentHash: string;

  /**
   * The base commit the working diff is computed against — the sandbox's last-pushed baseline; empty until the
// DIFF-76 change at line 50
   * sandbox reports it. Lets a promoted diff detect when its PR branch was rebased out from under the sandbox.
   */
  @Property({ default: "", persistence: "none" })
  public baseRef: string;

  /** The number of changed files in the diff. */
  @Property({ default: 0, persistence: "none" })
  public fileCount: number;

  /** The total number of added lines across the diff. */
  @Property({ default: 0, persistence: "none" })
  public additions: number;

  /** The total number of deleted lines across the diff. */
  @Property({ default: 0, persistence: "none" })
  public deletions: number;

  /** Whether oversized files were omitted when the diff was computed. */
  @Property({ default: false, persistence: "none" })
  public truncated: boolean;

  /**
   * Where the diff's contents stand in code.storage. The file list survives an eviction — only the contents are
   * gone, restored on demand from the coding session's sandbox — so the surface renders the changed files with
   * their bodies pending rather than as an error.
// DIFF-76 change at line 75
   */
  @Property({ default: "stored", persistence: "none" })
  public contentState: DiffContentState;

  /** The workspace the diff belongs to. */
  @ManyToOne(() => Organization, "diffs", { persistence: "none", nullable: false, optional: false, indexed: true })
  public organization: Organization;

  /** The coding session the diff is anchored to. Sessions are the only diff source today. */
  @LazyManyToOne(() => AgentSession, "diffs", {
    optional: true,
    nullable: false,
    indexed: true,
    trait: "useForPartialIndex",
    persistence: "none",
  })
  public agentSession?: LazyReference<AgentSession>;

  /**
   * The pull request the diff was promoted to when opened for review, 1:1. The diff keeps representing the local,
   * uncommitted changes after promotion.
   */
  @LazyManyToOne(() => PullRequest, "workingDiffs", {
    nullable: true,
    indexed: true,
// DIFF-76 change at line 100
    persistence: "none",
  })
  public pullRequest?: LazyReference<PullRequest>;

  /** Transient agent comments anchored to this working Diff. */
  @LazyOneToMany(() => TransientReviewComment, {
    index: "diffId",
    // The relation is local-only; diffId is not an API index.
    canSkipNetworkHydration: async () => true,
  })
  public readonly comments: LazyCollection<TransientReviewComment>;

  /** The user responsible for the diff, copied from the session's creator. */
  @ManyToOne(() => User, "diffs", {
    persistence: "none",
    nullable: true,
    indexed: true,
    trait: "useForPartialIndex",
  })
  public creator?: User;

  /**
   * The repository the diff's changes belong to, pinned from the sandbox's live-diff provisioning. Anchors a diff to
   * its repo independent of the session, toward diffs that can stand alone.
   */
// DIFF-76 change at line 125
  @OneSidedReference(() => CodeRepository, {
    persistence: "none",
    nullable: true,
    indexed: true,
    onArchive: "NO ACTION",
  })
  public codeRepository?: CodeRepository;

  /** The stable, unsaved pull request revision representing this Diff's working changes. */
  public get pullRequestRevision(): PullRequestRevision | undefined {
    if (!Feature.isEnabled(Feature.agentSessionLiveDiff) || this.fileCount === 0) {
      return;
    }

    const pullRequest = this.pullRequest?.value;
    if (!pullRequest) {
      return;
    }
    if (this._pullRequestRevision?.pullRequest.id !== pullRequest.id) {
      this._pullRequestRevision = PullRequestRevision.createTransient(pullRequest, this.id);
    }
    return this._pullRequestRevision;
  }

  /** A short title for the diff's work: its session's summary, else the issue title. Undefined until one resolves. */
// DIFF-76 change at line 150
  @Computed
  public get intentTitle(): string | undefined {
    const session = this.agentSession?.value;
    if (!session) {
      return undefined;
    }

    return session.summary?.trim() || session.issue?.value?.title || undefined;
  }

  // -- Private Interface

  private _pullRequestRevision?: PullRequestRevision;
}

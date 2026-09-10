import type { CodeRepositoryBranchTips } from "@linear/common/models/CodeRepositoryBranchTip";
import type { CodeRepositoryCommit } from "@linear/common/models/CodeRepositoryCommit";
import type { RepositoryVisibility } from "@linear/common/models/RepositoryVisibility";
import { ClientModel, OneSidedReference, Property } from "#models/base/Decorators";
import { ArchivableModel } from "#models/base/Model";
import { ModelLoadStrategy } from "#models/base/ModelLoadStrategy";
import { Organization } from "#models/Organization";

/**
 * A code repository (e.g., GitHub, GitLab).
 *
 * Normalizes repository data that was previously stored as JSONB on the PullRequest entity.
 */
@ClientModel("CodeRepository")
export class CodeRepository extends ArchivableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.instant;

  /** The organization this repository belongs to. */
  @OneSidedReference(() => Organization, { optional: false, nullable: false, persistence: "none" })
  public organization: Organization;

  /** The owner of the repository (user or organization). */
  @Property({ default: "" })
  public owner: string;

  /** The name of the repository. */
  @Property({ default: "" })
  public name: string;

  /** The external node ID of the repository. */
  @Property({ default: "" })
  public externalRepositoryId: string;

  /** The external node ID of the repository owner. */
  @Property({ default: "" })
  public externalOwnerId: string;

  /** The visibility of the repository (public, private, or internal). */
  @Property({ default: "" })
  public visibility: RepositoryVisibility;

  /** The base URL of the repository host (e.g., https://github.com). */
  @Property({ default: "" })
  public baseUrl: string;

  /** The name of the default branch (e.g., main, master). */
  @Property({ default: "" })
  public defaultBranch: string;

  /** Map of branch names to their tip commit information. */
  @Property({ default: {} })
  public branchTips: CodeRepositoryBranchTips;

  /** Commits on the default branch. */
  @Property({ default: [] })
  public defaultBranchCommits: CodeRepositoryCommit[];
}

import { GITHUB_DEFAULT_HOST } from "@linear/common/models/ExternalUserMapping";
import { IntegrationHelper } from "@linear/common/models/IntegrationHelper";
import { ClientModel, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { GitHubCodeAccessHelper, type GitHubFileBlobResult } from "#utils/github/GitHubCodeAccessHelper";
import type { Store } from "#models/Store";
import type { User } from "#models/User";

type FileAttrs = {
  owner: string;
  repo: string;
  sha: string;
  path: string;
  /** The GitHub host the file lives on. Defaults to github.com; a GEC host routes the fetch to that instance. */
  host?: string;
};

/**
 * An immutable, sha-keyed file from a code repository. Content is locally cached in IndexedDB.
 *
 * Unlike PullRequestFile, CodeRepositoryFile contains no information or functions related to
 * file changes. This models exists only to store unchanging file content so that it can be
 * used in e.g. permalink code embeds.
 */
@ClientModel("CodeRepositoryFile")
export class CodeRepositoryFile extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.local;
  public static override partialLoadMode = PartialLoadMode.regular;
  public override store: Store;

  /** The repository owner (GitHub organization or user). */
  @Property({ default: "" })
  public owner: string;

  /** The repository name. */
  @Property({ default: "" })
  public repo: string;

  /** The commit SHA the file was fetched at. */
  @Property({ default: "" })
  public sha: string;

  /** The path of the file within the repository. */
  @Property({ default: "" })
  public path: string;

  /** The full file content. */
  @Property({ default: "" })
  public content: string;

  /**
   * Whether the file was fetched from raw.githubusercontent.com without authentication,
   * confirming the repository is publicly accessible.
   */
  @Property({ default: false })
  public isPublic: boolean;

  /**
   * Deterministic ID for a file based on its content-addressed key.
   *
   * @param attrs The file location attributes.
   * @returns A stable ID string.
   */
  public static fileId(attrs: FileAttrs): string {
    return `crf:${attrs.owner}/${attrs.repo}/${attrs.sha}/${attrs.path}`;
  }

  /**
   * Synchronously finds cached content in memory and extracts line ranges.
   *
   * @param store The store to search in.
   * @param attrs The file location and line range attributes.
   * @returns The extracted content, or null if not in memory.
   */
  public static findCachedContent(
    store: Store,
    attrs: FileAttrs & IntegrationHelper.GitHub.LineRange
  ): { capped: string; uncapped: string; isPublic: boolean } | null {
    const file = store.findById(CodeRepositoryFile, CodeRepositoryFile.fileId(attrs));
    if (!file) {
      return null;
    }
    const lines = CodeRepositoryFile.extractLines(file.content, attrs);
    if (!lines) {
      return null;
    }
    return { ...lines, isPublic: file.isPublic };
  }

  /**
   * Returns file content, checking in-memory first, then fetching from GitHub.
   *
   * Runs the public (raw.githubusercontent.com) and authenticated (Linear VCS) fetches in
   * parallel so neither waits on the other. When `skipAuthFetch` is true (caller has a known
   * access error), only the public fetch runs — skipping the auth call that would also fail.
   *
   * @param store The store for in-memory caching.
   * @param user The authenticated user for the API request.
   * @param attrs The file location attributes.
   * @param options.skipAuthFetch Skip the authenticated fetch if the public fetch fails.
   * @returns The content and public flag, or undefined if all fetches failed.
   */
  public static async getContent(
    store: Store,
    user: User,
    attrs: FileAttrs,
    options?: { skipAuthFetch?: boolean }
  ): Promise<GitHubFileBlobResult | undefined> {
    const inMemory = store.findById(CodeRepositoryFile, CodeRepositoryFile.fileId(attrs));
    if (inMemory) {
      return { content: inMemory.content, isPublic: inMemory.isPublic };
    }

    // raw.githubusercontent.com only serves github.com repos, so the public fetch is github.com-only.
    // GEC repositories are private to their instance and are always fetched through the authenticated
    // Linear VCS endpoint.
    const isEnterprise = Boolean(attrs.host && attrs.host !== GITHUB_DEFAULT_HOST);

    // Run both fetches in parallel — auth wins for private repos, public wins for open-source.
    const [publicResult, authResult] = await Promise.allSettled([
      isEnterprise
        ? Promise.resolve(null)
        : GitHubCodeAccessHelper.fetchPublicFileBlob(attrs.owner, attrs.repo, attrs.sha, attrs.path),
      options?.skipAuthFetch
        ? Promise.resolve(undefined)
        : GitHubCodeAccessHelper.fetchGitHubFileBlob({
            owner: attrs.owner,
            repo: attrs.repo,
            sha: attrs.sha,
            filePath: attrs.path,
            host: attrs.host,
            userId: user.id,
            userAccountId: user.userAccountId,
          }),
    ]);

    const publicContent = publicResult.status === "fulfilled" ? publicResult.value : null;
    if (publicContent !== null) {
      CodeRepositoryFile.cacheContent(attrs, publicContent, true);
      return { content: publicContent, isPublic: true };
    }

    const authContent = authResult.status === "fulfilled" ? authResult.value : undefined;
    if (!authContent) {
      return undefined;
    }

    CodeRepositoryFile.cacheContent(attrs, authContent, false);
    return { content: authContent, isPublic: false };
  }

  /**
   * Stores file content in memory for same-session instant access.
   *
   * @param attrs The file location attributes.
   * @param content The full file content to cache.
   */
  private static cacheContent(attrs: FileAttrs, content: string, isPublic: boolean): void {
    const file = CodeRepositoryFile.createEmpty();
    file.id = CodeRepositoryFile.fileId(attrs);
    file.owner = attrs.owner;
    file.repo = attrs.repo;
    file.sha = attrs.sha;
    file.path = attrs.path;
    file.content = content;
    file.isPublic = isPublic;
    file.save(true);
  }

  /**
   * Extracts capped and uncapped line ranges from file content.
   *
   * @param content The full file content.
   * @param lineRange The line range to extract.
   * @returns The capped and uncapped content, or null if the range is invalid.
   */
  public static extractLines(
    content: string,
    lineRange: IntegrationHelper.GitHub.LineRange
  ): { capped: string; uncapped: string } | null {
    if (!IntegrationHelper.GitHub.isValidLineRange(content, lineRange)) {
      return null;
    }
    return {
      capped: IntegrationHelper.GitHub.extractLinesFromFileContent(content, lineRange),
      uncapped: IntegrationHelper.GitHub.extractLinesFromFileContent(content, lineRange, { uncapped: true }),
    };
  }
}

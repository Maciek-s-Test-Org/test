// DIFF-76: modified fixture
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import { action } from "mobx";
import { stripAttributionsFromDoc } from "@linear/editor/attribution/content";
import { getEmptyDocument, schema } from "@linear/editor/schema";
import { MarkdownTransformer } from "@linear/editor/markdown/MarkdownTransformer";
import type { ProsemirrorData, ProsemirrorDataNode } from "@linear/editor/types";
import { YjsDocument } from "@linear/editor/document/YjsDocument";
import { sanitizeMalformedNodeData } from "@linear/editor/utils/malformedContentSanitizer";
import { textBetween } from "@linear/editor/utils/textBetween";
import { notReachable } from "@linear/common/errors/UnreachableCaseError";
import { DocumentContentTrait } from "@linear/common/models/DocumentContentTrait";
import { getTrait } from "@linear/common/utils/traits";
import { DocumentContentHelper } from "@linear/common/models/DocumentContentHelper";
import type { ReadOnlyReason } from "@linear/common/models/ReadOnlyReason";
import {
  Action,
  ClientModel,
  Computed,
  EphemeralMapProperty,
  LazyOneToMany,
  LazyOneToOne,
  OneToOne,
  Property,
// DIFF-76 change at line 25
} from "#models/base/Decorators";
import { ModelLoadStrategy, PartialLoadMode, PartialPreloadForTeam } from "#models/base/ModelLoadStrategy";
import { Model } from "#models/base/Model";
import { BinarySerializer } from "#models/serialization/Serialization";
import { Logger } from "#logging/Logger";
import type { ITransaction } from "#models/sync/transactions/Transaction";
import { Issue } from "#models/Issue";
import { Meeting } from "#models/Meeting";
import { PullRequest } from "#models/PullRequest";
import { Project } from "#models/Project";
import { ProjectMilestone } from "#models/ProjectMilestone";
import { Document } from "#models/Document";
import { Comment } from "#models/Comment";
import { DocumentContentAgentCheckpoint } from "#models/DocumentContentAgentCheckpoint";
import { DocumentContentHistory } from "#models/DocumentContentHistory";
import type { DocumentContentRevision } from "#models/DocumentContentRevision";
import { YjsStateOptimizer } from "#models/serialization/ValueOptimizer";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { RequestCollection } from "#models/collections/RequestCollection";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import { LazyBackReference, LazyReference } from "#models/hydration/Lazy";
import type { Hydrated } from "#models/base/ModelTypes";
import type { EphemeralMap } from "#models/base/EphemeralMap";
import { AiPromptRules } from "#models/AiPromptRules";
import { ReleaseNote } from "#models/ReleaseNote";
// DIFF-76 change at line 50
import { WelcomeMessage } from "#models/WelcomeMessage";
import { WorkspaceAnnouncement } from "#models/WorkspaceAnnouncement";
import { WorkflowDefinitionDraft } from "#models/WorkflowDefinitionDraft";
import { Initiative } from "./Initiative";
import { MediaMetadata } from "./MediaMetadata";

/**
 * Entity representing a content of rich editor.
 */
@ClientModel("DocumentContent")
export class DocumentContent extends Model {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;
  public static override partialPreloadForTeam = PartialPreloadForTeam.secondPriority;

  /** Returns whether ProseMirror data contains meaningful document content. */
  public static hasContentData(content: ProsemirrorData | undefined): boolean {
    if (!content?.content?.length) {
      return false;
    }
    return !(
      content.content.length === 1 &&
      content.content[0].type === "paragraph" &&
      (!content.content[0].content ||
        content.content[0].content.length === 0 ||
// DIFF-76 change at line 75
        (content.content[0].content.length === 1 &&
          content.content[0].content[0].type === "text" &&
          content.content[0].content[0].text === ""))
    );
  }

  /** A base64 encoded representation of a Yjs state update representing the document. */
  @Property({ optimizer: YjsStateOptimizer })
  public contentState?: string;

  /** The timestamp when the document content was restored from a previous version. */
  @Property({ persistence: "updateOnly" })
  public restoredAt?: Date;

  /** Each bit in this number represents a different trait. */
  @Property({ persistence: "none" })
  public traits?: number;

  /** The issue that this content is associated with. */
  @LazyOneToOne(() => Issue, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
    trait: "useForPartialIndex",
// DIFF-76 change at line 100
  })
  public issue?: LazyReference<Issue>;

  /** The pull request that this content is associated with. */
  @LazyOneToOne(() => PullRequest, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public pullRequest?: LazyReference<PullRequest>;

  /** The project that this content is associated with. */
  @LazyOneToOne(() => Project, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
    trait: "useForPartialIndex",
  })
  public project?: LazyReference<Project>;

  /** The project milestone that this content is associated with. */
  @LazyOneToOne(() => ProjectMilestone, "documentContent", {
    optional: true,
// DIFF-76 change at line 125
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public projectMilestone?: LazyReference<ProjectMilestone>;

  /** The document that this content is associated with. */
  @LazyOneToOne(() => Document, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public document?: LazyReference<Document>;

  /** The meeting that this content is associated with. */
  @LazyOneToOne(() => Meeting, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public meeting?: LazyReference<Meeting>;

  /** The initiative that this content is associated with. */
// DIFF-76 change at line 150
  @OneToOne(() => Initiative, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public initiative?: Initiative;

  /** The AI prompt rules that this content is associated with. */
  @LazyOneToOne(() => AiPromptRules, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public aiPromptRules?: LazyReference<AiPromptRules>;

  /** The welcome message that this content is associated with. */
  @LazyOneToOne(() => WelcomeMessage, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public welcomeMessage?: LazyReference<WelcomeMessage>;
// DIFF-76 change at line 175

  /** The workspace announcement that this content is associated with. */
  @LazyOneToOne(() => WorkspaceAnnouncement, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public workspaceAnnouncement?: LazyReference<WorkspaceAnnouncement>;

  /** The release note that this content is associated with. */
  @LazyOneToOne(() => ReleaseNote, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public releaseNote?: LazyReference<ReleaseNote>;

  /** The workflow definition draft that this content is associated with. */
  @LazyOneToOne(() => WorkflowDefinitionDraft, "documentContent", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
// DIFF-76 change at line 200
  })
  public workflowDefinitionDraft?: LazyReference<WorkflowDefinitionDraft>;

  /** Pending automation revision for this document content, if one exists. */
  @LazyOneToOne({ nullable: true })
  public revision: LazyBackReference<DocumentContentRevision | undefined>;

  /** AI-authored checkpoints that can be restored into the live document or review flow. */
  public readonly agentCheckpoints: RequestCollection<DocumentContentAgentCheckpoint> = new RequestCollection(
    DocumentContentAgentCheckpoint,
    this,
    "documentContentId",
    { order: new CollectionOrder("contentDataSnapshotAt", "desc") }
  );

  /** Comments associated with the issue. */
  @LazyOneToMany(() => Comment, {
    index: "documentContentId",
    skipHydrationTraitBit: DocumentContentTrait.hasComments,
  })
  public readonly comments: LazyCollection<Comment>;

  /** History of the document content. */
  public readonly history: RequestCollection<DocumentContentHistory> = new RequestCollection(
    DocumentContentHistory,
// DIFF-76 change at line 225
    this,
    "documentContentId",
    { order: new CollectionOrder("createdAt", "desc") }
  );

  /** The media metadata associated with the document content. */
  @LazyOneToMany(() => MediaMetadata, {
    index: "documentContentId",
  })
  public readonly mediaMetadata: LazyCollection<MediaMetadata>;

  /**
   * Callback registered by the active collaborative editing session to force-save the current snapshot.
   * Returns the save transaction if dirty content was persisted, or undefined if no save was needed.
   */
  public forceSaveSnapshot?: () => ITransaction | undefined;

  /** Returns whether the active collaborative session contains meaningful content. */
  public hasLiveContent?: () => boolean;

  // -- Ephemeral properties

  /** The viewers of the document content. */
  @EphemeralMapProperty()
  public viewers: EphemeralMap<boolean>;
// DIFF-76 change at line 250

  // -- Computed properties

  /**
   * The document content in Prosemirror document. This property is computed from the `contentState` property and should
   * not be used to pass content to the editor. The editor should use `contentState` instead in order to correctly
   * merge in and display any changes from other users.
   */
  @Computed
  public get contentData(): ProsemirrorData | undefined {
    if (!this.contentState) {
      return undefined;
    }
    const doc = this.createYjsDocument();
    return doc.asProsemirrorData();
  }

  /**
   * Returns the number of active comment threads in the document content.
   */
  @Computed
  public get activeCommentThreadCount(): number {
    return this.contentData ? this.activeCommentsForContent(this.contentData.content).distinct().length : 0;
  }
  /**
// DIFF-76 change at line 275
   * Returns the number of resolved comment threads in the document content.
   */
  @Computed
  public get resolvedCommentThreadCount(): number {
    return this.contentData ? this.resolvedCommentsForContent(this.contentData.content).distinct().length : 0;
  }

  /**
   * Returns the number of removed comment threads in the document content.
   */
  @Computed
  public get removedCommentThreadCount(): number {
    return this.comments.length - this.activeCommentThreadCount - this.resolvedCommentThreadCount;
  }

  /** Get document content in Markdown format. This property is computed from the `contentState` property. */
  @Computed
  public get markdownContent(): string {
    return this.contentData ? MarkdownTransformer.serialize(this.contentData) : "";
  }

  /**
   * Returns true if the document content is not empty and not containing just single empty paragraph.
   */
  @Computed
// DIFF-76 change at line 300
  public get hasContent(): boolean {
    return DocumentContent.hasContentData(this.contentData);
  }

  /**
   * Returns an error message to display to the user if the document content is too big and cannot be saved.
   */
  public checkSize(propertyName: string): string | undefined {
    if (
      this.hasContent &&
      this.contentState != null &&
      this.contentState.length > DocumentContentHelper.maxContentStateLength
    ) {
      return DocumentContentHelper.maxContentStateLengthErrorMessage(propertyName);
    }

    return undefined;
  }

  /**
   * The version of the document. Whenever a document gets flattened on the backend its version is incremented.
   * Clients should not try to merge in changes from a document with a different version, but should replace the
   * content entirely whenever they get a new version.
   */
  @Computed
// DIFF-76 change at line 325
  public get documentVersion(): number {
    return this.createYjsDocument().documentVersion;
  }

  /** Returns the model object that this `DocumentContent` is the content of. */
  public getParent(this: Hydrated<DocumentContent>): DocumentContentParent | undefined;
  /** Returns the model object that this `DocumentContent` is the content of. */
  public getParent(this: DocumentContent): Promise<DocumentContentParent | undefined>;
  /** Method implementation. */
  public getParent(
    this: Hydrated<DocumentContent> | DocumentContent
  ): Promise<DocumentContentParent | undefined> | DocumentContentParent | undefined {
    if (this.isHydrated()) {
      return this.unsafeGetParent();
    } else {
      return Promise.all([
        this.issue?.resolve(),
        this.pullRequest?.resolve(),
        this.project?.resolve(),
        this.document?.resolve(),
        this.meeting?.resolve(),
        this.releaseNote?.resolve(),
        this.workspaceAnnouncement?.resolve(),
        this.workflowDefinitionDraft?.resolve(),
      ]).then(() => this.unsafeGetParent());
// DIFF-76 change at line 350
    }
  }

  /** Returns whether the document content cannot be edited anymore. */
  public override get isReadOnly(): ReadOnlyReason | undefined {
    return this.unsafeGetParent()?.isReadOnly;
  }

  /**
   * DO NOT USE. This is exposed only for specific operations that have to run synchronously and cannot wait for hydration.
   * Returns the parent we currently have locally. It won't check for hydration at all, so `undefined` result might be
   * because we just haven't hydrated yet.
   */
  public unsafeGetParent(): DocumentContentParent | undefined {
    return (
      this.issue?.value ||
      this.pullRequest?.value ||
      this.project?.value ||
      this.projectMilestone?.value ||
      this.document?.value ||
      this.meeting?.value ||
      this.initiative ||
      this.aiPromptRules?.value ||
      this.welcomeMessage?.value ||
      this.workspaceAnnouncement?.value ||
// DIFF-76 change at line 375
      this.releaseNote?.value ||
      this.workflowDefinitionDraft?.value
    );
  }

  /** Set the model object that this `DocumentContent` is the content of. */
  public setParent(model: DocumentContentParent) {
    if (model instanceof Issue) {
      this.issue = LazyReference.wrap(model);
    } else if (model instanceof PullRequest) {
      this.pullRequest = LazyReference.wrap(model);
    } else if (model instanceof Project) {
      this.project = LazyReference.wrap(model);
    } else if (model instanceof ProjectMilestone) {
      this.projectMilestone = LazyReference.wrap(model);
    } else if (model instanceof Document) {
      this.document = LazyReference.wrap(model);
    } else if (model instanceof Meeting) {
      this.meeting = LazyReference.wrap(model);
    } else if (model instanceof Initiative) {
      this.initiative = model;
    } else if (model instanceof AiPromptRules) {
      this.aiPromptRules = LazyReference.wrap(model);
    } else if (model instanceof WelcomeMessage) {
      this.welcomeMessage = LazyReference.wrap(model);
// DIFF-76 change at line 400
    } else if (model instanceof WorkspaceAnnouncement) {
      this.workspaceAnnouncement = LazyReference.wrap(model);
    } else if (model instanceof ReleaseNote) {
      this.releaseNote = LazyReference.wrap(model);
    } else if (model instanceof WorkflowDefinitionDraft) {
      this.workflowDefinitionDraft = LazyReference.wrap(model);
    } else {
      throw notReachable(model);
    }
  }

  /** Returns the parent type. */
  public get parentType():
    | "issue"
    | "pullRequest"
    | "project"
    | "projectMilestone"
    | "document"
    | "meeting"
    | "initiative"
    | "aiPromptRules"
    | "welcomeMessage"
    | "workspaceAnnouncement"
    | "releaseNote"
    | "workflowDefinitionDraft"
// DIFF-76 change at line 425
    | undefined {
    if (this.issue) {
      return "issue";
    } else if (this.pullRequest) {
      return "pullRequest";
    } else if (this.project) {
      return "project";
    } else if (this.projectMilestone) {
      return "projectMilestone";
    } else if (this.document) {
      return "document";
    } else if (this.meeting) {
      return "meeting";
    } else if (this.initiative) {
      return "initiative";
    } else if (this.aiPromptRules) {
      return "aiPromptRules";
    } else if (this.welcomeMessage) {
      return "welcomeMessage";
    } else if (this.workspaceAnnouncement) {
      return "workspaceAnnouncement";
    } else if (this.releaseNote) {
      return "releaseNote";
    } else if (this.workflowDefinitionDraft) {
      return "workflowDefinitionDraft";
// DIFF-76 change at line 450
    }
    return undefined;
  }

  /**
   * Returns whether the document content is equal to the given content data.
   */
  public hasContentEqualTo(contentDataToCompare: ProsemirrorData | undefined): boolean {
    return isEqual(
      normalizeContentData(cloneDeep(this.contentData)),
      normalizeContentData(cloneDeep(contentDataToCompare))
    );
  }

  /**
   * Returns whether the document content is equal to the given content data after normalization and
   * ignoring attribution-only differences.
   */
  public hasContentEqualToIgnoringAttributions(contentDataToCompare: ProsemirrorData | undefined): boolean {
    return isEqual(
      normalizeContentDataIgnoringAttributions(this.contentData),
      normalizeContentDataIgnoringAttributions(contentDataToCompare)
    );
  }

// DIFF-76 change at line 475
  /** Returns whether the document content's parent (e.g. issue or project) has been persisted. */
  public isParentPersisted(this: Hydrated<DocumentContent>): boolean;
  /** Returns whether the document content's parent (e.g. issue or project) has been persisted. */
  public isParentPersisted(this: DocumentContent): Promise<boolean>;
  /** Method implementation. */
  public isParentPersisted(this: Hydrated<DocumentContent> | DocumentContent): Promise<boolean> | boolean {
    if (this.isHydrated()) {
      const parent = this.getParent();
      return parent?.persisted ?? false;
    }
    return this.getParent().then(parent => parent?.persisted ?? false);
  }

  /**
   * Creates a new Yjs document from the content state. If not content state is available, an empty document is created.
   *
   * @returns A new Yjs document.
   */
  public createYjsDocument(): YjsDocument {
    try {
      const doc = new YjsDocument();
      if (this.contentState) {
        const binary = BinarySerializer.deserialize(this.contentState);
        doc.applyUpdate(binary);
      } else {
// DIFF-76 change at line 500
        doc.updateToProsemirrorData(getEmptyDocument());
      }
      return doc;
    } catch (error) {
      Logger.error("Error converting contentState to Yjs doc", error);
      return new YjsDocument();
    }
  }

  /**
   * Replaces the content of the document with the content of a prosemirror document. This will create a minimal set
   * of changes and apply the to the state of the Yjs document.
   *
   * @param contentData The Prosemirror document to set the content with.
   */
  @Action
  public replaceWithContent(contentData: ProsemirrorData) {
    const sanitized = (sanitizeMalformedNodeData(contentData as ProsemirrorDataNode, schema) ??
      contentData) as ProsemirrorData;
    const doc = this.createYjsDocument();
    if (this.persisted) {
      doc.updateToProsemirrorData(sanitized);
      this.contentState = BinarySerializer.serialize(doc.encodeStateAsUpdate());
    } else {
      doc.updateToProsemirrorData(sanitized);
// DIFF-76 change at line 525
      this.contentState = BinarySerializer.serialize(doc.getFlattenedState({ dontBumpVersion: true }));
    }
  }
  @Action
  public appendContent(contentToAppend: ProsemirrorData): void {
    const doc = this.createYjsDocument();

    // Append the new content to the existing content
    const updatedContent: ProsemirrorData = !this.hasContent
      ? contentToAppend
      : {
          type: "doc",
          content: [...(doc.asProsemirrorData().content || []), ...(contentToAppend.content || [])],
        };
    this.replaceWithContent(updatedContent);
  }

  @Action
  public prependContent(contentToPrepend: ProsemirrorData): void {
    const doc = this.createYjsDocument();

    // Prepend the new content to the existing content
    const updatedContent: ProsemirrorData = !this.hasContent
      ? contentToPrepend
      : {
// DIFF-76 change at line 550
          type: "doc",
          content: [...(contentToPrepend.content || []), ...(doc.asProsemirrorData().content || [])],
        };
    this.replaceWithContent(updatedContent);
  }

  /**
   * Apply a Yjs state update to the document content, in effect merging the changes into the contentData.
   *
   * @param contentState The base64 encoded Yjs state update to apply.
   */
  @Action
  public applyState(contentState: string): void {
    const doc = this.createYjsDocument();
    doc.applyUpdate(BinarySerializer.deserialize(contentState));
    this.contentState = BinarySerializer.serialize(doc.encodeStateAsUpdate());
  }

  /**
   * Gets the text content for a document content.
   */
  public get textContent(): string {
    if (!this.contentData) {
      return "";
    }
// DIFF-76 change at line 575
    const doc = schema.nodeFromJSON(this.contentData);
    return textBetween(doc, 0, doc.content.size, {});
  }

  /**
   * Checks if the document content has a specific trait.
   *
   * @param trait Trait to get.
   * @returns True if the issue has the given trait, false otherwise.
   */
  public getTrait(trait: DocumentContentTrait) {
    return getTrait(this.traits, trait);
  }

  /** @inheritdoc */
  public override includeInLocalTransactionVia(): Model[] {
    return [this.unsafeGetParent()].concrete();
  }

  /**
   * Returns document content that is related to a given parent model. If content does not exist, it creates it. Calling this
   * on a `Hydrated<T>` will return the document content synchronously.
   *
   * @param attachToParent Whether to attach the document content to the parent. Defaults to "attach".
   */
// DIFF-76 change at line 600
  public static getOrCreateFrom<T extends DocumentContentParent>(
    parent: Hydrated<T>,
    attachToParent?: "attach" | "doNotAttach"
  ): DocumentContent;
  /**
   * Returns document content that is related to a given parent model. If content does not exist, it creates it. Calling this
   * on an un-hydrated `Model` will return a promise, as the document needs to be hydrated internally first.
   *
   * @param attachToParent Whether to attach the document content to the parent. Defaults to "attach".
   */
  public static getOrCreateFrom<T extends DocumentContentParent>(
    parent: T,
    attachToParent?: "attach" | "doNotAttach"
  ): Promise<DocumentContent>;
  /** Method implementation. */
  public static getOrCreateFrom<T extends DocumentContentParent>(
    parent: Hydrated<T> | T,
    attachToParent: "attach" | "doNotAttach" = "attach"
  ): DocumentContent | Promise<DocumentContent> {
    const execute = action((hydratedParent: Hydrated<T>) => {
      if (hydratedParent.documentContent.value) {
        return hydratedParent.documentContent.value;
      }
      const documentContent = new DocumentContent();
      documentContent.setParent(hydratedParent);
// DIFF-76 change at line 625
      if (attachToParent === "attach") {
        // Attaching replaces the parent's lazy reference instance. Observers created before the swap (e.g. an open
        // editor tracking `documentContent.value`) still track the old instance, so forward the new content to it.
        const previousReference = hydratedParent.documentContent;
        hydratedParent.documentContent = LazyBackReference.wrap(documentContent);
        previousReference.value = documentContent;
      }
      return documentContent;
    });

    if (parent.isHydrated()) {
      const value = execute(parent as Hydrated<T>);
      // Touch to make it observable as we can use returned documentContent directly.
      // Keep it outside of the MobX `action`, it seems to not trigger observers when inside it.
      parent.documentContent.value;
      return value;
    } else {
      return (parent as Model).hydrate().then(hydratedParent => {
        return execute(hydratedParent as Hydrated<T>);
      });
    }
  }

  // Private interface

// DIFF-76 change at line 650
  private activeCommentsForContent(content: ProsemirrorDataNode[]): string[] {
    const res: string[] = [];
    for (const node of content) {
      res.push(...this.activeCommentsForNode(node));
    }
    return res;
  }

  private activeCommentsForNode(node: ProsemirrorDataNode): string[] {
    const res: string[] = [];
    if (node.content) {
      res.push(...this.activeCommentsForContent(node.content));
    }
    if (node.marks) {
      res.push(
        ...node.marks
          .filter(
            m =>
              m.type === "inlineComment" &&
              !m.attrs?.createdBy &&
              m.attrs?.resolved !== true &&
              m.attrs?.resolved !== "true" &&
              m.attrs?.commentId
          )
          .map(m => m.attrs?.commentId)
// DIFF-76 change at line 675
      );
    }
    return res;
  }

  private resolvedCommentsForContent(content: ProsemirrorDataNode[]): string[] {
    const res: string[] = [];
    for (const node of content) {
      res.push(...this.resolvedCommentsForNode(node));
    }
    return res;
  }

  private resolvedCommentsForNode(node: ProsemirrorDataNode): string[] {
    const res: string[] = [];
    if (node.content) {
      res.push(...this.resolvedCommentsForContent(node.content));
    }
    if (node.marks) {
      res.push(
        ...node.marks
          .filter(
            m =>
              m.type === "inlineComment" &&
              (m.attrs?.resolved === true || m.attrs?.resolved === "true") &&
// DIFF-76 change at line 700
              m.attrs?.commentId
          )
          .map(m => m.attrs?.commentId)
      );
    }
    return res;
  }
}

/** Removes undefined properties and empty `attrs` objects from editor content JSON. */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeContentData(contentData?: any): ProsemirrorData | undefined {
  if (isEqual(contentData, getEmptyDocument())) {
    return undefined;
  }
  if (Array.isArray(contentData)) {
    contentData.forEach(normalizeContentData);
  } else if (typeof contentData === "object" && contentData !== null) {
    if (contentData.attrs) {
      // Fix for comparing templates created before code snippet language auto-detection
      if (contentData.attrs.language === null) {
        delete contentData.attrs.language;
      }
      // uploadState is a transient attribute added during Yjs round-trip, not part of template data
      if (contentData.attrs.uploadState !== undefined) {
// DIFF-76 change at line 725
        delete contentData.attrs.uploadState;
      }
      // Delete empty attrs object
      if (Object.keys(contentData.attrs).length === 0) {
        delete contentData.attrs;
      }
    }
    for (const key in contentData) {
      if (contentData[key] === undefined || contentData[key] === null) {
        delete contentData[key];
      } else {
        normalizeContentData(contentData[key]);
      }
    }
  }
  return contentData;
}

/**
 * Normalizes ProseMirror content data and strips attribution marks so equality checks ignore attribution-only differences.
 */
export function normalizeContentDataIgnoringAttributions(contentData?: ProsemirrorData): ProsemirrorData | undefined {
  const normalizedContentData = normalizeContentData(cloneDeep(contentData));

  if (!normalizedContentData) {
// DIFF-76 change at line 750
    return normalizedContentData;
  }

  return stripAttributionsFromDoc(schema.nodeFromJSON(normalizedContentData)).toJSON() as ProsemirrorData;
}

/** The parent of a document content. */
export type DocumentContentParent =
  | Issue
  | PullRequest
  | Project
  | ProjectMilestone
  | Document
  | Meeting
  | Initiative
  | AiPromptRules
  | WelcomeMessage
  | WorkspaceAnnouncement
  | ReleaseNote
  | WorkflowDefinitionDraft;

/**
 * Document content and metadata used for displaying resolved inline comments.
 */
export type DocumentContentList = {
// DIFF-76 change at line 775
  title?: React.ReactNode;
  documentContent: DocumentContent | undefined;
}[];

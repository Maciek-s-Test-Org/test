import { Policy } from './policy';
import type { Actor, Document } from './types';

const isSystem = (actor: Actor) => actor.kind === 'system';
const isOwner = (actor: Actor, document: Document) => document.ownerId === actor.id;
const isAuthor = (actor: Actor, document: Document) => document.authorId === actor.id;
const isAnyLinkUser = (actor: Actor, document: Document) => document.linkUserIds.includes(actor.id);
const hasAny = (actor: Actor, workspaceId: string, perms: string[]) => perms.some(p => actor.permissions(workspaceId).has(p));

export const DocumentPolicies = {
  ensureCanView: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_VIEW',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanEdit: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_EDIT',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanDelete: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_DELETE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanShare: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_SHARE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanUpload: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_UPLOAD',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanAssignType: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_ASSIGNTYPE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanAttest: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_ATTEST',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanArchive: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_ARCHIVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanPurge: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_PURGE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanRestore: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_RESTORE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanRename: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_RENAME',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanMove: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_MOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanCopy: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_COPY',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanExport: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_EXPORT',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanPrint: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_PRINT',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanSign: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_SIGN',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanLock: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_LOCK',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanUnlock: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_UNLOCK',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanComment: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_COMMENT',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanTag: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_TAG',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanPin: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_PIN',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanStar: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_STAR',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanDuplicate: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_DUPLICATE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanMerge: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_MERGE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanSplit: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_SPLIT',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanPublish: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_PUBLISH',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanUnpublish: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_UNPUBLISH',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanApprove: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_APPROVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanReject: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_REJECT',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanEscalate: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_ESCALATE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanAssign: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_ASSIGN',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanUnassign: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_UNASSIGN',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanWatch: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_WATCH',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanUnwatch: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_UNWATCH',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanFlag: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_FLAG',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanUnflag: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_UNFLAG',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanResolve: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_RESOLVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanReopen: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_REOPEN',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanTransfer: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_TRANSFER',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanAudit: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_AUDIT',
      ]),
      isAnyLinkUser(actor, document),
    ),

};

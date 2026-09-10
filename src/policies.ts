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
        'ADMIN_JOB_VIEW',
        'ADMIN_JOB_UPDATE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanEdit: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
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
        'ADMIN_JOB_SHARE',
        'ADMIN_JOB_UPDATE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanAssignType: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
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
        'ADMIN_JOB_ATTEST',
        'ADMIN_JOB_UPDATE',
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
        'ADMIN_JOB_COPY',
        'ADMIN_JOB_UPDATE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanExport: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_EXPORT',
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
        'ADMIN_JOB_SIGN',
        'ADMIN_JOB_UPDATE',
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
        'ADMIN_JOB_COMMENT',
        'ADMIN_JOB_UPDATE',
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
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_STAR',
        'ADMIN_JOB_STAR',
        'ADMIN_JOB_UPDATE',
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

  ensureCanPublish: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
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
        'ADMIN_JOB_APPROVE',
        'ADMIN_JOB_UPDATE',
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

  ensureCanAssign: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      isAuthor(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_ASSIGN',
        'ADMIN_JOB_ASSIGN',
        'ADMIN_JOB_UPDATE',
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
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_UNWATCH',
        'ADMIN_JOB_UNWATCH',
        'ADMIN_JOB_UPDATE',
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
        'ADMIN_JOB_RESOLVE',
        'ADMIN_JOB_UPDATE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanReopen: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
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

  ensureCanRedact: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_REDACT',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanAnnotate: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_ANNOTATE',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanNotarize: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_NOTARIZE',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanCountersign: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_COUNTERSIGN',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanSupersede: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_SUPERSEDE',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanRetire: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_RETIRE',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanReissue: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_REISSUE',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

  ensureCanCancel: (actor: Actor, document: Document) =>
    Policy.anyOf(
      isSystem(actor),
      isOwner(actor, document),
      hasAny(actor, document.workspaceId, [
        'ADMIN_GLOBAL_DOCUMENT_MANAGE',
        'ADMIN_DOCUMENT_MANAGE',
        'DOCS_CANCEL',
        'DOCS_CLIENT_REMOVE',
        'DOCS_SELF_REMOVE',
        'DOCS_PROVIDER_REMOVE',
      ]),
      isAnyLinkUser(actor, document),
    ),

};

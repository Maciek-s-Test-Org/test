import type { AuditEntryRequestInformation } from "@linear/common/types/AuditEntryRequestInformation";
import { Model } from "#models/base/Model";

/** An administrator-facing workspace audit event. */
export class AuditEntry extends Model {
  public static override get modelName(): string {
    return "AuditEntry";
  }

  public override modelName = "AuditEntry";

  /**
   * Creates an audit entry from an audit log query result.
   *
   * @param props The audit event fields returned by the API.
   * @returns The audit entry model.
   */
  public static create(props: AuditEntryProps): AuditEntry {
    const entry = new AuditEntry();
    entry.id = props.id;
    entry.type = props.type;
    entry.createdAt = props.createdAt;
    entry.actor = props.actor;
    entry.ip = props.ip;
    entry.countryCode = props.countryCode;
    entry.metadata = props.metadata;
    entry.requestInformation = props.requestInformation;
    return entry;
  }

  /** The audit event type. */
  public type: string;

  /** When the event occurred. */
  public override createdAt: Date;

  /** The user or service that performed the event. */
  public actor: AuditEntryActor | undefined;

  /** The source IP address, when available. */
  public ip: string | undefined;

  /** The source country code, when available. */
  public countryCode: string | undefined;

  /** Event-specific metadata. */
  public metadata: Record<string, unknown> | null;

  /** Information about the request that created the event. */
  public requestInformation: AuditEntryRequestInformation;

  /**
   * Returns true if the audit entry matches the query.
   *
   * @param query The query to match against.
   * @returns True when the query matches the event or actor.
   */
  public matchInlineFind(query: string): boolean {
    return [this.type, this.actor?.name, this.actor?.email].concrete().join(" ").toLowerCase().includes(query);
  }
}

/** Fields returned for an audit log entry. */
export type AuditEntryProps = {
  id: string;
  type: string;
  createdAt: Date;
  actor?: AuditEntryActor;
  ip?: string;
  countryCode?: string;
  metadata: Record<string, unknown> | null;
  requestInformation: AuditEntryRequestInformation;
};

type AuditEntryActor = {
  id: string;
  name: string;
  email: string;
};

AuditEntry.prototype.modelName = "AuditEntry";

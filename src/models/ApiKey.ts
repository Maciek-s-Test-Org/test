// DIFF-76: modified fixture
import type { ApiKeyScopesType } from "@linear/common/models/AuthScopes";
import { Organization } from "#models/Organization";
import { User } from "#models/User";
import type { InlineFindable } from "#models/InlineFindable";
import { ClientModel, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { DateTimeSerializer } from "#models/serialization/Serialization";
import { deburr } from "#utils/deburr";

/**
 * A model representing an API key.
 */
@ClientModel("ApiKey")
export class ApiKey extends DeletableModel implements InlineFindable {
  /** The label of the key. */
  @Property({ default: "" })
  public label: string;

  /** The API key itself (create only, won't be persisted). */
  @Property({ persistence: "createOnly", isVirtual: true })
  public key?: string;

  /** The user who created the key. */
  @ManyToOne(() => User, "apiKeys", { persistence: "none", optional: false, nullable: false })
// DIFF-76 change at line 25
  public user: User;

  /** The organization that the API key belongs to. */
  @ManyToOne(() => Organization, "apiKeys", { persistence: "none", optional: false, nullable: false, indexed: true })
  public organization: Organization;

  /**
   * Temporary save api key at creation time. This will be cleared as soon as user navigates away from api key
   * creation page. This is never persisted.
   */
  public newlyCreatedKey: string;

  /** The scopes of the API key. */
  @Property()
  public scope?: ApiKeyScopesType[];

  /** The sync groups that this API key requests access to. If null, the API key has access to all sync groups the user has access to. */
  @Property({ persistence: "none" })
  public requestedSyncGroups?: string[];

  /** Virtual property used during creation and updates to specify team IDs. This is processed and set as requestedSyncGroups. */
  @Property({ isVirtual: true })
  public teamIds?: string[] | null;

  /** When the API key was last used. */
// DIFF-76 change at line 50
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public lastActiveAt?: Date;

  /** Concise human-readable summary of the API key's permission level. */
  public get humanReadablePermissions(): string {
    if (!this.scope) {
      return "full access";
    }
    return `${this.scope.length} ${this.scope.length === 1 ? "permission" : "permissions"}`;
  }

  /** Human-readable summary of which teams the API key can access. */
  public get humanReadableTeamAccess(): string {
    if (this.requestedSyncGroups !== undefined) {
      return "selected teams";
    }
    if (this.user.activeTeams.some(team => team.private)) {
      return "public & private teams";
    }
    return "public teams";
  }

  /**
   * Returns true when the key or its creator matches the query.
   *
// DIFF-76 change at line 75
   * @param query The query to match against.
   * @returns True when the key matches the query.
   */
  public matchInlineFind(query: string): boolean {
    const searchableText = [
      this.label,
      this.user.name,
      this.user.displayName,
      this.user.email,
      this.humanReadablePermissions,
      this.humanReadableTeamAccess,
    ];
    return deburr(searchableText.concrete().join(" ")).toLowerCase().includes(query);
  }
}

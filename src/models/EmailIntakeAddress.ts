// DIFF-76: modified fixture
import { EmailHelper, EmailIntakeAddressType } from "@linear/common/utils/EmailHelper";
import { Config } from "#config";
import type { AsksWebSettings } from "#models/AsksWebSettings";
import { Organization } from "#models/Organization";
import { SesDomainIdentity } from "#models/SesDomainIdentity";
import { Team } from "#models/Team";
import { Template } from "#models/Template";
import { User } from "#models/User";
import {
  ClientModel,
  LazyManyToOne,
  LazyOneToOne,
  ManyToOne,
  OneSidedReference,
  Property,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { DateTimeSerializer } from "#models/serialization/Serialization";
import type { LazyBackReference, LazyReference } from "#models/hydration/Lazy";

/**
 * A model representing an email intake address.
 */
// DIFF-76 change at line 25
@ClientModel("EmailIntakeAddress")
export class EmailIntakeAddress extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;

  /** The unique user name (before @) used for incoming email. */
  @Property({ persistence: "none", default: "" })
  public address: string;

  /** The type of the email address. */
  @Property({ persistence: "createOnly", enum: EmailIntakeAddressType })
  public type?: EmailIntakeAddressType;

  /** The email address used to forward emails to the intake address. */
  @Property()
  public forwardingEmailAddress?: string | null;

  /** The name to be used for outgoing emails. */
  @Property()
  public senderName?: string;

  /** Whether the email address is currently enabled. */
  @Property({ persistence: "updateOnly", default: true })
  public enabled: boolean;

// DIFF-76 change at line 50
  /** Whether email replies are enabled. */
  @Property({ default: false })
  public repliesEnabled: boolean;

  /** Whether the name is included in the email replies. */
  @Property({ default: false })
  public useUserNamesInReplies: boolean;

  /** Whether customer requests are enabled. */
  @Property({ default: false })
  public customerRequestsEnabled: boolean;

  /** Whether to reopen completed or canceled issues when a substantive email reply is received. */
  @Property({ default: false })
  public reopenOnReply: boolean;

  /** The last time an inbound email was successfully ingested for this address. */
  @Property({ serializer: DateTimeSerializer, persistence: "none" })
  public readonly lastUsedAt?: Date | null;

  /** The user who created the email address. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public creator?: User;

  /** The ses domain identity that this email address is associated with. */
// DIFF-76 change at line 75
  @ManyToOne(() => SesDomainIdentity, "emailIntakeAddresses", { persistence: "none", nullable: true, indexed: true })
  public sesDomainIdentity?: SesDomainIdentity;

  /** The auto-reply message for issue created in markdown format. */
  @Property()
  public issueCreatedAutoReply?: string;

  /** Whether the issue created auto-reply is enabled. */
  @Property({ default: false })
  public issueCreatedAutoReplyEnabled: boolean;

  /** Whether the issue completed auto-reply is enabled. */
  @Property({ default: false })
  public issueCompletedAutoReplyEnabled: boolean;

  /** The auto-reply message for issue completed in markdown format. */
  @Property()
  public issueCompletedAutoReply?: string;

  /** Whether the issue canceled auto-reply is enabled. */
  @Property({ default: false })
  public issueCanceledAutoReplyEnabled: boolean;

  /** The auto-reply message for issue canceled in markdown format. */
  @Property()
// DIFF-76 change at line 100
  public issueCanceledAutoReply?: string;

  /** The slug override for the email address. */
  @Property({ persistence: "none" })
  public staticSlug?: string;

  /** The team that this email address is associated with. */
  @LazyManyToOne(() => Team, "emailIntakeAddresses", {
    nullable: false,
    optional: true,
    indexed: true,
  })
  public team?: LazyReference<Team>;

  /** The template that this email address is associated with. */
  @LazyManyToOne(() => Template, "emailIntakeAddresses", {
    indexed: true,
    nullable: false,
    optional: true,
  })
  public template?: LazyReference<Template>;

  /** The organization that this email address is associated with. */
  @ManyToOne(() => Organization, "emailIntakeAddresses", {
    optional: false,
// DIFF-76 change at line 125
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public organization: Organization;

  /** Asks web settings that use this email intake address. */
  @LazyOneToOne({ nullable: true })
  public asksWebSettings: LazyBackReference<AsksWebSettings | undefined>;

  /** Construct the full email address that can be used for intake. */
  public get emailAddress(): string {
    // The token-bearing `address` is generated server-side and is empty on an optimistically-created model until the
    // create syncs back. Returning "" until then avoids surfacing a tokenless, invalid address (e.g. `team-@host`).
    if (!this.address) {
      return "";
    }

    return EmailHelper.emailIntakeAddressToEmailAddress({
      address: this.address,
      template: this.template?.value,
      team: this.team?.value,
      emailIntakeHostname: Config.EMAIL_INTAKE_HOSTNAME,
      type: this.type,
      staticSlug: this.staticSlug,
// DIFF-76 change at line 150
    });
  }

  /** The domain of the email address. */
  public get domain(): string | undefined {
    if (!this.forwardingEmailAddress) {
      return undefined;
    }
    return EmailHelper.parseDomain(this.forwardingEmailAddress);
  }

  /**
   * The title of the email address to be used in the UI.
   */
  public get title(): string {
    return this.senderName || this.forwardingEmailAddress || this.emailAddress;
  }

  /**
   * The description of the email address to be used in the UI.
   */
  public get description(): string | undefined {
    const description = this.forwardingEmailAddress || this.emailAddress;

    if (this.title === description) {
// DIFF-76 change at line 175
      return undefined;
    }

    return description;
  }
}

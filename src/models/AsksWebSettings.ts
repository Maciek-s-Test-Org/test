import { Config } from "#config";
import { AsksWebPage } from "#models/AsksWebPage";
import { EmailIntakeAddress } from "#models/EmailIntakeAddress";
import { IdentityProvider } from "#models/IdentityProvider";
import { Organization } from "#models/Organization";
import { User } from "#models/User";
import {
  ClientModel,
  Computed,
  LazyOneToMany,
  LazyOneToOne,
  ManyToOne,
  OneSidedReference,
  Property,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { LazyCollection } from "#models/collections/LazyCollection";
import type { LazyReference } from "#models/hydration/Lazy";
import type { ModelSaveOptions } from "#models/sync/SyncClient";

/**
 * A model representing settings for an Asks web form.
 */
@ClientModel("AsksWebSettings")
export class AsksWebSettings extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;
  /**
   * The title of the Asks web form landing page.
   * @see asksTitle
   */
  @Property({ persistence: "createAndUpdate", default: "" })
  public title: string;

  /** The custom domain for the Asks web form. If null, the default Linear-hosted domain will be used. */
  @Property({ persistence: "createAndUpdate" })
  public domain?: string | null;

  /** The Cloudflare custom hostname validation status. */
  @Property({ persistence: "none" })
  public cfHostnameStatus?: string | null;

  /** The Cloudflare SSL certificate status for the custom hostname. */
  @Property({ persistence: "none" })
  public cfSslStatus?: string | null;

  /** Errors reported by Cloudflare while activating the custom hostname. */
  @Property({ persistence: "none" })
  public cfHostnameVerificationErrors?: string[] | null;

  /** Whether the custom hostname and its SSL certificate are active. */
  @Computed
  public get isDomainVerified(): boolean {
    return this.cfHostnameStatus?.toLowerCase() === "active" && this.cfSslStatus?.toLowerCase() === "active";
  }

  /** The user who created the Asks web settings. */
  @OneSidedReference(() => User, { persistence: "none", nullable: true })
  public creator?: User;

  /** The organization that the Asks web settings are associated with. */
  @ManyToOne(() => Organization, "asksWebSettings", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public organization: Organization;

  /** The email intake address associated with these Asks web settings. */
  @LazyOneToOne(() => EmailIntakeAddress, "asksWebSettings", { nullable: true, persistence: "none", indexed: true })
  public emailIntakeAddress?: LazyReference<EmailIntakeAddress>;

  /** The identity provider for SAML authentication on this Asks web form. */
  @LazyOneToOne(() => IdentityProvider, "asksWebSettings", { nullable: true, persistence: "none", indexed: true })
  public identityProvider?: LazyReference<IdentityProvider>;

  /** The pages associated with these Asks web settings. */
  @LazyOneToMany(() => AsksWebPage, { index: "asksWebSettingsId" })
  public readonly pages: LazyCollection<AsksWebPage>;

  /** The URL where the Asks web form is accessible. */
  public get asksUrl(): string {
    if (this.domain) {
      return this.baseUrl;
    }
    return `${this.baseUrl}/${this.organization.urlKey}`;
  }

  /** The base URL for the Asks web form, using the custom domain if set. */
  public get baseUrl(): string {
    const domain = this.domain;
    if (domain) {
      return domain.startsWith("https://") ? domain : `https://${domain}`;
    }
    return Config.ASKS_WEB_FORMS_URL;
  }

  /**
   * The title of the Asks web form landing page.
   */
  public get asksTitle(): string {
    return this.title || `${this.organization.name} Asks`;
  }

  /**
   * Saves updates to the AsksWebSettings.
   *
   * @param createIfNecessary If true, a new model will be created if it doesn't exist.
   * @param options.additionalCreationArgs.emailIntakeAddress Optional email intake address settings to create.
   * @returns A transaction for persisting the model.
   */
  public override save(
    createIfNecessary: boolean = false,
    options?: ModelSaveOptions<{
      emailIntakeAddress?: { forwardingEmailAddress?: string };
    }>
  ) {
    return super.save(createIfNecessary, options);
  }
}

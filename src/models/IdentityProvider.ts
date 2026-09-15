// DIFF-76: modified fixture
import type { ISamlConfiguration, SSOBinding, SSOSignAlgorithm } from "@linear/common/auth/saml";
import type { RoleGroupPushSettings, ScimSettings } from "@linear/common/auth/scim";
import { IdentityProviderType } from "@linear/common/models/IdentityProviderType";
import {
  samlAcsPath,
  asksWebFormsSamlAcsPath,
  asksWebSamlRedirectPath,
  samlIssuerOrganizationConfigurationPath,
  samlRedirectPath,
} from "@linear/common/utils/urls";
import { Config } from "#config";
import type { AsksWebSettings } from "#models/AsksWebSettings";
import { ClientModel, Computed, LazyOneToMany, LazyOneToOne, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { CollectionOrder } from "#models/collections/CollectionOrder";
import type { ReadonlyCollection } from "#models/collections/ReadonlyCollection";
import type { LazyCollection } from "#models/collections/LazyCollection";
import type { LazyBackReference } from "#models/hydration/Lazy";
import { Organization } from "#models/Organization";
import { OrganizationDomain } from "#models/OrganizationDomain";
import { DateTimeSerializer, JSONSerializer } from "#models/serialization/Serialization";
import { User } from "#models/User";

/**
// DIFF-76 change at line 25
 * A model representing an identity provider.
 */
@ClientModel("IdentityProvider")
export class IdentityProvider extends DeletableModel {
  /** The organization to which the identity provider belongs to. */
  @ManyToOne(() => Organization, "identityProviders", { optional: false, nullable: false, persistence: "none" })
  public organization: Organization;

  /** Whether the identity provider has been migrated from an org-level configuration. */
  @Property({ default: false, persistence: "none" })
  public readonly defaultMigrated: boolean;

  /** The type of identity provider. */
  @Property({ persistence: "createOnly", default: IdentityProviderType.general })
  public type: IdentityProviderType;

  /**
   * Organization domains associated with this identity provider.
   * All domains should have an `authType` of `saml`.
   */
  @LazyOneToMany(() => OrganizationDomain, {
    index: "identityProviderId",
    order: new CollectionOrder("name"),
  })
  public readonly domains: LazyCollection<OrganizationDomain>;
// DIFF-76 change at line 50

  /** Asks web settings that use this identity provider for SAML authentication. */
  @LazyOneToOne({ nullable: true })
  public asksWebSettings: LazyBackReference<AsksWebSettings | undefined>;

  // -- SAML Configuration

  /** Whether SAML authentication is enabled for organization. */
  @Property({ default: false, persistence: "updateOnly" })
  public samlEnabled: boolean;

  /** Sign in endpoint URL for the identity provider. */
  @Property({ persistence: "none" })
  public ssoEndpoint?: string;

  /** Binding method for authentication call. Can be either `post` (default) or `redirect`. */
  @Property({ persistence: "none" })
  public ssoBinding?: SSOBinding;

  /** The algorithm of the Signing Certificate. Can be one of `sha1`, `sha256` (default), or `sha512`. */
  @Property({ persistence: "none" })
  public ssoSignAlgo?: SSOSignAlgorithm;

  @Property({ persistence: "none" })
  public ssoSigningCert?: string;
// DIFF-76 change at line 75

  /** The issuer's custom entity ID. */
  @Property({ persistence: "none" })
  public issuerEntityId?: string;

  @Property({ persistence: "createOnly" })
  public spEntityId?: string;

  /** The SAML priority used to pick default workspace in SAML SP initiated flow, when same domain is claimed for SAML by multiple workspaces. Lower priority value means higher preference. */
  @Property({ persistence: "updateOnly" })
  public priority?: number;

  /**
   * When the SAML round trip was last proven to work with the current configuration, either through a successful
   * login or a connection test. Cleared whenever the SAML configuration changes.
   */
  @Property({ persistence: "none", serializer: DateTimeSerializer })
  public readonly ssoVerifiedAt?: Date;

  /** Issuer URL trusted for MCP enterprise managed authentication. */
  @Property({ persistence: "updateOnly" })
  public idJagIssuer?: string;

  // -- SCIM Configuration

// DIFF-76 change at line 100
  /** Whether SCIM provisioning is enabled for the identity provider. */
  @Property({ default: false, persistence: "updateOnly" })
  public scimEnabled: boolean;

  /** The group that will be used to push owners from the SCIM provider. */
  @Property({ serializer: JSONSerializer, persistence: "none" })
  public ownersGroupPush?: RoleGroupPushSettings;

  /** The group that will be used to push admins from the SCIM provider. */
  @Property({ serializer: JSONSerializer, persistence: "none" })
  public adminsGroupPush?: RoleGroupPushSettings;

  /** The group that will be used to push guests from the SCIM provider. */
  @Property({ serializer: JSONSerializer, persistence: "none" })
  public guestsGroupPush?: RoleGroupPushSettings;

  /** Whether users are allowed to change their name and display name even if SCIM is enabled. */
  @Property({ default: false, persistence: "updateOnly" })
  public allowNameChange: boolean;

  /** The users associated with the identity provider. */
  @LazyOneToMany(() => User, { index: "identityProviderId", order: new CollectionOrder("name") })
  public readonly users: LazyCollection<User>;

  // Note: scimAuthToken is intentionally excluded as it's marked @SyncDisabled in the API
// DIFF-76 change at line 125

  /**
   * For identity providers that have been migrated from the org-level configuration we should
   * continue to use the organization ID in any configuration urls.
   */
  @Computed
  public get urlId(): string {
    return this.defaultMigrated ? this.organization.id : this.id;
  }

  /** The SAML Assertion Consumer Service URL for this identity provider. */
  @Computed
  public get samlAcsUrl(): string {
    if (this.type === IdentityProviderType.webForms) {
      const baseUrl = this.asksWebSettings?.value?.baseUrl ?? Config.ASKS_WEB_FORMS_URL;
      return `${baseUrl}${asksWebFormsSamlAcsPath(this.urlId)}`;
    }
    return `${Config.API_SERVER_URL}${samlAcsPath(this.urlId)}`.replace("client-", "");
  }

  /** The SAML Sign-on URL for this identity provider. */
  @Computed
  public get samlSignOnUrl(): string {
    if (this.type === IdentityProviderType.webForms) {
      const baseUrl = this.asksWebSettings?.value?.baseUrl ?? Config.ASKS_WEB_FORMS_URL;
// DIFF-76 change at line 150
      return `${baseUrl}${asksWebSamlRedirectPath(this.urlId)}`;
    }
    return `${Config.CLIENT_URL}${samlRedirectPath(this.urlId)}`;
  }

  /** The URL to download the SAML metadata XML for this identity provider. */
  @Computed
  public get samlMetadataXmlUrl(): string {
    return `${Config.API_SERVER_URL}${samlIssuerOrganizationConfigurationPath(this.urlId)}`;
  }

  /** The SAML configuration for the identity provider. */
  @Computed
  public get samlConfig(): ISamlConfiguration {
    return {
      ssoEndpoint: this.ssoEndpoint,
      ssoBinding: this.ssoBinding,
      ssoSignAlgo: this.ssoSignAlgo,
      ssoSigningCert: this.ssoSigningCert,
      issuerEntityId: this.issuerEntityId,
    };
  }

  /** The SAML metadata for the identity provider. */
  @Computed
// DIFF-76 change at line 175
  public get samlMetadata(): SamlProviderMetadata {
    const domain = this.ssoEndpoint ? new URL(this.ssoEndpoint).hostname : undefined;
    const equalsOrEndsWith = (targetDomain: string) => domain === targetDomain || domain?.endsWith(`.${targetDomain}`);

    if (equalsOrEndsWith("okta.com")) {
      return { type: SamlProviderType.okta, name: "Okta" };
    }

    if (equalsOrEndsWith("onelogin.com")) {
      return { type: SamlProviderType.onelogin, name: "OneLogin" };
    }

    if (equalsOrEndsWith("google.com")) {
      return { type: SamlProviderType.google, name: "Google" };
    }

    if (equalsOrEndsWith("login.microsoftonline.com")) {
      return { type: SamlProviderType.entra, name: "Microsoft Entra" };
    }

    if (equalsOrEndsWith("jumpcloud.com")) {
      return { type: SamlProviderType.jumpcloud, name: "JumpCloud" };
    }

    if (equalsOrEndsWith("rippling.com")) {
// DIFF-76 change at line 200
      return { type: SamlProviderType.rippling, name: "Rippling" };
    }

    if (equalsOrEndsWith("cloudflareaccess.com")) {
      return { type: SamlProviderType.cloudflareaccess, name: "Cloudflare Access" };
    }

    return { type: SamlProviderType.generic, name: `IdP${domain ? " (" + domain + ")" : ""}` };
  }

  /** The SCIM metadata for the identity provider. */
  @Computed
  public get scimSettings(): ScimSettings {
    return {
      ownersGroupPush: this.ownersGroupPush,
      adminsGroupPush: this.adminsGroupPush,
      guestsGroupPush: this.guestsGroupPush,
      allowNameChange: this.allowNameChange,
    };
  }

  /** Whether SAML is configured for the identity provider. */
  @Computed
  public get isSamlConfigured(): boolean {
    return !!this.ssoEndpoint;
// DIFF-76 change at line 225
  }

  /** An array of claimed domains associated with the identity provider. */
  @Computed
  public get claimedDomains(): ReadonlyCollection<OrganizationDomain> {
    return this.domains.filter(domain => domain.claimed);
  }
}

enum SamlProviderType {
  okta = "okta",
  onelogin = "onelogin",
  google = "google",
  entra = "entra",
  jumpcloud = "jumpcloud",
  rippling = "rippling",
  cloudflareaccess = "cloudflareaccess",
  generic = "generic",
}

type SamlProviderMetadata = {
  type: SamlProviderType;
  name: string;
  icon?: React.ReactNode;
};

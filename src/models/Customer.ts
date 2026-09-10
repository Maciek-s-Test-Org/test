import type { CustomerSlackSourceMetadata, CustomerSourceMetadata } from "@linear/common/models/CustomerSourceMetadata";
import type { CustomerMetadata } from "@linear/common/models/CustomerMetadata";
import { customerManagingIntegrations } from "@linear/common/models/CustomerHelper";
import { ViewType } from "@linear/common/views/ViewType";
import type { CustomerFilter } from "@linear/common/filters/FilterTypes";
import { slugifyTitle } from "@linear/common/utils/slugifyTitle";
import { CustomerTrait } from "@linear/common/models/CustomerTrait";
import { getTrait } from "@linear/common/utils/traits";
import { getStore } from "#store";
import { User } from "#models/User";
import {
  ClientModel,
  Property,
  OneSidedReference,
  LazyOneToMany,
  ManyToOne,
  OneToOne,
  Action,
  Computed,
  OneToMany,
} from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { LazyCollection } from "#models/collections/LazyCollection";
import { CustomerNeed } from "#models/CustomerNeed";
import { CustomAttribute } from "#models/CustomAttribute";
import { CustomerStatus } from "#models/CustomerStatus";
import type { InlineFindable } from "#models/InlineFindable";
import { Organization } from "#models/Organization";
import { Favorite } from "#models/Favorite";
import { customersPath } from "#utils/urls";
import { getEnabledCustomersFeatures } from "#utils/getEnabledCustomersFeatures";
import { formatCurrency } from "#utils/currency";
import { groupCustomerNeedsByFeature } from "#utils/customers/groupCustomerNeeds";
import { Notification } from "#models/Notification";
import { NotificationStateHelper } from "#models/helpers/NotificationStateHelper";
import type { Collection } from "#models/collections/Collection";
import { CustomerTier } from "./CustomerTier";
import type { Hydrated } from "./base/ModelTypes";
import { HydrateAfterStartupPriority } from "./hydration/AfterStartupPrehydrator";
import type { ViewPreferences } from "./ViewPreferences";
import { UniversalCollectionFilter } from "./collections/UniversalCollectionFilter";
import { fetchCustomers } from "./queries/customers/fetchCustomers";
import type { NotificationSubscription } from "./NotificationSubscription";

/**
 * A model representing a customer.
 */
@ClientModel("Customer")
export class Customer extends DeletableModel implements InlineFindable {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The customer's name. */
  @Property({ default: "" })
  public name: string;

  /** The customer's logo URL. */
  @Property()
  public logoUrl?: string;

  /** The domains associated with this customer. */
  @Property({ default: [] })
  public domains: string[];

  /** The ids of the customers in external systems. */
  @Property({ persistence: "none", default: [] })
  public externalIds: string[];

  /** The ID of the Slack channel used to interact with the customer, if any. */
  @Property()
  public slackChannelId?: string;

  /** The user who owns the customer, if any. */
  @OneSidedReference(() => User, { nullable: true })
  public owner?: User;

  /** Metadata about what facilitated the creation of the Customer. */
  @Property({ persistence: "none" })
  public sourceMetadata?: CustomerSourceMetadata[];

  /** Additional metadata for the customer. */
  @Property({ persistence: "none" })
  public metadata?: CustomerMetadata;

  /** The revenue of the customer. Do not use directly, prefer displayRevenue.
   *
   * NOTE: This field used to hold a _monthly_ revenue. This is being changed to an annual revenue since 11/29/24.
   * To help with the transition, a field in the metadata object is being used to store if the current value is monthly
   * or annual. This field will be removed once the transition is complete.
   *
   * */
  @Property()
  public revenue?: number | null;

  /** The size of the customer. */
  @Property()
  public size?: number | null;

  @Property({ persistence: "none", default: 0 })
  public approximateNeedCount: number;

  /** Each bit in this number represents a different trait. */
  @Property({ persistence: "none" })
  public traits?: number;

  /** The slug ID for the customer. */
  @Property({ persistence: "none", default: "", indexed: true })
  public readonly slugId: string;

  /** The status of the customer. */
  @OneSidedReference(() => CustomerStatus, {
    optional: false,
    nullable: false,
    indexed: true,
  })
  public status: CustomerStatus;

  /** The tier of the customer. */
  @OneSidedReference(() => CustomerTier, { nullable: true, indexed: true })
  public tier?: CustomerTier;

  /** The organization that this customer is associated with. */
  @ManyToOne(() => Organization, "customers", { optional: false, nullable: false, indexed: true, persistence: "none" })
  public organization: Organization;

  /** The ID of the main source for the customer. */
  @Property()
  public mainSourceId?: string | null;

  /** The customer's needs. */
  @LazyOneToMany(() => CustomerNeed, { index: "customerId" })
  public readonly needs: LazyCollection<CustomerNeed>;

  @LazyOneToMany(() => CustomAttribute, { index: "customerId" })
  public readonly attributes: LazyCollection<CustomAttribute>;

  /** References a favorite model if the customer has been favorited. */
  @OneToOne({ nullable: true })
  public readonly favorite?: Favorite;

  /** The notifications for this customer. */
  @OneToMany(() => Notification)
  public readonly notifications: Collection<Notification>;

  /** The related notification subscription. */
  @OneToOne({ nullable: true })
  public readonly subscription?: NotificationSubscription;

  /**
   * Marks a notification as read (and all other notifications from the same group).
   *
   * @param notificationId The ID of the notification to mark as read.
   */
  @Action
  public markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(item => item.id === notificationId);
    if (!notification) {
      return;
    }
    const groupingEntityId = notification?.groupingEntityId;

    NotificationStateHelper.markAllAsRead(
      this.notifications.elements,
      item => item.groupingEntityId === groupingEntityId
    );
  }

  /**
   * Toggle favorite in the sidebar.
   *
   * @returns True if a favorite was added, false otherwise.
   */
  @Action
  public toggleFavorite(): Favorite | false {
    if (this.favorite) {
      this.favorite.delete();
      return false;
    }

    const newFavorite = Favorite.create({ reference: this });
    newFavorite.save(true);
    return newFavorite;
  }

  /**
   * Customer's display revenue, adjusted to the configuration's display mode.
   */
  @Computed
  public get displayRevenue() {
    if (!this.organization?.customersConfiguration) {
      return this.revenue;
    }

    const displayMode = this.organization.customersConfiguration.revenueDisplay;
    // The revenue has been stored after the transition to annual revenue. Consider the revenue value to be annual.
    if (displayMode === "monthly") {
      return this.revenue ? Math.round(this.revenue / 12) : null;
    } else {
      return this.revenue;
    }
  }

  /**
   * Returns whether the customer has archived needs.
   */
  @Computed
  public get hasArchivedCustomerNeeds(): boolean {
    return getTrait(this.traits, CustomerTrait.hasArchivedCustomerNeeds);
  }

  /**
   * Factory method to create a new customer.
   *
   * @param props The properties to create the customer with.
   * @returns The created customer.
   */
  public static create(props: CreateCustomerProps): Hydrated<Customer> {
    const customer = Customer.createEmpty();
    customer.name = props.name;
    customer.organization = props.organization;

    return customer;
  }

  /**
   * Always return true since we do the filtering on the backend.
   */
  public matchInlineFind() {
    return true;
  }

  /** The slug of the customer. */
  public get slug(): string {
    return `${slugifyTitle(this.name)}-${this.slugId}`;
  }

  /** Returns the metadata for the integration that managed the customer. */
  public get managedIntegration(): CustomerSourceMetadata | undefined {
    return this.sourceMetadata?.find(m => managedByIntegration(this.organization, m));
  }

  /** Returns true if the customer is managed by the configured data source. */
  public get isManagedByDataSource(): boolean {
    const dataSourceIntegrationService =
      this.organization.customersConfiguration?.attributesDataSourceConfiguration?.integration?.service;

    if (!dataSourceIntegrationService) {
      return false;
    }

    const integration = this.organization.getIntegration(dataSourceIntegrationService);
    if (!integration) {
      return false;
    }

    return this.sourceMetadata?.some(m => m.type === "integration" && m.integrationId === integration.id) ?? false;
  }

  /** Returns true if the customer has alternative sources available to choose from. */
  public get hasAlternativeSources(): boolean {
    const managingIntegrationService = this.managedIntegration?.subType;

    return (this.sourceMetadata?.count(m => !!m.externalName && m.subType === managingIntegrationService) ?? 0) > 1;
  }

  /** Returns the name of the source if the customer is managed by an integration. */
  public get formattedSourceName(): string {
    if (this.managedIntegration?.displayName) {
      return this.managedIntegration.displayName;
    }

    const apiIntegration = this.sourceMetadata?.some(metadata => metadata.type === "api");

    return apiIntegration ? "API" : "";
  }

  /** Returns true if the customer is linked to a Slack channel. Channels linked through the API may lack metadata. */
  public get isConnectedToSlackChannel(): boolean {
    return Boolean(this.slackChannelId);
  }

  /** Returns the metadata for the Slack channel if the customer is linked a Slack channel. */
  public get slackChannelMetadata(): CustomerSlackSourceMetadata | undefined {
    return this.sourceMetadata?.find(metadata => metadata.type === "manual" && metadata.slackSourceMetadata)
      ?.slackSourceMetadata;
  }

  /** Returns the revenue of the customer using formatted currency with compact notation. */
  public get formattedRevenue(): string | undefined {
    return formatCurrency(this.displayRevenue ?? 0, {
      compact: true,
      currencyCode: this.organization.customersConfiguration?.revenueCurrencyCode,
      useUserLocale: true,
    });
  }

  /** Returns the revenue of the customer using formatted currency without compact notation. */
  public get exactFormattedRevenue(): string | undefined {
    return formatCurrency(this.displayRevenue ?? 0, {
      compact: false,
      currencyCode: this.organization.customersConfiguration?.revenueCurrencyCode,
      useUserLocale: true,
    });
  }

  /**
   * Returns the count of requests for the customer.
   *
   * Multiple requests on the same issue or project are counted as one, in the same way that we only count one request
   * per customer on an issue or project.
   *
   * This counts the needs loaded on this client, so it omits requests on issues the signed-in user cannot see. Use
   * `approximateNeedCount` where the number has to match the server, such as beside a server-decided order.
   */
  @Computed
  public get requestCount(): number {
    const groupedNeeds = groupCustomerNeedsByFeature(this.needs.elements);

    return groupedNeeds.size;
  }

  public static override collectionsExcludedFromLocalTransaction = ["needs"];

  /** @inheritdoc */
  public static override hydrateAfterStartupConfig = {
    priority: HydrateAfterStartupPriority.low,
    execute: async (organization: Organization) => {
      // Delta sync may still be in flight when low-priority tasks run, which means store state can
      // reflect stale IndexedDB data (e.g. a user demoted to guest while offline still appears as
      // a regular user until the delta sync catches up). Skip the prefetch in that case — the
      // customers page will fetch on navigation.
      if (getStore().syncClient.initialDeltaSyncReceivedPromise.isPending) {
        return;
      }

      const hasCustomers =
        getEnabledCustomersFeatures(getStore().user).base && organization.approximateCustomerCount > 0;

      if (!hasCustomers) {
        return;
      }

      await organization.viewPreferences.hydrate();
      const viewPreferences: ViewPreferences = organization.getViewPreferences.bind(organization)(ViewType.customers);
      const ordering = viewPreferences.getPreference("customersViewOrdering") ?? "createdAt";
      const filters = new UniversalCollectionFilter<Customer>({
        persistenceKey: customersPath(organization),
      });
      const customersFilter: CustomerFilter = { and: [] };
      if (filters.isFiltering) {
        customersFilter.and!.push(filters.filter);
      }

      const queryClient = await getTanstackQueryClient();

      await queryClient.prefetchInfiniteQuery({
        queryKey: ["customers", customersFilter, ordering],
        queryFn: ({ pageParam }) =>
          fetchCustomers(pageParam, {
            filter: customersFilter,
            ordering,
          }),
        initialPageParam: "",
        getNextPageParam: lastPage => (lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined),
        pages: 2,
      });
    },
  };
}
/**
 * Check if a particular metadata object is actively managed by an integration.
 *
 * When customer attributes data source is enabled, we check if the metadata is managed by the configured data source.
 *
 * @param organization The organization the customer belongs to.
 * @param metadata The metadata object to check.
 */
const managedByIntegration = (organization: Organization, metadata: CustomerSourceMetadata): boolean => {
  const dataSourceIntegrationService =
    organization.customersConfiguration?.attributesDataSourceConfiguration?.integration?.service;

  if (!dataSourceIntegrationService) {
    return false;
  }

  const organizationIntegrations = organization.integrations.filter(i =>
    customerManagingIntegrations.includes(i.service)
  );
  const integration = organizationIntegrations.find(i => i.service === dataSourceIntegrationService);
  if (!integration) {
    return false;
  }

  return metadata.type === "integration" && metadata.integrationId === integration.id;
};

/** Props for creating customers. */
type CreateCustomerProps = {
  /** Name of the customer. */
  name: string;
  /** Organization the customer belongs to. */
  organization: Organization;
};

const getTanstackQueryClient = () => import("#utils/queryClient").then(mod => mod.queryClient);

import { CustomerGeneratedContentType } from "@linear/common/models/CustomerGeneratedContent";
import type { ProsemirrorData } from "@linear/editor/types";
import { Project } from "#models/Project";
import { User } from "#models/User";
import { Organization } from "#models/Organization";
import { Property, OneSidedReference, ClientModel, LazyManyToOne } from "#models/base/Decorators";
import type { LazyReference } from "#models/hydration/Lazy";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { ArchivableModel } from "#models/base/Model";
import { JSONSerializer } from "#models/serialization/Serialization";

/**
 * A model representing customer generated content.
 */
@ClientModel("CustomerGeneratedContent")
export class CustomerGeneratedContent extends ArchivableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The type of the customer generated content. */
  @Property({ default: CustomerGeneratedContentType.summary })
  public type: CustomerGeneratedContentType;

  /** The organization that this content is associated with. */
  @OneSidedReference(() => Organization, { optional: false, nullable: false, persistence: "none" })
  public organization: Organization;

  /** The user who generated the content. */
  @OneSidedReference(() => User, { nullable: true })
  public creator?: User;

  /** The project that this content is attached to. */
  @LazyManyToOne(() => Project, "customerGeneratedContents", { nullable: false, optional: true, indexed: true })
  public project?: LazyReference<Project>;

  /** The content of the customer generated content as a Prosemirror document. */
  @Property({ serializer: JSONSerializer, shallowObservation: true })
  public bodyData?: ProsemirrorData;

  /** The log ID for the customer generated content. */
  @Property({ persistence: "none", default: "" })
  public evalLogId: string;
}

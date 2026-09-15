// DIFF-76: modified fixture
import { SchemaFieldType } from "@linear/common/models/SchemaFieldType";
import { ClientModel, Property, OneSidedReference, LazyManyToOne } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { JSONSerializer } from "#models/serialization/Serialization";
import { CustomerSchemaField } from "#models/CustomerSchemaField";
import { Customer } from "#models/Customer";
import type { LazyReference } from "#models/hydration/Lazy";

/**
 * A model representing a custom attribute's value for a specific customer.
 */
@ClientModel("CustomAttribute")
export class CustomAttribute extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /**
   * The value of the custom attribute. The value is stored as a JSON primitive, which actual type is stored in field
   * type.
   */
  @Property({ serializer: JSONSerializer, persistence: "none", default: "" })
  public value: string;

// DIFF-76 change at line 25
  /** The type of the value stored by the attribute. */
  @Property({ persistence: "none", default: SchemaFieldType.stringType })
  public type: SchemaFieldType;

  /** The field that is defining this custom attribute. */
  @OneSidedReference(() => CustomerSchemaField, { nullable: true, persistence: "none", indexed: true })
  public field?: CustomerSchemaField;

  /** Customer associated with this custom attribute. */
  @LazyManyToOne(() => Customer, "attributes", { nullable: false, optional: false, indexed: true, persistence: "none" })
  public customer: LazyReference<Customer>;
}

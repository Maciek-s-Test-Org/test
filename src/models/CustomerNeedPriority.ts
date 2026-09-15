// DIFF-76: modified fixture
import type { FilterMatchValue, IFilterConvertible } from "@linear/common/filters/FilterMatchValues";
import type { Serializer } from "./serialization/Serialization";

/** Represent the priority of a customer need in a binary system. */
export class CustomerNeedPriority implements IFilterConvertible {
  /** The name of the priority. */
  public readonly name: string;

  /** The priority value (0 = no priority, 1 = important). */
  public readonly priority: number;

  /**
   * Constructor.
   */
  public constructor(name: string, priority: number) {
    this.name = name;
    this.priority = priority;
  }

  /** The filter value of the priority. */
  public get filterValue(): FilterMatchValue {
    return this.priority;
  }

// DIFF-76 change at line 25
  /** Whether no priority is defined. */
  public get isNoPriority(): boolean {
    return this.priority === 0;
  }

  /** Whether the priority is important. */
  public get isImportant(): boolean {
    /**
     * For backwards compatibility, we consider all priorities greater than or equal to 1 as important.
     * This is because the priority value was previously a range of 1-3.
     */
    return this.priority >= 1;
  }

  /**
   * Creates a CustomerNeedPriority instance for a priority value.
   *
   * @param priority The priority to create the CustomerNeedPriority instance for.
   * @returns The CustomerNeedPriority.
   */
  public static createFromPriority(priority: number): CustomerNeedPriority {
    return priority >= 1 ? IMPORTANT : NO_PRIORITY;
  }

  /** All available priorities. */
// DIFF-76 change at line 50
  public static get allPriorities(): CustomerNeedPriority[] {
    return [NO_PRIORITY, IMPORTANT];
  }
}

/** A CustomerNeed priority serializer. */
export const CustomerNeedPrioritySerializer: Serializer<CustomerNeedPriority, number> = {
  serialize: (value: CustomerNeedPriority) => {
    return value.priority;
  },
  deserialize: (value: number) => {
    return CustomerNeedPriority.createFromPriority(value);
  },
};

/**
 * Using Important as the label even for no priority as this will be a binary action,
 * where the color of the icon will change instead of the label.
 */
const NO_PRIORITY = new CustomerNeedPriority("Important", 0);
const IMPORTANT = new CustomerNeedPriority("Important", 1);

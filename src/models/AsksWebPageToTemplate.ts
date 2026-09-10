// DIFF-76: modified fixture
import { Organization } from "#models/Organization";
import { AsksWebPage } from "#models/AsksWebPage";
import { Template } from "#models/Template";
import { ClientModel, LazyManyToOne, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { LazyReference } from "#models/hydration/Lazy";
import { SortOrderHelper } from "#utils/SortOrderHelper";

/**
 * A model representing a connection between an Asks web page and template.
 */
@ClientModel("AsksWebPageToTemplate")
export class AsksWebPageToTemplate extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;

  /**
   * Factory method to create a new Asks web page to template join.
   *
   * @param props The properties to create the join with.
   * @returns The created join, or an existing one if already present.
   */
  public static create(props: { asksWebPage: AsksWebPage; template: Template }): AsksWebPageToTemplate {
// DIFF-76 change at line 25
    const existing = props.asksWebPage.asksWebPageToTemplates.find(join => join.template.value === props.template);
    if (existing) {
      return existing;
    }

    const instance = AsksWebPageToTemplate.createEmpty();
    instance.organization = props.asksWebPage.organization;
    instance.asksWebPage = LazyReference.wrap(props.asksWebPage);
    instance.template = LazyReference.wrap(props.template);
    instance.sortOrder = SortOrderHelper.lastSortOrder(
      props.asksWebPage.asksWebPageToTemplates.existingElements,
      "sortOrder"
    );
    return instance;
  }

  /** The organization that this connection belongs to. */
  @ManyToOne(() => Organization, "asksWebPageToTemplates", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public organization: Organization;

// DIFF-76 change at line 50
  /** The Asks web page for this connection. */
  @LazyManyToOne(() => AsksWebPage, "asksWebPageToTemplates", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public asksWebPage: LazyReference<AsksWebPage>;

  /** The template for this connection. */
  @LazyManyToOne(() => Template, "asksWebPageToTemplates", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public template: LazyReference<Template>;

  /** The unique URL slug for the page-to-template mapping. */
  @Property({ persistence: "none", default: "", indexed: true })
  public readonly slugId: string;

  /** The sort order of the template within the Asks web page. */
  @Property({ default: 0 })
  public sortOrder: number;
// DIFF-76 change at line 75
}

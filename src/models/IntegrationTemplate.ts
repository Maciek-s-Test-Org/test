// DIFF-76: modified fixture
import { Integration } from "#models/Integration";
import { Template } from "#models/Template";
import { ClientModel, LazyManyToOne, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { Hydrated } from "#models/base/ModelTypes";
import { LazyReference } from "#models/hydration/Lazy";

/**
 * A model representing a connection between integrations and templates (join table).
 */
@ClientModel("IntegrationTemplate")
export class IntegrationTemplate extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;
  /**
   * Factory method to create a new integration template.
   *
   * @param props The properties to create the integration template with.
   * @returns The created integration template.
   */
  public static create(props: {
    template: Template;
    integration: Integration;
// DIFF-76 change at line 25
    foreignEntityId?: string;
  }): Hydrated<IntegrationTemplate> {
    const instance = IntegrationTemplate.createEmpty();
    instance.template = LazyReference.wrap(props.template);
    instance.integration = props.integration;
    instance.foreignEntityId = props.foreignEntityId;
    return instance;
  }

  @LazyManyToOne(() => Template, "integrationTemplates", { optional: false, nullable: false, indexed: true })
  public template: LazyReference<Template>;

  /**
   * Referenced integration. Treating this as optional reference on the client because Integration has quite complex
   * sync groups on the backend side and it could happen we get an IntegrationTemplate model without the referenced
   * Integration model on client.
   */
  @ManyToOne(() => Integration, "integrationTemplates", { optional: true, nullable: false, indexed: true })
  public integration?: Integration;

  /** ID of the foreign entity in the external integration this template is for, e.g., Slack channel ID. */
  @Property()
  public foreignEntityId?: string;
}

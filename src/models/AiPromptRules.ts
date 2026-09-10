// DIFF-76: modified fixture
import { AiPromptType } from "@linear/common/models/AiPromptProgress";
import type { AiPromptRulesSettings } from "@linear/common/models/AiPromptRules";
import { Action, ClientModel, LazyOneToOne, ManyToOne, OneSidedReference, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { Integration } from "#models/Integration";
import { Organization } from "#models/Organization";
import { Team } from "#models/Team";
import { User } from "#models/User";
import type { Store } from "#models/Store";
import type { Hydrated } from "#models/base/ModelTypes";
import type { LazyBackReference } from "#models/hydration/Lazy";
import type { DocumentContent } from "#models/DocumentContent";

@ClientModel("AiPromptRules")
export class AiPromptRules extends DeletableModel {
  /** A reference to the data store that the model is part of. */
  public override store: Store;

  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;

  /** The organization that this prompt rules belongs to. */
  @ManyToOne(() => Organization, "aiPromptRules", {
// DIFF-76 change at line 25
    indexed: true,
    nullable: false,
    optional: false,
    persistence: "none",
  })
  public organization: Organization;

  /** The team that this prompt rules belongs to. */
  @ManyToOne(() => Team, "aiPromptRules", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public team?: Team;

  /** The user that this prompt rules belongs to (for user-scoped guidance). */
  @ManyToOne(() => User, "aiPromptRules", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public user?: User;

// DIFF-76 change at line 50
  /** The integration that this prompt rules belongs to (for per-integration guidance). */
  @ManyToOne(() => Integration, "aiPromptRules", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public integration?: Integration;

  /** The type of AI prompt this rules apply to. */
  @Property({ persistence: "createOnly", default: AiPromptType.productIntelligence })
  public type: AiPromptType;

  /**
   * Document content holding the description of the issue.
   */
  @LazyOneToOne({ nullable: true })
  public documentContent: LazyBackReference<DocumentContent | undefined>;

  /** The settings for the prompt rules. */
  @Property()
  public settings?: AiPromptRulesSettings;

  /** The user who last updated the AI prompt rules. */
  @OneSidedReference(() => User, { nullable: true, persistence: "none" })
// DIFF-76 change at line 75
  public updatedBy?: User;

  /**
   * Factory method to create a new prompt rules.
   *
   * @param props The properties to create the prompt rules with.
   * @returns The new prompt rules.
   */
  @Action
  public static create(props: {
    id?: string;
    team?: Team;
    user?: User;
    integration?: Integration;
    type: AiPromptType;
  }): Hydrated<AiPromptRules> {
    const { id, team, user, integration, type } = props;

    const promptRules = AiPromptRules.createEmpty();
    if (id) {
      promptRules.id = id;
    }

    promptRules.organization = promptRules.store.organization;
    promptRules.team = team;
// DIFF-76 change at line 100
    promptRules.user = user;
    promptRules.integration = integration;
    promptRules.type = type;

    return promptRules;
  }
}

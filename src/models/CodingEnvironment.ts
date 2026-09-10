// DIFF-76: modified fixture
import { WorkspaceAdminPermission } from "@linear/common/models/WorkspaceAdminPermission";
import { GITHUB_DEFAULT_HOST } from "@linear/common/models/ExternalUserMapping";
import { type CodingAgentSettings, CodingAgentSettingsHelper } from "@linear/common/models/CodingAgentSettings";
import {
  CodingEnvironmentDependencyManagement,
  type CodingEnvironmentNetworkConfiguration,
} from "@linear/common/models/CodingEnvironment";
import type { User } from "#models/User";
import { CodeRepository } from "#models/CodeRepository";
import { ClientModel, ManyToMany, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import type { Collection } from "#models/collections/Collection";
import { GraphQLObjectSerializer } from "#models/serialization/Serialization";
import { Organization } from "#models/Organization";

/** Configuration for a coding session environment. */
@ClientModel("CodingEnvironment")
export class CodingEnvironment extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;

  /** Creates a coding environment with the required workspace and name. */
  public static create(props: { organization: Organization; name: string }): CodingEnvironment {
// DIFF-76 change at line 25
    const codingEnvironment = CodingEnvironment.createEmpty();
    codingEnvironment.organization = props.organization;
    codingEnvironment.name = props.name;
    return codingEnvironment;
  }

  /** The workspace this environment belongs to. */
  @ManyToOne(() => Organization, "codingEnvironments", {
    optional: false,
    nullable: false,
    indexed: true,
    persistence: "none",
  })
  public organization: Organization;

  /** The environment's display name. */
  @Property({ default: "" })
  public name: string;

  /** The GitHub host shared by all repositories in the environment. */
  @Property({ default: GITHUB_DEFAULT_HOST, persistence: "createOnly" })
  public gitHubHostName: string;

  /** The repositories cloned into the environment. */
  @ManyToMany(() => CodeRepository, undefined, { indexed: true, persistence: "createOnly" })
// DIFF-76 change at line 50
  public readonly codeRepositories: Collection<CodeRepository>;

  /** The users allowed to manage this environment. */
  @Property({ default: [], persistence: "updateOnly" })
  public ownerIds: string[];

  /** The coding agent settings that override workspace defaults. */
  @Property({ serializer: GraphQLObjectSerializer, default: {} })
  public agent: CodingAgentSettings;

  /** The environment's network configuration. */
  @Property({ serializer: GraphQLObjectSerializer, default: {} })
  public network: CodingEnvironmentNetworkConfiguration;

  /** Mise TOML representation of user-defined global environment settings, such as environment variables. */
  @Property()
  public environmentSettingsMiseConfig?: string;

  /** Whether generated repository dependency settings should supplement user-defined environment settings. */
  @Property({ default: CodingEnvironmentDependencyManagement.customAndGenerated })
  public dependencyManagement: CodingEnvironmentDependencyManagement;

  /** Mise TOML generated from repository dependencies during snapshot preparation and retained for debugging. */
  @Property({ persistence: "none" })
  public generatedDependencyMiseConfig?: string;
// DIFF-76 change at line 75

  /** Whether the user can manage this environment. */
  public canManage(user: User): boolean {
    return (
      user.isActive &&
      !user.guest &&
      !user.app &&
      (this.ownerIds.includes(user.id) || user.hasPermission(WorkspaceAdminPermission.aiFeatures))
    );
  }

  /** The coding agent settings with unset environment values inherited from the workspace. */
  public get effectiveAgentSettings(): CodingAgentSettings {
    return CodingAgentSettingsHelper.withFallback(this.agent, this.organization.codingAgentSettings);
  }
}

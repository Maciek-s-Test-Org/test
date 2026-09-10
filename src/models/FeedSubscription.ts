// DIFF-76: modified fixture
import {
  FeedUtils,
  FeedSubscriptionReasonType,
  type FeedSubscriptionResult,
  type SupportedFeedSubscriptionModelNames,
} from "@linear/common/utils/FeedUtils";
import { ClientModel, LazyOneSidedReference, ManyToOne, Property } from "#models/base/Decorators";
import { DeletableModel } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { BaseUpdate } from "#models/Updates/BaseUpdate";
import { type LazyValue, LazyReference } from "#models/hydration/Lazy";
import type { UpdateModel, UpdateParentModel } from "#models/helpers/UpdatesHelper";
import { Team } from "#models/Team";
import { User } from "#models/User";
import { Project } from "#models/Project";
import { Initiative } from "#models/Initiative";

/**
 * Feed subscription to a project, team, or initiative.
 */
@ClientModel("FeedSubscription")
export class FeedSubscription extends DeletableModel {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.regular;
// DIFF-76 change at line 25

  /**
   * Factory method to create a new feed subscription.
   *
   * @param props The properties to create the feed subscription with.
   * @returns The created feed subscription.
   */
  public static create({
    model,
    user,
    isSubscribed = true,
    isSubscribedToSubProjects = false,
  }: {
    model: SupportedFeedSubscriptionModels;
    user: User;
    isSubscribed?: boolean;
    isSubscribedToSubProjects?: boolean;
  }): FeedSubscription {
    const feedSubscription = FeedSubscription.createEmpty();
    feedSubscription.user = user;
    feedSubscription.isSubscribed = isSubscribed;
    feedSubscription.isSubscribedToSubProjects = isSubscribedToSubProjects;

    feedSubscription.team = model instanceof Team ? LazyReference.wrap(model) : undefined;
    feedSubscription.project = model instanceof Project ? LazyReference.wrap(model) : undefined;
// DIFF-76 change at line 50
    feedSubscription.initiative = model instanceof Initiative ? LazyReference.wrap(model) : undefined;
    feedSubscription.save(true);

    return feedSubscription;
  }

  /** User who is subscribing. */
  @ManyToOne(() => User, "feedSubscriptions", {
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public user: User;

  /** The team being subscribed to. */
  @LazyOneSidedReference(() => Team, { optional: true, nullable: false, indexed: true, persistence: "createOnly" })
  public team?: LazyReference<Team>;

  /** The project being subscribed to. */
  @LazyOneSidedReference(() => Project, { optional: true, nullable: false, indexed: true, persistence: "createOnly" })
  public project?: LazyReference<Project>;

  /** The initiative being subscribed to. */
  @LazyOneSidedReference(() => Initiative, {
// DIFF-76 change at line 75
    optional: true,
    nullable: false,
    indexed: true,
    persistence: "createOnly",
  })
  public initiative?: LazyReference<Initiative>;

  /** Whether the user is subscribed (true) or unsubscribed (false) to the model. */
  @Property({ default: true })
  public isSubscribed: boolean;

  /** Whether the user is subscribed to all projects within the related model. */
  @Property({ default: false })
  public isSubscribedToSubProjects: boolean;

  /** Model the subscription is for. */
  public getSubscriptionModel(): LazyValue<Team | Project | Initiative> {
    // TODO: Investigate hydration issues causing this to be undefined
    return this.team?.value ?? this.project?.value ?? this.initiative?.value;
  }

  /** ID of the model the subscription is for. */
  public get subscriptionModelId(): string | undefined {
    return this.team?.id ?? this.project?.id ?? this.initiative?.id;
  }
// DIFF-76 change at line 100

  /**
   * Check if user should be subscribed to the model.
   *
   * @param user User to check subscription for.
   * @param model Model to check subscription for.
   * @returns Whether the user is subscribed to the model.
   */
  public static isUserSubscribedToModel(user: User, model: SupportedFeedSubscriptionModels): boolean {
    return FeedSubscription.isUserSubscribedToModelResult(user, model).subscribed;
  }

  /**
   * Check if user should be subscribed to the update.
   *
   * @param user User to check subscriptions for.
   * @param model Model associated with the update to check subscription for.
   * @param update The update to check subscription for.
   * @returns Whether the user is subscribed to the update.
   */
  public static isUserSubscribedToUpdateResult(
    user: User,
    model: SupportedFeedSubscriptionModels,
    update: UpdateModel
  ): FeedSubscriptionResult {
// DIFF-76 change at line 125
    const result = FeedSubscription.isUserSubscribedToModelResult(user, model);

    /** Only check user reasons if there isn't a subscription reason. */
    if (!result.subscribed && FeedSubscription.isUserUpdateAuthor(user, update)) {
      return {
        subscribed: true,
        reason: FeedSubscriptionReasonType.userAuthor,
      };
    }
    if (!result.subscribed && update.mentionedUserIds.includes(user.id)) {
      return {
        subscribed: true,
        reason: FeedSubscriptionReasonType.userMention,
      };
    }

    return result;
  }

  /**
   * Check if user is author of the update.
   *
   * @param user User to check the authorship for.
   * @param update The update to check the authorship for.
   * @returns Whether the user is the author of the update.
// DIFF-76 change at line 150
   */
  public static isUserUpdateAuthor(user: User, update: UpdateModel): boolean {
    const authorId = update instanceof BaseUpdate ? update.user?.id : update.creator?.id;
    return Boolean(authorId && user.id === authorId);
  }

  /**
   * Check if user should be subscribed to the model.
   *
   * @param user User to check subscription for.
   * @param model Model to check subscription for.
   * @returns A FeedSubscriptionResult with whether the user is subscribed to the model and the reason why.
   */
  public static isUserSubscribedToModelResult(
    user: User,
    model: SupportedFeedSubscriptionModels
  ): FeedSubscriptionResult {
    const subscriptions = user.feedSubscriptionsByModelId;

    const existingSubscription = subscriptions[model.id];
    if (existingSubscription) {
      if (existingSubscription.isSubscribed) {
        return {
          subscribed: true,
          reason: FeedUtils.getModelSubscriptionReason(model.modelName as SupportedFeedSubscriptionModelNames),
// DIFF-76 change at line 175
        };
      }
      return { subscribed: false };
    }

    if (model instanceof Team) {
      return FeedUtils.isSubscribedToTeamByDefault({
        teamId: model.id,
        userTeamIds: user.activeTeams.map(team => team.id),
      });
    }

    if (model instanceof Project) {
      return FeedUtils.isSubscribedToProjectByDefault({
        projectTeamIds: model.accessibleTeams.map(team => team.id),
        projectMemberIds: model.members.map(member => member.id),
        initiativeOwnerIds: model.initiatives.map(initiative => initiative.owner?.id).concrete(),
        initiativeIds: model.initiatives.map(initiative => initiative.id),
        userId: user.id,
        userTeamIds: user.activeTeams.map(team => team.id),
        subscriptions,
      });
    }

    if (model instanceof Initiative) {
// DIFF-76 change at line 200
      return FeedUtils.isSubscribedToInitiativeByDefault({
        initiativeOwnerId: model.owner?.id,
        initiativeProjectMemberIds: model.projects.flatMap(project => project.members.map(member => member.id)),
        subInitiativeProjectMemberIds: model.projectsInheritedOnly.flatMap(project =>
          project.members.map(member => member.id)
        ),
        userId: user.id,
      });
    }

    throw new Error("Unsupported model provided to isUserSubscribedToModel");
  }

  /**
   * Check if user should be subscribed to the model's sub-projects.
   *
   * @param user User to check subscription for.
   * @param model Model to check subscription for.
   * @returns Whether the user is subscribed to the model's sub-projects.
   */
  public static isUserSubscribedToModelSubProjects(user: User, model: SupportedFeedSubscriptionModels): boolean {
    const existingSubscription = user.feedSubscriptionsByModelId[model.id];
    if (existingSubscription) {
      return existingSubscription.isSubscribedToSubProjects;
    }
// DIFF-76 change at line 225

    // Only Teams have defaults here. you're auto-subscribed to sub-projects if you're a member of the team
    if (model instanceof Team) {
      return user.activeTeams.some(team => team.id === model.id);
    }

    return false;
  }

  /**
   * Set whether the user is subscribed to the model's sub-projects.
   *
   * @param user User to update the subscription for.
   * @param model Model to update the subscription for.
   * @param isSubscribedToSubProjects Whether the user should be subscribed to the model's sub-projects.
   * @returns The updated or created feed subscription.
   */
  public static setUserSubscribedToModelSubProjects(
    user: User,
    model: SupportedFeedSubscriptionModels,
    isSubscribedToSubProjects: boolean
  ): FeedSubscription {
    const existingSubscription = user.feedSubscriptionsByModelId[model.id];
    if (existingSubscription) {
      existingSubscription.isSubscribedToSubProjects = isSubscribedToSubProjects;
// DIFF-76 change at line 250
      existingSubscription.save();
      return existingSubscription;
    }

    return FeedSubscription.create({
      model,
      user,
      isSubscribed: FeedSubscription.isUserSubscribedToModel(user, model),
      isSubscribedToSubProjects,
    });
  }
}

/** Supported entities a user can subscribe to. */
export type SupportedFeedSubscriptionModels = UpdateParentModel;

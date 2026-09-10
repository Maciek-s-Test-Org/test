import { CalendarEventType } from "@linear/common/models/CalendarEvent";
import { User } from "#models/User";
import { ClientModel, ManyToOne, Property } from "#models/base/Decorators";
import { Model } from "#models/base/Model";
import { ModelLoadStrategy, PartialLoadMode } from "#models/base/ModelLoadStrategy";
import { DateTimeSerializer } from "#models/serialization/Serialization";

/**
 * A model representing a CalendarEvent.
 */
@ClientModel("CalendarEvent")
export class CalendarEvent extends Model {
  public static override readonly loadStrategy = ModelLoadStrategy.partial;
  public static override partialLoadMode = PartialLoadMode.full;

  /** The user associated with the event. */
  @ManyToOne(() => User, "calendarEvents", { optional: false, nullable: false, indexed: true })
  public user: User;

  /** The start time of the event. */
  @Property({ serializer: DateTimeSerializer, default: () => new Date() })
  public startsAt: Date;

  /** The end time of the event. */
  @Property({ serializer: DateTimeSerializer, default: () => new Date() })
  public endsAt: Date;

  /** The type of event. */
  @Property({ default: CalendarEventType.outOfOffice })
  public type: CalendarEventType;

  /** Whether the event is an all-day event, with its boundaries anchored to midnight in `timezone`. */
  @Property({ default: false })
  public allDay: boolean;

  /** The IANA timezone the boundaries of an all-day event are anchored in, when known. */
  @Property()
  public timezone?: string;
}

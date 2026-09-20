/** Shared settings for the review reminder worker and its settings page. */
export const reviewPolicy = {
  reminderDelayMinutes: 30,
  maximumReminders: 3,
  quietHoursStart: 18,
  quietHoursEnd: 9,
  weekdaysOnly: true,
};

/** Checks whether a reminder can be sent at this hour. */
export function isReminderHour(hour: number): boolean {
  return hour >= reviewPolicy.quietHoursEnd && hour < reviewPolicy.quietHoursStart;
}

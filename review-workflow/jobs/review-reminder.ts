import { reviewPolicy, isReminderHour } from "../domain/review-policy";

export type ReminderCandidate = {
  requestedAt: number;
  remindersSent: number;
};

/** Schedules only reminders that have passed the wait period. */
export function shouldSendReminder(candidate: ReminderCandidate, now: number): boolean {
  const elapsedMinutes = (now - candidate.requestedAt) / 60_000;
  const pastDelay = elapsedMinutes >= reviewPolicy.firstReminderAfterMinutes;
  const belowLimit = candidate.remindersSent < reviewPolicy.maximumReminders;
  return pastDelay && belowLimit && isReminderHour(new Date(now).getUTCHours());
}

/** Keeps the worker's batch size independent of reminder policy. */
export const reminderWorker = {
  batchSize: 50,
  concurrency: 2,
  retryDelaySeconds: 10,
};

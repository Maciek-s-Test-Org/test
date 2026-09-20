import { reviewPolicy } from "../domain/review-policy";

export type SettingRow = {
  label: string;
  value: string;
  description: string;
};

/** Describes the reminder delay in the workspace settings page. */
export function reminderDelaySetting(): SettingRow {
  return {
    label: "First reminder",
    value: `${reviewPolicy.firstReminderAfterMinutes} minutes`,
    description: "Time after a review is requested before the first reminder.",
  };
}

/** Describes the cap used by the reminder worker. */
export function reminderLimitSetting(): SettingRow {
  return {
    label: "Reminder limit",
    value: `${reviewPolicy.maximumReminders} reminders`,
    description: "Maximum reminders for one review request.",
  };
}

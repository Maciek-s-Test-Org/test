import * as ReviewerNames from "../domain/reviewer";
import type { Reviewer } from "../domain/reviewer";

export type DigestEntry = {
  reviewId: string;
  reviewer: Reviewer;
  fileCount: number;
};

/** Creates plain-text rows for the daily review email. */
export function reviewDigest(entries: DigestEntry[]): string[] {
  return entries.map(entry => {
    const reviewer = ReviewerNames.formatReviewer(entry.reviewer);
    return `${reviewer}: ${entry.fileCount} files waiting for review`;
  });
}

/** The digest uses a fixed subject so mail clients can group messages. */
export const digestOptions = {
  subject: "Your review requests",
  senderName: "Review Desk",
  includeEmptyDays: false,
};

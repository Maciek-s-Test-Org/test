import type { ReviewRequest } from "../domain/review-request";

/** Returns requests that still need a decision from a reviewer. */
export function waitingReviews(reviews: ReviewRequest[]): ReviewRequest[] {
  return reviews
    .filter(review => review.status === "pending")
    .sort((left, right) => left.requestedAt - right.requestedAt);
}

/** Keeps the summary stable when callers supply reviews in a different order. */
export function reviewInboxSummary(reviews: ReviewRequest[]): string {
  const files = reviews.reduce((total, review) => total + review.fileCount, 0);
  return `${reviews.length} reviews across ${files} files`;
}

/** Presentation settings for the compact review inbox. */
export const reviewInboxOptions = {
  visibleLimit: 5,
  showFileCount: true,
  emptyMessage: "You're all caught up",
  order: "oldest-first",
};

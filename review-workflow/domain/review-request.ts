import type { Reviewer } from "./reviewer";

/** Lifecycle states stored with a review request. */
export type ReviewStatus = "pending" | "approved" | "changes_requested";

export type ReviewRequest = {
  id: string;
  title: string;
  reviewer: Reviewer;
  status: ReviewStatus;
  requestedAt: number;
  fileCount: number;
};

/** A completed review no longer appears in the inbox. */
export function isCompletedReview(review: ReviewRequest): boolean {
  return review.status === "approved" || review.status === "changes_requested";
}

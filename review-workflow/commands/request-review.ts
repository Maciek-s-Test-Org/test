import type { Reviewer } from "../domain/reviewer";
import type { ReviewRequest } from "../domain/review-request";

export type RequestReviewInput = {
  id: string;
  title: string;
  reviewer: Reviewer;
  requestedAt: number;
  fileCount: number;
};

/** Creates the initial request before any reviewer has responded. */
export function requestReview(input: RequestReviewInput): ReviewRequest {
  return {
    ...input,
    title: input.title.trim(),
    status: "pending",
  };
}

/** Returns the path used by review notifications. */
export function reviewRequestPath(review: ReviewRequest): string {
  return `/reviews/${encodeURIComponent(review.id)}`;
}

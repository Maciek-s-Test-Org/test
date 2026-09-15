/** Build the name shown beside a review. */
export function reviewerLabel(name: string): string {
  return name.trim();
}

/** Default name when a reviewer has no display name. */
export const anonymousReviewer = "Anonymous";

import { formatReviewer, type Reviewer } from "../domain/reviewer";

export type ReviewHeader = {
  title: string;
  subtitle: string;
  initials: string;
};

/** Builds the header for a review assigned to one person. */
export function reviewHeader(reviewer: Reviewer): ReviewHeader {
  const title = "Review requested";
  const initials = [reviewer.firstName, reviewer.lastName]
    .filter(Boolean)
    .map(part => part[0])
    .join("");

  const subtitle = formatReviewer(reviewer);
  return { title, subtitle, initials };
}

/** Copy shown when no reviewer has been assigned yet. */
export const emptyReviewHeader = {
  title: "No reviewer assigned",
  description: "Choose someone to review this change.",
  actionLabel: "Assign reviewer",
};

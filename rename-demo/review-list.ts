import { formatReviewer, type Reviewer } from "./reviewer";

export type ReviewerRow = {
  label: string;
  pending: boolean;
};

export function reviewerRow(reviewer: Reviewer): ReviewerRow {
  return {
    label: formatReviewer(reviewer),
    pending: true,
  };
}

export const reviewerListOptions = {
  heading: "Reviewers",
  emptyMessage: "No reviewers yet",
  visibleLimit: 3,
};

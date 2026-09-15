import { formatReviewer, type Reviewer } from "./reviewer";

export type ReviewHeader = {
  title: string;
  subtitle: string;
};

export function reviewHeader(reviewer: Reviewer): ReviewHeader {
  const title = "Review requested";
  const subtitle = formatReviewer(reviewer);
  return { title, subtitle };
}

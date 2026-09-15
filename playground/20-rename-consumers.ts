import { formatReviewer } from "./19-rename-definition";

/** Name shown in the review header. */
export function header(name: string): string {
  const prefix = "Reviewer: ";
  return prefix + formatReviewer(name);
}

/** Name shown in a comment. */
export function commentAuthor(name: string): string {
  const prefix = "By ";
  return prefix + formatReviewer(name);
}

/** Name shown in the review history. */
export function historyEntry(name: string): string {
  const prefix = "Reviewed by ";
  return prefix + formatReviewer(name);
}

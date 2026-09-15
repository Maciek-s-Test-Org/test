import { formatReviewer } from "./19-rename-definition";

/** This change includes more than the rename and needs a separate review. */
export function compactLabel(name: string): string {
  const label = formatReviewer(name);
  return label.slice(0, 12);
}

/** This use only changes the name and can be reviewed with the group. */
export function fullLabel(name: string): string {
  const prefix = "Reviewed by ";
  return prefix + formatReviewer(name);
}

import { reviewerLabel } from "./19-rename-definition";

/** This change includes more than the rename and needs a separate review. */
export function compactLabel(name: string): string {
  const label = reviewerLabel(name);
  return label.slice(0, 24);
}

/** This use only changes the name and can be reviewed with the group. */
export function fullLabel(name: string): string {
  const prefix = "Reviewed by ";
  return prefix + reviewerLabel(name);
}

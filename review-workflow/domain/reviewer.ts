export type Reviewer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

/** Returns the name shown next to a review request. */
export function reviewerLabel(reviewer: Reviewer): string {
  const name = `${reviewer.firstName} ${reviewer.lastName}`.trim();
  return name || reviewer.email;
}

/** Returns the initials used when no avatar is available. */
export function reviewerInitials(reviewer: Reviewer): string {
  return [reviewer.firstName, reviewer.lastName]
    .filter(Boolean)
    .map(part => part[0].toUpperCase())
    .join("");
}

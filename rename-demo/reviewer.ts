export type Reviewer = {
  firstName: string;
  lastName: string;
};

export function reviewerLabel(reviewer: Reviewer): string {
  return `${reviewer.firstName} ${reviewer.lastName}`.trim();
}

export function reviewerInitials(reviewer: Reviewer): string {
  return `${reviewer.firstName[0]}${reviewer.lastName[0]}`;
}

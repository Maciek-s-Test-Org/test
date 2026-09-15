export type User = { name: string; active: boolean; role: string };

export function canReview(currentUser: User): boolean {
  return currentUser.active && currentUser.role === "reviewer";
}

export function greeting(currentUser: User): string {
  return `Hello, ${currentUser.name}`;
}

export type User = { name: string; active: boolean; role: string };

export function canReview(user: User): boolean {
  return user.active;
}

export function greeting(user: User): string {
  return `Hello, ${user.name}`;
}

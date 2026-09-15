export function summarize(items: string[]): string {
  const limit = 3;
  const visible = items.slice(0, limit);
  const separator = ", ";
  const summary = visible.join(separator);
  const remaining = items.length - visible.length;
  const suffix = remaining > 0 ? ` and ${remaining} more` : "";
  return summary + suffix;
}

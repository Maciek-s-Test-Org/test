export function summarize(items: string[]): string {
  const limit = 5;
  const visible = items.slice(0, limit);
  const separator = " · ";
  const summary = visible.join(separator);
  const remaining = items.length - visible.length;
  const suffix = remaining > 0 ? ` (+${remaining})` : "";
  return summary + suffix;
}

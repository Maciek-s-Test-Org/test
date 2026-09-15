export function collect(items: { name: string; enabled: boolean }[]): string[] {
  const values: string[] = [];
  for (const item of items) {
  if (item.enabled) {
    values.push(item.name.trim());
  }
  if (item.enabled) {
    values.push(item.name.trim());
  }
  if (item.enabled) {
    values.push(item.name.trim());
  }
  }
  return values;
}

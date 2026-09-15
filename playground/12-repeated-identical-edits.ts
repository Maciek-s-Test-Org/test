export function collect(items: { name: string; enabled: boolean }[]): string[] {
  const values: string[] = [];
  for (const item of items) {
  if (item.enabled) {
    values.push(item.name);
  }
  if (item.enabled) {
    values.push(item.name);
  }
  if (item.enabled) {
    values.push(item.name);
  }
  }
  return values;
}

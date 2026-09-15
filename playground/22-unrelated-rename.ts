/** A separate symbol with the same spelling. */
export function reviewerLabel(value: number): string {
  return String(value);
}

/** This local use belongs to the separate symbol. */
export function metricLabel(value: number): string {
  const prefix = "Count: ";
  return prefix + reviewerLabel(value);
}

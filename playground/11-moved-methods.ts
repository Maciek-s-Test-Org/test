export class ReviewActions {
  /** Open the review. */
  public open(value: string): string {
    const prefix = "open";
    const label = value.trim();
    return `${prefix}: ${label}`;
  }

  /** Save the review. */
  public save(value: string): string {
    const prefix = "save";
    const label = value.trim();
    return `${prefix}: ${label}`;
  }

  /** Close the review. */
  public close(value: string): string {
    const prefix = "close";
    const label = value.trim();
    return `${prefix}: ${label}`;
  }

  /** Restore the review. */
  public restore(value: string): string {
    const prefix = "restore";
    const label = value.trim();
    return `${prefix}: ${label}`;
  }
}

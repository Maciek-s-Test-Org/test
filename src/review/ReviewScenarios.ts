/** Scenarios available in the review playground. */
export class ReviewScenarios {
  /** Scenarios grouped by the behavior being checked. */
  public static readonly cases: ReviewScenario[] = [
    {
      id: "empty-file",
      title: "Empty added file",
      category: "edge",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "single-line",
      title: "Single line replacement",
      category: "inline",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "adjacent-edits",
      title: "Adjacent replacements",
      category: "grouping",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "separated-edits",
      title: "Changes separated by context",
      category: "grouping",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "deleted-method",
      title: "Deleted method",
      category: "deletion",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "moved-method",
      title: "Method moved within a class",
      category: "structural",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: true,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "renamed-symbol",
      title: "Symbol renamed in several places",
      category: "structural",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: true,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "wrapped-call",
      title: "Call split across several lines",
      category: "structural",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: true,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "nested-conditions",
      title: "Nested conditions with early returns",
      category: "structural",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: true,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "whole-file-added",
      title: "Entire file added",
      category: "edge",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "whole-file-deleted",
      title: "Entire file deleted",
      category: "edge",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "renamed-file",
      title: "Renamed file with edits",
      category: "metadata",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "tall-hunk",
      title: "Hunk taller than the viewport",
      category: "scroll",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "markdown-preview",
      title: "Markdown source and preview",
      category: "preview",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "long-line",
      title: "Long line with horizontal scrolling",
      category: "scroll",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "end-of-file",
      title: "Change at the final line",
      category: "edge",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "partial-review",
      title: "Some changes reviewed",
      category: "state",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "all-reviewed",
      title: "All changes reviewed",
      category: "state",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "new-commit",
      title: "Changed content after review",
      category: "state",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "unchanged-hunk",
      title: "Unchanged content after review",
      category: "state",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "split-view",
      title: "Paired old and new lines",
      category: "layout",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "unified-view",
      title: "Inline removed and added lines",
      category: "layout",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
    {
      id: "keyboard-focus",
      title: "Review control reached by keyboard",
      category: "accessibility",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 6,
        reviewed: false,
      },
    },
    {
      id: "fast-scroll",
      title: "Scroll through several tall changes",
      category: "scroll",
      enabled: true,
      views: ["split", "unified"],
      options: {
        structural: false,
        contextLines: 3,
        reviewed: false,
      },
    },
  ];

  /** Return the scenarios for a selected category. */
  public static forCategory(category: string): ReviewScenario[] {
    return this.cases.filter(scenario => scenario.enabled && scenario.category === category);
  }
}

/** A single review interaction to exercise. */
export type ReviewScenario = {
  id: string;
  title: string;
  category: string;
  enabled: boolean;
  views: string[];
  options: {
    structural: boolean;
    contextLines: number;
    reviewed: boolean;
  };
};

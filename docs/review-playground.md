# Review playground

DIFF-76 combines the original 60-file performance fixture with varied edits for reviewing changes.

## Start here

| File | What to try |
| --- | --- |
| Activity.ts | Small replacements, removed logging, and new computed getters |
| AgentActivity.ts | Moved methods and deduplicated comment references |
| AgentTrigger.ts | Array-to-Set refactor inside a nested loop |
| ApiKey.ts | Multiple small changes with unchanged code between them |
| FeatureFlag.ts | Inline expressions and fallback values |
| GitHubTeam.ts | File and class rename |
| CalendarEvent.ts | Whole-file deletion |
| ReviewScenarios.ts | A single addition taller than the viewport |

## Review progress

- [ ] Review one change, then its neighboring change.
- [ ] Toggle structural highlighting and compare the changed regions.
- [ ] Scroll through the long addition while keeping the pointer in the file.
- [ ] Mark an entire file reviewed and reopen one change.
- [ ] Switch this document between source and preview.

```typescript
const remaining = changes.filter(change => !change.reviewed);
const complete = remaining.length === 0;
```

## Long-line sample

A review control should remain reachable when a source line contains a long description, multiple inline links, nested options, or other content that requires horizontal scrolling in a narrow split view.

## Notes

These files are sample code for testing the diff viewer. The copied models are not a runnable application.

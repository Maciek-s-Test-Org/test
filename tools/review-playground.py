#!/usr/bin/env python3
"""Write repeatable sample revisions for manual hunk review in DIFF-76."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MODE = sys.argv[1] if len(sys.argv) == 2 else ""
if MODE not in ("base", "initial", "update"):
    raise SystemExit("Usage: python3 tools/review-playground.py initial|update")

samples = {}
def sample(path, before, after, updated=None):
    samples[path] = (before, after, after if updated is None else updated)

def settings(values):
    return "\n\n".join(
        f'''/** {description}. */
export const {name} = {{
  enabled: true,
  label: "{label}",
  {key}: {value},
  persist: true,
}};'''
        for name, description, label, key, value in values
    ) + "\n"

before = settings([
    ("search", "Search behavior", "Search", "minimumLength", 3),
    ("preview", "Preview behavior", "Preview", "contextLines", 3),
    ("navigation", "Navigation behavior", "Navigation", "pageSize", 20),
    ("history", "History behavior", "History", "limit", 25),
])
after = before.replace('minimumLength: 3', 'minimumLength: 2').replace('contextLines: 3', 'contextLines: 6').replace('pageSize: 20', 'pageSize: 50').replace('limit: 25', 'limit: 100')
updated = after.replace('contextLines: 6', 'contextLines: 10')
sample('01-four-independent-changes.ts', before, after, updated)

sample('02-nearby-changes.ts', '''export function summarize(items: string[]): string {
  const limit = 3;
  const visible = items.slice(0, limit);
  const separator = ", ";
  const summary = visible.join(separator);
  const remaining = items.length - visible.length;
  const suffix = remaining > 0 ? ` and ${remaining} more` : "";
  return summary + suffix;
}
''', '''export function summarize(items: string[]): string {
  const limit = 5;
  const visible = items.slice(0, limit);
  const separator = " · ";
  const summary = visible.join(separator);
  const remaining = items.length - visible.length;
  const suffix = remaining > 0 ? ` (+${remaining})` : "";
  return summary + suffix;
}
''')

rows = '\n'.join(f'  {{ id: "rule-{i:03}", label: "Review rule {i}", enabled: true, priority: {i % 4} }},' for i in range(1, 121))
sample('03-tall-replacement.ts', 'export const rules = [\n  { id: "default", label: "Default rule", enabled: true, priority: 0 },\n];\n', 'export const rules = [\n' + rows + '\n];\n')
sample('04-added-short.ts', None, 'export const reviewed = false;\n')
sample('05-added-tall.ts', None, '/** Large addition for checking the bottom-pinned review control. */\nexport const scenarios = [\n' + rows.replace('id:', 'key:').replace('rule-', 'scenario-').replace('label:', 'description:').replace('Review rule', 'Scroll scenario').replace('enabled: true, priority:', 'reviewed: false, order:') + '\n];\n')
sample('06-deleted-short.ts', 'export const legacyReviewMode = "file";\n', None)
sample('07-deleted-tall.ts', 'export const legacyRules = [\n' + rows + '\n];\n', None)
sample('08-name-before.ts', 'export class ReviewPreferences {\n  public readonly label = "Review preferences";\n  public readonly contextLines = 3;\n  public readonly enabled = true;\n  public readonly mode = "split";\n  public readonly showLineNumbers = true;\n  public readonly wrapLines = false;\n  public readonly collapseUnchanged = true;\n}\n', None)
sample('08-name-after.ts', None, 'export class ReviewPreferences {\n  public readonly label = "Review preferences";\n  public readonly contextLines = 6;\n  public readonly enabled = true;\n  public readonly mode = "split";\n  public readonly showLineNumbers = true;\n  public readonly wrapLines = false;\n  public readonly collapseUnchanged = true;\n}\n')

markdown = '''# Review notes

This document contains several independent edits.

## Context

Show three unchanged lines around each change.

Keep the source and preview switches available while reviewing.

## Navigation

Use the file list to move between examples.

Keep comments visible beside the source they refer to.

## Progress

Review files after reading every changed line.

The file checkbox reports whether all changes have been reviewed.

## Example

```typescript
const reviewed = changes.every(change => change.reviewed);
```
'''
sample('09-markdown.md', markdown, markdown.replace('three unchanged', 'six unchanged').replace('Review files after reading every changed line.', 'Review each change as you finish reading it.').replace('changes.every', 'visibleChanges.every'))

sample('10-mixed-change.ts', '''export type User = { name: string; active: boolean; role: string };

export function canReview(user: User): boolean {
  return user.active;
}

export function greeting(user: User): string {
  return `Hello, ${user.name}`;
}
''', '''export type User = { name: string; active: boolean; role: string };

export function canReview(currentUser: User): boolean {
  return currentUser.active && currentUser.role === "reviewer";
}

export function greeting(currentUser: User): string {
  return `Hello, ${currentUser.name}`;
}
''')

methods = [f'''  /** {name.capitalize()} the review. */
  public {name}(value: string): string {{
    const prefix = "{name}";
    const label = value.trim();
    return `${{prefix}}: ${{label}}`;
  }}''' for name in ('open', 'save', 'close', 'restore')]
sample('11-moved-methods.ts', 'export class ReviewActions {\n'+'\n\n'.join(methods)+'\n}\n', 'export class ReviewActions {\n'+'\n\n'.join([methods[2],methods[0],methods[3],methods[1].replace('value.trim()', 'value.trim().toLowerCase()')])+'\n}\n')

repeat = '  if (item.enabled) {\n    values.push(item.name);\n  }\n'
a = 'export function collect(items: { name: string; enabled: boolean }[]): string[] {\n  const values: string[] = [];\n  for (const item of items) {\n'+repeat*3+'  }\n  return values;\n}\n'
b = a.replace('values.push(item.name);', 'values.push(item.name.trim());')
sample('12-repeated-identical-edits.ts', a, b, b.replace('  const values: string[] = [];', '  const values: string[] = [];\n  // A new commit moves the identical edits down one line.'))

longline = 'export const description = "'+'A long source line for horizontal scrolling. '*12+'";\n'
sample('13-long-line-and-unicode.ts', longline+'\nexport const labels = ["Review", "Cafe", "Done"];\n', longline.replace('horizontal scrolling.', 'checking review control placement while scrolling horizontally.')+'\nexport const labels = ["Przejrzyj", "Café ☕", "Gotowe ✓"];\n')
sample('14-empty-to-one-line.ts', '', 'export const enabled = true;\n')
sample('15-no-final-newline.ts', 'export const label = "Pending";', 'export const label = "Reviewed";')
sample('16-whitespace-only.ts', 'export const options = {\n  enabled: true,\n  label: "Review",\n};\n', 'export const options = {\n    enabled: true,\n    label: "Review",\n};\n')
sample('17-stable-after-line-shift.ts', before, after, '// A new commit adds this header without changing the reviewed edits below.\n// Their line numbers move; their content stays the same.\n\n'+after)
sample('18-reviewed-change-disappears.ts', before, after, before)

GUIDE = '''# DIFF-76 — manual hunk review playground

Open the numbered files under `playground/`. The original model fixtures remain under `src/models/` for testing many files.

## Cases

| File | Check |
| --- | --- |
| 01-four-independent-changes.ts | Four separate review targets; partial and complete file state |
| 02-nearby-changes.ts | Separate edits within one Git hunk; hover between nearby controls |
| 03-tall-replacement.ts | A replacement taller than the viewport |
| 04-added-short.ts | One-line added file; action has space outside the code |
| 05-added-tall.ts | Whole-file addition; sticky control during fast scrolling |
| 06-deleted-short.ts | One-line deleted file |
| 07-deleted-tall.ts | Whole-file deletion taller than the viewport |
| 08-name-after.ts | Rename plus a small edit; file metadata and review completion |
| 09-markdown.md | Source/preview controls, comments, and review controls together |
| 10-mixed-change.ts | Variable rename and logic change in the same region |
| 11-moved-methods.ts | Moved blocks and an edited moved method in structural mode |
| 12-repeated-identical-edits.ts | Repeated changes that must not share review state by accident |
| 13-long-line-and-unicode.ts | Horizontal scrolling, wide content, accented text and emoji |
| 14-empty-to-one-line.ts | Existing empty file gaining its first line |
| 15-no-final-newline.ts | End-of-file marker and a one-line edit |
| 16-whitespace-only.ts | Whitespace visibility and review completion |
| 17-stable-after-line-shift.ts | Review persistence when a new commit shifts line numbers |
| 18-reviewed-change-disappears.ts | A reviewed edit removed by the next commit |

## Manual checks

- [ ] Hover a change: the whole control appears together.
- [ ] Leave the change: the whole control disappears together.
- [ ] Move onto the control through the gap above or below the code.
- [ ] Toggle Reviewed: changed coloring clears, and the label and control width stay fixed.
- [ ] Toggle again: changed coloring returns.
- [ ] Reach the control with the keyboard and toggle it with Space.
- [ ] Mark some changes: the file checkbox becomes partial.
- [ ] Mark every change: the file checkbox becomes complete when metadata is also acknowledged.
- [ ] Mark the whole file, reopen it, and unreview one change.
- [ ] Undo and redo a review action.
- [ ] Scroll a tall change slowly and quickly in both directions.
- [ ] Switch between split/unified and basic/structural highlighting.
- [ ] Expand unchanged context and resize the window.
- [ ] Add a local draft comment beside a change and check control placement.
- [ ] Reload the app and check saved review state.
- [ ] Repeat in light and dark themes, and with browser zoom at 200%.

## New-commit checks

Start by reviewing changes in cases 01, 12, 17, and 18. In a checkout of this PR's head branch, run:

```sh
python3 tools/review-playground.py update
git add playground
git commit -m "Advance manual review persistence cases"
git push origin HEAD:diff-76-head
```

This changes one of the four edits in case 01, shifts the duplicate edits in case 12, adds context above case 17, and removes all edits in case 18. It leaves the other cases alone.

- Case 01: the modified edit becomes unreviewed; unchanged edits retain their marks.
- Case 12: ambiguous duplicate edits are conservatively invalidated across commits.
- Case 17: unchanged edits retain their marks despite new line numbers; the new header remains unreviewed.
- Case 18: removed edits no longer contribute to remaining progress.

Review marks describe the displayed comparison. If you change its base commit, check the new comparison separately.

## Restore the initial sample contents

```sh
python3 tools/review-playground.py initial
git add playground
git commit -m "Restore initial manual review cases"
git push origin HEAD:diff-76-head
```

This creates another commit. It resets sample contents, not saved review state. Use the review controls to clear marks when you want to repeat a test from an unreviewed state.

The fixture writer refuses to overwrite uncommitted changes under `playground/`. Commit or preserve local edits first. All sample code is for exercising the diff viewer; it is not a runnable application.
'''
sample('00-guide.md', None, GUIDE)

if subprocess.check_output(['git', '-C', str(ROOT), 'status', '--porcelain', '--', 'playground'], text=True).strip():
    raise SystemExit('Preserve or commit existing playground changes before writing a sample revision.')

index = {'base':0, 'initial':1, 'update':2}[MODE]
for name, versions in samples.items():
    path = ROOT/'playground'/name
    content = versions[index]
    if content is None:
        path.unlink(missing_ok=True)
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')
print(f'Wrote {MODE} content for {len(samples)} manual review cases.')

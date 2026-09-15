# DIFF-76 — manual hunk review playground

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

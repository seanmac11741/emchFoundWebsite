# Board Card Layout — Orphan Prevention

## Problem
On the Foundation Board and District Board sections, the final row of member cards sometimes contains a single orphan card. This looks visually unbalanced (e.g., 5 cards rendering as 4+1 at desktop widths).

## Goal
Ensure the last row of board member cards always contains at least 2 cards whenever viewport conditions allow for multiple cards per row.

## Scope
- Applies to **both** boards:
  - Foundation Board (`FoundboardMemCards`)
  - District Board (`boardMemCards`)
- Behavior is identical for both sections.

## Layout Rules
- Maximum of **4 cards per row** at desktop widths.
- After the member list loads, compute the largest cards-per-row value `N ∈ {4, 3, 2}` such that `count % N ≠ 1`. That value governs the layout for that section.
  - Example: 5 cards → N = 3 (rows of 3+2, not 4+1)
  - Example: 9 cards → N = 3 (rows of 3+3+3, not 4+4+1)
  - Example: 7 cards → N = 4 (rows of 4+3)
- If `count ≤ 2`, render as-is (no orphan possible).

## Breakpoint Behavior
- **Desktop** (max 4 per row): orphan-prevention algorithm applies with N ∈ {4, 3, 2}; if no N avoids a trailing single, fall back to 1 (stacked).
- **Tablet** (max 2 per row): same rule with N ∈ {2}. Even counts render 2 per row; odd counts stack to 1 per row. No mixed "2+2+…+1" layouts.
- **Mobile** (1 per row, stacked): rule does not apply.

## Edge Cases
- Count of 1: single card renders alone (unavoidable).
- Count changes dynamically (admin adds/removes a member): layout recomputes on the next render of that section.

## Out of Scope
- No vacant/placeholder filler cards.
- No changes to card visual styling, colors, or content.
- No changes to card data or the admin editing flow.

## Implementation Todos

Shared foundation (1-3):
1. [x] Add a pure helper that, given a card count, returns the cards-per-row value using the rule: largest `N ∈ {4, 3, 2}` where `count % N ≠ 1`, else `count` when `count ≤ 2`. Expected: function covers counts 0 through 20+ with no orphans at desktop.
2. [x] Add unit tests for the helper covering: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13. Expected: all tests pass and no returned value produces a remainder of 1 when count ≥ 3.
3. [x] Add CSS that allows the two board containers to render an explicit column count at desktop (via a CSS custom property or equivalent mechanism), while preserving the existing tablet (max 2/row) and mobile (stacked) behavior via media queries. Expected: changing the column count on a container at desktop visibly changes the grid; tablet/mobile layout is unchanged.

Foundation Board wiring (4-5):
4. [x] After the Foundation Board card render loop completes, call the helper with the rendered count and apply the result to the Foundation Board container. Expected: for 5 members, desktop shows 3+2; for 9 members, 3+3+3; for 7 members, 4+3.
5. [x] Manually verify Foundation Board at desktop width in browser across at least three counts (e.g., temporarily seeded with 4, 5, and 7). Expected: no single-card trailing row at desktop; tablet and mobile unaffected.

District Board wiring (6-7):
6. [x] After the District Board card render loop completes, call the same helper and apply the result to the District Board container. Expected: matches Foundation Board behavior with no code duplication.
7. [x] Manually verify District Board at desktop width with the current member count (the 5-member case shown in the screenshot). Expected: final row contains ≥2 cards; the previously-orphaned card is no longer alone.

End-to-end verification (8-9):
8. [] Resize browser through desktop → tablet → mobile for both boards. Expected: desktop enforces the rule; tablet shows up to 2 per row with a trailing single allowed; mobile stacks single column.
9. [] Confirm admin add/remove of a board member triggers a re-render that reapplies the correct column count. Expected: after adding or deleting a member, the layout immediately rebalances without a page reload (or, if a reload is required by the existing flow, the post-reload layout is correct).

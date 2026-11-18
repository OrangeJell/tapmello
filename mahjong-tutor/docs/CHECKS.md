# Current acceptance — v0.3 · 2026-10-30

Scope: remove the opponent table and rewrite the seven bilingual guides for beginners. Earlier records below describe previous versions and are historical.

- `npm test`: 17 groups pass. Four removed-prototype groups were retired; one meaningful content test was added to verify all shared pattern references, bilingual paragraphs, four-copy limits and the five complete waiting sets.
- `tests/browser-reading.js`: 56 article combinations pass (seven articles × Chinese/English × 320/375/768/1440px). Checks include seven directory entries, diagrams, contents navigation, heading focus, unchanged route, and no horizontal overflow.
- Home retains three levels, reading and random practice; no battle links remain. All six former scene URLs resolve to home.
- `tests/browser-v2-flow.js`: all 28 questions and seven guided steps completed in Chinese after the removal, including wrong-answer retry, language switch with selection preserved, labels, mid-round refresh, 29 saved entries and identical shared pattern text in tutorial/article. No browser page errors.
- Full English article rendering was checked; the English end-to-end tutorial completion recorded for v0.2 was not repeated in this change.
- New writing explains terms before using them and adds concrete examples and common mistakes. No personal anecdotes, invented authority or gameplay guarantees were added. Shared rule wording and tile examples remain the source of pattern conditions.
- Visually reviewed desktop home and mobile article body. Current screenshots: `output/v3-home-desktop.png`, `output/v3-article-desktop.png`, `output/v3-article-mobile.png`, `output/v3-article-detail-mobile.png`.
- `npm run verify:site`: 98 website files, zero changed/removed/added. Storage format remains v2; learning progress and preferences are retained.

Browser checks use isolated Chromium sessions, not the user's saved progress or physical mobile devices.

---

# Acceptance checks — v0.2 · 2026-10-28

## Automated rules, content and state

`npm test`: **20 test groups passed, 0 failures**.

- Original basic solver: suits, sequences, honors, exposed kongs, combined four-copy limits, complete waiting sets, call source restrictions and scripted round.
- 400 seeded random practice hands, with complete basic-rule answers and physically valid tile counts.
- Shared catalog: valid pattern examples, counterexamples fail the corresponding condition, bilingual fields and valid article references.
- Seven distinct concealed pairs; quads are not two pairs. Thirteen orphans and its 13-sided wait. Open-set restrictions, invalid shapes and fifth-copy rejection.
- Independent all-triplet decomposition, full/half flush, compatible tags and no duplicate labels.
- All 28 exercises have reachable answers; 29 unique progress IDs include the guided round. Level sizes are 12, 8 and 9.
- Legacy progress, partial exercises, completed guided round, settings, v2 roundtrip, corruption and disabled storage. New advanced exercises stay incomplete after migration.
- All six prototype scenes allocate exactly 136 physical tiles, four copies each. Opponent hands are hidden from the public view.
- Three chow options, pung, exposed kong and replacement draw; transfer from river to meld; correct pass/turn order; exact hand counts and endings.
- Repeated commands are rejected after phase changes; paused computer actions do not advance.

## Browser interaction

Playwright Chromium in an isolated test session. `tests/browser-v2-flow.js` passed independently in **Chinese and English**, at 375 × 812:

- Completed all 28 questions and all seven guided-round steps through UI clicks.
- Incorrect answers, short inline feedback, hint dialog, retry, answer locking and next question.
- Confirmation and next buttons remain inside the table; no answer confirmation modal.
- Language changes preserve current selection; tile names toggle off and on.
- Mid-round refresh preserves the guided step. All 29 progress entries are saved on completion.
- Tutorial and related article render exactly the same seven-pairs condition.
- Normal draw/discard, three computer turns, each chow/pung/kong claim, replacement draw, win breakdown and full-flush tag, exhaustive draw, replay, next scene, pass and scene refresh.
- Modal pause stops computer discards; closing resumes once. No uncaught JavaScript errors in either complete flow.

`tests/browser-v2-compat.js` passed:

- All six old `#lesson/N` links resolve to corresponding stable exercise URLs.
- Actual v1 storage migration preserves language, labels, completed questions and the guided-round completion without finishing new advanced questions.
- Reload and keyboard skip link preserve current route.
- Reset cancellation preserves state; reset confirmation preserves preferences and does not revive v1 progress.
- Damaged JSON and a denied `localStorage` getter both leave the game playable.
- Repeated discard submission produces one discard. Simulated hidden-document visibility pauses playback; restoration executes each remaining computer turn once.
- Random practice exposes all computed waits and resets selection for the next hand.

## Layout and screenshots

`tests/browser-v2-layout.js`: **128 combinations passed** — 16 routes × two languages × 320, 375, 768 and 1440px widths.

- No page horizontal overflow or clipped main buttons.
- No visible main button below 24px in either dimension; playable hand tiles use at least 44px width.
- No bottom action area overlaps the hand. Fourteen-tile hands use three rows at 320px, at most two rows at 375px and above.
- 34-tile reference dialog fits without horizontal overflow at all tested widths and languages.
- Reduced-motion preference enabled. Images awaited decoding before capture.
- English captions use whole-word compact labels with normal word wrapping; full accessible names remain on every tile.

After screenshot inspection, river labels were moved toward the outside edges to avoid the featured discard label, and 375px advanced examples were tightened into fewer rows. `tests/browser-v2-visual.js`: **24 additional checks passed** for the affected chow-selection, post-kong and advanced-example states at all four widths in both languages. The five screenshots were regenerated and the final mobile table and advanced exercise were visually rechecked.

Latest screenshots:

- [Desktop home](../output/v2-home-desktop.png)
- [Desktop prototype table](../output/v2-table-desktop.png)
- [Mobile prototype table](../output/v2-table-mobile.png)
- [Mobile advanced exercise](../output/v2-lesson-mobile.png)
- [Mobile pattern article](../output/v2-article-mobile.png)

These are Chromium responsive emulations. Browser scripts operate on isolated QA storage. Git history retains the browser scripts for the retired v0.1 table.

## Website isolation

The standalone-development check compared SHA-256 hashes of the website files:

- Baseline/current website files: **98 / 98**.
- Changed or removed: **0**.
- Added: **0**.

No site build, deployment, homepage integration, routing or analytics changes were made.

## Deliberate limits

The opponent table is a fixed-scenario interactive prototype, clearly labelled in the UI. It does not implement full AI decisions, random matches, scoring, concealed/added kongs or simultaneous claim resolution. Refresh restarts the current scenario and no match statistics are persisted. Pattern definitions follow this version's stated conventions, rather than all regional rulesets.

## Article expansion — 2026-10-29

Added three bilingual illustrated guides, for seven total: organising a hand, five common waiting shapes, and choosing chow/pung/kong actions. Existing guides and shared pattern definitions remain available.

- All new diagram tile counts satisfy the four-copy limit.
- Five complete 13-tile examples were checked against `winningTilesFor`: two-sided [3, 6 characters], closed [5 characters], edge [3 characters], single [East], double-pair [East, South].
- Existing 20 automated test groups passed.
- 18 browser combinations passed: three new guides × Chinese/English × 320/375/1440px. Article-directory count, navigation, rendered diagrams and horizontal overflow checked; no page errors.
- Visually reviewed the 375px waiting-shapes article screenshot: `output/articles-waits-mobile.png`.
- Website integrity check still reports 98 files and no changes, additions or removals.

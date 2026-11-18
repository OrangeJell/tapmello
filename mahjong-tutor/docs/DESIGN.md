# Current design — v0.3 · 2026-10-30

The user removed the opponent table from scope. The home page now leads to three tutorial levels, seven articles and waiting-hand practice. The prototype renderer, state driver, timers and controls have been removed; old battle URLs redirect to home. Guided teaching remains part of the advanced level.

The seven bilingual articles are now longer, connected explanations for a first-time Mahjong learner. They introduce terms before using them, work through tile examples, explain common mistakes and avoid invented personal anecdotes or strategic guarantees. Stable article IDs and shared pattern definitions remain unchanged. Article content is separated into `js/articles.js`.

Editorial guidance applied: [Humanizer-zh](https://github.com/op7418/Humanizer-zh/blob/main/SKILL.md), read from its source for this task. No global installation was made. Its focus on concrete wording and preserving meaning informed the edit; expansion was explicitly requested by the user.

UI guidance: ui-ux-pro-max's typography / line-length search. Reading pages are capped at 740px, use 16px body text with generous line height, and include keyboard-accessible section buttons. Contents navigation scrolls and focuses the heading without changing the article hash or the learning record. Pattern conditions, examples and counterexamples still come from the same shared catalog as exercises.

The sections below record the earlier prototype design and are historical.

---

# Design choices — v0.2

2026-10-28 · Independent Mahjong tutorial and opponent-table prototype

Applied skill: `/Users/chenliangyu/.codex/skills/ui-ux-pro-max/SKILL.md`.

The skill's initial tabletop search suggested a marketing showcase and 3D treatment. The explicit minimalism and error-feedback searches were more appropriate for this playable product. The implementation uses a quiet grid, restrained typography, ivory surfaces and a green table, with amber reserved for selection and the primary action.

- Exactly three level entrances, all directly accessible. Random practice and the clearly labelled opponent prototype remain separate activities.
- No external coach columns or repeated rules around the table. One goal, progress, tiles and actions live inside it. Detail is available on demand.
- First encounters introduce a pattern briefly. Tutorials, explanations and four articles render the same bilingual pattern catalog, including complete examples and counterexamples.
- Ivory SVG faces with a fine green lower edge, subtle gradient and thickness. Character suits use traditional lettering, dots and bamboo use consistent geometry; one bamboo retains the bird.
- Selection raises the tile slightly and outlines its edge without covering the face. Full accessible names accompany compact English captions.
- Seven-column mobile hands at 375px and six-column hands at 320px keep playable tiles at least 44px wide. Controls follow the hand in normal flow. Long articles scroll as separate pages.
- Native dialogs contain keyboard focus and pause computer playback. Escape resumes the prior state. Reduced-motion preference disables transitions.
- A deterministic state driver owns the six prototype scenarios, physical tile allocation, claims, replacement draw, turn order and endings. The UI receives opponent hand counts rather than their concealed tile faces.
- Synchronous action guards reject repeated submissions. Timers check the active state and revision; modal or background pauses cancel playback until resumed.
- No timer pressure, imaginary scores, fabricated win history or forced lesson unlocking.

The website remains outside this change. Versioned question IDs preserve old learning progress while allowing newly added advanced exercises to remain incomplete.

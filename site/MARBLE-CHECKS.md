# Clock Out! website checks

## 2026-11-17 版本

第一关改为 3 色、6 间小屋、54 位乘客。英印两版攻略从关卡源码生成六步路线。关卡增至 60，包含 16 关带两个顺序陷阱的超难关。下方旧版验收记录保留供追溯。


Verified on 2026-11-05 against the local static build.

## Current: accessible openings, later challenges (level version 10)

All opening bus colours are available in clickable front offices. Each level starts with a short easy section, then a transition, then blocked targets and mixed bottlenecks. Six distinct opening patterns remain. All 61 logic/physics checks pass, including 20 booster-free solutions, safe matching first moves, opening backlog limits and late-stage traps.

The real-click browser check passes all six easy opening types and full levels 1 and 20 at 390 × 844 with no uncaught errors. Logs: `../output/playwright/marble-sort/gentle-*`. The first-stage walkthrough is generated from the current route: each of its first four offices sends nine workers home, with 36 collected after the opening. Both guide translations and `src/assets/marble-opening.png` now show this version.

The latest build and static checks pass (40 HTML files, 1,253 local links, image dimensions and English/Hindi content). The six browser recovery checks also pass, covering retry and expansion after later-stage overflow.

## Earlier website integration checks (before version 10)

- `node site/scripts/build.mjs` builds 36 indexable pages, three noindex game players and the existing redirect.
- `node site/scripts/check.mjs` checks 40 HTML files and 1,253 local links, including image dimensions, canonical URLs, English/Hindi alternates, structured data, sitemap and release exclusions.
- `site/scripts/browser-marble.js` passes 77 browser checks. These cover the featured homepage game, difficulty bands, automatic 4× finish explanation, 360/390/768/1440 px layouts, iframe sizing, the current first-stage route, pause/undo/expansion, Hindi switching, off-screen pause, eight guide pages, no-JavaScript reading and iframe failure/retry. No uncaught browser errors.
- `site/scripts/browser-marble-links.js` passes 16 checks for both illustrated opening guides, standalone return links, embedded navigation and the existing Mahjong and Glass Twist entries.

The earlier first-stage walkthrough was 2–2–2–4. After the first two releases, 18 workers wait and nine places remain free. Releasing the target office lets its nine workers uncover buses for the waiting 18. The fourth office completes the stage at 36 collected. This route covers the first stage.

The homepage and Clock Out! sharing image use `src/assets/shuttle-cover.png`, a 1200 × 732 crop of actual current-game boarding. It shows 3 collected, 23 waiting, and a full bus in the third independent lane. The article uses `src/assets/marble-opening.png`, showing 27 collected with an empty waiting loop after the third release.

Current visual records include `../output/playwright/shuttle-home-390.png`, `shuttle-home-1440.png`, `marble-site-390.png`, `marble-site-1440.png`, `marble-site-hi-mobile.png` and `marble-guide-final.png`.

Browser viewport emulation covers Chromium layouts. The local `dist/` build is updated for the existing preview and release process.

## Earlier opening variety update (version 9)

The game now alternates six opening structures and at least three rhythms within each level. Front bus requests vary across two, three or four colours; the next office in each column is visible at the opening. The first-stage guide route remains 2–2–2–4.

All 60 logic/physics tests passed, including all 20 booster-free solutions and structural diversity checks that ignore colour and column permutations. `browser-variety.js` validated six opening types and full levels 1 and 20 against the built site at 390 × 844, without boosters, overflow or uncaught errors. `npm run build` and `npm run check` passed (40 HTML files, 1253 local links). Logs and screenshots: `../output/playwright/marble-sort/variety-*`.

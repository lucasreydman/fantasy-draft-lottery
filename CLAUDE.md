# CLAUDE.md

## Project Overview

Fantasy Draft Lottery Simulator — a web-based NBA-style lottery for The People's Dynasty League. Pure HTML/CSS/JS, no build tools, no frameworks. Single-page app served from `index.html`. Deployed to GitHub Pages via GitHub Actions on push to `main`.

## File Structure

- `index.html` — page structure, section layout, script/style imports (cache-busted `lottery.js` via `?v=` query param)
- `js/lottery.js` — all application logic (~1,200 lines): lottery draw, team management, pick trading, UI rendering, animations, exports
- `styles/main.css` — all styling (~1,480 lines): dark theme, layout, responsive breakpoints, animations, all `@keyframes`
- `images/favicon.png` — site icon
- `.github/workflows/static.yml` — GitHub Pages deployment workflow

## Lottery Mechanism

NBA-style: 1,001 combinations (1 discarded = 1,000 used). Picks 1–4 drawn from full 1,001 pool — redraw on discarded combo or already-picked team. Picks 5–6 by reverse record (ascending `originalIndex`). Picks 7–10 locked by standings. Combinations: `[224, 224, 224, 224, 60, 45, 0, 0, 0, 0]` (10-element array, trailing zeros for locked picks). Odds table is hardcoded, verified via 5M simulations.

## Key Constants

- `COMBINATIONS` — fixed 10-element combination counts per team, never change
- `TOTAL_POOL = 1001`, `ASSIGNED = 1000` — global constants
- `odds` — hardcoded 6x6 odds table
- `TEAM_NAME_OPTIONS` — dropdown team names
- `TEAM_LABELS` — seed labels (10th Seed through Champion)

## localStorage Keys

- `lotteryTeamNames` — saved team names array
- `lotteryTeamsLocked` — boolean string
- `lotteryPickOwnershipLocked` — boolean string
- `lotteryPickOwnership` — 3x10 ownership array

## Known Issues & Improvement Areas

### Code Quality
- **Nested function depth:** `runLottery()` contains deeply nested functions (`runQuickIterations`, `runFinalLottery`, `revealAutomaticPicks`, `revealTopFour`, etc.). Hard to test independently.

### Architecture
- `lottery.js` is a single ~1,200-line file — could be split into modules (lottery logic, UI rendering, state management, exports)

### Resolved
- ~~localStorage keys are magic strings~~ → extracted to `LS_KEY_*` constants
- ~~No validation on pick ownership data when loading from localStorage~~ → validated structure, types, and bounds
- ~~No user feedback when localStorage quota exceeded~~ → `safeSetItem()` shows toast on quota error
- ~~No ARIA labels on dynamically created podium elements~~ → added `role`, `aria-label` to quick and top-4 podiums
- ~~No focus trap on fullscreen modal~~ → `trapFocus()` utility traps Tab within modal; cleaned up on close
- ~~No focus management when modal opens/closes~~ → close button focused on open; focus trap removed on close
- ~~Color-only communication for badges~~ → added Unicode arrows (⬆/⬇/⚠) alongside text labels and `aria-label` attributes
- ~~Podium heights are fixed px values~~ → use `min(px, vh)` for viewport-relative sizing across all breakpoints
- ~~Inline styles not responsive~~ → moved `min-height`, `font-size`, button margin to CSS classes (`top-four-stage`, `batch-header-lg`, `reveal-top4-btn`)

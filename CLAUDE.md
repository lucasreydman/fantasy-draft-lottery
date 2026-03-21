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
- **Magic numbers:** Timing values (800ms, 3000ms, 5000ms), podium heights, and some colors are hardcoded. Could be extracted to constants.
- **Nested function depth:** `runLottery()` contains deeply nested functions (`runQuickIterations`, `runFinalLottery`, `revealAutomaticPicks`, `revealTopFour`, etc.). Hard to test independently.

### Accessibility
- No ARIA labels on dynamically created elements
- No keyboard navigation for fullscreen modal (no ESC to close, no focus trap)
- No focus management when modal opens/closes
- Color-only communication for "Shock drop!" and "Lucky Leap!" badges
- Emojis used without text fallbacks

### Mobile / Responsive
- Podium heights are fixed px values — overflow on mobile screens
- Font sizes in some inline styles not responsive
- No viewport-relative sizing (vw units) for dynamically created elements

### Error Handling
- No null checks on many `document.getElementById()` calls
- No validation on pick ownership data structure when loading from localStorage
- No user feedback when localStorage quota is exceeded (fails silently)

### Architecture
- `lottery.js` is a single ~1,200-line file — could be split into modules (lottery logic, UI rendering, state management, exports)
- localStorage keys are magic strings — should be constants
- Event listeners on dynamically created elements are never cleaned up (potential memory leaks on extended use)

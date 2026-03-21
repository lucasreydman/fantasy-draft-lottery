# CLAUDE.md

## Project Overview

Fantasy Draft Lottery Simulator — a web-based NBA-style lottery for Zim's Dynasty League. Pure HTML/CSS/JS, no build tools, no frameworks. Single-page app served from `index.html`.

## File Structure

- `index.html` — page structure, section layout, script/style imports
- `js/lottery.js` — all application logic (~1,800 lines): lottery draw, team management, pick trading, UI rendering, animations, exports
- `styles/main.css` — all styling (~1,000 lines): layout, theming, responsive breakpoints, animations
- `images/favicon.png` — site icon

## Lottery Mechanism

NBA-style: 1,001 combinations (1 discarded = 1,000 used). Picks 1–4 drawn from full 1,001 pool — redraw on discarded combo or already-picked team. Picks 5–6 by reverse record (ascending `originalIndex`). Picks 7–10 locked by standings. Combinations: `[224, 224, 224, 224, 60, 45]`. Odds table is hardcoded, verified via 5M simulations.

## Key Constants

- `COMBINATIONS` — fixed combination counts per team, never change
- `TOTAL_POOL = 1001`, `ASSIGNED = 1000` — defined inside `runQuickLottery()`
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
- **Excessive inline styles:** ~259 instances of `element.style.X` in lottery.js. Most styling for dynamically created elements (podiums, timers, modals, animations) is done in JS instead of CSS classes.
- **Dead code:** `showCountdown()` function (~line 1305) is defined but never called — replaced by `showPickTimer()`. Should be removed.
- **Magic numbers:** Timing values (800ms, 3000ms, 5000ms), podium heights (400px, 320px, 260px, 220px), and colors are hardcoded throughout. Should be extracted to constants.
- **`parseInt` without radix:** Two instances use `parseInt(value)` without the radix parameter — should be `parseInt(value, 10)`.
- **Nested function depth:** `runLottery()` contains deeply nested functions (`runQuickIterations`, `runFinalLottery`, `revealAutomaticPicks`, `revealTopFour`, etc.). Hard to test independently.
- **`alert()` dialogs:** 6 instances of `alert()` for validation messages. Should be replaced with inline error messages or toast notifications.

### Accessibility
- No ARIA labels on dynamically created elements
- No keyboard navigation for fullscreen modal (no ESC to close, no focus trap)
- No focus management when modal opens/closes
- Color-only communication for "Shock drop!" and "Lucky Leap!" badges
- Emojis used without text fallbacks
- Gold/silver podium colors fail WCAG AA contrast on white

### Mobile / Responsive
- Podium heights are fixed px values — overflow on mobile screens
- Timer positioned `fixed top: 20px right: 20px` — overlaps content on small screens
- Font sizes in inline styles (2.5rem, 1.8rem) not responsive
- No viewport-relative sizing (vw units) for dynamically created elements

### Error Handling
- No null checks on many `document.getElementById()` calls
- No validation on pick ownership data structure when loading from localStorage
- No user feedback when localStorage quota is exceeded (fails silently)
- No bounds checking on team array access in some places

### CSS
- Duplicate `@keyframes` definitions (pulse, shake defined multiple times)
- Inconsistent z-index values (1000 vs 9999)
- Some hardcoded colors should use CSS variables
- Animation keyframes scattered between CSS file and inline JS `<style>` injection

### Architecture
- `lottery.js` is a single 1,800-line file — could be split into modules (lottery logic, UI rendering, state management, exports)
- localStorage keys are magic strings — should be constants
- `TOTAL_POOL` and `ASSIGNED` are local to `runQuickLottery()` — should be global constants alongside `COMBINATIONS`
- Event listeners on dynamically created elements are never cleaned up (potential memory leaks on extended use)

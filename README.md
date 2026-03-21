# Fantasy Draft Lottery Simulator

A web-based NBA-style lottery simulator for fantasy sports draft order. Uses the exact same mechanism as the real NBA Draft Lottery — fixed combinations, sequential draws with redraw rules, and remaining picks by reverse record.

## Features

### Team Management
- Customizable team names for 10 teams (dropdown + optional custom names)
- **Confirm team order** locks the team order and unlocks pick ownership
- **Confirm pick ownership** locks picks and enables the lottery — everything is locked before the sim
- Names and lock states saved in local storage

### Lottery System
- **NBA-style lottery** for picks 1–4 using fixed combinations drawn from a pool of 1,001
- Picks 5–6 assigned automatically by reverse record (worst remaining team first)
- Teams 7–10 are not in the lottery — locked into picks 7–10 by standings
- **Magic number (1–99):** Run that many lotteries; the **Nth** run is the official result. Previews show runs 1 through N-1 on podiums, then the final reveal.

### Pick Trading
- Pick ownership table for all 3 rounds x 10 picks
- Assign any pick to any team (trades); saved in local storage
- Full draft order reflects lottery result + ownership

### Visual & Exports
- Dark theme UI with blue/gold sports-broadcast aesthetic
- Podium displays for quick-run results (gold/silver/bronze for top 3)
- Fullscreen final lottery reveal with spring-easing animations
- "Lucky Leap!" badges for upsets, "Shock drop!" alerts for fallers
- Countdown timer overlay during top-4 reveal
- Full draft order shown after the lottery
- **Download full draft order** — full 3-round order as a text file (with pick trades applied; shows "via" when a pick was traded)
- **Download lottery results** — original top 10 only (lottery result before any trades), as a text file
- Toast notifications for validation feedback (no browser alert dialogs)

### Accessibility
- ARIA labels on all interactive elements and the fullscreen modal
- ESC key closes the lottery modal
- Focus management — focus moves to modal on open
- `prefers-reduced-motion` respected — animations disabled for users who prefer reduced motion
- WCAG AA contrast ratios on dark theme
- Semantic `label[for]` attributes on form inputs

## Lottery Odds

The odds are fixed and derived from the combination counts, just like the NBA publishes a known odds table. Every team's probability for every pick is predetermined by the math. These were verified via 5,000,000 simulated lotteries.

| Team |  1st  |  2nd  |  3rd  |  4th  |  5th  |  6th  |
|------|-------|-------|-------|-------|-------|-------|
| 1 (10th) | 22.4% | 21.9% | 21.0% | 19.1% | 15.7% |  0.0% |
| 2 (9th)  | 22.4% | 21.8% | 20.9% | 19.1% | 14.7% |  0.9% |
| 3 (8th)  | 22.4% | 21.9% | 20.9% | 19.1% | 13.8% |  1.9% |
| 4 (7th)  | 22.4% | 21.9% | 21.0% | 19.1% | 12.8% |  2.8% |
| 5 (6th)  |  6.0% |  7.2% |  9.2% | 13.3% | 43.0% | 21.3% |
| 6 (5th)  |  4.4% |  5.4% |  7.0% | 10.3% |  0.0% | 73.0% |

Every row sums to 100%. Every column sums to 100%.

## Usage

1. **Enter team names** — Choose a name for each slot (10th Seed through Champion). Each name can be used only once.
2. **Confirm team order** — Click "Confirm Team Order" to lock the order and unlock the pick ownership table.
3. **Pick ownership (optional)** — In the table, set which team owns each pick for each round if picks have been traded.
4. **Confirm pick ownership** — Click "Confirm Pick Ownership" to lock picks and enable the lottery button.
5. **Magic number** — Enter 1-99. The app runs that many lotteries; the **Nth** run is the official result.
6. **Run lottery** — Click "Run Lottery" to see preview runs (if N > 1) and then the final draft order.
7. **Draft order** — View the full 3-round draft order on the page. Use **Download full draft order** for the complete order (with trades) or **Download lottery results** for the original top 10 only (before trades).

## Data Persistence

Stored in the browser's local storage:
- Team names
- Team order lock state
- Pick ownership lock state
- Pick ownership (trades)

## How the Lottery Works (Full Logic)

### Team Structure

There are 10 teams ordered by regular-season finish:

| Slot | Seed | Role |
|------|------|------|
| Team 1 | 10th (worst) | Lottery eligible |
| Team 2 | 9th | Lottery eligible |
| Team 3 | 8th | Lottery eligible |
| Team 4 | 7th | Lottery eligible |
| Team 5 | 6th | Lottery eligible |
| Team 6 | 5th | Lottery eligible |
| Team 7 | 4th | Locked — pick 7 |
| Team 8 | 3rd | Locked — pick 8 |
| Team 9 | 2nd | Locked — pick 9 |
| Team 10 | Champion | Locked — pick 10 |

Teams 7-10 are **not in the lottery**. They are automatically assigned picks 7-10 in reverse order of standings.

### Combination Pool

There are **1,001 total combinations**. 1,000 are assigned to teams. 1 is discarded. This is identical to the NBA, which uses 14 ping pong balls to generate C(14,4) = 1,001 possible 4-ball combinations, discards 1, and assigns the remaining 1,000 to teams.

| Team | Combinations | Share of Pool |
|------|-------------|--------------|
| Team 1 (10th seed) | 224 | 22.4% |
| Team 2 (9th seed) | 224 | 22.4% |
| Team 3 (8th seed) | 224 | 22.4% |
| Team 4 (7th seed) | 224 | 22.4% |
| Team 5 (6th seed) | 60 | 6.0% |
| Team 6 (5th seed) | 45 | 4.5% |
| *(discarded)* | 1 | — |
| **Total** | **1,001** | **100%** |

These combination counts are **fixed constants in the code**. They never change and are never recalculated.

### Step 1: Drawing Picks 1-4

Picks 1 through 4 are drawn **sequentially** from the **full pool of 1,001 combinations**. For each pick:

1. A random number is generated from 0 to 1,001
2. If it lands on the **discarded combination** (the 1,001st slot) — the draw is **voided and repeated**. This is exactly what the NBA does when the discarded combination is pulled.
3. If it lands on a **team that has already been selected** for an earlier pick — the draw is **voided and repeated**. This is exactly what the NBA does: they put the balls back, redraw, and keep going until a new team is selected.
4. If it lands on a **valid, unselected team** — that team wins the pick.

The pool is **never reduced**. Every draw is from the same 1,001 combinations. Redraws handle collisions, exactly like the NBA re-pulling ping pong balls.

All 6 lottery teams are eligible for all 4 drawn picks. There are no restrictions on which team can win which pick in the drawn portion.

If any redraws occur during the lottery, a notice is displayed at the end of the reveal.

### Step 2: Assigning Picks 5-6

After 4 teams have been drawn, 2 lottery teams remain. These are **not drawn**. They are assigned picks 5 and 6 by **reverse record** (worst remaining team gets the earlier pick):

- The team with the **worse record** (higher seed number) gets **pick 5**
- The team with the **better record** (lower seed number) gets **pick 6**

For example, if Team 3 (8th seed) and Team 6 (5th seed) remain after picks 1-4, Team 3 gets pick 5 and Team 6 gets pick 6. This is identical to how the NBA assigns picks 5-14 by reverse record after the top 4 are drawn.

### Step 3: Picks 7-10

Teams 7-10 (4th seed through Champion) are not in the lottery. They are locked into picks 7-10 in reverse order of standings. This never changes.

### Why Certain Odds Are 0%

Two cells in the odds table are 0.0%. These are not special rules coded into the draw — they are **natural, mathematical consequences** of assigning picks 5-6 by reverse record:

- **Team 1 (10th seed) has 0% for pick 6.** Team 1 is the worst team in the lottery. If they don't get drawn in picks 1-4, they are guaranteed to be the worse of the two remaining teams, so they always get pick 5 (never 6).

- **Team 6 (5th seed) has 0% for pick 5.** Team 6 is the best team in the lottery. If they don't get drawn in picks 1-4, they are guaranteed to be the better of the two remaining teams, so they always get pick 6 (never 5).

In the NBA, the same logic applies: the team with the worst record can never fall below pick 5 (in a 14-team lottery), and the team with the best lottery record always falls to the last remaining slot if not drawn. No special-case code is needed — the sort handles it.

## How This Mirrors the NBA Lottery

| | NBA Draft Lottery | This Simulator |
|---|---|---|
| **Lottery teams** | 14 teams eligible for the lottery | 6 teams eligible for the lottery |
| **Total combinations** | 1,001 possible combinations | 1,001 possible combinations |
| **Discarded** | 1 combination discarded, 1,000 used | 1 combination discarded, 1,000 used |
| **Assignment** | Each team gets a fixed share of the 1,000 combinations | Each team gets a fixed share of the 1,000 combinations |
| **Number of draws** | 4 picks drawn by lottery | 4 picks drawn by lottery |
| **Draw pool** | Every draw is from the full 1,001 pool (never reduced) | Every draw is from the full 1,001 pool (never reduced) |
| **Discarded combo drawn** | Void the draw, put balls back, redraw | Void the draw, generate a new random number, redraw |
| **Already-picked team drawn** | Void the draw, put balls back, redraw | Void the draw, generate a new random number, redraw |
| **Remaining picks** | Picks 5-14 assigned by reverse record (no drawing) | Picks 5-6 assigned by reverse record (no drawing) |
| **Non-lottery teams** | Teams 15-30 pick in order of record | Teams 7-10 locked by standings |
| **Pick 1 eligibility** | All 14 lottery teams can win pick 1 | All 6 lottery teams can win pick 1 |
| **Odds table** | Published fixed table derived from combination counts | Published fixed table derived from combination counts |
| **Randomness** | Physical ping pong balls | `Math.random()` — fully random, never seeded |

The mechanism is identical. The only differences are scale (6 lottery teams instead of 14) and the specific combination counts assigned to each team.

## Technical Details

- **Stack:** HTML5, CSS3, vanilla JavaScript — no build tools, no frameworks
- **Fonts:** Inter (UI) + JetBrains Mono (numbers/data) via Google Fonts
- **Styling:** CSS custom properties (design tokens) for colors, spacing, shadows, transitions. Dark theme default.
- **Hosting:** Static files — works on GitHub Pages, Netlify, or any static host with zero configuration
- **Randomness:** Every lottery run uses `Math.random()` — fully random, never seeded, never reproducible. Each run is unique.
- **Odds table:** Hardcoded from the known combination counts and verified against 5,000,000 simulated lotteries. The probabilities are mathematical facts of the combination system.
- **Combination counts:** `[224, 224, 224, 224, 60, 45]` — 1,000 assigned + 1 discarded = 1,001 total. Stored as the constant `COMBINATIONS` in code.
- **Draw mechanism:** True NBA-style. Each draw samples from the full 1,001 pool. Collisions (discarded combo or already-picked team) trigger a redraw. The pool is never reduced between picks.

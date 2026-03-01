# Fantasy Draft Lottery Simulator

A web-based lottery simulator for fantasy sports draft order (e.g. Zim's Dynasty League). It supports customizable team names, pick trading, weighted lottery for the top 6 picks with NBA-style rules, and a visual lottery reveal.

## Features

### Team Management
- Customizable team names for 10 teams (dropdown + optional custom names)
- Team order locked after confirmation so lottery and pick ownership are stable
- Names and lock state saved in local storage

### Lottery System
- **Weighted lottery** for picks 1–6; teams 7–10 keep their reverse order (no lottery)
- **NBA-style rules:** Team 1 (10th seed) cannot receive the 6th pick; Team 6 (5th seed) cannot receive the 5th pick. These are enforced in code (0% probability).
- **Magic number (1–99):** Run that many simulated lotteries; the **Nth** run is the official result. Previews show runs 1 through N−1 on podiums, then the final reveal.
- Draw weights are **tuned on load** so the actual draw probabilities match the displayed odds table.

### Pick Trading
- Pick ownership table for all 3 rounds × 10 picks
- Assign any pick to any team (trades); saved in local storage
- Full draft order reflects lottery result + ownership

### Visual
- Podium displays for quick-run results (gold/silver/bronze for top 3)
- Fullscreen final lottery reveal with animations
- Full draft order shown after the lottery

## Lottery Odds

Teams 1–6 correspond to **10th seed (worst)** through **5th seed (best)** in the lottery. Each row is the probability that that team receives the given draft pick; each row sums to 100%.

| Team |  1st  |  2nd  |  3rd  |  4th  |  5th  |  6th  |
|------|-------|-------|-------|-------|-------|-------|
|  1 (10th) | 22.5% | 21.8% | 20.9% | 19.1% | 15.7% |  0.0% |
|  2 (9th)  | 22.5% | 21.8% | 20.9% | 19.1% | 14.8% |  0.9% |
|  3 (8th)  | 22.5% | 21.8% | 20.9% | 19.1% | 13.8% |  1.9% |
|  4 (7th)  | 22.5% | 21.8% | 20.9% | 19.1% | 12.9% |  2.8% |
|  5 (6th)  |  6.0% |  7.2% |  9.1% | 13.2% | 42.8% | 21.7% |
|  6 (5th)  |  4.5% |  5.5% |  7.1% | 10.4% |  0.0% | 72.5% |

- **Team 1 (10th):** 0% for 6th pick — by rule, when only two teams remain for the 5th pick and one is Team 1, Team 1 always gets 5th, so they never get 6th.
- **Team 6 (5th):** 0% for 5th pick — by rule, Team 6 is excluded from the 5th-pick draw; they get 6th whenever they are still in the pool after picks 1–4.

## Usage

1. **Enter team names** — Choose a name for each slot (10th Seed through Champion). Each name can be used only once.
2. **Confirm team order** — Click “Confirm Team Order” to lock the order and enable pick ownership and the lottery.
3. **Pick ownership (optional)** — In the table, set which team owns each pick for each round if picks have been traded.
4. **Magic number** — Enter 1–99. The app runs that many lotteries; the **Nth** run is the official result.
5. **Run lottery** — Click “Run Lottery” to see preview runs (if N > 1) and then the final draft order.
6. **Draft order** — View and use the full 3-round draft order; export via Copy / Download JSON / Download CSV if needed.

## Data Persistence

Stored in the browser’s local storage:
- Team names
- Team order lock state
- Pick ownership (trades)

## Technical Details

- **Stack:** HTML5, CSS3, vanilla JavaScript
- **Lottery logic:** Sequential weighted random draw for picks 1–6. For the 5th pick, Team 6 is excluded and, when the pool has two teams and one is Team 1, Team 1 is assigned 5th. Draw weights are tuned on page load (Monte Carlo) so realized probabilities match the canonical odds table.
- **Reproducibility:** Each single run can be made reproducible by using a seeded RNG (used internally where needed).

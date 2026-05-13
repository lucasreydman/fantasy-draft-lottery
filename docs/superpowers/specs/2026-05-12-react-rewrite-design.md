# Fantasy Draft Lottery — React/Next.js Rewrite on Vercel

**Date:** 2026-05-12
**Status:** Draft
**Scope:** Full rewrite of the existing `tpdl-lottery` vanilla HTML/JS app onto a modern React stack with persistent storage and shareable results. TPDL-specific (single league).

## Context

The existing app is a polished NBA-style draft lottery simulator for The People's Dynasty League: pure HTML/CSS/JS, ~1,200 lines of `lottery.js`, ~1,480 lines of `main.css`, no build tools, deployed to GitHub Pages. It runs the lottery client-side, holds state in localStorage, and renders a cinematic reveal sequence.

The user wants a modern rewrite to enable: (a) cleaner animation choreography via a real animation library, (b) layout/UX improvements, (c) shareable result URLs the rest of the league can open, and (d) browsable lottery history across seasons. A move to Vercel unlocks shared server-side state (Vercel KV) without standing up a backend.

This is a **separate effort** from the existing `docs/superpowers/specs/2026-03-23-generic-lottery-simulator-design.md` (which is a generic/customizable port to a different repo). That design is not relevant here.

## Goals & Non-Goals

**Goals:**
- Same lottery math, verified against the existing implementation
- React + Next.js (App Router) + Tailwind v4 + Motion + shadcn/ui + Vercel KV
- Multi-page routing: `/`, `/history`, `/results/[id]`, `/admin`
- Fullscreen-takeover reveal experience, replayable from a shared URL
- Auto-save every completed lottery; share-on-completion flow
- Rich Slack/iMessage link previews for `/results/[id]`

**Non-goals:**
- Auth / accounts (trust by obscurity — URLs only shared in league chat)
- Live spectator mode (broadcast reveal across devices in real time)
- Multi-league support (TPDL is hardcoded; a separate generic version is its own project)
- Migrating existing localStorage data (clean slate; team names re-entered once)

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind v4 |
| Components | shadcn/ui (copy-into-repo, owned source) |
| Animation | Motion (formerly Framer Motion) |
| Storage | Vercel KV (Upstash Redis under the hood) |
| Hosting | Vercel |
| Testing | Vitest (unit tests for lottery math) |
| Package mgr | pnpm |

**Why Next.js over Vite SPA:** Server components let `/results/[id]` and `/history` be server-rendered, which gives rich link previews when shared in chat — the single biggest UX win for a tool meant to be shared. API routes co-locate with pages; no separate functions config. Path of least resistance on Vercel.

## Architecture

### Routes & Server/Client Split

```
app/
  page.tsx                  → "/"            (run a new lottery)
  history/page.tsx          → "/history"     (list of past lotteries)
  results/[id]/page.tsx     → "/results/abc" (shared replay page)
  admin/page.tsx            → "/admin"       (team config + pick trades)
  api/
    lotteries/route.ts      → POST (save), GET (list)
    lotteries/[id]/route.ts → GET (fetch one)
  layout.tsx                → shell, nav, fonts, theme
```

- `app/history/page.tsx` and `app/results/[id]/page.tsx` are **server components** that read KV directly. They render the HTML on Vercel, producing rich OpenGraph previews in link unfurls.
- The interactive parts — running the lottery, the reveal animation, trade UI — are **client components** mounted inside those server shells.
- `app/page.tsx` is a thin server shell hosting `<LotteryRunner />` (client).

### Project Structure

```
fantasy-draft-lottery/
  app/                      Next.js routes
  components/
    reveal/                 RevealPlayer + sub-components
    lottery/                LotteryRunner, TeamSetup, PickOwnershipEditor, OddsTable
    history/                HistoryList, ResultPage shell
    shared/                 Button, Dialog, etc. (shadcn-derived)
  lib/
    lottery/                Pure lottery engine — no React, no DOM, no localStorage
      combinations.ts       1001-combination draw logic
      draw.ts               runDraw(config) → { finalOrder, drawSequence }
      jumps.ts              "team X jumped from N to M" analysis
      odds.ts               Hardcoded TPDL odds table + lookup helpers
      types.ts              TS types shared with the rest of the app
    kv.ts                   Vercel KV client + typed read/write helpers
    league.ts               TPDL constants: team labels, defaults, combinations
  test/
    lottery/                Vitest specs for lib/lottery/
  styles/globals.css        Tailwind v4 directives, theme tokens
  next.config.ts
  tsconfig.json
  package.json
```

**Key principle:** `lib/lottery/` is a pure TypeScript module. Takes a config in, returns a result out. No React, no DOM, no side effects. This is what lets us unit-test the math against the verified original implementation and lets the reveal player operate on data, not behavior.

## Data Model

### Core Types

```ts
type TeamConfig = {
  name: string;
  originalIndex: number;   // 0 = worst seed, 9 = best (champion)
  combinations: number;    // 224, 224, 224, 224, 60, 45, 0, 0, 0, 0
};

type DrawEvent =
  | { kind: 'lottery';  pick: 1 | 2 | 3 | 4; teamIndex: number }
  | { kind: 'byRecord'; pick: 5 | 6;         teamIndex: number }
  | { kind: 'locked';   pick: 7 | 8 | 9 | 10; teamIndex: number };

type LotteryResult = {
  id: string;              // nanoid(10)
  createdAt: number;       // unix ms
  label: string;           // e.g. "2026 Season"
  teams: TeamConfig[];     // length 10
  pickOwnership: string[][]; // 3 (draft rounds) × 10 (teams); cell value = owning team name after trades
  finalOrder: number[];    // length 10; finalOrder[pick-1] = originalIndex
  drawSequence: DrawEvent[]; // length 10; ordered as drawn (4 lottery, 2 by-record, 4 locked)
};
```

**Notes:**
- `pickOwnership` represents the **three rounds of the actual draft** that follows the lottery (round 1 picks are the lottery result, rounds 2 and 3 are pre-determined by reverse standings unless traded). It is *not* multiple lottery scenarios; the lottery itself runs once per `LotteryResult`.
- `drawSequence` is the single source of truth for replays — the reveal player is a deterministic state machine driven by this array.
- **`DrawEvent.kind` → reveal phase mapping:** `kind: 'lottery'` (picks 1-4) → **top podium** phase. `kind: 'byRecord'` (picks 5-6) and `kind: 'locked'` (picks 7-10) → **automatic picks** phase (revealed bottom-up, 10 down to 5). The reveal player groups events by phase, not by `kind` directly.
- **Replay visual determinism:** `finalOrder` and `drawSequence` are deterministic. The **quick-iterations phase shuffle is purely visual** and may use unseeded randomness — different replays of the same lottery may show different teaser shuffles, but the final reveal is identical.
- **Trade badges on reveal:** when a pick is revealed, the player displays both the winning team (from `drawSequence`) and the owning team for that pick (from `pickOwnership[0]`, the first draft round). Picks that have been traded show a badge indicating the original-vs-current owner, matching the existing app's badge system.

### KV Schema

| Key | Type | Value |
|---|---|---|
| `lottery:{id}` | string | JSON-encoded `LotteryResult` |
| `lottery:index` | sorted set | members = `{id}`, scores = `createdAt` |

The sorted set lets `/history` page in reverse-chronological order with O(log N) inserts and cheap reads.

### API

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/lotteries` | Body = `Omit<LotteryResult, 'id' \| 'createdAt'>`. Generates `id` (nanoid) + `createdAt`, persists both keys, returns full saved object. |
| GET | `/api/lotteries?limit=20&cursor=…` | Returns paged list from `lottery:index` (reverse chronological). |
| GET | `/api/lotteries/[id]` | Returns one `LotteryResult` or 404. |

Server components use the KV client directly (no internal HTTP); the API routes exist for the client-side POST after a live run completes.

## Reveal System

The reveal is the centerpiece of the app. Same component powers live runs and replays — both consume a `drawSequence`.

### Flow: Live Run

1. User on `/` configures teams + pick ownership, clicks **Run Lottery**.
2. `runDraw(config)` runs synchronously in the browser, returns `{ finalOrder, drawSequence }`.
3. UI transitions to fullscreen takeover. `<RevealPlayer drawSequence={...} mode="live" />` mounts and begins animation.
4. Reveal proceeds through three phases (preserving the existing app's structure):
   - **Quick iterations** — preview podium with random shuffling (Motion `LayoutGroup` for the swap animations).
   - **Automatic picks** — picks 10 through 5 revealed bottom-up.
   - **Top picks podium** — picks 4 through 1 revealed dramatically.
5. On completion, the player calls `onComplete(result)`. The page POSTs to `/api/lotteries`, receives `{ id }`, and shows a **Share** button with `/results/{id}`.

### Flow: Replay

1. `/results/[id]` server component fetches the `LotteryResult` from KV. 404s cleanly if missing.
2. Server-renders a **teaser**: header (league + season label), locked picks (7-10) revealed, large **Watch the reveal** button. This is what shows up in Slack link previews.
3. Click → fullscreen takeover → `<RevealPlayer drawSequence={...} mode="replay" />` plays the same animation as a live run.

Why "press play": shared link previews unfurl with locked-pick info only — no spoilers — and viewers get the full cinematic moment any time they want it.

### State Machine

`<RevealPlayer>` walks through `drawSequence` with timed transitions per phase. Internal state:

```ts
type RevealPhase = 'quickIterations' | 'automaticPicks' | 'topPodium' | 'complete';
type RevealState = { phase: RevealPhase; cursor: number; iterationsRemaining?: number };
```

Animation timings, magic-number behavior (the quick-iteration phase scales with a constant), and easing curves live in `components/reveal/timing.ts` so they can be tuned independently of logic.

## Component Breakdown

### Lottery feature
- **`<LotteryRunner>`** *(client)* — orchestrator on `/`. Loads TPDL config from `lib/league.ts`, renders `<TeamSetup>` + `<PickOwnershipEditor>` + `<OddsTable>`, owns the **Run Lottery** action, hosts `<RevealPlayer>` when running, handles the post-complete save + share flow.
- **`<TeamSetup>`** — 10 team name inputs, lock/unlock, persists to localStorage for convenience between sessions (not authoritative).
- **`<PickOwnershipEditor>`** — 3×10 trade table, lock/unlock.
- **`<OddsTable>`** — static display of the hardcoded TPDL odds table.

### Reveal feature
- **`<RevealPlayer>`** — fullscreen state machine, takes `drawSequence`, owns animation choreography.
- **`<QuickIterationsPodium>`** — Motion `LayoutGroup` swap animations for the preview phase.
- **`<AutomaticPicksLane>`** — bottom-up reveal for picks 10→5.
- **`<TopPicksPodium>`** — dramatic reveal for picks 4→1.

### History feature
- **`<HistoryList>`** *(server)* — reverse-chronological list, each entry shows label, date, and top pick winner team name.
- **`<ResultPage>`** *(server shell + client player)* — teaser + replay launcher.
- **`<ShareButton>`** *(client)* — copy `/results/[id]` to clipboard, toast on success.

### Admin feature
- `/admin` route holds the team-config and pick-ownership editors as a dedicated screen. The home page renders read-only summaries with an "Edit on Admin" link, keeping the main flow focused on running the lottery.

### Pure modules (no JSX)
- `lib/lottery/combinations.ts` — the 1001-combo pool, draw-without-replacement logic, redraw on discard or already-picked team.
- `lib/lottery/draw.ts` — `runDraw(config) → { finalOrder, drawSequence }`. Synchronous, seedable RNG injectable for tests.
- `lib/lottery/jumps.ts` — "team X jumped N spots" analysis used for badges.
- `lib/lottery/odds.ts` — hardcoded 6×6 odds table verified by 5M-sim runs, lookup helpers.
- `lib/league.ts` — TPDL constants: team labels (`TEAM_LABELS`), team name dropdown options (`TEAM_NAME_OPTIONS`), combination counts (`COMBINATIONS`).

## Migration Approach

**Green-field, parallel build.** Don't incrementally migrate the existing `lottery.js`. Scaffold the Next.js app fresh, port the math first (as pure modules with tests), then build the UI around it.

The existing GitHub Pages site stays live during the rewrite. Cut over at the end by switching the league's bookmarked URL. The old repo is archived but kept readable as a reference.

**localStorage keys are not migrated.** New repo, clean slate. Team names re-entered once.

## Verification

1. **Math parity (automated):**
   - Vitest specs in `test/lottery/` assert that `runDraw()` produces empirical odds matching the hardcoded TPDL odds table within 0.1% over 100K Monte Carlo runs (seeded RNG).
   - The 1001-combination invariant (1 discarded, 1000 used; redraw on discard or already-picked) is tested explicitly.
   - Jump analysis (`lib/lottery/jumps.ts`) tested against fixed scenarios from the existing app's behavior.

2. **Live run end-to-end (manual):** Open `/`, configure teams, run a lottery, watch the reveal play, hit Share, copy URL, open in another tab → replay loads, locked picks teasered, **Watch the reveal** plays the full animation.

3. **History end-to-end (manual):** Run two lotteries, visit `/history`, verify both appear in reverse-chronological order with correct labels and top-pick winners.

4. **Link previews (manual):** Paste a `/results/[id]` URL in Slack and iMessage, verify rich OpenGraph preview renders (label, top pick, date). Requires OG metadata wired in the server component.

5. **Strict types:** `pnpm tsc --noEmit` clean. `lib/lottery/` contains no `any`.

6. **Accessibility carry-over:** The existing app added focus traps, ARIA labels, and color-independent badge cues. These patterns carry forward; verify Tab navigation works in the reveal and dialogs, fullscreen modal traps focus.

## Deployment

- New GitHub repo (or rewrite this one in place — TBD with user at start of implementation).
- Connect to Vercel via dashboard.
- Provision Vercel KV from Vercel dashboard; auto-injects `KV_*` env vars into the project.
- Push to `main` → auto-deploys (preview deploys on PRs).
- Old `static.yml` GitHub Pages workflow either removed or left on the archived repo.
- Custom domain optional; Vercel subdomain is fine for the league.

## Open Questions Deferred to Implementation

1. **Repo:** rewrite `tpdl-lottery` in place vs new repo `tpdl-lottery-react`. Doesn't affect design — decide at scaffold time.
2. **Theme/visual style:** the existing dark theme is solid; whether to refresh design tokens during the rewrite is a polish decision left to implementation.
3. **OG image generation:** static OG image vs dynamic per-result image via Next.js `opengraph-image.tsx`. Both work; default to static first, upgrade if it feels worth it.

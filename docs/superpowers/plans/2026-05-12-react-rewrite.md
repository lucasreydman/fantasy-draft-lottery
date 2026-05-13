# Fantasy Draft Lottery — React/Next.js Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the existing vanilla HTML/JS lottery app as a Next.js 15 application with persistent server-side history, shareable result URLs, and a cinematic Motion-driven reveal — deployed to Vercel.

**Architecture:** Next.js App Router with file-based routing. Pure TypeScript lottery engine (no React) under `lib/lottery/`. Vercel KV stores `LotteryResult` JSON keyed by id + a sorted set for chronological listing. Server components render `/history` and `/results/[id]` for rich link previews; the interactive reveal is a client component driven by a deterministic `drawSequence`.

**Tech Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind v4 · shadcn/ui · Motion · Vercel KV · Vitest · pnpm

**Spec:** `docs/superpowers/specs/2026-05-12-react-rewrite-design.md`

**Scope decision (Phase 0):** This plan scaffolds a **new directory** at `C:\Users\lucas\dev\tpdl-draft-lottery`. The existing `tpdl-lottery` repo stays live on GitHub Pages until cutover. If you prefer to rewrite in-place instead, adjust Task 1 paths accordingly — nothing else in the plan depends on the choice.

---

## Phase 0 — Bootstrap

### Task 1: Scaffold Next.js project

**Files:**
- Create: `C:\Users\lucas\dev\tpdl-draft-lottery\` (entire project tree via `create-next-app`)

- [ ] **Step 1: Run create-next-app**

```bash
cd C:\Users\lucas\dev
pnpm create next-app@latest tpdl-draft-lottery --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*" --turbopack
```

- [ ] **Step 2: Verify the dev server boots**

```bash
cd tpdl-draft-lottery
pnpm dev
```

Expected: server on http://localhost:3000 renders the Next.js starter page. Stop the server.

- [ ] **Step 3: Initialize git, push to new GitHub repo**

```bash
git init
git add .
git commit -m "chore: bootstrap Next.js project"
gh repo create lucasreydman/tpdl-draft-lottery --public --source=. --remote=origin --push
```

- [ ] **Step 4: Update package.json with project metadata**

Edit `package.json`: set `"name": "tpdl-draft-lottery"`, `"version": "0.1.0"`, `"private": true`.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: project metadata"
```

---

### Task 2: Add Motion, shadcn/ui, Vitest, nanoid

**Files:**
- Modify: `package.json`, `tsconfig.json`
- Create: `components.json` (shadcn config), `vitest.config.ts`

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add motion nanoid @vercel/kv
```

- [ ] **Step 2: Install dev deps**

```bash
pnpm add -D vitest @vitest/ui @types/node
```

- [ ] **Step 3: Init shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

Pick: New York style, Neutral base color, CSS variables yes. This creates `components.json` and updates `globals.css` with the theme tokens.

- [ ] **Step 4: Add vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 5: Add test script to package.json**

In `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 6: Verify tsc + test commands work**

```bash
pnpm tsc --noEmit
pnpm test
```

Expected: tsc clean, vitest reports "No test files found" (fine — we have none yet).

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml components.json vitest.config.ts app/globals.css
git commit -m "chore: add motion, shadcn/ui, vitest, nanoid"
```

---

## Phase 1 — Lottery Math (Pure Modules with Tests)

The math is the crown jewel — verified against 5M Monte Carlo simulations in the original repo. Port carefully with tests proving parity.

### Task 3: Define lottery types

**Files:**
- Create: `lib/lottery/types.ts`

- [ ] **Step 1: Write the type definitions**

```ts
// lib/lottery/types.ts

export type TeamConfig = {
  name: string;
  originalIndex: number;
  combinations: number;
};

export type DrawEventLottery  = { kind: 'lottery';  pick: 1 | 2 | 3 | 4; teamIndex: number };
export type DrawEventByRecord = { kind: 'byRecord'; pick: 5 | 6;          teamIndex: number };
export type DrawEventLocked   = { kind: 'locked';   pick: 7 | 8 | 9 | 10; teamIndex: number };
export type DrawEvent = DrawEventLottery | DrawEventByRecord | DrawEventLocked;

export type LotteryConfig = {
  teams: TeamConfig[];
};

export type DrawResult = {
  finalOrder: number[];
  drawSequence: DrawEvent[];
};

export type LotteryResult = DrawResult & {
  id: string;
  createdAt: number;
  label: string;
  teams: TeamConfig[];
  pickOwnership: string[][];
};

export type RNG = () => number;
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/lottery/types.ts
git commit -m "feat(lottery): define core types"
```

---

### Task 4: Port the combinations draw logic

The original uses 1001 combinations: 1 is discarded (forces redraw), 1000 are assigned. Picks 1-4 draw without replacement.

**Files:**
- Create: `lib/lottery/combinations.ts`, `test/lottery/combinations.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/lottery/combinations.test.ts
import { describe, it, expect } from 'vitest';
import { drawOnePick } from '@/lib/lottery/combinations';
import type { TeamConfig, RNG } from '@/lib/lottery/types';

const tpdlTeams: TeamConfig[] = [
  { name: 'A', originalIndex: 0, combinations: 224 },
  { name: 'B', originalIndex: 1, combinations: 224 },
  { name: 'C', originalIndex: 2, combinations: 224 },
  { name: 'D', originalIndex: 3, combinations: 224 },
  { name: 'E', originalIndex: 4, combinations: 60 },
  { name: 'F', originalIndex: 5, combinations: 45 },
];

const fixedRng = (sequence: number[]): RNG => {
  let i = 0;
  return () => sequence[i++ % sequence.length];
};

describe('drawOnePick', () => {
  it('returns the team whose combination range contains the rolled number', () => {
    const rng = fixedRng([0.0]);
    const out = drawOnePick(tpdlTeams, new Set(), rng);
    expect(out).toBe(0);
  });

  it('skips already-picked teams (forces redraw)', () => {
    const rng = fixedRng([0.0, 0.5]);
    const out = drawOnePick(tpdlTeams, new Set([0]), rng);
    expect(out).not.toBe(0);
  });

  it('treats the 1001st combination as a discard (triggers redraw)', () => {
    const rng = fixedRng([1000 / 1001, 0.0]);
    const out = drawOnePick(tpdlTeams, new Set(), rng);
    expect(out).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL, "drawOnePick is not defined" or import error.

- [ ] **Step 3: Implement combinations.ts**

```ts
// lib/lottery/combinations.ts
import type { TeamConfig, RNG } from './types';

export const TOTAL_POOL = 1001;
export const ASSIGNED = 1000;

export function drawOnePick(
  teams: TeamConfig[],
  alreadyPicked: ReadonlySet<number>,
  rng: RNG,
): number {
  while (true) {
    const roll = Math.floor(rng() * TOTAL_POOL);
    if (roll >= ASSIGNED) continue; // discarded combo
    let cursor = 0;
    for (const team of teams) {
      cursor += team.combinations;
      if (roll < cursor) {
        if (alreadyPicked.has(team.originalIndex)) break;
        return team.originalIndex;
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test
```

Expected: 3/3 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/lottery/combinations.ts test/lottery/combinations.test.ts
git commit -m "feat(lottery): port combinations draw logic"
```

---

### Task 5: Port the full draw (runDraw)

Implements: 4 lottery picks (combinations), 2 by-record picks (ascending originalIndex among the rest), 4 locked picks (descending originalIndex among the rest).

**Files:**
- Create: `lib/lottery/draw.ts`, `test/lottery/draw.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// test/lottery/draw.test.ts
import { describe, it, expect } from 'vitest';
import { runDraw } from '@/lib/lottery/draw';
import type { TeamConfig } from '@/lib/lottery/types';

const TPDL_TEAMS: TeamConfig[] = Array.from({ length: 10 }, (_, i) => ({
  name: `Team${i}`,
  originalIndex: i,
  combinations: [224, 224, 224, 224, 60, 45, 0, 0, 0, 0][i],
}));

describe('runDraw', () => {
  it('returns 10 events covering picks 1-10 exactly once', () => {
    const { drawSequence, finalOrder } = runDraw({ teams: TPDL_TEAMS }, Math.random);
    const picks = drawSequence.map(e => e.pick).sort((a, b) => a - b);
    expect(picks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(finalOrder).size).toBe(10);
    expect(finalOrder).toHaveLength(10);
  });

  it('uses lottery kind for picks 1-4, byRecord for 5-6, locked for 7-10', () => {
    const { drawSequence } = runDraw({ teams: TPDL_TEAMS }, Math.random);
    const sorted = [...drawSequence].sort((a, b) => a.pick - b.pick);
    expect(sorted[0].kind).toBe('lottery');
    expect(sorted[3].kind).toBe('lottery');
    expect(sorted[4].kind).toBe('byRecord');
    expect(sorted[5].kind).toBe('byRecord');
    expect(sorted[6].kind).toBe('locked');
    expect(sorted[9].kind).toBe('locked');
  });

  it('by-record picks (5-6) go to the worst-seeded non-lottery teams ascending', () => {
    const { drawSequence } = runDraw({ teams: TPDL_TEAMS }, Math.random);
    const lotteryIndexes = new Set(
      drawSequence.filter(e => e.kind === 'lottery').map(e => e.teamIndex),
    );
    const byRecord = drawSequence.filter(e => e.kind === 'byRecord');
    const remainingSorted = TPDL_TEAMS
      .map(t => t.originalIndex)
      .filter(i => !lotteryIndexes.has(i))
      .sort((a, b) => a - b)
      .slice(0, 2);
    expect(byRecord.sort((a, b) => a.pick - b.pick).map(e => e.teamIndex))
      .toEqual(remainingSorted);
  });

  it('locked picks (7-10) go to teams with zero combinations in standings order', () => {
    const { drawSequence } = runDraw({ teams: TPDL_TEAMS }, Math.random);
    const locked = drawSequence.filter(e => e.kind === 'locked').sort((a, b) => a.pick - b.pick);
    expect(locked.map(e => e.teamIndex)).toEqual([6, 7, 8, 9]);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm test draw
```

Expected: FAIL.

- [ ] **Step 3: Implement runDraw**

```ts
// lib/lottery/draw.ts
import { drawOnePick } from './combinations';
import type { LotteryConfig, DrawResult, DrawEvent, RNG } from './types';

export function runDraw(config: LotteryConfig, rng: RNG): DrawResult {
  const lotteryEligible = config.teams.filter(t => t.combinations > 0);
  const locked = config.teams.filter(t => t.combinations === 0);
  const drawn = new Set<number>();
  const events: DrawEvent[] = [];

  // Picks 1-4: lottery
  for (let pick = 1; pick <= 4; pick++) {
    const teamIndex = drawOnePick(lotteryEligible, drawn, rng);
    drawn.add(teamIndex);
    events.push({ kind: 'lottery', pick: pick as 1 | 2 | 3 | 4, teamIndex });
  }

  // Picks 5-6: by reverse record (lowest originalIndex of remaining lottery-eligible teams)
  const byRecordCandidates = lotteryEligible
    .filter(t => !drawn.has(t.originalIndex))
    .sort((a, b) => a.originalIndex - b.originalIndex);
  events.push({ kind: 'byRecord', pick: 5, teamIndex: byRecordCandidates[0].originalIndex });
  events.push({ kind: 'byRecord', pick: 6, teamIndex: byRecordCandidates[1].originalIndex });

  // Picks 7-10: locked, in standings order (ascending originalIndex)
  const lockedSorted = [...locked].sort((a, b) => a.originalIndex - b.originalIndex);
  lockedSorted.forEach((t, i) => {
    events.push({ kind: 'locked', pick: (7 + i) as 7 | 8 | 9 | 10, teamIndex: t.originalIndex });
  });

  // finalOrder[pick-1] = originalIndex
  const finalOrder = new Array<number>(10);
  events.forEach(e => { finalOrder[e.pick - 1] = e.teamIndex; });

  return { finalOrder, drawSequence: events };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm test
```

Expected: all combinations + draw tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/lottery/draw.ts test/lottery/draw.test.ts
git commit -m "feat(lottery): port runDraw orchestrating lottery/by-record/locked picks"
```

---

### Task 6: Monte Carlo parity test against verified odds

The original app has a hardcoded 6×6 odds table verified by 5M-sim runs. Prove our port reproduces it within 0.1% over 100K runs.

**Files:**
- Create: `lib/lottery/odds.ts`, `test/lottery/parity.test.ts`

- [ ] **Step 1: Copy the verified odds table into odds.ts**

Values from the original `C:\Users\lucas\dev\tpdl-lottery\js\lottery.js:75-82` (`odds` constant). Original values are percentages; this module stores them as fractions for ergonomic use in code. The OddsTable component multiplies by 100 to display.

```ts
// lib/lottery/odds.ts
// TPDL hardcoded odds verified by 5M Monte Carlo simulations in the original app.
// Source: js/lottery.js:75-82 in the original tpdl-lottery repo.
// Index [originalIndex][pickPosition - 1]. originalIndex 0 = 10th seed (worst).
// Only lottery-eligible teams (originalIndex 0-5) have non-zero odds.

export const TPDL_ODDS: readonly (readonly number[])[] = [
  // pick:    1      2      3      4      5      6
  [0.224, 0.219, 0.210, 0.191, 0.157, 0.000], // 10th seed (originalIndex 0)
  [0.224, 0.218, 0.209, 0.191, 0.147, 0.009], // 9th  seed
  [0.224, 0.219, 0.209, 0.191, 0.138, 0.019], // 8th  seed
  [0.224, 0.219, 0.210, 0.191, 0.128, 0.028], // 7th  seed
  [0.060, 0.072, 0.092, 0.133, 0.430, 0.213], // 6th  seed
  [0.044, 0.054, 0.070, 0.103, 0.000, 0.730], // 5th  seed
] as const;
```

- [ ] **Step 2: Write parity test**

```ts
// test/lottery/parity.test.ts
import { describe, it, expect } from 'vitest';
import { runDraw } from '@/lib/lottery/draw';
import { TPDL_ODDS } from '@/lib/lottery/odds';
import type { TeamConfig } from '@/lib/lottery/types';

const TPDL_TEAMS: TeamConfig[] = Array.from({ length: 10 }, (_, i) => ({
  name: `Team${i}`,
  originalIndex: i,
  combinations: [224, 224, 224, 224, 60, 45, 0, 0, 0, 0][i],
}));

describe('lottery parity vs verified odds', () => {
  it('100K runs match TPDL_ODDS within 0.005 absolute', () => {
    const N = 100_000;
    const counts = Array.from({ length: 6 }, () => new Array<number>(6).fill(0));
    for (let n = 0; n < N; n++) {
      const { drawSequence } = runDraw({ teams: TPDL_TEAMS }, Math.random);
      for (const e of drawSequence) {
        if (e.pick > 6) continue;
        if (e.teamIndex < 6) counts[e.teamIndex][e.pick - 1]++;
      }
    }
    for (let team = 0; team < 6; team++) {
      for (let pick = 0; pick < 6; pick++) {
        const empirical = counts[team][pick] / N;
        const expected = TPDL_ODDS[team][pick];
        expect(Math.abs(empirical - expected)).toBeLessThan(0.005);
      }
    }
  }, 30_000);
});
```

- [ ] **Step 3: Run parity test**

```bash
pnpm test parity
```

Expected: pass within 30s. If it fails, the math port is wrong — read the original `js/lottery.js` lottery logic carefully.

- [ ] **Step 4: Commit**

```bash
git add lib/lottery/odds.ts test/lottery/parity.test.ts
git commit -m "test(lottery): Monte Carlo parity vs verified TPDL odds"
```

---

### Task 7: Port the jumps analysis

The existing app surfaces "UPSET ALERT" badges when (a) a 5th or 6th seed jumps into picks 1-4 (a **jumper**), or (b) a top-4 seed (10th-7th seed, originalIndex 0-3) falls to picks 5 or 6 (a **faller**). Port matches the original's exact contract at `C:\Users\lucas\dev\tpdl-lottery\js\lottery.js:598-621`.

**Files:**
- Create: `lib/lottery/jumps.ts`, `test/lottery/jumps.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// test/lottery/jumps.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeJumps } from '@/lib/lottery/jumps';

describe('analyzeJumps', () => {
  it('flags a 5th seed (originalIndex 4) landing in picks 1-4 as a jumper', () => {
    // finalOrder[pickIdx] = originalIndex
    const finalOrder = [4, 0, 1, 2, 3, 5, 6, 7, 8, 9];
    const analysis = analyzeJumps(finalOrder);
    expect(analysis.jumpers).toHaveLength(1);
    expect(analysis.jumpers[0]).toMatchObject({ teamIndex: 4, pick: 1, fromSeed: 5 });
    expect(analysis.hasChaos).toBe(true);
  });

  it('flags a 6th seed (originalIndex 5) landing in picks 1-4 as a jumper', () => {
    const finalOrder = [0, 1, 5, 2, 3, 4, 6, 7, 8, 9];
    const analysis = analyzeJumps(finalOrder);
    expect(analysis.jumpers.map(j => j.teamIndex)).toEqual([5]);
    expect(analysis.jumpersByPick.get(3)?.fromSeed).toBe(6);
  });

  it('flags a top-4 seed landing at pick 5 or 6 as a faller', () => {
    const finalOrder = [4, 5, 1, 2, 3, 0, 6, 7, 8, 9];
    const analysis = analyzeJumps(finalOrder);
    expect(analysis.fallers).toHaveLength(1);
    expect(analysis.fallers[0]).toMatchObject({ teamIndex: 0, pick: 6, fromSeed: 1 });
  });

  it('reports hasChaos=false when no upsets occurred', () => {
    const finalOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const analysis = analyzeJumps(finalOrder);
    expect(analysis.jumpers).toEqual([]);
    expect(analysis.fallers).toEqual([]);
    expect(analysis.hasChaos).toBe(false);
  });

  it('ignores non-lottery (locked) positions (picks 7-10)', () => {
    const finalOrder = [0, 1, 2, 3, 4, 5, 9, 8, 7, 6];
    const analysis = analyzeJumps(finalOrder);
    expect(analysis.jumpers).toEqual([]);
    expect(analysis.fallers).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm test jumps
```

Expected: FAIL.

- [ ] **Step 3: Implement analyzeJumps**

```ts
// lib/lottery/jumps.ts
// Port of analyzeLotteryJumps from the original js/lottery.js:598-621.
// originalIndex 0 = worst (10th) seed; 3 = 7th seed; 4 = 6th; 5 = 5th.

export type Jumper = { teamIndex: number; pick: number; fromSeed: number };
export type Faller = { teamIndex: number; pick: number; fromSeed: number };

export type JumpAnalysis = {
  jumpers: Jumper[];
  fallers: Faller[];
  jumpersByPick: Map<number, Jumper>;
  fallersByPick: Map<number, Faller>;
  hasChaos: boolean;
};

const TOP_FOUR_SEED_MAX = 3; // originalIndex inclusive upper bound for "top-4 lottery seeds"

export function analyzeJumps(finalOrder: number[]): JumpAnalysis {
  const jumpers: Jumper[] = [];
  const fallers: Faller[] = [];

  finalOrder.forEach((teamIndex, idx) => {
    const pick = idx + 1;
    if (idx < 4 && teamIndex > TOP_FOUR_SEED_MAX) {
      jumpers.push({ teamIndex, pick, fromSeed: teamIndex + 1 });
    }
    if ((idx === 4 || idx === 5) && teamIndex <= TOP_FOUR_SEED_MAX) {
      fallers.push({ teamIndex, pick, fromSeed: teamIndex + 1 });
    }
  });

  return {
    jumpers,
    fallers,
    jumpersByPick: new Map(jumpers.map((j) => [j.pick, j])),
    fallersByPick: new Map(fallers.map((f) => [f.pick, f])),
    hasChaos: jumpers.length > 0 || fallers.length > 0,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm test jumps
```

Expected: 5/5 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/lottery/jumps.ts test/lottery/jumps.test.ts
git commit -m "feat(lottery): port jumps analysis (jumpers/fallers/hasChaos)"
```

---

## Phase 2 — TPDL League Config

### Task 8: Hardcode TPDL constants

**Files:**
- Create: `lib/league.ts`

- [ ] **Step 1: Copy TEAM_LABELS, TEAM_NAME_OPTIONS, COMBINATIONS from existing `js/lottery.js`**

```ts
// lib/league.ts
import type { TeamConfig } from './lottery/types';

export const TEAM_LABELS: readonly string[] = [
  '10th Seed', '9th Seed', '8th Seed', '7th Seed',
  '6th Seed', '5th Seed', '4th Seed', '3rd Place',
  '2nd Place', 'Champion',
];

// Values from C:\Users\lucas\dev\tpdl-lottery\js\lottery.js:27-38.
export const TEAM_NAME_OPTIONS: readonly string[] = [
  "Bradley's Bandits",
  "Buttar's Barbarians",
  "Cyr's Beers",
  "Darcy's Demons",
  "Lu's Lazers",
  "Moe's Hoes",
  "Sith's Nips",
  "Sleepy's Steppaz",
  "Teezy's Turtles",
  "Zim's Sims",
];

export const TPDL_COMBINATIONS: readonly number[] = [224, 224, 224, 224, 60, 45, 0, 0, 0, 0];

export function buildTeams(names: readonly string[]): TeamConfig[] {
  if (names.length !== 10) throw new Error(`expected 10 team names, got ${names.length}`);
  return names.map((name, i) => ({
    name,
    originalIndex: i,
    combinations: TPDL_COMBINATIONS[i],
  }));
}
```

- [ ] **Step 2: Verify tsc clean**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/league.ts
git commit -m "feat(league): hardcode TPDL labels, name options, combinations"
```

---

## Phase 3 — KV Layer + API Routes

### Task 9: KV client wrapper

**Files:**
- Create: `lib/kv.ts`, `.env.local.example`

- [ ] **Step 1: Implement the typed wrapper**

```ts
// lib/kv.ts
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import type { LotteryResult } from './lottery/types';

const ENTRY_KEY = (id: string) => `lottery:${id}`;
const INDEX_KEY = 'lottery:index';

export async function saveLottery(
  partial: Omit<LotteryResult, 'id' | 'createdAt'>,
): Promise<LotteryResult> {
  const id = nanoid(10);
  const createdAt = Date.now();
  const full: LotteryResult = { ...partial, id, createdAt };
  await kv.set(ENTRY_KEY(id), full);
  await kv.zadd(INDEX_KEY, { score: createdAt, member: id });
  return full;
}

export async function getLottery(id: string): Promise<LotteryResult | null> {
  return (await kv.get<LotteryResult>(ENTRY_KEY(id))) ?? null;
}

export async function listLotteries(limit = 20, offset = 0): Promise<LotteryResult[]> {
  const ids = await kv.zrange<string[]>(INDEX_KEY, offset, offset + limit - 1, { rev: true });
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getLottery(id)));
  return results.filter((r): r is LotteryResult => r !== null);
}
```

- [ ] **Step 2: Add .env.local.example**

```
# Vercel KV — populated automatically when you link the project to a KV store
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
KV_URL=
```

- [ ] **Step 3: Verify tsc**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/kv.ts .env.local.example
git commit -m "feat(kv): typed wrapper for lottery save/get/list"
```

---

### Task 10: POST /api/lotteries

**Files:**
- Create: `app/api/lotteries/route.ts`

- [ ] **Step 1: Implement POST + GET**

```ts
// app/api/lotteries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { saveLottery, listLotteries } from '@/lib/kv';
import type { LotteryResult } from '@/lib/lottery/types';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<LotteryResult, 'id' | 'createdAt'>;
  if (!body?.teams || !body?.drawSequence || !body?.finalOrder) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const saved = await saveLottery(body);
  return NextResponse.json(saved, { status: 201 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? 20);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const items = await listLotteries(limit, offset);
  return NextResponse.json({ items });
}
```

- [ ] **Step 2: Verify tsc**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/lotteries/route.ts
git commit -m "feat(api): POST + GET /api/lotteries"
```

---

### Task 11: GET /api/lotteries/[id]

**Files:**
- Create: `app/api/lotteries/[id]/route.ts`

- [ ] **Step 1: Implement**

```ts
// app/api/lotteries/[id]/route.ts
import { NextResponse } from 'next/server';
import { getLottery } from '@/lib/kv';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = await getLottery(id);
  if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(item);
}
```

- [ ] **Step 2: Verify tsc**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/lotteries/\[id\]/route.ts
git commit -m "feat(api): GET /api/lotteries/[id]"
```

---

## Phase 4 — App Shell + Setup UI

### Task 12: Layout, nav, theme tokens

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Create: `components/shared/Nav.tsx`

- [ ] **Step 1: Edit layout.tsx — set metadata, fonts, dark theme**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Nav from '@/components/shared/Nav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TPDL Draft Lottery',
  description: 'The People\'s Dynasty League Draft Lottery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create Nav.tsx**

```tsx
// components/shared/Nav.tsx
import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="border-b border-neutral-800 px-6 py-4 flex gap-6">
      <Link href="/" className="font-bold">TPDL Lottery</Link>
      <Link href="/history">History</Link>
      <Link href="/admin">Admin</Link>
    </nav>
  );
}
```

- [ ] **Step 3: Verify dev server renders**

```bash
pnpm dev
```

Visit http://localhost:3000 — should show the nav above the default starter page.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/shared/Nav.tsx
git commit -m "feat: app shell with nav and dark theme"
```

---

### Task 13: TeamSetup component

**Files:**
- Create: `components/lottery/TeamSetup.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/lottery/TeamSetup.tsx
'use client';

import { TEAM_LABELS, TEAM_NAME_OPTIONS } from '@/lib/league';

type Props = {
  names: string[];
  onChange: (names: string[]) => void;
  locked: boolean;
  onLockToggle: () => void;
};

export default function TeamSetup({ names, onChange, locked, onLockToggle }: Props) {
  return (
    <section className="p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Teams</h2>
        <button onClick={onLockToggle} className="text-sm">{locked ? 'Unlock' : 'Lock'}</button>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEAM_LABELS.map((label, i) => (
          <label key={i} className="flex flex-col gap-1">
            <span className="text-xs text-neutral-400">{label}</span>
            <select
              disabled={locked}
              value={names[i] ?? ''}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
            >
              <option value="">—</option>
              {TEAM_NAME_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify tsc**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/lottery/TeamSetup.tsx
git commit -m "feat(ui): TeamSetup component"
```

---

### Task 14: PickOwnershipEditor component

**Files:**
- Create: `components/lottery/PickOwnershipEditor.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/lottery/PickOwnershipEditor.tsx
'use client';

import { TEAM_LABELS } from '@/lib/league';

type Props = {
  ownership: string[][]; // [round][teamIndex] = ownerName
  teamNames: string[];
  onChange: (ownership: string[][]) => void;
  locked: boolean;
  onLockToggle: () => void;
};

export default function PickOwnershipEditor({ ownership, teamNames, onChange, locked, onLockToggle }: Props) {
  const setCell = (round: number, team: number, value: string) => {
    const next = ownership.map((row) => [...row]);
    next[round][team] = value;
    onChange(next);
  };

  return (
    <section className="p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Pick Ownership</h2>
        <button onClick={onLockToggle} className="text-sm">{locked ? 'Unlock' : 'Lock'}</button>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Round</th>
            {TEAM_LABELS.map((label) => <th key={label}>{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2].map((round) => (
            <tr key={round}>
              <td>Round {round + 1}</td>
              {ownership[round].map((owner, team) => (
                <td key={team}>
                  <select
                    disabled={locked}
                    value={owner}
                    onChange={(e) => setCell(round, team, e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded px-1"
                  >
                    {teamNames.filter(Boolean).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 2: Verify tsc**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/lottery/PickOwnershipEditor.tsx
git commit -m "feat(ui): PickOwnershipEditor component"
```

---

### Task 15: OddsTable component

**Files:**
- Create: `components/lottery/OddsTable.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/lottery/OddsTable.tsx
import { TPDL_ODDS } from '@/lib/lottery/odds';
import { TEAM_LABELS } from '@/lib/league';

export default function OddsTable() {
  return (
    <section className="p-6">
      <h2 className="text-xl font-semibold mb-3">Odds</h2>
      <table className="text-sm">
        <thead>
          <tr>
            <th></th>
            {Array.from({ length: 6 }, (_, i) => <th key={i}>Pick {i + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {TPDL_ODDS.map((row, i) => (
            <tr key={i}>
              <td className="pr-3 text-neutral-400">{TEAM_LABELS[i]}</td>
              {row.map((p, j) => <td key={j} className="px-2">{(p * 100).toFixed(1)}%</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/lottery/OddsTable.tsx
git commit -m "feat(ui): OddsTable component"
```

---

### Task 16: /admin page

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Implement, using localStorage for team names + ownership**

```tsx
// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import TeamSetup from '@/components/lottery/TeamSetup';
import PickOwnershipEditor from '@/components/lottery/PickOwnershipEditor';
import { TEAM_LABELS } from '@/lib/league';

const LS_NAMES = 'tpdl.teamNames';
const LS_OWNERSHIP = 'tpdl.pickOwnership';

const blankOwnership = (names: string[]): string[][] =>
  [0, 1, 2].map(() => names.map((n) => n || ''));

export default function AdminPage() {
  const [names, setNames] = useState<string[]>(Array(10).fill(''));
  const [ownership, setOwnership] = useState<string[][]>(() => blankOwnership(Array(10).fill('')));
  const [teamsLocked, setTeamsLocked] = useState(false);
  const [ownLocked, setOwnLocked] = useState(false);

  useEffect(() => {
    const n = localStorage.getItem(LS_NAMES);
    const o = localStorage.getItem(LS_OWNERSHIP);
    if (n) setNames(JSON.parse(n));
    if (o) setOwnership(JSON.parse(o));
  }, []);

  useEffect(() => { localStorage.setItem(LS_NAMES, JSON.stringify(names)); }, [names]);
  useEffect(() => { localStorage.setItem(LS_OWNERSHIP, JSON.stringify(ownership)); }, [ownership]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold p-6">Admin</h1>
      <TeamSetup names={names} onChange={setNames} locked={teamsLocked} onLockToggle={() => setTeamsLocked(v => !v)} />
      <PickOwnershipEditor
        ownership={ownership}
        teamNames={names}
        onChange={setOwnership}
        locked={ownLocked}
        onLockToggle={() => setOwnLocked(v => !v)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Manually verify in the browser**

```bash
pnpm dev
```

Visit http://localhost:3000/admin — should show team setup + ownership editor, both persisting to localStorage across refreshes.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): /admin page with TeamSetup and PickOwnershipEditor"
```

---

## Phase 5 — Lottery Runner + Basic Reveal (No Animations Yet)

This phase gets the end-to-end flow working with a placeholder reveal — instant transitions, no Motion. Animations come in Phase 6.

### Task 17: LotteryRunner orchestrator + basic reveal

**Files:**
- Create: `components/reveal/RevealPlayer.tsx` (basic version), `components/lottery/LotteryRunner.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement basic RevealPlayer (no animations)**

The prop shape here matches what the Phase 6 Motion-driven RevealPlayer will require, so the call site in `LotteryRunner` won't need to change later. `pickOwnership` is unused in the placeholder.

```tsx
// components/reveal/RevealPlayer.tsx
'use client';

import type { DrawEvent } from '@/lib/lottery/types';

type Props = {
  drawSequence: DrawEvent[];
  teamNames: string[];
  pickOwnership: string[][];
  onComplete: () => void;
};

export default function RevealPlayer({ drawSequence, teamNames, onComplete }: Props) {
  const sorted = [...drawSequence].sort((a, b) => a.pick - b.pick);
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 overflow-auto">
      <h2 className="text-3xl font-bold mb-6">Draft Order</h2>
      <ol className="space-y-2">
        {sorted.map((e) => (
          <li key={e.pick} className="text-xl">
            <strong>Pick {e.pick}:</strong> {teamNames[e.teamIndex]}
          </li>
        ))}
      </ol>
      <button onClick={onComplete} className="mt-8 px-4 py-2 bg-neutral-800 rounded">Done</button>
    </div>
  );
}
```

- [ ] **Step 2: Implement LotteryRunner**

```tsx
// components/lottery/LotteryRunner.tsx
'use client';

import { useEffect, useState } from 'react';
import { runDraw } from '@/lib/lottery/draw';
import { buildTeams } from '@/lib/league';
import type { LotteryResult, DrawResult } from '@/lib/lottery/types';
import OddsTable from './OddsTable';
import RevealPlayer from '@/components/reveal/RevealPlayer';

const LS_NAMES = 'tpdl.teamNames';
const LS_OWNERSHIP = 'tpdl.pickOwnership';

export default function LotteryRunner() {
  const [names, setNames] = useState<string[]>(Array(10).fill(''));
  const [ownership, setOwnership] = useState<string[][]>([[], [], []]);
  const [draw, setDraw] = useState<DrawResult | null>(null);
  const [saved, setSaved] = useState<LotteryResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const n = localStorage.getItem(LS_NAMES);
    const o = localStorage.getItem(LS_OWNERSHIP);
    if (n) setNames(JSON.parse(n));
    if (o) setOwnership(JSON.parse(o));
  }, []);

  const ready = names.every(Boolean) && new Set(names).size === 10;

  const run = () => {
    const teams = buildTeams(names);
    setDraw(runDraw({ teams }, Math.random));
  };

  const handleComplete = async () => {
    if (!draw) return;
    setSaving(true);
    const teams = buildTeams(names);
    const label = new Date().getFullYear() + ' Season';
    const res = await fetch('/api/lotteries', {
      method: 'POST',
      body: JSON.stringify({ ...draw, teams, pickOwnership: ownership, label }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json: LotteryResult = await res.json();
    setSaved(json);
    setSaving(false);
  };

  if (saved) {
    const url = `/results/${saved.id}`;
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Saved!</h1>
        <a href={url} className="underline">{url}</a>
        <button
          className="ml-4 px-3 py-1 bg-neutral-800 rounded"
          onClick={() => navigator.clipboard.writeText(window.location.origin + url)}
        >
          Copy link
        </button>
      </div>
    );
  }

  if (draw) {
    return <RevealPlayer drawSequence={draw.drawSequence} teamNames={names} pickOwnership={ownership} onComplete={handleComplete} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Run Lottery</h1>
      {!ready && (
        <p className="text-amber-400 mb-4">
          Set 10 unique team names on the <a href="/admin" className="underline">Admin page</a> first.
        </p>
      )}
      <button
        disabled={!ready || saving}
        onClick={run}
        className="px-6 py-3 bg-blue-600 disabled:bg-neutral-800 rounded text-lg font-bold"
      >
        Run Lottery
      </button>
      <OddsTable />
    </div>
  );
}
```

- [ ] **Step 3: Update `app/page.tsx`**

```tsx
// app/page.tsx
import LotteryRunner from '@/components/lottery/LotteryRunner';
export default function Home() { return <LotteryRunner />; }
```

- [ ] **Step 4: Manual end-to-end test**

Run `pnpm dev`. Configure 10 teams on `/admin`. Return to `/`. Click Run Lottery → reveal renders → Done → Save fails because KV is not provisioned locally. **This is expected at this stage.** Note: we'll provision KV before Phase 10.

- [ ] **Step 5: Commit**

```bash
git add components/reveal/RevealPlayer.tsx components/lottery/LotteryRunner.tsx app/page.tsx
git commit -m "feat: LotteryRunner + basic RevealPlayer end-to-end"
```

---

## Phase 6 — Motion-Driven Reveal

Replace the placeholder RevealPlayer with the cinematic three-phase reveal.

### Task 18: Reveal timing + structure scaffolding

**Files:**
- Create: `components/reveal/timing.ts`, `components/reveal/types.ts`
- Modify: `components/reveal/RevealPlayer.tsx`

- [ ] **Step 1: Create timing.ts**

```ts
// components/reveal/timing.ts
export const TIMINGS = {
  quickIterationsCount: 8,
  quickIterationDurationMs: 250,
  automaticPickDelayMs: 900,
  topPodiumPickDelayMs: 1800,
  phaseTransitionMs: 500,
};
```

- [ ] **Step 2: Create types.ts**

```ts
// components/reveal/types.ts
export type RevealPhase = 'quickIterations' | 'automaticPicks' | 'topPodium' | 'complete';
```

- [ ] **Step 3: Rewrite RevealPlayer as a state machine driving sub-components**

```tsx
// components/reveal/RevealPlayer.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TIMINGS } from './timing';
import type { RevealPhase } from './types';
import type { DrawEvent } from '@/lib/lottery/types';
import QuickIterationsPodium from './QuickIterationsPodium';
import AutomaticPicksLane from './AutomaticPicksLane';
import TopPicksPodium from './TopPicksPodium';

type Props = {
  drawSequence: DrawEvent[];
  teamNames: string[];
  pickOwnership: string[][];
  onComplete: () => void;
};

export default function RevealPlayer({ drawSequence, teamNames, pickOwnership, onComplete }: Props) {
  const [phase, setPhase] = useState<RevealPhase>('quickIterations');

  useEffect(() => {
    if (phase === 'complete') return;
    const next: Record<RevealPhase, RevealPhase> = {
      quickIterations: 'automaticPicks',
      automaticPicks: 'topPodium',
      topPodium: 'complete',
      complete: 'complete',
    };
    // Sub-components call back when finished; for the placeholder we'd auto-advance, but here we wait.
  }, [phase]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-auto">
      <AnimatePresence mode="wait">
        {phase === 'quickIterations' && (
          <motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuickIterationsPodium teamNames={teamNames} onDone={() => setPhase('automaticPicks')} />
          </motion.div>
        )}
        {phase === 'automaticPicks' && (
          <motion.div key="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AutomaticPicksLane
              events={drawSequence.filter((e) => e.kind !== 'lottery')}
              teamNames={teamNames}
              pickOwnership={pickOwnership}
              onDone={() => setPhase('topPodium')}
            />
          </motion.div>
        )}
        {phase === 'topPodium' && (
          <motion.div key="top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TopPicksPodium
              events={drawSequence.filter((e) => e.kind === 'lottery')}
              teamNames={teamNames}
              pickOwnership={pickOwnership}
              onDone={() => setPhase('complete')}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {phase === 'complete' && (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-3xl font-bold mb-4">Lottery Complete</h2>
          <button onClick={onComplete} className="px-6 py-2 bg-blue-600 rounded">Save & Share</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify tsc compiles (sub-components don't exist yet — will fail)**

This will fail tsc; that's fine. Tasks 19-21 add the sub-components.

- [ ] **Step 5: Commit (with `--no-verify` if your hooks block on tsc — adjust per repo norms)**

```bash
git add components/reveal/
git commit -m "feat(reveal): RevealPlayer state machine skeleton"
```

---

### Task 19: QuickIterationsPodium

**Files:**
- Create: `components/reveal/QuickIterationsPodium.tsx`

- [ ] **Step 1: Implement using Motion LayoutGroup for swap animations**

```tsx
// components/reveal/QuickIterationsPodium.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { TIMINGS } from './timing';

const shuffle = <T,>(arr: T[]): T[] => arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

export default function QuickIterationsPodium({ teamNames, onDone }: { teamNames: string[]; onDone: () => void }) {
  const [order, setOrder] = useState<string[]>(() => teamNames.slice(0, 3));
  const [iter, setIter] = useState(0);

  useEffect(() => {
    if (iter >= TIMINGS.quickIterationsCount) { onDone(); return; }
    const t = setTimeout(() => {
      setOrder(shuffle(teamNames.slice(0, 3)));
      setIter((n) => n + 1);
    }, TIMINGS.quickIterationDurationMs);
    return () => clearTimeout(t);
  }, [iter, teamNames, onDone]);

  return (
    <div className="flex items-end justify-center gap-6 min-h-screen pb-32">
      <LayoutGroup>
        {order.map((name, i) => (
          <motion.div
            key={name}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`bg-neutral-800 rounded-t-lg flex items-end justify-center text-center text-white font-bold w-32 ${
              i === 0 ? 'h-64' : i === 1 ? 'h-80' : 'h-48'
            }`}
          >
            <span className="pb-4">{name}</span>
          </motion.div>
        ))}
      </LayoutGroup>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reveal/QuickIterationsPodium.tsx
git commit -m "feat(reveal): QuickIterationsPodium"
```

---

### Task 20: AutomaticPicksLane

**Files:**
- Create: `components/reveal/AutomaticPicksLane.tsx`

- [ ] **Step 1: Implement bottom-up timed reveal of picks 10 → 5**

```tsx
// components/reveal/AutomaticPicksLane.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TIMINGS } from './timing';
import type { DrawEvent } from '@/lib/lottery/types';

type Props = {
  events: DrawEvent[];
  teamNames: string[];
  pickOwnership: string[][];
  onDone: () => void;
};

export default function AutomaticPicksLane({ events, teamNames, pickOwnership, onDone }: Props) {
  const sorted = [...events].sort((a, b) => b.pick - a.pick); // 10 → 5
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= sorted.length) { const t = setTimeout(onDone, TIMINGS.phaseTransitionMs); return () => clearTimeout(t); }
    const t = setTimeout(() => setRevealed((n) => n + 1), TIMINGS.automaticPickDelayMs);
    return () => clearTimeout(t);
  }, [revealed, sorted.length, onDone]);

  return (
    <div className="flex flex-col items-center justify-end min-h-screen p-8 gap-3">
      {sorted.slice(0, revealed).map((e) => {
        const owner = pickOwnership[0]?.[e.teamIndex];
        const winner = teamNames[e.teamIndex];
        const traded = owner && owner !== winner;
        return (
          <motion.div
            key={e.pick}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-neutral-800 rounded-lg px-6 py-3 text-xl flex items-center gap-3"
          >
            <span className="text-neutral-500">Pick {e.pick}</span>
            <span className="font-bold">{winner}</span>
            {traded && <span className="text-xs bg-amber-700 rounded px-2 py-0.5">→ {owner}</span>}
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reveal/AutomaticPicksLane.tsx
git commit -m "feat(reveal): AutomaticPicksLane with trade badges"
```

---

### Task 21: TopPicksPodium

**Files:**
- Create: `components/reveal/TopPicksPodium.tsx`

- [ ] **Step 1: Implement dramatic reveal of picks 4 → 1**

```tsx
// components/reveal/TopPicksPodium.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TIMINGS } from './timing';
import type { DrawEvent } from '@/lib/lottery/types';

type Props = {
  events: DrawEvent[];
  teamNames: string[];
  pickOwnership: string[][];
  onDone: () => void;
};

export default function TopPicksPodium({ events, teamNames, pickOwnership, onDone }: Props) {
  const sorted = [...events].sort((a, b) => b.pick - a.pick); // 4 → 1
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= sorted.length) { const t = setTimeout(onDone, TIMINGS.phaseTransitionMs); return () => clearTimeout(t); }
    const t = setTimeout(() => setRevealed((n) => n + 1), TIMINGS.topPodiumPickDelayMs);
    return () => clearTimeout(t);
  }, [revealed, sorted.length, onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <AnimatePresence>
        {sorted.slice(0, revealed).map((e) => {
          const owner = pickOwnership[0]?.[e.teamIndex];
          const winner = teamNames[e.teamIndex];
          const traded = owner && owner !== winner;
          return (
            <motion.div
              key={e.pick}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="my-3 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl px-10 py-6 text-3xl font-bold text-center"
            >
              <div className="text-sm text-yellow-200 mb-1">Pick {e.pick}</div>
              <div>{winner}</div>
              {traded && <div className="text-base text-yellow-100 mt-1">→ {owner}</div>}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Manual run-through**

```bash
pnpm dev
```

Visit `/`, run a lottery, watch the full reveal animation. Tune timings in `timing.ts` if it feels off.

- [ ] **Step 3: Commit**

```bash
git add components/reveal/TopPicksPodium.tsx
git commit -m "feat(reveal): TopPicksPodium dramatic reveal"
```

---

## Phase 7 — History Page

### Task 22: /history server component

**Files:**
- Create: `app/history/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/history/page.tsx
import Link from 'next/link';
import { listLotteries } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const items = await listLotteries(50, 0);
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">History</h1>
      {items.length === 0 ? (
        <p className="text-neutral-400">No lotteries yet. Run one on the home page.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const topPickTeam = it.teams[it.finalOrder[0]]?.name ?? '—';
            return (
              <li key={it.id} className="border border-neutral-800 rounded-lg p-4">
                <Link href={`/results/${it.id}`} className="font-bold underline">
                  {it.label}
                </Link>
                <div className="text-sm text-neutral-400">
                  Top pick: {topPickTeam} · {new Date(it.createdAt).toLocaleDateString()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/history/page.tsx
git commit -m "feat(history): /history server component"
```

---

## Phase 8 — Results Page + Replay

### Task 23: /results/[id] page with teaser

**Files:**
- Create: `app/results/[id]/page.tsx`, `components/history/ReplayLauncher.tsx`

- [ ] **Step 1: Implement the result page**

```tsx
// app/results/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLottery } from '@/lib/kv';
import ReplayLauncher from '@/components/history/ReplayLauncher';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lot = await getLottery(id);
  if (!lot) return { title: 'Not found' };
  const top = lot.teams[lot.finalOrder[0]]?.name ?? '—';
  return {
    title: `${lot.label} — TPDL Lottery`,
    description: `Top pick: ${top}`,
    openGraph: {
      title: `${lot.label} — TPDL Lottery`,
      description: `Top pick: ${top}. Watch the full reveal.`,
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const lot = await getLottery(id);
  if (!lot) notFound();
  const lockedEvents = lot.drawSequence.filter((e) => e.kind === 'locked').sort((a, b) => b.pick - a.pick);
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{lot.label}</h1>
      <p className="text-sm text-neutral-400 mb-6">{new Date(lot.createdAt).toLocaleDateString()}</p>
      <h2 className="text-lg font-semibold mb-3">Locked picks</h2>
      <ul className="space-y-1 mb-8">
        {lockedEvents.map((e) => (
          <li key={e.pick}>
            <strong>Pick {e.pick}:</strong> {lot.teams[e.teamIndex].name}
          </li>
        ))}
      </ul>
      <ReplayLauncher lottery={lot} />
    </div>
  );
}
```

- [ ] **Step 2: Implement ReplayLauncher**

```tsx
// components/history/ReplayLauncher.tsx
'use client';

import { useState } from 'react';
import RevealPlayer from '@/components/reveal/RevealPlayer';
import type { LotteryResult } from '@/lib/lottery/types';

export default function ReplayLauncher({ lottery }: { lottery: LotteryResult }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <RevealPlayer
        drawSequence={lottery.drawSequence}
        teamNames={lottery.teams.map((t) => t.name)}
        pickOwnership={lottery.pickOwnership}
        onComplete={() => setPlaying(false)}
      />
    );
  }
  return (
    <button
      onClick={() => setPlaying(true)}
      className="px-6 py-3 bg-blue-600 rounded text-lg font-bold"
    >
      Watch the reveal
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/results/\[id\]/page.tsx components/history/ReplayLauncher.tsx
git commit -m "feat(results): /results/[id] teaser + replay launcher"
```

---

## Phase 9 — Polish

### Task 24: ShareButton + post-save flow polish

**Files:**
- Create: `components/shared/ShareButton.tsx`
- Modify: `components/lottery/LotteryRunner.tsx`

- [ ] **Step 1: Implement ShareButton**

```tsx
// components/shared/ShareButton.tsx
'use client';

import { useState } from 'react';

export default function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="px-4 py-2 bg-neutral-800 rounded"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
}
```

- [ ] **Step 2: Wire ShareButton into LotteryRunner's "saved" view**

Replace the inline copy button with `<ShareButton url={absoluteUrl} />`.

- [ ] **Step 3: Commit**

```bash
git add components/shared/ShareButton.tsx components/lottery/LotteryRunner.tsx
git commit -m "feat(share): ShareButton with copy feedback"
```

---

### Task 25: Loading + 404 states

**Files:**
- Create: `app/loading.tsx`, `app/not-found.tsx`, `app/results/[id]/loading.tsx`

- [ ] **Step 1: Implement minimal loading + not-found**

```tsx
// app/loading.tsx
export default function Loading() { return <div className="p-6 text-neutral-500">Loading…</div>; }
```

```tsx
// app/not-found.tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Not found</h1>
      <Link href="/" className="underline">Back to home</Link>
    </div>
  );
}
```

```tsx
// app/results/[id]/loading.tsx
export default function Loading() { return <div className="p-6 text-neutral-500">Loading result…</div>; }
```

- [ ] **Step 2: Commit**

```bash
git add app/loading.tsx app/not-found.tsx app/results/\[id\]/loading.tsx
git commit -m "feat: loading and 404 states"
```

---

### Task 26: Accessibility — focus trap on reveal, ARIA labels

**Files:**
- Modify: `components/reveal/RevealPlayer.tsx`

- [ ] **Step 1: Wrap reveal in a focus-trapped container with proper ARIA**

Either:
- **Option A (recommended):** `pnpm add focus-trap-react` and wrap the reveal root with `<FocusTrap>`.
- **Option B:** port the existing app's `trapFocus()` utility from `C:\Users\lucas\dev\tpdl-lottery\js\lottery.js` (Tab/Shift+Tab cycling within a container) into a `useFocusTrap` hook.

Add `role="dialog"`, `aria-modal="true"`, `aria-label="Draft lottery reveal"` to the outer container. Set `inert` on `document.body > *:not(reveal)` siblings while the reveal is mounted to prevent assistive tech from reaching content behind it.

- [ ] **Step 2: Manual keyboard test**

Tab into the reveal — focus should not escape. Esc should not close mid-reveal (matches original).

- [ ] **Step 3: Commit**

```bash
git add components/reveal/RevealPlayer.tsx
git commit -m "a11y(reveal): focus trap + ARIA label"
```

---

## Phase 10 — Deployment

### Task 27: Provision Vercel KV and link project

- [ ] **Step 1: Push code to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Connect to Vercel (manual, in browser)**

In Vercel dashboard: New Project → import `lucasreydman/tpdl-draft-lottery` → accept defaults.

- [ ] **Step 3: Provision KV (manual)**

In project Storage tab: Add KV (or Upstash Redis via Marketplace if KV is no longer offered standalone). Link to the project. Confirm `KV_*` env vars appear in Settings → Environment Variables.

- [ ] **Step 4: Pull env vars locally**

```bash
pnpm dlx vercel link
pnpm dlx vercel env pull .env.local
```

- [ ] **Step 5: End-to-end test against real KV**

```bash
pnpm dev
```

Run a lottery → save → verify it lands. Visit `/history` → it appears. Visit `/results/[id]` directly → loads.

- [ ] **Step 6: Trigger Vercel production deploy**

```bash
git commit --allow-empty -m "chore: trigger deploy"
git push
```

Visit the deployed URL, run an end-to-end test in production.

---

### Task 28: Link preview verification + cutover

- [ ] **Step 1: Post a `/results/[id]` URL into Slack or iMessage**

Verify the rich preview shows the season label and top pick.

- [ ] **Step 2: Archive old repo**

In the existing `tpdl-lottery` repo's README, add a banner: "This repo is archived. New version: <new URL>." Disable the GitHub Pages deploy workflow (rename `static.yml` to `static.yml.disabled` or delete the workflow file).

- [ ] **Step 3: Share the new URL with the league**

(Manual.)

---

## Verification Checklist (final)

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm test` — all lottery math tests pass, parity test within tolerance
- [ ] Run a lottery on `/`, save, visit `/results/[id]` → replay plays correctly
- [ ] `/history` shows saved lotteries in reverse-chronological order
- [ ] Link preview unfurls in Slack/iMessage with label + top pick
- [ ] Tab navigation works in reveal; focus trapped while modal is open
- [ ] Production deploy resolves and KV-backed save persists across browser sessions

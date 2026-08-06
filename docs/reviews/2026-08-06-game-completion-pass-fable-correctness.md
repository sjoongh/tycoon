# Claude review packet — correctness and state safety

## Objective
Review the uncommitted game-completion pass against `origin/main` as an independent, read-only critic. Find only actionable regressions or release blockers. Inspect the workspace diff and cited files directly.

## Approved constraints
- Preserve every existing staff base effect; add exactly three strategic deployed slots.
- Staff ranks and field appearance change at levels 5, 10, 15, and 20.
- PWA update must save first, then offer `지금 갱신 / 나중에`; never force a live session reload.
- First prestige target is 8–12 minutes; later runs are 5–8 minutes.
- Validate Firebase preview before production.
- Preserve old saves and durable collection progress.

## Primary review dimensions
1. Save v9 migration, stage progress-ratio preservation, staff-slot normalization, reset boundaries.
2. Staff effect math and accidental stacking/regression of existing effects.
3. First/repeat pacing source-of-truth and simulator fidelity.
4. Offline carry, checkpoint boss, operation, event-chain, and prestige interactions.
5. Dependency/custom Phaser compatibility and code-level correctness.

## Source coordinates
- `src/state/GameState.js`
- `src/data/staffDeployment.js`
- `src/ui/DOMBottomPanel.js`
- `src/world/WorldView.js`
- `src/world/dotChar.js`
- `scripts/_balancesim.mjs`
- `scripts/_offlinecarrytest.mjs`
- associated new/changed tests

## Evidence already obtained
- Unit: 19 files, 106/106 pass.
- Deterministic pacing: first 687s, repeat 405s and 426s.
- Clean 600s, 330ms/tap play: area 4 at 480s; 1,725 taps, 51 upgrades, 13 events, 3 chain endings, 3 fever cycles, one boss success, zero errors.
- Staff E2E: auto-deploy, Lv5 visual, swap, save/reload, compact layout pass.
- Offline carry, boss, operation/fever, UI readability, mobile runtime, startup fonts, Phaser custom/stock, event chains all pass after isolated reruns.
- Custom Phaser: deterministic raw 662,199 B, gzip 184,363 B, unsupported factories 0.
- Production dependency audit: 0 vulnerabilities. Full audit: three moderate dev-only findings through Capacitor CLI → xcode → uuid; forced downgrade not applied. Android sync and doctor pass.

## Known implementation deviations
- Unsupported Phaser Container was replaced with synchronized supported Image/Rectangle objects.
- esbuild 0.27.7 security update to 0.28.1 required updating the exact custom-core version guard and rerunning the compatibility matrix.

## Response format
Start with `VERDICT: PASS` or `VERDICT: FAIL`. Then list findings by severity (P0–P3) with file/line evidence, impact, and smallest safe fix. Do not suggest unrelated features or style-only rewrites. Explicitly say when no blocking finding exists.

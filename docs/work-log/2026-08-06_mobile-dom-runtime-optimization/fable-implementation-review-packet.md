# Claude implementation review packet — mobile DOM/runtime optimization

## Role

Act as an independent, read-only implementation reviewer. Prioritize correctness and user-visible regressions over style. Do not assume a finding is valid without tying it to the evidence below.

## Approved behavior

- The first UI state change after an idle period must render immediately.
- Further continuous changes may be coalesced, with a maximum 100 ms UI budget.
- Firebase may start on the first pointer/keyboard intent or after 5 seconds, whichever comes first.
- Game economy, fever, operations, bosses, offline progress, save semantics, accessibility, and the current pixel-font identity must remain intact.
- Font files were deliberately not changed because family sizes are tuned to their pixel grids.

## Implementation summary

### `src/ui/DOMBottomPanel.js`

- The `changed` consumer now uses leading-immediate, trailing-coalesced rendering.
- A forced `refresh()` cancels pending timer/rAF work; destroy also cancels it.
- A pending render that expires in the background is flushed on visibility restore.
- The goals tab computes a structural signature. If claimability/completion/active-definition structure is unchanged, only progress bars, counts, and achievement percentages are patched. Structural changes rebuild the tab.
- Existing list scroll is restored after rebuilds.

### `src/ui/DOMHud.js`

- Frequently queried nodes are cached.
- Text, inline style, stage markup, fever labels/ARIA, and floating-button markup are written only when changed.

### `src/main.js` and `src/cloud.js`

- Cloud initialization is idempotent and starts at first pointer/keydown or a 5-second fallback.
- Opening the leaderboard forces/awaits cloud initialization and shows a loading/error state.
- Firestore changed from the full browser bundle to `firebase/firestore/lite`; this project only uses one-shot reads/writes and queries.
- Analytics loads only on the first analytics event.
- Firestore's internal logging is set to silent because optional cloud calls catch failures and browser teardown otherwise prints an RPC error as a game console failure.

## Important scheduler pseudocode

```js
_scheduleRefresh() {
  const now = nowMs();
  const idle = now - this._lastChangedAt >= 100;
  this._lastChangedAt = now;
  if (idle) {
    this._cancelScheduledRefresh();
    this._renderNow();
    return;
  }
  if (this._refreshPending) return;
  const remaining = Math.max(0, 100 - (now - this._lastRenderAt));
  this._refreshPending = true;
  this._refreshTimer = setTimeout(() => {
    this._refreshTimer = null;
    if (document.visibilityState !== "visible") return;
    this._refreshFrame = requestAnimationFrame(() => {
      this._refreshFrame = null;
      this._refreshPending = false;
      this._renderNow();
    });
  }, remaining);
}

refresh() {
  this._cancelScheduledRefresh();
  this._lastChangedAt = -Infinity;
  this._renderNow();
}
```

## Baseline → final evidence

- 60 continuous `changed` events, full panel replacements:
  - facilities 60 → 11
  - crew 60 → 11
  - goals 60 → 0 (value-only partial patch)
  - prestige 60 → 11
- Worst frame:
  - facilities 50.0 → 25.3 ms
  - crew 25.8 → 17.0 ms
  - goals initial stress 41.6 → 16.8 ms after partial patch
  - prestige 17.4 → 17.6 ms
- Emit p95: baseline 0.7–1.3 ms → final 0.4–0.5 ms.
- Leading change is observed immediately.
- Crew and goal scroll positions are preserved; a structural goal threshold change causes exactly one full rebuild and preserves scroll.
- First 700 ms loads no Firebase SDK; only the 8,254-byte local config module is requested.
- Firebase development transfer: 1,468,659 → 475,149 bytes (-67.6%).
- Production Firestore chunk: 573.29 kB / gzip 169.27 → Lite 106.61 kB / gzip 32.16 kB.
- Fonts remain unchanged at 1,506,654 transferred bytes.

## Verification already passing

- Unit suite: 13 files, 68/68 tests.
- Production build.
- Performance E2E with external hosts blocked (no Firebase mutation).
- Existing offline carry, UI readability, boss, and operation E2E flows.
- 70-second no-state-injection adaptive play: 258 taps, area 7, 34 upgrades, two events, two operation choices, one complete fever/finisher/recovery cycle, two successful bosses, no console/page errors.

## Review questions

1. Does the leading/trailing scheduler have a correctness hole at idle, forced refresh, visibility, or destroy boundaries?
2. Is the goal structural signature sufficient to decide when a partial value patch is safe? Identify any concrete missing state.
3. Does Firestore Lite preserve the APIs and semantics described here? Is silent internal logging likely to hide a failure that the game does not otherwise catch?
4. Could cached HUD markup or ARIA updates become stale in a user-visible way?
5. Are the performance thresholds and regression evidence sufficient for this scope?

Return `APPROVE`, `ADVICE`, or `REQUEST_CHANGES`. For every finding, give severity, a concrete failure sequence, and the smallest safe correction. Separate blocking findings from optional follow-ups.

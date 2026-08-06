# Claude verification packet — closure of game completion review

## Objective
Verify whether the two prior CHANGES_REQUESTED reviews are now closed. This is an evidence-focused, read-only release gate. Return PASS only if no approved constraint remains unverified.

## Review provenance
- Correctness review: Claude Fable 5, xhigh, cost USD 0.687345, duration 128311 ms.
- Release review: Claude Fable 5, xhigh, cost USD 0.700863, duration 154267 ms.
- Both runs resolved `claude-fable-5` with `claude-haiku-4-5-20251001` support.

## Closure evidence

### Firebase preview before production
- Preview channel deployed successfully; production has not been deployed.
- URL: `https://gaepyo-tycoon--game-completion-pass-44eivfl3.web.app`
- Expiry: 2026-08-07 22:48:14 KST.
- Remote smoke results: `/`, `/privacy.html`, `/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png`, `/screenshots/game-mobile.png`, and an unknown SPA route all returned 200.
- Remote `/sw.js`: `content-type: text/javascript; charset=utf-8`; `cache-control: no-cache, no-store, must-revalidate`.
- Unknown route returned the same index ETag and content length as `/`, proving the SPA rewrite.

### PWA explicit-choice lifecycle
- `scripts/_pwaupdatetest.mjs` reran after the final source/build and passed: exact five install-asset dimensions, privacy 200, real worker byte change, prompt copy, strictly increased save timestamp, waiting worker activation, new cache, and offline reload.
- Unit test now proves a `controllerchange` caused by another tab does not save or reload this tab before user choice.
- Unit test proves a second rapid `apply()` returns false while the first is pending.
- Existing unit test proves `나중에` dismisses the prompt without `SKIP_WAITING`.
- Existing unit test proves accepted update saves first, then posts `SKIP_WAITING`, and reloads exactly once despite repeated controllerchange events.
- Prompt now has `aria-label="새 공문 업데이트"`; native buttons retain keyboard behavior. Existing global `prefers-reduced-motion: reduce` rules disable nonessential gameplay/UI animation.

### Save v9 and durable progress
- The v8→v9 test loads a 37.5%-complete stage and asserts the exact ratio after target migration.
- The same migrated save carries valid seen-event, chain-ending, title, and cosmetic collections through `prestigeReset()` unchanged.
- Legacy staff migration auto-fills the first three hired staff; corrupted/duplicate/unknown/fourth slots normalize to exactly three valid unique entries.
- Offline E2E with a legacy v5 save confirms normalized version 9, migrated stage room 4,001, carry stops at checkpoint boss and operation draft, no duplicate payout after rapid reload, and one-time double reward.

### Staff rank/effect constraints
- `staffDeployment.test.js` explicitly covers levels `[0,1,4,5,9,10,14,15,19,20]` and tiers `[0,1,1,2,2,3,3,4,4,5]`.
- `WorldView.js` consumes that same `staffRankForLevel()` result to select `worker-rank-${tier}`; textures 1–5 are all generated.
- Staff E2E confirms field/card synchronization at Lv5, swap, persistence, and compact layout.
- `GameState.staffDeployment.test.js` records the base staff multiplier and CPS before deployment, then asserts the base multiplier is unchanged while only the separate deployed effect increases CPS.
- Slot normalization and runtime deployment both enforce exactly three.

### Pacing evidence
- Deterministic normal-play model (3 taps/s) passed three consecutive prestige cycles: first 687s, repeat 405s and 426s, against approved 480–720s and 300–480s bands.
- The first clean real run observed eligibility at the 480s sampling tick. A second clean 600s run added event-level timing and reached eligibility at 495.54s, with 1,721 taps, 57 upgrades, 12 events, two chain endings, two fever cycles, one boss success, and zero browser errors.
- A separate 105ms/tap power-user stress run was classified as stress evidence, not used to tune normal-user pacing.

### Build, integrity, CI, security
- Full unit rerun at closure time: 19 files, 107/107 passed. Current release evidence later added missing/corrupt-version, runtime slot-normalization, and PWA recovery regressions for 112/112.
- Production build passed after final source changes.
- Custom Phaser guard remains exact at esbuild `0.28.1`; deterministic custom output raw 662,199 B, gzip 184,363 B, SHA-256 `44eb878cf64162891a6c7804c0709a8caa686f59c0e9fda1ef4afaa8befb74d0`; unsupported factories 0. Stock rollback build also passed.
- CI uses Node 22 and runs `npm ci`, `npm test`, and `npm run build` on pull requests and main pushes.
- Production dependency audit: 0 vulnerabilities. Full audit: three moderate dev-only issues through Capacitor CLI → xcode → uuid; forced breaking downgrade not applied. Android sync and doctor passed.

## Accepted non-blocking risks
- Manual Image/Rectangle synchronization replaces unsupported Phaser Container; staff field E2E and custom factory audit pass.
- Existing Firebase and Phaser chunks above 500 kB remain a known warning; custom Phaser gzip stays under its 200 kB gate.
- The Firebase preview channel will expire automatically after one day.

## Required response
Return `VERDICT: PASS` if the earlier approved-constraint gaps are closed, otherwise `VERDICT: FAIL`. List only remaining blockers with severity and the exact missing evidence. Do not reopen findings explicitly evidenced above without explaining the contradiction.

## Complete prior-finding traceability

### Correctness review

| Prior finding (verbatim title) | Severity | Closure |
|---|---:|---|
| Firebase preview validation — an approved constraint — has no evidence, while hosting layout changed | high | Firebase preview section and raw HTTP/deploy excerpts below |
| PWA update flow (save-first, 지금 갱신/나중에, no forced reload) has no cited test result | high | PWA lifecycle section; final local production-preview E2E and unit negative paths |
| Save v9 migration and durable-collection preservation only indirectly evidenced | high | Save v9 section; explicit migrated fixture and offline legacy E2E |
| Rank/appearance thresholds evidenced only at Lv5; constraint spans Lv5/10/15/20 | medium | Staff section; exact boundary vector through Lv20 and shared WorldView mapper |
| No explicit evidence that deployed-slot effects don’t stack with or alter preserved base effects | medium | Staff section; `staffMultiplierFor` equality before/after deployment |
| First-prestige pacing rests on a single simulator sample 33s under the 12-minute ceiling | low | Pacing section; three consecutive cycles plus clean real run |
| Phaser Container replacement relies on manual synchronization of paired objects | note | Accepted non-blocking risk; field E2E and custom factory audit |
| No blocking code-level defect identified from the packet itself | note | No action required; all evidence gaps above are closed |

### Release review

| Prior finding (verbatim title) | Severity | Closure |
|---|---:|---|
| No evidence the Firebase preview-channel smoke test ran before production | high | Firebase preview section and raw excerpts below; production still untouched |
| Update-prompt “later” path, duplicate clicks, and controllerchange reloads are untested and can bypass the save-first constraint | high | PWA lifecycle unit negative paths and strict save timestamp E2E |
| Rank milestone evidence covers only level 5 of the four specified tiers | medium | Exact `[0,1,4,5,9,10,14,15,19,20]` unit vector and shared mapper |
| Subsequent-prestige pacing (5–8 min) has no cited runtime evidence; first prestige sits at the exact lower bound | medium | Repeat cycles are 405s and 426s; real first is inclusive 480s |
| sw.js caching headers and SPA rewrite exclusions in firebase.json are unverified | medium | Remote `sw.js` and unknown route raw headers below |
| The changed “exact custom-core version guard” may have loosened an integrity pin | low | Exact esbuild 0.28.1 check and deterministic hash below |
| Reduced-motion handling and update-prompt accessibility are unevidenced | low | Existing `prefers-reduced-motion` rules plus new Korean aria-label and native buttons |
| CI coverage of the new E2E scripts is not stated | note | CI runs `npm ci`, unit, and build; browser scripts remain the documented manual release gate. A CI run URL cannot exist until the dev-protocol approval permits commit/push/PR, and is a downstream PR merge gate rather than a pre-commit blocker. |
| Pre-existing >500 kB chunk warning is acknowledged and non-blocking | note | Accepted non-blocking risk |

## Minimal raw artifacts

### Unit runner

```text
Test Files  19 passed (19)
Tests       107 passed (107)
Duration    727ms
exit=0
```

### PWA E2E after final build

```text
ok: true
target: http://localhost:4178
manifestStatus: 200
iconCount: 3
screenshotCount: 2
privacyStatus: 200
savedBefore: 1786024079283
savedAfter: 1786024081064
updatedCache: trust-office-shell-v4-e2e-1786024078798
offlineReload: 믿어주세요 개표국
exit=0
```

### Firebase preview deploy

```text
hosting[gaepyo-tycoon]: found 45 files in dist
hosting[gaepyo-tycoon]: release complete
Channel URL: https://gaepyo-tycoon--game-completion-pass-44eivfl3.web.app
expires 2026-08-07 22:48:14 KST
exit=0
```

### Remote headers

```text
GET /sw.js
HTTP/2 200
cache-control: no-cache, no-store, must-revalidate
content-type: text/javascript; charset=utf-8
etag: 9f3333b5adfd7295cef4c0816c176dcc0d28de61e8b77d45a3e95137931429f8

GET /qa-spa-rewrite-check
HTTP/2 200
content-type: text/html; charset=utf-8
etag: 7b6f564be5498427d56e68b580794eb7b05b6b0040e2cbfc52fd6f8f21cfe208
content-length: 1200

GET /
HTTP/2 200
etag: 7b6f564be5498427d56e68b580794eb7b05b6b0040e2cbfc52fd6f8f21cfe208
content-length: 1200
```

### Custom Phaser integrity

```text
ok: true
esbuild exact expected: 0.28.1
rawBytes: 662199
gzipBytes: 184363
sha256: 44eb878cf64162891a6c7804c0709a8caa686f59c0e9fda1ef4afaa8befb74d0
unsupportedFactories: []
unsupportedMath: []
exit=0
```

## Two clarifications requested by the prior verifier
- Tier 0 cannot reach `WorldView`: normalized staff slots reject staff with level `<= 0`, and runtime deploy also rejects an unhired staff member. Every rendered worker therefore has tier 1–5; no `worker-rank-0` texture is needed.
- Pacing bands are inclusive. The simulator failure condition is `< min || > max`; the exact rerun is 495.54 seconds, giving 15.54 seconds of measured lower-bound margin.

# QA Report — 게임 완성도 마감 패스

## Outcome

- Result: PASS (released)
- Checks: 129/129 passed — 112 unit, 6 integration, 10 E2E, 1 hands-on
- Firebase preview: `https://gaepyo-tycoon--game-completion-pass-44eivfl3.web.app`
- Production: `https://gaepyo-tycoon.web.app` — PR #11 merge, main CI, production smoke test complete

## Covered behavior

- Existing staff base effects remain unchanged while exactly three deployed roles add separate bonuses.
- Staff ranks map every off-by-one boundary through Lv.20 and share the same mapper between cards and world sprites.
- v8 and earlier saves preserve stage progress ratio; valid durable collections survive prestige; corrupt staff slots normalize safely.
- First/repeat pacing uses 44,000/24,000 bases and lands inside the inclusive 8–12/5–8 minute bands.
- Continuing the first run reaches area 11 at 1,395 seconds, below the 3,600-second late-game reachability ceiling.
- PWA updates expose an explicit later/apply choice, save before activation, recover from save/activation failure, block duplicate apply, avoid cross-tab forced reload, and recover offline.
- Firebase Hosting serves the game from `dist`, preserves `/privacy.html`, applies SPA rewrite, revalidates the app shell, and sends no-cache headers for `/sw.js`.
- Custom Phaser remains deterministic and below the 200 kB gzip gate on exact esbuild 0.28.1; stock rollback and Android sync/doctor pass.

## Hands-on alpha result

- Clean 600-second mobile play at 330 ms/tap with no GameState injection.
- First prestige eligibility reached at an exact 495.54 seconds, 15.54 seconds above the inclusive lower bound.
- 1,721 taps, 57 upgrades, 12 events, two chain endings, one operation, two fever cycles/finishers, one boss success, zero failures, zero browser errors.
- A separate 105 ms/tap run was treated only as power-user stress evidence and was not used to tune normal-user pacing.

## Defects and test repairs found during QA

- The prior 40,000 first-run base reached area 4 at about 450 seconds in the normal profile; the smallest compliant adjustment was 44,000 while repeat remained 24,000.
- The offline-carry E2E assumed exactly 100 legacy votes remained and that the old 8-hour seed could fill new longer stages. It now derives migrated room from the preserved ratio and uses explicit production to reach boss/operation gates.
- A nine-browser parallel run saturated the render scheduler and made mobile performance query a panel before it rendered; the isolated mandatory performance run passed within all thresholds.

## Cross-review closure

- AIDP classified the change high risk and required xhigh, two-panel review.
- Two independent Claude Fable 5 reviews requested explicit preview, PWA negative paths, v9 durable migration, rank boundaries, base-effect parity, and traceable raw evidence.
- Local fixes/tests and Firebase preview evidence closed all prior high/medium findings. The AIDP ledger, not this mutable report, is the authority for the exact current-head reviewer digest.
- Prior closure provenance: Anthropic `claude-fable-5` with `claude-haiku-4-5-20251001` support; cost USD 2.558219.

## Evidence

- Summary: `../evidence/2026-08-06/game-completion-pass-summary.yaml`
- Raw excerpts: `../evidence/2026-08-06/game-completion-pass-raw-evidence.md`
- Unit: `npm test` — 19 files, 112/112 pass
- Build: `npm run build` — pass
- Browser matrix: balance integration plus offline carry, boss, operation/fever, UI readability, mobile performance, startup font, Phaser, event chains, staff, and PWA E2E — all pass
- Hands-on capture: `../evidence/2026-08-06/game-completion-pass-live-final/SC-GCP-015-hands-on-adaptive-600s.png`
- Claude packets and finding traceability: `../../docs/reviews/2026-08-06-game-completion-pass-fable-closure.md`
- PR #11 and production closure smoke: `../evidence/2026-08-07/production-release-closure-smoke.md`

## Release closure and accepted risk

- PR #11 was squash-merged as `6977a5d` after Node 22 `npm ci`, `npm test`, and `npm run build` passed.
- Production deployment and `/`, `/privacy.html`, manifest, service worker, and SPA fallback smoke tests passed.
- Full npm audit retains three moderate dev-only `uuid` findings through Capacitor CLI/xcode; production audit is zero and a forced breaking downgrade was rejected.
- Existing Firebase and Phaser chunks above 500 kB remain a warning; the guarded custom Phaser artifact is 184,363 B gzip.

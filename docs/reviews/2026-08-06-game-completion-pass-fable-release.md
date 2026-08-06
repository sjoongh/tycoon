# Claude review packet — UX, PWA, and release safety

## Objective
Review the uncommitted game-completion pass against `origin/main` as an independent, read-only release critic. Find actionable UX, PWA, deployment, accessibility, or test-evidence gaps. Inspect the workspace diff and cited files directly.

## Approved constraints
- Existing staff effects remain active; three deployed slots add visible strategic role bonuses.
- Rank appearance milestones are levels 5, 10, 15, and 20.
- PWA update saves first and requires an explicit `지금 갱신 / 나중에` choice.
- First prestige target is 8–12 minutes; subsequent targets are 5–8 minutes.
- Firebase preview smoke test precedes production.
- No ads, payment, login, server API, or save deletion is in scope.

## Primary review dimensions
1. Update-controller lifecycle: waiting worker discovery, later choice, duplicate clicks, controllerchange/reload, stale cache and offline behavior.
2. Manifest/icons/screenshots/privacy/Firebase headers and SPA deployment contract.
3. Mobile/desktop staff slot usability, rank feedback, copy clarity, touch targets, reduced motion, and visual regressions.
4. CI/package/security choices and whether release evidence covers meaningful failures.
5. Any mismatch between README, manifest, Firebase configuration, tests, and implemented behavior.

## Source coordinates
- `src/pwa/ServiceWorkerUpdateController.js`
- `src/ui/DOMUpdatePrompt.js`
- `src/main.js`
- `public/sw.js`
- `public/manifest.webmanifest`
- `firebase.json`
- `src/ui/dom-ui.css`
- `README.md`
- `.github/workflows/ci.yml`
- `scripts/_pwaupdatetest.mjs`
- `scripts/_staffdeploymenttest.mjs`

## Evidence already obtained
- Unit: 19 files, 106/106 pass; production build pass.
- PWA E2E on production preview server: manifest and all five install assets at exact dimensions, privacy 200, real worker byte replacement, save timestamp increase, controller activation, new cache, offline reload pass.
- Staff E2E: exact three-slot behavior, Lv5 rank visual, swap, v9 persistence, 360px no overflow, 52px minimum control height.
- Visual inspection performed on 390×844 and 1280×900 captures.
- 600s clean mobile play: first prestige eligibility at 480s, no browser errors.
- Production dependency audit 0; Android sync and doctor pass.
- Existing >500 kB Firebase/Phaser chunk warning remains; custom Phaser gzip is 184,363 B.

## Known implementation deviations
- Unsupported Phaser Container was replaced with synchronized supported Image/Rectangle objects.
- esbuild security update required changing the exact custom-core version guard.

## Response format
Start with `VERDICT: PASS` or `VERDICT: FAIL`. Then list findings by severity (P0–P3) with file/line evidence, impact, and smallest safe fix. Do not request unrelated redesign. Explicitly say when no blocking finding exists.

# Raw release-gate excerpts — game completion pass

The build, offline-carry, staff, balance, unit, PWA, and diff-check excerpts below were refreshed after the final runtime hardening pass and before push/PR.

## Unit

```text
RUN v4.1.10
Test Files  19 passed (19)
Tests       112 passed (112)
Duration    460ms
exit=0
```

## Deterministic balance integration

```text
target first: 480-720s
target repeat: 300-480s
run 1: 687s
run 2: 405s
run 3: 426s
deep run: area 11 at 1395s (limit 3600s)
failures: []
exit=0
```

## Exact-timestamp hands-on run

```text
pace: casual active · 330ms tap interval · adaptive operation picks
elapsedSec: 600
firstPrestigeEligibleSec: 495.54
taps: 1721
upgrades: 57
events: 12
eventChainEndings: 2
operationChoices: 1
feverCycles: 2
finisherClicks: 2
bossSuccesses: 1
bossFailures: 0
errors: []
exit=0
```

Capture: `game-completion-pass-live-final/SC-GCP-015-hands-on-adaptive-600s.png`

## Staff E2E

```text
automatic slots: [clerk, auditor, runner]
fourth waiting: engineer level 1
promotion: clerk level 5, tier 2, texture worker-rank-2
swapped slots: [auditor, runner, engineer]
persisted world: [auditor, runner, engineer]
compact overflow: false
minimumHeight: 52
screenshots: 2
exit=0
```

Captures:
- `game-completion-pass-staff/SC-STAFF-001-deployment-promotion-mobile.png`
- `game-completion-pass-staff/SC-STAFF-002-persisted-compact.png`

## PWA production-build E2E

```text
target: http://localhost:4178
manifestStatus: 200
iconCount: 3
screenshotCount: 2
privacyStatus: 200
savedBefore: 1786029317404
savedAfter: 1786029318925
updatedCache: trust-office-shell-e2e-1786029316867
offlineReload: 믿어주세요 개표국
exit=0
```

## Firebase preview smoke

```text
hosting files: 45
channel: game-completion-pass
url: https://gaepyo-tycoon--game-completion-pass-44eivfl3.web.app
expires: 2026-08-08 00:05:31 KST

GET /sw.js
HTTP/2 200
cache-control: no-cache, no-store, must-revalidate
content-type: text/javascript; charset=utf-8
cache name: trust-office-shell-78705fe894d1

GET /index.html
HTTP/2 200
cache-control: no-cache, max-age=0, must-revalidate

GET /manifest.webmanifest
HTTP/2 200
cache-control: no-cache, max-age=0, must-revalidate

GET /qa-spa-rewrite-check
HTTP/2 200
content-length: 1200

GET /
HTTP/2 200
cache-control: no-cache, max-age=0, must-revalidate
content-length: 1200
```

## Custom Phaser and platform

```text
esbuild exact: 0.28.1
rawBytes: 662199
gzipBytes: 184363
sha256: 44eb878cf64162891a6c7804c0709a8caa686f59c0e9fda1ef4afaa8befb74d0
unsupportedFactories: []
stock rollback: passed
Capacitor Android sync: passed
Capacitor doctor: Android looking great
production npm audit: 0 vulnerabilities
full npm audit: 3 moderate, 0 high, 0 critical
```

## Pending downstream artifact

PR CI has not run because this evidence precedes push/PR. Merge requires the exact head to pass Node 22 `npm ci`, `npm test`, and `npm run build`. Current-head cross-review provenance is stored in the external AIDP ledger so documenting it cannot itself invalidate the reviewed digest.

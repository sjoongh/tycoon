# Independent release review packet

## Objective

Review the Android `1.1.1 (versionCode 4)` release metadata and supplied verification evidence. Return only actionable blockers or evidence gaps. Do not edit files.

## User-approved scope

- Release the already-merged facility/staff purchase-immediate-save fix in a new signed AAB.
- Bump package, Android, and README version markers to `1.1.1 (4)`.
- Validate persistence regression, full tests, Android signing and metadata.
- Commit, open a PR, and merge after gates.
- Play Console upload is not authorized.

## Source baseline and change set

- Base: `2d54cb4b1b3f4acc4397ed479b286b08c4bcb82a`, merged PR #13.
- The baseline contains immediate `save(false)` calls after single/bulk facility upgrades and staff hires, plus a Capacitor Preferences native mirror and restore path.
- Release edits:
  - `package.json`: `1.1.0` → `1.1.1`
  - `package-lock.json`: root/package version `1.1.0` → `1.1.1`
  - `android/app/build.gradle`: `versionCode 3` → `4`, `versionName 1.1.0` → `1.1.1`
  - `README.md`: current Android release marker → `1.1.1 (4)`
  - QA evidence, implementation note, and work-log documents added/updated.
- No production logic, signing secret, keystore, generated AAB, or generated font is in the proposed Git diff.

## Verification evidence

- `npm ci`: PASS; production audit: 0 vulnerabilities; full audit has 3 existing moderate dev-only findings.
- Unit: 21 files, 124/124 PASS.
- Persistence target: `GameState.persistOnBuy.test.js` + `persistence.test.js`, 12/12 PASS.
- Vite production build: PASS.
- Balance simulation: PASS.
- Local target guard: only `localhost` used.
- Game browser E2E, sequential: offline carry, boss, operation/fever, UI readability, mobile performance, startup font, custom Phaser core, event-chain play, staff deployment/reload, savecheck — 10/10 PASS.
- PWA update/apply/save/offline reload E2E on production preview — PASS.
- Capacitor Android sync and doctor — PASS.
- OpenJDK 21.0.11 `npm run android:bundle` (sync + `./gradlew --no-daemon clean bundleRelease`) — PASS, including lint vital, signing validation, and bundle signing.
- bundletool 1.18.1 validate — PASS.
- Manifest dump: package `kr.gaepyo.counting`, versionCode `4`, versionName `1.1.1`.
- ZIP integrity and `jarsigner -verify` — PASS.
- Artifact signer SHA-256 matches configured release keystore: `7A:81:32:A4:F7:BE:13:4C:4E:91:B1:3F:82:0C:49:68:8D:71:A8:DD:DF:B3:AF:65:A6:96:1A:08:49:31:35:D8`.
- Artifact: 4,453,987 bytes, SHA-256 `f2fafd6f74d35bd74a51514f45f5fc81ace0e816b831a47af616ac683bbf48c2`.
- Stable copy: `/Users/manager/aidp/gaepyo-release-artifacts/1.1.1/gaepyo-1.1.1-4-release.aab`, identical hash.
- Keystore, properties, and AAB paths are confirmed ignored by Git.

## Known limitation

- Android SDK `adb` exists but reports zero connected devices. The emulator binary is not installed.
- A physical/emulated Android purchase → process kill → reopen test could not run. This is explicitly marked unverified and is not represented as passing.
- Play Console version-code availability and policy acceptance are not checked because upload is out of scope.

## Review questions

1. Is any source/version mismatch or release-blocking defect evident from the change and evidence?
2. Does the lack of a real-device process-kill test require HOLD despite the targeted/native mirror tests and browser reload E2E? Explain the decision threshold.
3. Are the artifact integrity, signer identity, and provenance checks sufficient for PR merge?
4. Identify any claim that overstates the evidence.

Return `PASS`, `HOLD`, or `FAIL`, followed by concise findings with severity and exact remediation.

## Remediation applied after first review

- Release wording now distinguishes verified web-layer persistence and mocked native-bridge contracts from **UNVERIFIED native Android process-kill persistence**.
- The physical/emulator force-stop scenario is explicitly a blocking pre-upload gate, not a merge gate.
- Play upload-key certificate matching and versionCode availability are explicit pre-upload checks.
- Artifact provenance records base commit plus SHA-256 of all three version-bearing build inputs; a merge-commit sidecar will be written next to the stable artifact after merge.

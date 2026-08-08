# Independent release review packet

## Objective

Review the uncommitted Android durable-save fix and `1.1.2 (versionCode 5)` release candidate before commit/PR. Try to disprove that facility and staff purchases survive immediate Android process death.

## User-approved scope

- Raise version to `1.1.2`, Android `versionCode 5`.
- Build a new signed AAB, repeat device gates, then commit/push/PR/merge related files.
- Do not upload to Play Console or change signing keys/repository rules.

## Base and branch

- Base commit: `6c40dc13b8348182e594a292c7c4e66233426a2f`
- Branch/worktree: `fix/android-durable-save` / isolated worktree
- Existing `1.1.1 (4)` AAB reproduced the defect for both facility and staff when force-stopped within one second.

## Implementation contract

### Native slot

- `DurableSaveStore` exposes one fixed SharedPreferences file/key only: `gaepyo_durable_save` / `game_save_v1`.
- `write` and `clear` use synchronous `SharedPreferences.commit()` and return its boolean.
- Writes reject null and payloads over 1,000,000 chars.
- `DurableSavePlugin` injects only `read`, `write`, and `clear` as `GaepyoSaveBridge`.
- `MainActivity` registers the plugin before `super.onCreate` so the bridge exists before the first WebView document.

### JavaScript selection

```js
export function seedLocalStorageFromDurableSave() {
  const durableValue = readDurableSave();
  if (!durableValue) return false;
  const durable = parseSave(durableValue);
  const localValue = localStorage.getItem(SAVE_KEY);
  const local = parseSave(localValue);
  const durableSavedAt = durable?.lastSavedAt || 0;
  const localSavedAt = local?.lastSavedAt || 0;
  if (durableSavedAt < localSavedAt) return false;
  if (durableSavedAt === localSavedAt && durableValue === localValue) return false;
  localStorage.setItem(SAVE_KEY, durableValue);
  return true;
}

export function mirrorNativeSave(json) {
  try {
    if (durableBridge()?.write?.(json) === true) return true;
  } catch {}
  // Native Capacitor Preferences remains asynchronous fallback only.
}
```

- `seedLocalStorageFromDurableSave()` runs before `new GameState()`.
- Valid sync slot suppresses legacy async Preferences restore, preventing an old async value from overwriting the fixed slot.
- Existing web localStorage behavior remains.

## Version and artifact

- `package.json` and lockfile: `1.1.2`.
- Android Gradle: `versionName 1.1.2`, `versionCode 5`.
- Clean signed release AAB: 4,454,773 bytes.
- SHA-256: `24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4`.
- bundletool manifest and installed package both report `1.1.2 (5)`.
- `bundletool validate`, `jarsigner -verify` exit 0, lint vital, Capacitor doctor: PASS.

## Runtime evidence

- Android 15 ARM64 AVD, APK set generated from the exact AAB.
- Facility actual DOM purchase action: before 1, purchase return local/durable 2/2, force-stop in the same command (0.4s total), process absent, native XML before relaunch 2, cold relaunch local/durable 2/2.
- Staff actual DOM purchase action: before 0, purchase return local/durable 1/1, force-stop in the same command (0.7s total), process absent, native XML before relaunch 1, cold relaunch local/durable 1/1.
- Unit tests: 21 files, 132/132 PASS.
- Android app instrumentation: 4/4 PASS.
- Production dependency audit: 0 vulnerabilities.

## Known diagnostics

- Repository-root aggregate `connectedDebugAndroidTest` runs the app tests successfully, then fails in generated `capacitor-cordova-android-plugins:checkDebugAndroidTestDuplicateClasses` because its test graph mixes Kotlin stdlib 1.8.22 with legacy jdk7/jdk8 1.6.21.
- Product-owned `:app:connectedDebugAndroidTest` is the declared gate and passes 4/4. Clean release bundle and exact-AAB execution pass.
- One emulator configuration was tested; no physical device is connected.
- AIDP automatic ledger binaries are unavailable, so review/diff/PR gates are manual.

## Requested review

Return a strict verdict: PASS, HOLD, or FAIL.

1. Identify correctness, data-loss, lifecycle, security, versioning, or rollout blockers.
2. Judge whether the exact-AAB device evidence proves the original defect is fixed.
3. Decide whether the root aggregate Android test failure should block this release, given the app-scoped gate and exact-AAB tests.
4. Flag any missing test or evidence that must be completed before commit/PR; separate physical-device recommendation from a blocker.
5. Keep findings actionable and rank them P0/P1/P2.

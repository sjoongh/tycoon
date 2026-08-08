# Android 1.1.2 durable-save release — raw evidence

## Artifact identity

```text
Source: android/app/build/outputs/bundle/release/app-release.aab
Release copy: /Users/manager/aidp/gaepyo-release-artifacts/1.1.2/gaepyo-1.1.2-5-release.aab
Package: kr.gaepyo.counting
Version: 1.1.2 (versionCode 5)
Bytes: 4,454,773
SHA-256: 24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4
Source/copy SHA-256 match: PASS
bundletool 1.18.1 validate: PASS
jarsigner -verify exit: 0
Capacitor doctor: Android looking great
```

## Automated verification

```text
npm test -- --run
Test Files  21 passed (21)
Tests       132 passed (132)

:app:connectedDebugAndroidTest
Starting 4 tests on gaepyo_qa_api35(AVD) - 15
Finished 4 tests
BUILD SUCCESSFUL

clean bundleRelease: PASS
:app:lintVitalRelease: PASS
npm audit --omit=dev: 0 vulnerabilities
git diff --check: PASS
```

## Exact AAB installation

```text
Install: bundletool connected-device APK set generated from the exact AAB
Device: gaepyo_qa_api35
OS / ABI: Android 15 / arm64-v8a
dumpsys package: versionCode=5, versionName=1.1.2
```

## Facility sub-second force-stop

```text
Actual DOM action: [data-action=upgradeFac].click()
Before: desk Lv.1
Purchase return: local Lv.2 / durable Lv.2
Command including purchase evaluation and force-stop elapsed: 0.4s
Process after force-stop: absent
Native XML before relaunch: desk Lv.2, game_save_v1 present
Cold relaunch: local Lv.2 / durable Lv.2
Result: PASS
```

## Staff sub-second force-stop

```text
Setup: committed test resources to the same fixed slot, force-stopped, then cold-booted the state
Actual DOM action: [data-action=hire][data-id=clerk].click()
Before: clerk Lv.0
Purchase return: local Lv.1 / durable Lv.1
Command including purchase evaluation and force-stop elapsed: 0.7s
Process after force-stop: absent
Native XML before relaunch: desk Lv.2 / clerk Lv.1, game_save_v1 present
Cold relaunch: local Lv.2 / durable Lv.2, clerk Lv.1 / durable Lv.1
Result: PASS
```

## Data-preserving upgrade 1.1.1 (4) to 1.1.2 (5)

```text
Old artifact SHA-256: f2fafd6f74d35bd74a51514f45f5fc81ace0e816b831a47af616ac683bbf48c2
Old installed identity: 1.1.1 (4)
Old-version user action: actual facility upgrade Lv.1 -> Lv.2
Old-version 5-second force-stop and cold relaunch: local Lv.2 PASS
Update: exact 1.1.2 (5) APK set installed without uninstall/data wipe
First 1.1.2 launch: local Lv.2 / migrated durable Lv.2
Immediate force-stop native XML: facility Lv.2, game_save_v1 present
Cold relaunch: local Lv.2 / durable Lv.2
Result: PASS
```

## Two-step reset anti-resurrection

```text
Precondition: migrated local/durable facility Lv.2
Actual UI flow: settings open -> 초기화 -> 정말 삭제!
Force-stop after reset reload
Native slot: replaced with fresh facility Lv.1, not old Lv.2
Cold relaunch: local Lv.1 / durable Lv.1 / staff Lv.0
Old save resurrected: false
Result: PASS
```

## Legacy timestamp audit

```text
Initial repository GameState (package 0.1.0): lastSavedAt field and normalization present
All later release lines inherit lastSavedAt normalization
Result: PASS
```

## Non-gating diagnostic

```text
Root aggregate connectedDebugAndroidTest:
  app module 4/4 tests finished PASS
  aggregate later failed in capacitor-cordova-android-plugins:checkDebugAndroidTestDuplicateClasses
  cause: Kotlin stdlib 1.8.22 and legacy jdk7/jdk8 1.6.21 duplicate classes in the plugin module test graph

Release gate command :app:connectedDebugAndroidTest: PASS
The product app release build and exact-AAB device tests do not traverse the failing plugin test-only aggregate graph.

First upgrade fixture attempt:
  Direct DevTools localStorage injection on 1.1.1 did not survive the update.
  It was rejected as non-representative because it bypassed GameState.save and was not verified by an old-version cold relaunch.
  The final upgrade gate used an actual 1.1.1 purchase, waited 5 seconds, and proved old-version relaunch before update.
```

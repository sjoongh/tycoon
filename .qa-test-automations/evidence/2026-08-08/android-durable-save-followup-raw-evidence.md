# Android durable-save follow-up — raw evidence excerpts

## Defect baseline

```text
Original signed AAB SHA-256: f2fafd6f74d35bd74a51514f45f5fc81ace0e816b831a47af616ac683bbf48c2
Facility Lv.1 -> Lv.2 -> force-stop -> cold relaunch Lv.1: FAIL
Staff Lv.0 -> Lv.1 -> force-stop -> cold relaunch Lv.0: FAIL
CapacitorStorage.xml after autosave interval: absent
```

## Automated verification

```text
npm test -- --run
Test Files  21 passed (21)
Tests       132 passed (132)

connectedDebugAndroidTest
Starting 4 tests on gaepyo_qa_api35(AVD) - 15
Finished 4 tests
BUILD SUCCESSFUL

npm run android:sync: PASS
clean :app:bundleRelease: PASS
:app:lintVitalRelease: PASS
bundletool 1.18.1 validate: PASS
jarsigner -verify: PASS
npm audit --omit=dev: 0 vulnerabilities
git diff --check: PASS
```

## Final candidate artifact

```text
Path: android/app/build/outputs/bundle/release/app-release.aab
Package: kr.gaepyo.counting
Version: 1.1.1 (versionCode 4; QA candidate only)
Bytes: 4,454,725
SHA-256: 5306792d9aae299e227854994f04d2a2e767e201ff9078cf6e671c8829d8b874
Install: bundletool connected-device APK set on Android 15 ARM64
```

## Final AAB device process-kill verification

```text
Facility sub-second force-stop:
  before local: Lv.1
  purchase return local: Lv.2
  purchase return durable slot: Lv.2
  cold relaunch local: Lv.2
  cold relaunch durable slot: Lv.2
  result: PASS

Staff sub-second force-stop:
  before local: Lv.0
  purchase return local: Lv.1
  purchase return durable slot: Lv.1
  cold relaunch local: Lv.1
  cold relaunch durable slot: Lv.1
  result: PASS

Recent-apps swipe kill:
  before: staff Lv.1
  purchase return local/durable: Lv.2/Lv.2
  process after upward swipe: absent
  cold relaunch local/durable: Lv.2/Lv.2
  result: PASS

Native file:
  /data/user/0/kr.gaepyo.counting/shared_prefs/gaepyo_durable_save.xml
  game_save_v1 entry: present after force-stop
```

## Write latency sample

```text
Payload: 2,286 bytes
SharedPreferences.commit bridge calls: 21.8ms cold, then 2.3ms / 0.5ms / 0.7ms / 0.1ms
All return values: true
```

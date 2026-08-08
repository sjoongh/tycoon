# Android 1.1.1 save release — raw evidence excerpts

## Unit and persistence

```text
npm test
Test Files  21 passed (21)
Tests       124 passed (124)

npm test -- --run src/state/GameState.persistOnBuy.test.js src/state/persistence.test.js
Test Files  2 passed (2)
Tests       12 passed (12)
```

## Web and browser

```text
npm run build
86 modules transformed
build completed successfully

QA_BASE_URL=http://localhost:5178
target-guard:PASS localhost
preflight:PASS
```

Sequential game E2E scripts returned `ok: true` for offline carry, checkpoint boss, operation/fever, UI readability, mobile performance, startup font, custom Phaser core, event-chain play, staff deployment/reload, and general save persistence. The balance simulation returned no failures. Production-preview PWA E2E returned:

```text
target: http://localhost:4178
manifestStatus: 200
savedAfter > savedBefore
updated cache found
offlineReload: 믿어주세요 개표국
```

## Android build

```text
npm run android:sync
Sync finished
Capacitor Doctor: Android looking great

JAVA_HOME=<OpenJDK 21> npm run android:bundle
:app:validateSigningRelease
:app:lintVitalRelease
:app:signReleaseBundle
:app:bundleRelease
BUILD SUCCESSFUL
```

## Bundle and signature

```text
bundletool-validate:PASS
package:kr.gaepyo.counting
versionCode:4
versionName:1.1.1
jarsigner-verify:PASS
certificate-match:PASS (7A:81:32:A4:F7:BE:13:4C:4E:91:B1:3F:82:0C:49:68:8D:71:A8:DD:DF:B3:AF:65:A6:96:1A:08:49:31:35:D8)
f2fafd6f74d35bd74a51514f45f5fc81ace0e816b831a47af616ac683bbf48c2  app-release.aab
size:4453987 bytes
```

The stable copy at `/Users/manager/aidp/gaepyo-release-artifacts/1.1.1/gaepyo-1.1.1-4-release.aab` has the same SHA-256 and size.

## Android device process-kill test

```text
Device: gaepyo_qa_api35
OS: Android 15
ABI: arm64-v8a
Installed package: kr.gaepyo.counting
Installed version: 1.1.1 (versionCode 4)
AAB SHA-256: f2fafd6f74d35bd74a51514f45f5fc81ace0e816b831a47af616ac683bbf48c2

Facility, sub-second force-stop:
  before: Lv.1
  purchase confirmed on screen: Lv.2
  after force-stop and cold relaunch: Lv.1
  result: FAIL — purchase lost

Staff, sub-second force-stop:
  before: Lv.0
  purchase confirmed on screen: Lv.1
  after force-stop and cold relaunch: Lv.0
  result: FAIL — purchase lost

Staff, three-second delay before force-stop:
  before: Lv.0
  purchase confirmed on screen: Lv.1
  after force-stop and cold relaunch: Lv.1
  result: PASS

Native mirror inspection:
  expected: /data/user/0/kr.gaepyo.counting/shared_prefs/CapacitorStorage.xml
  observed after more than one 10-second autosave interval: absent
  Capacitor Preferences plugin JSON and classes.dex entry: present
```

The release AAB therefore has a sub-second durability window: WebView localStorage eventually flushes, but the native SharedPreferences mirror does not write in the installed release. Play upload remains blocked.

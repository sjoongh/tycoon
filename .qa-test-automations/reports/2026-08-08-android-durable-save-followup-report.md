# QA Report — Android 구매 즉시 저장 내구성 수정

## Outcome

- Result: **PASS — FIX CANDIDATE**
- Original `1.1.1 (4)` artifact: facility/staff sub-second process-kill persistence **FAIL**.
- Fixed candidate AAB: facility force-stop, staff force-stop, and recent-apps swipe-kill persistence **PASS**.
- Candidate SHA-256: `5306792d9aae299e227854994f04d2a2e767e201ff9078cf6e671c8829d8b874`.

## Verification

- Web unit suite: 21 files, 132/132 PASS.
- Android instrumentation: 4/4 PASS, including commit-read, commit-clear, and invalid payload rejection.
- Vite production build, Capacitor sync, clean signed release bundle, lint vital, bundletool validation, and JAR signature verification: PASS.
- Android 15 ARM64 exact-AAB install: facility `Lv.1→2` and staff `Lv.0→1` both survived sub-second force-stop and cold relaunch.
- Staff `Lv.1→2` survived actual recent-apps upward swipe removal and cold relaunch.
- Durable SharedPreferences XML and fixed save slot were present after force-stop.
- Production dependency audit: 0 vulnerabilities.

## Performance

- Tested save payload: 2,286 bytes.
- Synchronous commit bridge latency: cold 21.8ms; subsequent writes 0.1–2.3ms.
- This is a deliberate purchase durability cost: the cold sample was about 1.3 frames at 60Hz, while steady-state writes stayed below one frame.

## Release status

- The verified artifact still identifies as `1.1.1 (versionCode 4)` and is a QA candidate only.
- The broken `versionCode 4` artifact may already exist outside this worktree, so the next distributable AAB must increment `versionCode`, rebuild, and repeat this device gate.
- No Play Console upload, commit, push, PR, or merge was performed in this task.

## Residual risk

- One Android 15 ARM64 emulator configuration was tested; an additional physical-device smoke test is recommended before staged rollout, but the originally failing release blocker is now directly covered and passing.
- Existing Vite chunk-size, Gradle `flatDir`, and Gradle 9 deprecation warnings are unchanged.

## Evidence

- Machine summary: `../evidence/2026-08-08/android-durable-save-followup-summary.yaml`
- Raw excerpts: `../evidence/2026-08-08/android-durable-save-followup-raw-evidence.md`
- Implementation note: `../../docs/impl-notes/2026-08-08-android-durable-save-followup.md`
- Work log: `../../docs/work-log/2026-08-08_android-durable-save-followup/`

# Verification Evidence — Android 저장 수정 1.1.2 배포 준비

- Task ID: `2026-08-08_android-durable-save-1-1-2-release`
- Generated: 2026-08-08T19:43:49+09:00
- Base: `6c40dc13b8348182e594a292c7c4e66233426a2f`
- Head: `6c40dc13b8348182e594a292c7c4e66233426a2f`
- Verdict: **PASS**

| Check | Command | Result | Log |
|---|---|---|---|
| npm-test | `npm test -- --run` | PASS | `docs/work-log/2026-08-08_android-durable-save-1-1-2-release/evidence/logs/20260808T194343-npm-test.log` |
| npm-run-build | `npm run build` | PASS | `docs/work-log/2026-08-08_android-durable-save-1-1-2-release/evidence/logs/20260808T194343-npm-run-build.log` |
| android-release-aab-build | `test "$(shasum -a 256 android/app/build/outputs/bundle/release/app-release.aab | awk '{print $1}')" = 24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4 && test "$(shasum -a 256 /Users/manager/aidp/gaepyo-release-artifacts/1.1.2/gaepyo-1.1.2-5-release.aab | awk '{print $1}')" = 24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4 && /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -jar /tmp/gaepyo-bundletool-1.18.1.jar validate --bundle android/app/build/outputs/bundle/release/app-release.aab >/dev/null && test "$(/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -jar /tmp/gaepyo-bundletool-1.18.1.jar dump manifest --bundle android/app/build/outputs/bundle/release/app-release.aab --xpath /manifest/@android:versionCode)" = 5 && test "$(/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -jar /tmp/gaepyo-bundletool-1.18.1.jar dump manifest --bundle android/app/build/outputs/bundle/release/app-release.aab --xpath /manifest/@android:versionName)" = 1.1.2` | PASS | `docs/work-log/2026-08-08_android-durable-save-1-1-2-release/evidence/logs/20260808T194343-android-release-aab-build.log` |
| android-15-facility-force-stop-cold-relaunch-persistence | `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","facility_subsecond_force_stop","result") == "passed" ? 0 : 1)'` | PASS | `docs/work-log/2026-08-08_android-durable-save-1-1-2-release/evidence/logs/20260808T194343-android-15-facility-force-stop-cold-relaunch-persistence.log` |
| android-15-staff-force-stop-cold-relaunch-persistence | `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","staff_subsecond_force_stop","result") == "passed" ? 0 : 1)'` | PASS | `docs/work-log/2026-08-08_android-durable-save-1-1-2-release/evidence/logs/20260808T194343-android-15-staff-force-stop-cold-relaunch-persistence.log` |
| android-15-upgrade-in-place-persistence | `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","upgrade_in_place_1_1_1_to_1_1_2","result") == "passed" ? 0 : 1)'` | PASS | `docs/work-log/2026-08-08_android-durable-save-1-1-2-release/evidence/logs/20260808T194343-android-15-upgrade-in-place-persistence.log` |
| android-15-reset-anti-resurrection | `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","settings_two_step_reset","result") == "passed" ? 0 : 1)'` | PASS | `docs/work-log/2026-08-08_android-durable-save-1-1-2-release/evidence/logs/20260808T194343-android-15-reset-anti-resurrection.log` |

## Changed files

- `.qa-test-automations/_index.md`
- `.qa-test-automations/coverage/mobile-runtime/e2e-flows.md`
- `.qa-test-automations/coverage/mobile-runtime/manifest.yaml`
- `.qa-test-automations/coverage/mobile-runtime/scenarios.md`
- `.qa-test-automations/coverage/mobile-runtime/test-cases.yaml`
- `.qa-test-automations/evidence/2026-08-08/android-1.1.1-save-release-raw-evidence.md`
- `.qa-test-automations/evidence/2026-08-08/android-1.1.1-save-release-summary.yaml`
- `.qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-raw-evidence.md`
- `.qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml`
- `.qa-test-automations/evidence/2026-08-08/android-durable-save-followup-raw-evidence.md`
- `.qa-test-automations/evidence/2026-08-08/android-durable-save-followup-summary.yaml`
- `.qa-test-automations/history.yaml`
- `.qa-test-automations/reports/2026-08-08-android-1.1.1-save-release-report.md`
- `.qa-test-automations/reports/2026-08-08-android-1.1.2-durable-save-release-report.md`
- `.qa-test-automations/reports/2026-08-08-android-durable-save-followup-report.md`
- `android/app/build.gradle`
- `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`
- `android/app/src/androidTest/java/kr/gaepyo/counting/DurableSaveStoreInstrumentedTest.java`
- `android/app/src/main/java/kr/gaepyo/counting/DurableSavePlugin.java`
- `android/app/src/main/java/kr/gaepyo/counting/DurableSaveStore.java`
- `android/app/src/main/java/kr/gaepyo/counting/MainActivity.java`
- `docs/impl-notes/2026-08-08-android-durable-save-followup.md`
- `docs/work-log/2026-08-08_android-durable-save-followup/.aidp-task.json`
- `docs/work-log/2026-08-08_android-durable-save-followup/checklist.md`
- `docs/work-log/2026-08-08_android-durable-save-followup/context.md`
- `docs/work-log/2026-08-08_android-durable-save-followup/evidence.md`
- `docs/work-log/2026-08-08_android-durable-save-followup/evidence/evidence.json`
- `docs/work-log/2026-08-08_android-durable-save-followup/evidence/logs/.gitignore`
- `docs/work-log/2026-08-08_android-durable-save-followup/memory-promotion.md`
- `docs/work-log/2026-08-08_android-durable-save-followup/outcome.json`
- `docs/work-log/2026-08-08_android-durable-save-followup/plan.md`
- `package-lock.json`
- `package.json`
- `public/fonts/Galmuri14.woff2`
- `public/fonts/Galmuri9.woff2`
- `src/main.js`
- `src/state/persistence.js`
- `src/state/persistence.test.js`

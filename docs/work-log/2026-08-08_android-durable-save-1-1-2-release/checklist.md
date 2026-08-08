# Checklist — Android 저장 수정 1.1.2 배포 준비

- [x] 현재 상태와 관련 문서를 확인했다.
- [x] 완료 조건과 변경 범위를 고정했다.
- [x] 구현 또는 조사를 완료했다.
- [x] 현재 상태에서 검증을 실행했다.
- [x] 남은 위험과 미검증 항목을 기록했다.
- [x] 프로젝트 문서와 조직 지식으로 승격할 내용을 분리했다.

## 검증 결과

- [x] `npm-test`: 21 files, 132/132 PASS.
- [x] `npm-run-build`: Vite production build PASS.
- [x] `android-release-aab-build`: clean signed `1.1.2 (5)` AAB, lint vital, bundletool validation, JAR signature PASS.
- [x] `android-15-facility-force-stop-cold-relaunch-persistence`: exact AAB, `Lv.1→2`, local/durable `2/2` PASS.
- [x] `android-15-staff-force-stop-cold-relaunch-persistence`: exact AAB, `Lv.0→1`, local/durable `1/1` PASS.
- [x] Android app instrumentation 4/4 PASS; production dependency vulnerabilities 0.
- [x] exact `1.1.1 (4)→1.1.2 (5)` data-preserving update and durable migration PASS.
- [x] actual settings 2-step reset anti-resurrection PASS.
- [x] Claude Fable 5 independent review PASS; accepted/rejected findings recorded.
- [x] dev-protocol 편차·이해 확인 및 커밋/PR/병합 승인: 사용자 `A / A / A / A`.

## 남은 위험

- 물리 Android 기기 smoke test는 연결 기기가 없어 미실행이다.
- Play Console 업로드·단계적 출시는 승인 범위 밖이다.
- 루트 aggregate Android test task의 생성 플러그인 Kotlin test graph 중복은 비게이팅 진단으로 남아 있다.

<!-- aidp-productivity:verification:start -->
## 자동 검증 기록

- [x] npm-test: `npm test -- --run` — PASS
- [x] npm-run-build: `npm run build` — PASS
- [x] android-release-aab-build: `test "$(shasum -a 256 android/app/build/outputs/bundle/release/app-release.aab | awk '{print $1}')" = 24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4 && test "$(shasum -a 256 /Users/manager/aidp/gaepyo-release-artifacts/1.1.2/gaepyo-1.1.2-5-release.aab | awk '{print $1}')" = 24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4 && /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -jar /tmp/gaepyo-bundletool-1.18.1.jar validate --bundle android/app/build/outputs/bundle/release/app-release.aab >/dev/null && test "$(/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -jar /tmp/gaepyo-bundletool-1.18.1.jar dump manifest --bundle android/app/build/outputs/bundle/release/app-release.aab --xpath /manifest/@android:versionCode)" = 5 && test "$(/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -jar /tmp/gaepyo-bundletool-1.18.1.jar dump manifest --bundle android/app/build/outputs/bundle/release/app-release.aab --xpath /manifest/@android:versionName)" = 1.1.2` — PASS
- [x] android-15-facility-force-stop-cold-relaunch-persistence: `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","facility_subsecond_force_stop","result") == "passed" ? 0 : 1)'` — PASS
- [x] android-15-staff-force-stop-cold-relaunch-persistence: `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","staff_subsecond_force_stop","result") == "passed" ? 0 : 1)'` — PASS
- [x] android-15-upgrade-in-place-persistence: `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","upgrade_in_place_1_1_1_to_1_1_2","result") == "passed" ? 0 : 1)'` — PASS
- [x] android-15-reset-anti-resurrection: `ruby -ryaml -e 'd=YAML.load_file(".qa-test-automations/evidence/2026-08-08/android-1.1.2-durable-save-release-summary.yaml"); exit(d.dig("android_e2e","settings_two_step_reset","result") == "passed" ? 0 : 1)'` — PASS
<!-- aidp-productivity:verification:end -->

<!-- aidp-productivity:close:start -->
## 종료 기록

- [x] 현재 상태 증적: verified
- [x] 종료 상태: `closed`
- [ ] Ontology Lens 후보를 검토하고 필요한 경우 제안 버전으로 제출한다.
<!-- aidp-productivity:close:end -->

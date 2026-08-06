# 2026-08-06 Phaser custom core 부팅 최적화

## 목표 / 확정 사항

- Phaser 3.90과 기존 게임 규칙·화면·저장·Firebase 의미는 유지한다.
- 실제 사용하는 Phaser 기능만 담은 재현 가능한 custom core를 만들고 초기 엔진 전송·실행 비용을 줄인다.
- WebGL과 Canvas fallback을 모두 유지한다.
- 게임이 사용하지 않는 Phaser Sound와 고급 Canvas blend-mode 능력 검사는 제외한다.
- 문제가 생기면 환경 변수 하나로 stock Phaser 빌드로 되돌릴 수 있게 한다.

## Gate evidence

- 질문: `A` custom core + 불필요 Canvas 검사 제거 / `B` 전체 Phaser + Canvas 검사만 제거 / `C` 보류 중 선택을 요청했다.
- 사용자 답: `응a로 진행하자 그럼`
- 승인된 범위: A안의 custom Phaser 생성·Vite alias·정확한 버전 고정·stock rollback·빌드/API/용량 검증·WebGL 및 강제 Canvas E2E·성능 비교·직접 플레이.
- 미승인 가정: Phaser 4 마이그레이션, 게임 규칙·화면 재설계, Canvas fallback 제거는 하지 않는다.

## 계획

1. Phaser·esbuild 버전을 정확히 고정하고 custom entry와 생성기를 추가한다.
2. 생성물은 gitignored `.cache/phaser/`에 두고, 소스·버전 hash가 달라질 때 Vite config가 자동 재생성한다.
3. `phaser-core`에 현재 사용하는 Clamp·Rectangle·Arc/Circle·Zone factory만 보강한다.
4. Canvas/WebGL은 유지하고 Sound는 제외한다. CanvasFeatures는 고급 blend-mode 미지원이라는 보수적 stub으로 대체한다.
5. `GAEPYO_STOCK_PHASER=1`이면 alias를 우회하는 rollback 경로를 제공한다.
6. build/API/용량 회귀, WebGL·강제 Canvas, 전체 기존 E2E, CPU throttling, 상태 주입 없는 180초 플레이로 검증한다.

## 판단 근거

- 4× CPU + SwiftShader 3회 중앙값에서 stock Phaser는 330,076바이트, 총 long task 1,207ms, 최대 588ms였다.
- custom core + CanvasFeatures stub 프로브는 175,583바이트(-46.8%), 총 long task 615ms(-49.0%), 최대 392ms(-33.3%)였다.
- CPU profile에서 Phaser Canvas blend-mode 검사의 1픽셀 readback이 약 600ms를 차지했다. 프로젝트 소스에는 custom blend mode 사용이 없다.
- 임시 custom core로 오프라인·보스·작전/피버 E2E와 180초 직접 플레이(1,438탭, 보스 9/9, 오류 0)가 통과했다.
- Phaser 공식 소스는 build-time feature flag와 core entry를 제공한다. 내부 source entry를 쓰므로 버전을 정확히 고정하고 업그레이드 시 검증을 강제한다.

## Claude Fable 교차 리뷰 반영

- 모델: `claude-fable-5` + `claude-haiku-4-5-20251001`, effort `high`, cost `$0.576171`.
- 생성물을 `node_modules`가 아닌 gitignored 프로젝트 `.cache/`에 둔다.
- 정확한 renderer/sound/plugin flag map, hash 기반 재생성, stock rollback, Phaser MIT 배너를 구현한다.
- 강제 Canvas 시각·상호작용 검증과 custom API·용량 ceiling을 추가한다.
- Android `adb`는 현재 환경에 없어 실기기 수치는 미검증으로 명시하고, SwiftShader 수치를 실제 기기 개선으로 확대 해석하지 않는다.
- 최종 read-only 리뷰는 같은 모델 조합·effort `high`, cost `$0.591846`로 `PASS`(차단 이슈 없음)를 냈다. Claude는 제공 packet만 검토했으므로 제안은 모두 로컬 소스와 실행 결과로 독립 검증했다.
- 최종 리뷰의 타당한 보강을 반영해 stock 준비 경로를 custom 생성기 import와 분리하고, 깨진 cache rollback 시험·소스 API 정적 감사·hard version guard·교차 순서 성능 측정·원자료 범위를 추가했다.

## 구현 결과

- Phaser 3.90.0과 esbuild 0.27.7을 exact pin하고, 입력·버전·feature flag의 fingerprint가 달라질 때만 `.cache/phaser/phaser-custom.mjs`를 재생성한다.
- custom entry에는 현재 장면이 쓰는 `Clamp`, `Rectangle`, `Arc/Circle`, `Zone`을 등록했고 WebGL·Canvas renderer는 유지했다.
- Sound·기본/실험 플러그인은 제외하고, Canvas advanced blend-mode 능력 검사는 미지원으로 보수적으로 고정했다.
- 생성 전후 검증은 동일 바이트·SHA, MIT 배너, 정확한 버전, renderer/sound flag, raw/gzip ceiling을 확인한다.
- Vite는 기본으로 custom ESM을 alias하며 `GAEPYO_STOCK_PHASER=1`이면 custom 준비 모듈을 import하지 않고 stock Phaser로 우회한다. 이는 rebuild/redeploy가 필요한 build-time switch다.
- prebuild 정적 감사는 현재 소스의 factory·Phaser.Math 사용을 custom entry와 대조하고, 제외된 Sound·plugin·physics·advanced blend mode 재도입을 실패 처리한다.
- 성능 측정 중 실패해도 Chromium이 남지 않도록 브라우저 수명주기를 `finally`로 정리했다.

## 측정·검증 결과

- 생성물: raw 662,162 B, gzip 184,343 B, SHA-256 `6dab596158279fa0503ea6149787ec654a7326b3e2281807b2df07465c51933f`.
- production Phaser transfer: stock 330,076 B → custom 175,588 B (`-46.8%`).
- synthetic 4× CPU + SwiftShader에서 양 build 1회 warm-up을 버리고 측정 순서를 교차한 신규 브라우저 3회 중앙값: 총 long task 1,183 → 570 ms (`-51.8%`), 최대 long task 576 → 358 ms (`-37.8%`), world ready 1,325.8 → 1,235.9 ms (`-6.8%`). Android 실기기 수치가 아니다.
- 총 83/83 통과: Vitest 68, 생성기·custom/stock build 3, E2E 11, 상태 주입 없는 180초 직접 플레이 1.
- custom·stock 각각 WebGL/강제 Canvas 부팅, 실제 canvas 탭, HUD, 동적 factory/system을 확인했다. Canvas screenshot sampled color 18개 이상과 육안 동등성을 확인했다.
- 직접 플레이는 1,471탭, 28구역, 작전 9회, 피버·재정비·피니셔 각 4회, 보스 9/9, 오류 0이었다.
- `npm test`, `npm run build`, clean-cache 동시 test/build, 새 도구 `node --check`, YAML/JSON parse, `git diff --check`가 통과했다.
- 고의로 깨뜨린 custom cache를 둔 `GAEPYO_STOCK_PHASER=1 npm run build`가 cache를 건드리지 않고 통과했다.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)

- ⚠️ 기존 E2E 6개를 병렬 실행하자 여러 Chromium의 CPU/GPU 경합으로 모바일 frame max가 142~433ms까지 튀고 폰트 platformFonts가 빈 배열이 됐다. 나머지 4개 E2E는 통과했다. → 택한 보수적 대안: 성능·폰트 테스트는 다른 브라우저와 경쟁하지 않게 단독 재실행하고, 병렬 실패는 통과 증적으로 사용하지 않는다. → 리뷰: [x] 사용자 그대로 승인
- ⚠️ 최종 Phaser core 재검증 때 DEV 전용 QA handle을 쓰는 테스트를 production preview에 연결해 10초 timeout이 났다. → 택한 수정: 이 실행은 제품 실패·통과 증거에서 제외하고, 명시된 custom/stock dev 서버에서 순차 재실행해 WebGL·Canvas 4/4를 통과했다. → 리뷰: [x] 사용자 그대로 승인

## 사용자 완료 게이트

- 답변: `그대로 승인 / A / A / A 가자`
- 이해 확인: stock rollback은 `GAEPYO_STOCK_PHASER=1`, custom core는 양 renderer를 유지하며 미사용 모듈·고비용 Canvas 검사를 제외, 성능 수치는 Android 실기기가 아닌 synthetic 비교라는 점을 모두 확인했다.
- 결과: 계획 이탈 승인 및 이해도 확인 완료.

## 다음에 참고 (unknown 대응 이력)

- Phaser custom build를 갱신할 때는 소스 정적 참조뿐 아니라 scene factory와 시스템의 동적 사용까지 E2E로 검증한다.
- CanvasFeatures의 고급 blend-mode 기본값을 false로 고정했으므로 향후 custom blend mode를 쓰면 stub을 재검토한다.

## 현재 상태

- A안 구현과 정량·회귀·직접 플레이 검증, Claude 최종 교차리뷰, 사용자 deviation 승인·이해도 확인 완료. Git 반영 대기.

# Phaser custom core QA Report — 2026-08-06

## Summary

| 항목 | 결과 |
|---|---:|
| 전체 | **83/83 PASS** |
| Vitest | 68/68 |
| 생성기·custom/stock build | 3/3 |
| 결정적 E2E | 11/11 |
| 상태 주입 없는 직접 플레이 | 180초, 오류 0 |

## Startup comparison

동일한 390×844, 4× CPU, SwiftShader, 외부 요청 차단 조건에서 양 build를 1회씩 warm-up한 결과는 버리고, 이후 custom-first/stock-first를 교차하며 각각 신규 브라우저로 3회 측정한 중앙값이다.

| 지표 | Stock | Custom | 변화 |
|---|---:|---:|---:|
| Phaser 전송 | 330,076 B | 175,588 B | **-46.8%** |
| 총 long task | 1,183 ms | 570 ms | **-51.8%** |
| 최대 long task | 576 ms | 358 ms | **-37.8%** |
| HUD ready | 601.7 ms | 546.0 ms | -9.3% |
| World ready | 1,325.8 ms | 1,235.9 ms | -6.8% |

3회 원자료 범위도 같은 방향이었다: 총 long task는 stock 1,171~1,188 ms / custom 568~582 ms, 최대 long task는 stock 563~578 ms / custom 354~363 ms, world-ready는 stock 1,315.1~1,340.1 ms / custom 1,226.5~1,239.8 ms였다. 전체 표본은 evidence YAML에 기록했다.

이는 synthetic 저사양 조건의 비교 수치다. 현재 환경에는 `adb`가 없어 Android WebView 실기기 수치는 미검증이다.

## Functional coverage

- WebGL renderer와 강제 Canvas renderer 모두 GameScene·DOM HUD가 부팅됐다.
- Graphics, Text, Rectangle, Image, Circle, Sprite, Zone factory와 input, loader, scale, time, tweens를 확인했다.
- 두 renderer 모두 canvas 실제 탭이 `totalClicks`를 증가시켰다.
- Canvas 프레임에서 18개 sampled color를 확인했고 WebGL/Canvas 스크린샷을 육안 비교해 구성·텍스트·픽셀 선명도 차이가 없었다.
- `GAEPYO_STOCK_PHASER=1` rollback production build와 stock WebGL·강제 Canvas 부팅·탭이 통과했다.
- 고의로 깨뜨린 custom cache를 둔 stock production build가 cache를 변경하지 않고 통과해 rollback이 custom 생성 경로와 독립적임을 확인했다. 이 전환은 런타임 토글이 아니라 rebuild/redeploy가 필요한 build-time switch다.
- 생성물을 두 번 만들었을 때 SHA-256이 동일했고 Phaser MIT 배너·양 renderer flag·정확한 버전을 확인했다.
- 정적 소스 감사는 factory `circle/graphics/image/rectangle/sprite/text/zone`, Phaser.Math `Between/Clamp`만 검출했고 제외된 Sound·plugin·physics·advanced blend 사용은 0건이었다. 새 미포함 API가 추가되면 production prebuild가 실패한다.

## Regression and direct play

- 오프라인 이월·감사 판단, 보스, 작전/피버, 가독성, DOM 성능, 첫 조작/폰트 E2E가 모두 통과했다.
- 180초 직접 플레이: 1,471탭, 28구역, 업그레이드 98회, 사건 4회, 작전 9회, 피버·재정비·피니셔 각 4회, 보스 9/9, 오류 0.
- E2E 6개 병렬 실행은 CPU/GPU 경합으로 성능·폰트 2개가 오염됐다. 두 테스트를 단독 재실행해 frame max 9.2~25.2ms와 Galmuri 실제 사용을 다시 확인했으며, 병렬 실패는 통과 증적으로 세지 않았다.
- 공식 QA 명령은 `&&` 체인과 `execution: sequential`로 성능·폰트 측정을 순차 실행한다.

## Remaining risk

- `phaser/src/*` 내부 entry를 사용하므로 Phaser 업그레이드는 exact pin을 풀기 전에 생성기·양 renderer·전체 E2E를 다시 통과해야 한다.
- 향후 custom blend mode를 추가하면 보수적으로 고정한 CanvasFeatures stub을 재검토해야 한다.
- Android 실기기 WebView 성능은 기기가 연결되는 별도 단계에서 확인한다.

## Evidence

- `.qa-test-automations/evidence/2026-08-06/phaser-core-summary.yaml`
- `.qa-test-automations/evidence/2026-08-06/screenshots/SC-MRT-008-phaser-webgl.png`
- `.qa-test-automations/evidence/2026-08-06/screenshots/SC-MRT-008-phaser-canvas.png`
- `.qa-test-automations/evidence/2026-08-06/screenshots/SC-MRT-008-phaser-stock-webgl.png`
- `.qa-test-automations/evidence/2026-08-06/screenshots/SC-MRT-008-phaser-stock-canvas.png`

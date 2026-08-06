# Plan — Phaser custom core 부팅 최적화

## 목표

게임 동작과 Canvas fallback을 보존하면서 Phaser 엔진 전송량과 4x CPU long task를 유의미하게 줄인다

## 작업 범위

1. Phaser·esbuild 버전을 정확히 고정한다.
2. custom entry와 build-time flag/stub을 적용하는 hash 기반 생성기를 추가한다.
3. Vite가 generated ESM을 자동 생성·alias하고 환경 변수로 stock Phaser를 선택할 수 있게 한다.
4. 사용 API·license·크기·결정성 검증과 WebGL/Canvas 부팅·상호작용 E2E를 추가한다.
5. 기존 전체 E2E, CPU throttling 비교, 상태 주입 없는 180초 플레이를 실행한다.
6. QA 메타데이터·구현노트·작업 원장에 결과와 남은 위험을 기록한다.

## 검증 계획

- `npm test`와 `npm run build`를 필수 검증으로 기록한다.
- custom/stock build, repeated build hash, generated license와 API, Phaser chunk ceiling을 확인한다.
- WebGL과 강제 Canvas에서 부팅·탭·DOM HUD·스크린샷을 확인한다.
- 기존 결정적 E2E 전체와 180초 상태 주입 없는 플레이를 수행한다.
- 4× CPU + SwiftShader 3회 중앙값으로 stock/custom을 같은 조건에서 비교한다.
- 실행하지 못한 Android 실기기 수치는 통과가 아니라 미검증으로 남긴다.

## 위험

- `phaser/src/*`는 내부 entry이므로 3.90.0 고정과 업그레이드 실패 가드가 필요하다.
- Canvas advanced blend mode를 향후 사용하면 stub을 재검토해야 한다.
- synthetic 성능 개선을 실제 Android 개선으로 확대 해석하지 않는다.
- custom core에서 동적으로 도달하는 factory/system 누락은 전체 E2E로 방어한다.

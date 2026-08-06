# Context — Phaser custom core 부팅 최적화

## 요청

- 작업: Phaser custom core 부팅 최적화
- 완료 조건: 게임 동작과 Canvas fallback을 보존하면서 Phaser 엔진 전송량과 4x CPU long task를 유의미하게 줄인다

## 시작 좌표

- 시작 시각: 2026-08-06T14:39:03+09:00
- 브랜치: `perf/phaser-custom-core-startup`
- 기준 커밋: `8e62cd0ee06ff0c53176d46c6cb361038c25399c`
- 시작 시 워킹트리 변경: 있음

## 근거와 입력

- 사용자 선택: `응a로 진행하자 그럼` — custom core + 불필요 Canvas 능력검사 제거.
- 기준 성능(4× CPU + SwiftShader, 3회 중앙값): Phaser 330,076바이트, 총 long task 1,207ms, 최대 588ms, world ready 1,433ms.
- 임시 A안 프로브: Phaser 175,583바이트, 총 long task 615ms, 최대 392ms, world ready 1,322ms.
- CPU profile: `CanvasFeatures.checkBlendMode`의 pixel readback이 약 600ms를 차지하며 프로젝트에는 custom blend mode 사용이 없다.
- 임시 custom core에서 오프라인·보스·작전/피버 E2E와 180초 직접 플레이가 통과했다.
- 구현노트: `docs/impl-notes/2026-08-06-phaser-custom-core-startup.md`

## 제약

- Phaser 3.90, 게임 규칙·화면·저장·Firebase 의미를 유지한다.
- WebGL과 Canvas fallback을 모두 보존한다.
- Phaser 4 마이그레이션은 범위 밖이다.
- 사용자 소유 `.omc/project-memory.json`, `.impeccable/`, `.omc/artifacts/` 변경은 건드리거나 커밋하지 않는다.
- Android `adb`가 없어 실기기 성능은 미검증으로 남긴다.

## 결정

- Phaser source entry와 esbuild는 정확한 버전으로 고정한다.
- generated ESM은 gitignored `.cache/phaser/`에 두고 버전·입력 hash로 재생성한다.
- CanvasFeatures는 advanced blend mode를 지원하지 않는 보수적 stub으로 바꾼다.
- `GAEPYO_STOCK_PHASER=1`을 즉시 rollback 경로로 둔다.
- Phaser MIT 라이선스 배너를 generated bundle에 보존한다.

## 남은 질문

- 없음. 구현 중 계획 이탈이 생기면 구현노트에 기록하고 완료 시 사용자 리뷰를 받는다.

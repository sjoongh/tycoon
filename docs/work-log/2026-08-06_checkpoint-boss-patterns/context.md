# Context — 체크포인트 보스 패턴 차별화

## 요청

- 작업: 체크포인트 보스 패턴 차별화
- 완료 조건: 보스 6종이 승인된 세 조작 패턴으로 구분되고 무페널티 흐름·작전 순서·모바일 접근성을 보존한다

## 시작 좌표

- 시작 시각: 2026-08-06T15:49:04+09:00
- 브랜치: `feat/checkpoint-boss-patterns`
- 기준 커밋: `bb5a3d822bcebf6572d47a3abbbe6b44ad24401e`
- 시작 시 워킹트리 변경: 있음

## 근거와 입력

- 사용자 문제: 게임이 심심하고 밋밋해 보스별 행동 차이를 추가한다.
- 코드 근거: `src/data/bosses.js`의 6개 정의는 문구만 다르고 `BOSS_DURATION_MS`, `bossTargetFor`, `addBossProgress`를 모두 공유한다.
- 기존 이력: `docs/impl-notes/2026-08-05-checkpoint-boss-event.md`의 무페널티 실패·+35%·작전 모달 오입력 방지 결정을 보존한다.
- 구현노트: `docs/impl-notes/2026-08-06-checkpoint-boss-patterns.md`.

## 제약

- 기존 게임 경제·구역 완료 보상·Firebase·저장 의미를 바꾸지 않는다.
- 세 패턴만 사용하고 보스별 독립 규칙 증식을 피한다.
- 모바일 44px 터치, 키보드, ARIA, reduced-motion과 desktop을 함께 검증한다.
- 사용자 소유 `.omc/project-memory.json`, `.impeccable/`, `.omc/artifacts/` 변경은 건드리거나 커밋하지 않는다.
- `.claude/references/`는 이 저장소에 없어 적용할 프로젝트 reference가 없다.

## 결정

- 사용자 선택 `A로 가자`: 연타 처리전·좌우 교차 검수·타이밍 봉인 3패턴 조합.
- design-workflow 모드는 `small-feature`, 기존 `.gp-boss` 픽셀 카드가 시각 정본이다.
- 실패·건너뛰기 무페널티, 성공 보상 +35%, 3구역 주기와 작전 후속 순서를 유지한다.

## 남은 질문

- 없음. 계획 이탈이 생기면 구현노트에 기록하고 완료 시 사용자 리뷰를 받는다.

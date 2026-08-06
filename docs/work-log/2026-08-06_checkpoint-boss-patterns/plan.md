# Plan — 체크포인트 보스 패턴 차별화

## 목표

보스 6종이 승인된 세 조작 패턴으로 구분되고 무페널티 흐름·작전 순서·모바일 접근성을 보존한다

## 작업 범위

1. 보스 정의에 세 pattern과 보스별 안내·목표 파라미터를 데이터화한다.
2. GameState 저장 정규화와 pattern 입력 API를 추가하고 기존 보스 lifecycle·보상·작전 순서를 보존한다.
3. 기존 보스 카드 안에 연타, 좌우 교차, 타이밍 봉인 조작과 진행 피드백을 구현한다.
4. pattern 공식·구 세이브·성공·실패·건너뛰기 단위 테스트와 모바일/desktop E2E를 추가한다.
5. 전체 회귀, 실제 플레이, source/render detector와 스크린샷을 검증하고 QA 증적을 갱신한다.

## 검증 계획

- `npm test`, `npm run build`를 필수로 실행한다.
- boss pattern 단위 테스트에서 area별 pattern 매핑, 목표, 저장 정규화, 잘못된 순서·타이밍 입력을 확인한다.
- localhost target guard와 preflight를 통과한 뒤 기존 boss E2E와 신규 pattern E2E를 순차 실행한다.
- 390×844와 1280×900에서 조작, overflow, focus, reduced-motion, console/network 오류, 작전 오선택을 확인한다.
- 상태 주입 없는 직접 플레이에서 최소 3종 pattern을 한 번씩 만나고 성공·실패 흐름을 확인한다.
- Impeccable source/URL detector와 동일 viewport 전후 screenshot을 최대 두 번의 bounded pass로 검증한다.

## 완료 증거

- 데이터·상태·UI·저장 호환 구현 완료.
- 전체 단위 76/76, build, deterministic Chromium E2E 통과.
- 상태 주입 없는 240초 플레이에서 42구역·보스 13회 성공·오류 0.
- Claude Fable 교차 리뷰 지적을 회귀 테스트와 키보드 포커스·라이브 안내로 닫음.
- QA 상세: `.qa-test-automations/reports/2026-08-06-checkpoint-boss-pattern-report.md`.

## 위험

- 보스 입력과 기존 world tap이 중복 집계되거나 종료 직후 작전 카드로 전달될 수 있다.
- 저장 중 재접속 시 교차 순서·타이밍 상태가 손상되면 보스를 완료할 수 없게 될 수 있다.
- 타이밍 패턴이 저사양·reduced-motion·키보드에서 불공정할 수 있다.
- 세 패턴 설명이 8초 안에 읽히지 않으면 재미가 아니라 학습 부담이 된다.

# Plan — 체크포인트 보스 사건

## 목표

3구역 단위 8초 보스가 무페널티 실패와 성공 보상, 작전 회의 순서, 저장 호환 및 모바일 실제 플레이에서 검증됨

## 작업 범위

1. 3구역 체크포인트와 순환하는 보스 정의·목표 공식을 데이터 모듈로 만든다.
2. GameState에 보스 저장 상태, 시작·진행·성공·실패·건너뛰기·만료 복구를 구현한다.
3. 구역 완료 CTA와 비차단 중앙 보스 HUD를 연결하고, 종료 뒤에만 구역 완료·작전 회의를 실행한다.
4. 데이터/상태 단위 테스트와 모바일·데스크톱 E2E를 추가한다.
5. 신규 세이브 실제 플레이로 빈도·성공률·피버 상호작용·오류를 확인하고 필요한 범위 내 수치를 조정한다.
6. QA 메타데이터·구현노트·작업 체크리스트에 증적과 남은 위험을 기록한다.

## 검증 계획

- `npm test`: 보스 정의, 3구역 게이트, 성공/실패/건너뛰기, 보상, 저장 만료, 감사 초기화와 기존 회귀.
- `npm run build`: 프로덕션 번들.
- `QA_BASE_URL=http://localhost:5178 node scripts/_bosschecktest.mjs`: 모바일 390×844, 데스크톱, 접근성, 순서, 저장 복구, overflow.
- `QA_BASE_URL=http://localhost:5178 node scripts/_operationfevertest.mjs`: 기존 작전·피버 회귀.
- `QA_BASE_URL=http://localhost:5178 PLAY_DURATION_MS=120000 node scripts/_operationfeverplay.mjs`: GameState 값 주입 없는 신규 세이브 실제 플레이.
- 필수 검증: `npm-test`, `npm-run-build`, `playwright-boss-e2e`, `fresh-save-hands-on-play`

## 위험

- `GameState.js`는 경제·저장·오프라인·프레스티지의 공유 상태라 high risk다.
- 보스 완료와 작전 드래프트가 같은 3구역 경계에 있어 이벤트/모달 순서가 어긋나면 진행이 잠길 수 있다.
- 실시간 타이머가 앱 백그라운드·새로고침 경계에서 멈추거나 보상을 중복 지급할 수 있다.
- 보스 목표가 현재 생산을 그대로 따라가면 피버 이득이 상쇄되므로 비버프 스냅샷과 실제 버프 진행을 분리해야 한다.

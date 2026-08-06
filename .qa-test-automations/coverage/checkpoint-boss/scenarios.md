# 체크포인트 보스 시나리오

## SC-BOSS-001: 3구역 단위 보스 시작과 성공

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 3·6·9…구역의 진행도가 100%이고 열린 작전 드래프트가 없음 |

**왜 필요한가**: 보스가 일반 구역을 막거나 성공 보상을 중복 지급하면 핵심 성장 루프가 깨진다.

1. 체크포인트 완료 CTA를 누른다.
2. 생산과 탭으로 목표를 채운다.
3. 성공 결과 뒤 새 구역과 작전 회의를 확인한다.

**기대 결과**: 8초 타이머, 성공 보상 +35%, 구역 1회 전진, 작전 드래프트 1회.

## SC-BOSS-002: 실패와 건너뛰기의 무페널티 완료

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 체크포인트 보스가 진행 중 |

**왜 필요한가**: 방치형 사용자가 타임어택 때문에 영구 진행 벽을 만나지 않아야 한다.

**기대 결과**: 시간 만료와 건너뛰기 모두 추가 보상만 제외하고 기본 구역 보상·작전 회의를 유지한다.

## SC-BOSS-003: 저장·재접속 만료 복구

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 보스 진행 중 저장 후 제한 시간이 지난 상태 |

**왜 필요한가**: 모바일 백그라운드·프로세스 종료 뒤 진행이 잠길 수 있다.

**기대 결과**: 재접속 시 실패로 정리되고 `지역완료`가 가능하며 보상 중복은 없다.

## SC-BOSS-004: 비차단 UI와 작전 오선택 방지

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 모바일 또는 데스크톱에서 보스 진행/종료 |

**왜 필요한가**: 보스 카드가 세계 탭을 막거나 직전 연타가 작전 카드를 오선택하면 능동 플레이가 불공정해진다.

**기대 결과**: 세계 탭은 계속 집계되고 중앙 UI는 하나뿐이며, 작전 모달 개방 직후 450ms의 탭 전달은 무시된다.

## Traceability Matrix

| Scenario | Test cases | Test code | Evidence |
|---|---|---|---|
| SC-BOSS-001 | TC-BOSS-001, 002, 003, 007 | bosses.test.js, GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |
| SC-BOSS-002 | TC-BOSS-004, 005, 007 | GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |
| SC-BOSS-003 | TC-BOSS-006, 008 | GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |
| SC-BOSS-004 | TC-BOSS-007, 008 | _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |

# 체크포인트 보스 시나리오

## SC-BOSS-001: 3구역 단위 보스 시작과 성공

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 3·6·9…구역의 진행도가 100%이고 열린 작전 드래프트가 없음 |

**왜 필요한가**: 보스가 일반 구역을 막거나 성공 보상을 중복 지급하면 핵심 성장 루프가 깨진다.

1. 체크포인트 완료 CTA를 누른다.
2. 안내된 연타·교대·타이밍 패턴을 직접 조작해 목표를 채운다.
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

## SC-BOSS-005: 세 패턴 학습과 경제 격리

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 3·6·9구역 보스를 차례로 시작 |

**왜 필요한가**: 자동 생산이나 피버가 미니게임을 대신 깨면 보스의 손맛이 사라지고, 오입력이 진행을 깎으면 무페널티 원칙이 깨진다.

**기대 결과**: 3구역은 연타만, 6구역은 좌우 정답만, 9구역은 NOW 구간만 진행하며 자동 생산·다른 패턴 입력은 진행시키지 않는다.

## SC-BOSS-006: 후반 조합과 접근 가능한 단계 전환

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 12·15·18구역 조합 보스 진행 중 |

**왜 필요한가**: 8초 안에 컨트롤이 교체될 때 키보드 포커스나 규칙 안내가 끊기면 조합 자체가 불공정해진다.

**기대 결과**: 승인된 세 패턴만 2→2→3단계로 조합되고, 버튼으로 플레이 중이면 다음 단계 첫 컨트롤로 포커스가 이어지며 NOW와 판정 피드백이 라이브 영역에 전달된다.

## SC-BOSS-007: 구버전·패턴 세이브 호환

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 패턴 도입 전 active 보스 또는 타이밍 단계 중 저장 |

**왜 필요한가**: 구버전 throughput 목표가 작은 패턴 목표로 바뀌거나 타이밍 원점이 깨지면 재접속 결과가 달라진다.

**기대 결과**: 구버전 목표·진행은 레거시 경로로 유지하고, 패턴 세이브는 단계·부분 진행·타이밍 원점·남은 시간을 일관되게 복구한다.

## Traceability Matrix

| Scenario | Test cases | Test code | Evidence |
|---|---|---|---|
| SC-BOSS-001 | TC-BOSS-001, 002, 003, 007 | bosses.test.js, GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |
| SC-BOSS-002 | TC-BOSS-004, 005, 007 | GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |
| SC-BOSS-003 | TC-BOSS-006, 008 | GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |
| SC-BOSS-004 | TC-BOSS-007, 008 | _bosschecktest.mjs | evidence/2026-08-05/summary.yaml |
| SC-BOSS-005 | TC-BOSS-009, 010, 011, 012 | bosses.test.js, GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-06/checkpoint-boss-pattern-summary.yaml |
| SC-BOSS-006 | TC-BOSS-013, 015 | GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-06/checkpoint-boss-pattern-summary.yaml |
| SC-BOSS-007 | TC-BOSS-014 | GameState.checkpointBoss.test.js, _bosschecktest.mjs | evidence/2026-08-06/checkpoint-boss-pattern-summary.yaml |

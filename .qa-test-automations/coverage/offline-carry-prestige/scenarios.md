# 오프라인 이월·감사 판단 시나리오

## SC-OCP-001: 저장 세이브의 장시간 복귀

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 30초 이상 지난 v5 이하 로컬 세이브 |

**왜 필요한가**: 생성자 오프라인 계산에서 예외가 나면 실제 세이브가 신규 게임으로 대체될 수 있다.

**기대 결과**: 기존 구역·튜토리얼·자원을 유지한 채 v6로 정규화하고 오프라인 보상을 한 번 계산한다.

## SC-OCP-002: 현재 구역 반영과 초과 진행 이월

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 현재 구역이 일부 진행된 상태에서 1~8시간 복귀 |

**왜 필요한가**: 현재 목표를 넘긴 오프라인 표가 구역 진행에서 사라지면 장기 복귀 보람이 훼손된다.

**기대 결과**: 현재 구역을 채운 양과 초과 이월량의 합이 오프라인 표와 같고, 표·누적 통계는 한 번만 증가한다.

## SC-OCP-003: 하루 1회 2배와 정산 UI

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 오프라인 기본 보상 적용 후 2배 사용 가능 |

**왜 필요한가**: 2배가 구역 진행을 누락하거나 같은 보상을 여러 번 지급할 수 있다.

**기대 결과**: 같은 표·해명을 한 번 더 지급하고 현재 구역의 남은 공간 또는 이월함에 정확히 배분하며 재사용은 차단한다.

## SC-OCP-004: 보스·작전 앞 진행 정지

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 이월량이 여러 지역 목표를 채울 만큼 큼 |

**왜 필요한가**: 자동 이월이 체크포인트 보스나 작전 선택을 건너뛰면 기존 능동 루프가 사라진다.

**기대 결과**: 지역 완료 때만 다음 지역에 적용하고 3구역 보스, 이후 작전 회의에서 각각 멈춘다.

## SC-OCP-005: 감사 상대 증가율과 반응형 표시

| 항목 | 내용 |
|---|---|
| 리스크 | MEDIUM |
| 전제 조건 | 감사 가능 또는 준비 중 상태 |

**왜 필요한가**: 인장 `+N`만으로는 현재 감사하는 것이 유리한지 판단하기 어렵다.

**기대 결과**: 현재 대비 영구 생산 증가율과 추천 라벨을 탭·확인 모달에 보여주며 모바일·데스크톱에서 넘치지 않는다.

## Traceability Matrix

| Scenario | Test cases | Test code | Evidence |
|---|---|---|---|
| SC-OCP-001 | TC-OCP-001, 002, 009 | GameState.offlinePrestige.test.js | evidence/2026-08-06/summary.yaml |
| SC-OCP-002 | TC-OCP-003, 004 | GameState.offlinePrestige.test.js, _offlinecarrytest.mjs | evidence/2026-08-06/summary.yaml |
| SC-OCP-003 | TC-OCP-005, 007 | GameState.offlinePrestige.test.js, _offlinecarrytest.mjs | evidence/2026-08-06/summary.yaml |
| SC-OCP-004 | TC-OCP-006, 007 | GameState.offlinePrestige.test.js, _offlinecarrytest.mjs | evidence/2026-08-06/summary.yaml |
| SC-OCP-005 | TC-OCP-008 | GameState.offlinePrestige.test.js, _offlinecarrytest.mjs | evidence/2026-08-06/summary.yaml |

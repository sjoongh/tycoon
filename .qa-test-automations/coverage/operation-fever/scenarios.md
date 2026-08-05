# Operation Fever Scenarios

## SC-OPF-001: 12종 작전 드래프트는 유효하고 재현 가능하다

| 항목 | 내용 |
|---|---|
| AC 참조 | 전략형 구현노트의 12종·3구역 드래프트 |
| 리스크 | LOW |
| 전제 조건 | 구역, 감사 횟수, 현재 작전 선택이 주어짐 |

왜 필요한가: 새로고침 때 카드가 바뀌거나 한 계열이 빠지면 선택 신뢰가 깨진다.

## SC-OPF-002: 작전은 3구역마다 현재 감사 런에만 누적된다

| 항목 | 내용 |
|---|---|
| AC 참조 | 전략형 구현노트의 빈도·저장·감사 계약 |
| 리스크 | HIGH |
| 전제 조건 | 구 세이브 또는 작전 선택 세이브 |

왜 필요한가: 매 구역 팝업 재발, 저장 손상, 감사 후 잔류는 흐름과 경제를 함께 망친다.

## SC-OPF-003: 우세 계열이 12초 피버의 행동을 바꾼다

| 항목 | 내용 |
|---|---|
| AC 참조 | 전략형 구현노트의 현장·운영·대응 피버 |
| 리스크 | HIGH |
| 전제 조건 | 한 계열 작전이 우세하고 열기 99 이상 |

왜 필요한가: 세 계열이 모두 같은 배율이면 작전 선택이 다시 정답 누적으로 퇴행한다.

## SC-OPF-004: 피버는 피니셔·결산·30초 재정비로 한 사이클을 완성한다

| 항목 | 내용 |
|---|---|
| AC 참조 | 전략형 구현노트의 러시 통합·결산·재충전 |
| 리스크 | HIGH |
| 전제 조건 | 피버가 발동 중 |

왜 필요한가: 피니셔 중복이나 즉시 재충전은 경제 폭주와 상시 피버를 되살린다.

## SC-OPF-005: 반복 실제 플레이에서도 선택과 피버가 업무가 되지 않는다

| 항목 | 내용 |
|---|---|
| AC 참조 | 직접 플레이 성공 기준 |
| 리스크 | HIGH |
| 전제 조건 | 완전 신규 세이브, 모바일 390×844, GameState 주입 없음 |

왜 필요한가: 개별 함수가 맞아도 실제 속도에서 모달·피버 빈도가 과하면 재미 목표를 달성하지 못한다.

## Traceability Matrix

| AC | Scenario | Test Cases | Test Code | Evidence |
|---|---|---|---|---|
| 12종·결정적 3택1 | SC-OPF-001 | TC-OPF-001~002 | `src/data/operations.test.js` | `evidence/2026-08-05/summary.yaml` |
| 3구역·런 한정 저장 | SC-OPF-002 | TC-OPF-003~007, 014 | `src/state/GameState.operationFever.test.js` | `evidence/2026-08-05/summary.yaml` |
| 계열별 피버 | SC-OPF-003 | TC-OPF-008~011 | `src/state/GameState.operationFever.test.js` | `evidence/2026-08-05/summary.yaml` |
| 피니셔·결산·재정비 | SC-OPF-004 | TC-OPF-012~015 | 단위 테스트 + `_operationfevertest.mjs` | `evidence/2026-08-05/summary.yaml` |
| 180초 실제 플레이 | SC-OPF-005 | TC-OPF-016 | `scripts/_operationfeverplay.mjs` | `evidence/2026-08-05/summary.yaml` |

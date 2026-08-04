# Operation Fever Scenarios

## SC-OPF-001: 구역별 세 장 작전은 유효하고 재현 가능하다

| 항목 | 내용 |
|---|---|
| AC 참조 | 구현노트의 작전 3택1 |
| 리스크 | LOW |
| 전제 조건 | 구역과 감사 횟수가 주어짐 |

왜 필요한가: 재로드 때 카드가 바뀌거나 중복되면 선택 신뢰가 깨진다.

## SC-OPF-002: 작전은 현재 감사 런에만 안전하게 누적된다

| 항목 | 내용 |
|---|---|
| AC 참조 | 구현노트의 저장·감사 계약 |
| 리스크 | HIGH |
| 전제 조건 | 구 세이브 또는 작전 선택 세이브 |

왜 필요한가: 저장 손상이나 감사 후 잔류는 전체 경제를 왜곡한다.

## SC-OPF-003: 열기 100에서 10초 피버가 한 번만 발동한다

| 항목 | 내용 |
|---|---|
| AC 참조 | 구현노트의 10초 피버 |
| 리스크 | HIGH |
| 전제 조건 | 작전 1개 이상 선택 |

왜 필요한가: 중복 발동·오프라인 적용은 경제 폭주를 만든다.

## Traceability Matrix

| AC | Scenario | Test Cases | Test Code | Evidence |
|---|---|---|---|---|
| 작전 3택1 | SC-OPF-001 | TC-OPF-001~002 | `src/data/operations.test.js` | `evidence/2026-08-04/summary.yaml` |
| 런 한정 저장 | SC-OPF-002 | TC-OPF-003~006 | `src/state/GameState.operationFever.test.js` | `evidence/2026-08-04/summary.yaml` |
| 피버 플레이 | SC-OPF-003 | TC-OPF-007 | `scripts/_operationfevertest.mjs` | `evidence/2026-08-04/summary.yaml` |

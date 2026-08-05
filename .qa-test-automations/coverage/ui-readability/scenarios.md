# UI Readability Scenarios

## SC-UIR-001: 중앙의 중요 메시지는 한 번에 하나만 노출된다

| 항목 | 내용 |
|---|---|
| AC 참조 | 구현노트의 중앙 메시지 단일화 |
| 리스크 | HIGH |
| 전제 조건 | 구역 진입·작전 채택·업적·위기 이벤트가 같은 틱에 발생 |

왜 필요한가: 서로 다른 배너와 토스트 큐가 동시에 실행되면 핵심 성취를 읽지 못하고 피버 결산까지 가린다.

## SC-UIR-002: 모바일의 본문과 조작 표적이 읽고 누를 수 있다

| 항목 | 내용 |
|---|---|
| AC 참조 | 본문 11px·라벨 10px·주요 조작 44px |
| 리스크 | MEDIUM |
| 전제 조건 | 390×844 및 360×740 뷰포트 |

왜 필요한가: 픽셀 폰트는 작은 크기에서 획이 빠르게 뭉개지고, 작은 닫기·설정 버튼은 실기기 오입력을 만든다.

## SC-UIR-003: 진행 애니메이션은 layout을 흔들지 않고 감속 설정을 따른다

| 항목 | 내용 |
|---|---|
| AC 참조 | width transition 제거와 reduced-motion 보존 |
| 리스크 | MEDIUM |
| 전제 조건 | 구역 진행 50%, 체제 위기 50%, 감속 모드 |

왜 필요한가: 잦은 changed 이벤트에서 width 갱신은 layout 비용을 만들고 감속 사용자의 설정을 무시할 수 있다.

## SC-UIR-004: 실제 고강도 플레이의 작전·피버 사이클은 그대로다

| 항목 | 내용 |
|---|---|
| AC 참조 | 게임 규칙·경제·저장 비변경 |
| 리스크 | HIGH |
| 전제 조건 | 신규 세이브, 상태 주입 없음, 모바일 390×844 |

왜 필요한가: 시각 중복 제거가 상태 이벤트나 작전 선택을 실수로 누락시키면 핵심 루프가 깨진다.

## Traceability Matrix

| AC | Scenario | Test Cases | Test Code | Evidence |
|---|---|---|---|---|
| 중앙 단일 알림 | SC-UIR-001 | TC-UIR-001~002 | `scripts/_uireadabilitytest.mjs` | `evidence/2026-08-05/summary.yaml` |
| 모바일 가독성·조작성 | SC-UIR-002 | TC-UIR-003~004 | `scripts/_uireadabilitytest.mjs` | `evidence/2026-08-05/summary.yaml` |
| transform·감속 | SC-UIR-003 | TC-UIR-005~006 | `scripts/_uireadabilitytest.mjs` | `evidence/2026-08-05/summary.yaml` |
| 게임 루프 보존 | SC-UIR-004 | TC-UIR-007~008 | unit + operation E2E | `evidence/2026-08-05/summary.yaml` |

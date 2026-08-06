# Mobile Runtime Scenarios

## SC-MRT-001: 연타의 첫 반영은 즉시, 후속 반영은 100ms 안에 합쳐진다

| 항목 | 내용 |
|---|---|
| AC 참조 | 사용자 승인 A안 |
| 리스크 | HIGH |
| 전제 조건 | 모바일 390×844, 60회 상태 변경을 약 16ms 간격으로 발생 |

왜 필요한가: 모든 상태 이벤트마다 큰 패널을 다시 만들면 프레임이 끊기고, 반대로 첫 갱신까지 늦추면 구매·진행 반응이 둔하게 느껴진다.

## SC-MRT-002: 렌더 예약의 경계 상태가 마지막 화면을 잃지 않는다

| 항목 | 내용 |
|---|---|
| AC 참조 | 숨김 복귀·강제 갱신·destroy 안전성 |
| 리스크 | HIGH |
| 전제 조건 | trailing 예약 뒤 visibility 변경 또는 직접 refresh/cancel |

왜 필요한가: pending 플래그나 rAF가 남으면 복귀 뒤 후속 상태가 영구적으로 누락되거나 파괴된 UI가 다시 그려질 수 있다.

## SC-MRT-003: 긴 목표 목록과 HUD가 값만 바뀔 때 DOM 구조를 보존한다

| 항목 | 내용 |
|---|---|
| AC 참조 | 목표 부분 갱신·HUD 쓰기 캐시 |
| 리스크 | HIGH |
| 전제 조건 | 304노드 목표 목록, 중간 스크롤, 구조/값 변경 각각 발생 |

왜 필요한가: 전체 재생성은 스크롤·포커스를 흔들고, 잘못된 부분 갱신은 보상 버튼과 진행률을 오래된 상태로 남긴다.

## SC-MRT-004: 첫 화면에서 Firebase SDK가 핵심 게임과 경쟁하지 않는다

| 항목 | 내용 |
|---|---|
| AC 참조 | 첫 입력 또는 5초 뒤 클라우드 시작 |
| 리스크 | HIGH |
| 전제 조건 | 신규 페이지, 첫 700ms 네트워크 관찰 |

왜 필요한가: 모바일에서 큰 인증·Firestore 청크를 즉시 읽고 파싱하면 첫 화면과 폰트 표시가 늦어진다.

## SC-MRT-005: 성능 최적화 뒤 기존 게임과 저장 의미가 유지된다

| 항목 | 내용 |
|---|---|
| AC 참조 | 게임 규칙·Firestore 저장 의미 비변경 |
| 리스크 | HIGH |
| 전제 조건 | 단위 68개, 4개 기존 E2E, 상태 주입 없는 70초 플레이 |

왜 필요한가: 렌더 소비자와 초기화 시점 변경이 작전·피버·보스·오프라인·멀티기기 저장을 간접적으로 깨뜨릴 수 있다.

## Traceability Matrix

| AC | Scenario | Test Cases | Test Code | Evidence |
|---|---|---|---|---|
| 첫 반영·합류 예산 | SC-MRT-001 | TC-MRT-001~002 | `scripts/_mobileperformancetest.mjs` | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 예약 경계 | SC-MRT-002 | TC-MRT-003~004 | `scripts/_mobileperformancetest.mjs` | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 목표·HUD 보존 | SC-MRT-003 | TC-MRT-005~006 | performance + readability E2E | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 초기 클라우드 지연 | SC-MRT-004 | TC-MRT-007 | performance E2E | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 전체 의미 회귀 | SC-MRT-005 | TC-MRT-008 | unit + 4 E2E + hands-on | `evidence/2026-08-06/mobile-runtime-summary.yaml` |

# 사건 체인 결말 시나리오

## SC-EVC-001: 데이터 주도형 3단계 분기

| 항목 | 내용 |
|---|---|
| 리스크 | MEDIUM |
| 전제 조건 | 체인 3종과 각 단계·결말 데이터 로드 |

**왜 필요한가**: 단계나 결말 id가 중복되거나 효과 키가 어긋나면 저장 복구와 경제 수식이 깨진다.

**기대 결과**: 각 체인은 3단계·좌우 선택·원칙/돌파/혼합 결말을 가지며 모든 id와 효과 키가 유효하다.

## SC-EVC-002: 자연 발생과 후속 사건 보장

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 사건 대응 가능, 2구역 이상 |

**왜 필요한가**: 체인이 일반 사건 RNG에 다시 섞이면 사용자가 앞 이야기를 잊거나 결말을 보지 못한다.

**기대 결과**: 35% 확률로 시작하고 일반 사건 두 번 뒤에는 반드시 시작하며, 시작 뒤 다음 두 사건은 같은 체인의 후속편이다.

## SC-EVC-003: 결말 보상과 런 효과

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 체인 3단계의 선택 완료 |

**왜 필요한가**: 선택 결과가 이름만 다른 카드이거나 영구 경제를 오염시키면 반복 플레이의 의미와 기존 밸런스가 동시에 무너진다.

**기대 결과**: 선택 조합에 맞는 결말, 즉시 보상, 생산/탭/해명/사건 보상 중 런 한정 효과가 적용되고 결말 발견은 영구 기록된다.

## SC-EVC-004: 저장·감사·체제 전복 경계

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | v6 이하 저장 또는 진행 중/완료 체인 저장 |

**왜 필요한가**: 재접속 시 후속 단계가 되감기거나 런 효과가 감사 뒤 남으면 사용자 선택과 경제가 불일치한다.

**기대 결과**: v7로 정규화하고 진행 단계·선택·효과를 복구하며, 감사·전복은 런 상태만 지우고 결말 도감은 보존한다.

## SC-EVC-005: 사건 탭과 결말 카드

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 모바일 390×844와 데스크톱 1280×900 |

**왜 필요한가**: 단계·보상·효과가 보이지 않거나 결과 카드가 다른 중앙 연출과 겹치면 새 시스템을 이해할 수 없다.

**기대 결과**: 1/3 단계 배지, 후속 CTA, 결말 1/9, 런 효과, 결과 카드가 명확히 보이고 44px 터치·무가로 overflow·중앙 큐 직렬화를 지킨다.

## SC-EVC-006: 실제 반복 루프 공존

| 항목 | 내용 |
|---|---|
| 리스크 | HIGH |
| 전제 조건 | 신규 세이브 5분 능동 플레이 |

**왜 필요한가**: 결말 모달이나 저장이 보스·작전·피버·구역 진행을 막는 장기 교착은 짧은 기능 E2E로 놓칠 수 있다.

**기대 결과**: 자연 사건 주기로 체인 하나를 완주한 뒤에도 기존 성장 루프가 중단되지 않고 콘솔·페이지 오류가 없다.

## Traceability Matrix

| Scenario | Test cases | Test code | Evidence |
|---|---|---|---|
| SC-EVC-001 | TC-EVC-001~003 | eventChains.test.js | evidence/2026-08-06/event-chain-endings-summary.yaml |
| SC-EVC-002 | TC-EVC-004~006 | GameState.eventChains.test.js, _eventchainplaytest.mjs | evidence/2026-08-06/event-chain-endings-summary.yaml |
| SC-EVC-003 | TC-EVC-007~009 | GameState.eventChains.test.js, _eventchainplaytest.mjs | evidence/2026-08-06/event-chain-endings-summary.yaml |
| SC-EVC-004 | TC-EVC-010~012 | GameState.eventChains.test.js | evidence/2026-08-06/event-chain-endings-summary.yaml |
| SC-EVC-005 | TC-EVC-013~015 | _eventchainplaytest.mjs | evidence/2026-08-06/event-chain-endings-summary.yaml |
| SC-EVC-006 | TC-EVC-016 | _operationfeverplay.mjs | evidence/2026-08-06/event-chain-endings-summary.yaml |

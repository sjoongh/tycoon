# 2026-08-05 작전·피버 전략형 재설계

## 목표 / 확정 사항
- 기존 픽셀 개표국 세계관, 표·해명·믿음 경제, 모바일 우선 구조를 보존한다.
- 작전 선택을 매 구역에서 3구역마다로 줄이고, 한 번의 선택은 더 강하고 읽기 쉽게 만든다.
- 작전을 12종으로 확장하고 현장·운영·대응 계열이 서로 다른 피버를 만든다.
- 피버 종료 뒤 30초 재충전 구간을 두어 상시 피버를 막고, 기존 긴급 개표는 피버의 피니셔로 통합한다.
- 피버 결산과 현재 작전 현황을 제공해 선택 결과와 성장을 다시 확인할 수 있게 한다.

## Gate evidence
- 질문: 작전·피버 재설계 강도를 `전략형 재설계`, `핵심형 개선`, `최소 조정`으로 제시했다.
- 사용자 답: `응 1번승인`
- 승인된 범위: 3구역마다 작전 선택, 12종 작전, 계열별 피버, 30초 재충전, 러시 피니셔, 피버 결산, 작전 현황과 관련 저장·UI·테스트.
- 미승인 가정: 3구역 보스 사건, 전반 연출 충돌/소형 텍스트 정리, 신규 통화·과금·광고는 이번 구현에서 제외한다.

### Design gate evidence

#### Mode and lock
- Mode: `small-feature`
- Application source writes: `unlocked`

#### Product interview
- [x] A real user answer or explicit summary approval was received
- Question: 직접 플레이·유사 게임 후기 분석을 바탕으로 세 가지 재설계 강도를 제시했다.
- User answer: `응 1번승인`
- Confirmed user, job, differentiation, success and failure criteria: 사용자는 감사 런의 방향을 스스로 만들고 30~60초 간격의 피버 절정을 기대한다. 선택 팝업이 반복 업무가 되거나 피버가 상시 유지되면 실패다.

#### Design-direction interview
- [x] Existing visual direction and scope guard were explicitly accepted for this small feature
- Question: 기존 픽셀 세계관을 유지하는 작전·피버 한정 전략형 재설계를 승인할지 확인했다.
- User answer: `응 1번승인`

#### Visual-world decision
- [x] Not required: incumbent visual world is preserved; this is not `new`, `rebrand`, or visual-world replacement.
- Options: 기존 픽셀 프레임·금색 성취색·현장/운영/대응 계열색을 확장한다.
- User choice: 전략형 재설계.

#### High-fidelity comps
- [x] Not required for a scoped existing-world small feature.
- Comp paths or URLs: 기존 작전 모달·피버 HUD·사건 선택 모달을 시각 정본으로 사용한다.
- User decision: `approve`
- Adopt: 기존 버튼·모달·픽셀 테두리·Galmuri 계열 서체·모바일 세로 밀도.
- Reject: 전역 팔레트·서체·레이아웃 교체, 별도 보스 사건 UI, 일반적인 유리 카드/그라디언트 장식.

#### Implementation unlock
- [x] Every required small-feature gate above is complete
- Implementation unlocked: `yes`

## 계획
1. 작전 정의를 계열별 4종으로 확장하고, 3구역 주기의 결정적 드래프트와 추천 근거를 만든다.
2. GameState에 계열 우세 판정, 대기/발동/피니셔/회복 상태, 피버 세션 통계와 구 세이브 정규화를 구현한다.
3. 작전 카드에 쉬운 효과 문구·추천 이유를, HUD에 작전 현황·계열 피버·피니셔·결산을 연결한다.
4. 정상·경계·구 세이브·감사 초기화 단위 테스트와 모바일/데스크톱 실제 플레이를 검증한다.

## 판단 근거
- Delight thesis: 사용자가 3구역의 노력을 끝낼 때 “내가 고른 개표 방식이 다음 피버의 성격을 바꾼다”고 느끼고, 피버 마지막 3초에는 직접 마감 버튼을 누르고 싶어야 한다.
- 계열 동률은 마지막으로 고른 작전 계열을 우선해 방금 한 선택의 결과를 즉시 체감하게 한다.
- 구 세이브의 이미 열린 작전 드래프트는 보존하고, 이후 완료 구역부터 3구역 주기를 적용한다.
- 수치 튜닝은 기존 경제를 깨지 않는 범위에서 단위 테스트와 3분 직접 플레이로 조정한다.
- 유사 장르 대조 결과, Cookie Clicker의 간헐적 클릭 보너스처럼 능동 행동은 강한 가속 장치로 두되 상시 의무가 되지 않게 하고, Realm Grinder의 계열별 플레이 스타일처럼 선택 결과가 실제 배율·행동 보상 차이로 이어지게 한다. Idle Slayer의 능동 미니게임/방치 진행 병행과 사용자 후기의 "깨끗하고 재촉하지 않는 UI"도 반복 팝업을 줄이는 근거로 삼았다.
- 추가 120초 신규 세이브 UI 플레이에서 운영 고정은 21구역·작전 6회, 대응 고정은 18구역·작전 5회에 도달했다. 양쪽 모두 피버·피니셔·재정비 각 2회, 오류 0건이라 12초/30초/마지막 4초 수치는 유지한다.
- 추천은 현재 감사 런의 누적 행동 통계에 기반하므로 `최근`이라는 표현 대신 `이번 런 … 성향`으로 정확히 안내한다.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)
- ⚠️ 로컬 URL 대상 Impeccable detector는 Firebase/Analytics 장기 연결 때문에 30초 navigation timeout으로 렌더 결과를 만들지 못했다. → 택한 보수적 대안: 같은 localhost를 Playwright 모바일/desktop으로 렌더링해 overflow·console·터치·focus·reduced-motion을 검증하고 detector 미완을 공개한다. → 리뷰: [x] 2026-08-05 사용자와 리뷰 — 그대로 승인 (`응 그래`)

## 구현 결과
- `src/data/operations.js`: 계열별 4종, 총 12종 작전과 현장·운영·대응 피버 프로필을 정의했다.
- `src/state/GameState.js`: 3구역 주기 드래프트, 행동 기반 추천, 계열 우세, 12초 피버, 마지막 4초 1회 피니셔, 30초 재정비, 결산·저장 v4 정규화를 구현했다.
- `src/ui/DOMHud.js`, `src/ui/DOMModalLayer.js`, `src/ui/dom-ui.css`, `src/world/WorldView.js`: 44px 작전 HUD, 작전 현황, 계열별 피버 피드백, 비차단 6초 결산을 기존 픽셀 UI에 연결했다.
- 기존 긴급 개표 FAB는 별도 20초 ×5 버프에서 피버 마지막 4초의 `막판 총력`으로 통합했다.
- 결산은 반복 플레이를 막지 않도록 모달 대신 닫기 가능·자동 종료되는 상태 패널로 제공한다.

## 검증
- `npm test -- --run`: 10 files, 51/51 pass.
- `npm run build`: pass. Phaser/Firebase 대형 청크 경고는 기존 번들 구조로 범위 밖이다.
- `QA_BASE_URL=http://localhost:5178 node scripts/_operationfevertest.mjs`: 모바일 390×844 / desktop 1280×900 pass. 추천 1개, 카드 3장, 최소 96px 카드 높이, 작전 현황, 피버, 피니셔, 결산, 재정비, reload, overflow 없음, focus, reduced-motion을 확인했다.
- `QA_BASE_URL=http://localhost:5178 PLAY_DURATION_MS=180000 node scripts/_operationfeverplay.mjs`: GameState 값 주입 없는 신규 세이브 고강도 플레이 pass. 1,452탭·92증설·4사건·27구역 완료에서 작전 9회, 피버/피니셔/재정비 각 4회, 오류 0건이었다.
- `OPERATION_FAMILY=build|response PLAY_DURATION_MS=120000 node scripts/_operationfeverplay.mjs`: 운영·대응 고정 신규 세이브 플레이 pass. 운영은 21구역·작전 6회, 대응은 18구역·작전 5회였고 양쪽 모두 피버/피니셔/재정비 각 2회, 오류 0건이었다.
- `impeccable detect src`: 8건. 모두 기존 픽셀 side accent 5건과 기존 width transition 3건이며 신규 finding은 없다.
- `impeccable detect http://localhost:5178/`: 30초 navigation timeout. 위 Playwright 렌더 행렬로 보완했으나 detector 자체는 미완으로 남긴다.

## 다음에 참고 (unknown 대응 이력)
- 전반 연출 충돌·소형 텍스트 개선과 3구역 보스 사건은 사용자 요청대로 후속 단계로 분리한다.
- 피버 결산처럼 약 45초마다 반복되는 피드백은 모달이 아니라 비차단 패널로 제공해야 새 팝업 업무가 되지 않는다.

## 사용자 이해 확인
- 질문: 작전 회의 주기, 피버 재정비 시간, 막판 총력 사용 시점·횟수를 확인했다.
- 사용자 답: `니가 정해 테스트해보면서 뭐가 더 나을지 또는 비슷한 유형의 게임들에서는 어떻게 하는지 찾던가`
- 결과: 사용자는 문답 대신 플레이·유사 게임 근거에 따른 자율 판단을 요청했다. 정답은 각각 `3구역마다`, `30초`, `피버 마지막 4초에 1회`이며 재시험 없이 실제 플레이 검증으로 마무리한다.

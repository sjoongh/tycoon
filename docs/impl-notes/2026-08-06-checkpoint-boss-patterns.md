# 2026-08-06 체크포인트 보스 패턴 차별화

## 목표 / 확정 사항

- 이름과 문구만 다르고 같은 8초 게이지를 쓰는 보스 6종에 실제 조작 차이를 만든다.
- 패턴은 `연타 처리전`, `좌우 교차 검수`, `타이밍 봉인` 세 종류로 제한한다.
- 후반 보스는 새 규칙을 계속 추가하지 않고 승인된 세 패턴의 속도·연속 성공 조건을 조합한다.
- 실패·건너뛰기는 기존처럼 페널티가 없고, 성공 시 구역 완료 표 보상 +35%를 유지한다.
- 기존 픽셀 보스 카드, 모바일 44px 터치, 키보드, reduced-motion, 저장·작전 회의 순서를 보존한다.

## Gate evidence

- 질문: `A — 3종 마이크로 패턴 조합`, `B — 보스 6종 완전 고유 미니게임`, `C — 기존 게이지에 수치 조건만 변경`을 제시했다. 공통 보존 조건은 무페널티 실패, 성공 +35%, 기존 픽셀 HUD와 키보드·모바일 조작이었다.
- 사용자 답: `A로 가자`
- 승인된 범위: 세 마이크로 패턴의 보스별 배치·후반 조합, 상태·저장 호환, 보스 HUD 상호작용, 단위·E2E·실제 플레이 검증.
- 미승인 가정: 신규 통화, 성공 보상 변경, 실패 페널티, 전역 UI 개편, 별도 대형 아트·사운드 제작은 하지 않는다.

### Design gate evidence

#### Mode and lock

- Mode: `small-feature`
- Application source writes: `unlocked`

#### Product interview

- [x] A real user answer or explicit summary approval was received
- Question: 현재 실제 규칙이 같은 보스 6종의 차별화 강도를 세 안으로 제시했다.
- User answer: `A로 가자`
- Confirmed user, job, differentiation, success and failure criteria: 반복 플레이 사용자는 3구역 끝의 8초 검증에서 즉시 이해되는 다른 손동작을 원한다. 세 패턴이 구분되고 반복해도 피곤하지 않으면 성공이며, 규칙 학습이 길거나 실패가 성장 벽이 되면 실패다.

#### Design-direction interview

- [x] Existing visual direction and scope guard were explicitly accepted for this small feature
- Question: A안은 기존 픽셀 HUD·44px 조작·접근성과 무페널티 규칙을 유지한다고 함께 제시했다.
- User answer: `A로 가자`

#### Visual-world decision

- [x] Not required: 기존 픽셀 개표국 visual world를 보존하는 small feature다.
- Options: 기존 이벤트색 보스 카드와 금색 성공색을 재사용하며 패턴별 조작만 구분한다.
- User choice: A안의 기존 HUD 보존.

#### High-fidelity comps

- [x] Not required: 기존 보스 카드 한 컴포넌트 안의 상태 확장이며 새 화면·대표 composition을 만들지 않는다.
- Comp paths or URLs: 기존 `.gp-boss` 모바일·desktop 기준 화면.
- User decision: `approve`
- Adopt: 픽셀 테두리, Galmuri 글꼴, 이벤트 red/gold, 비차단 중앙 카드, 명시적 진행·시간 표시.
- Reject: 전역 palette·typography 변경, 새 modal shell, 유리 카드·부드러운 일반 UI, 새 이미지 의존성.

#### Implementation unlock

- [x] Every required small-feature gate above is complete
- Implementation unlocked: `yes`

## 계획

1. 보스 정의에 패턴·목표·안내 문구를 데이터화하고 구 세이브를 보수적으로 정규화한다.
2. GameState에 패턴별 시작·입력·진행·성공·만료 API를 구현하되 기존 throughput API 호환을 유지한다.
3. 기존 보스 카드 안에 44px 이상 조작과 명확한 키보드·ARIA 상태를 추가한다.
4. 보스별 단위 테스트와 모바일/desktop E2E, 무상태 주입 직접 플레이를 수행한다.
5. 전체 단위·빌드·기존 작전/피버·가독성·오프라인 회귀와 Impeccable 검사를 수행한다.

## 판단 근거

- 현재 `checkpointBosses` 6종은 제목·설명만 다르고 duration·target·progress 경로가 동일하다.
- delight thesis: 사용자는 3구역을 끝낸 순간 단순히 더 큰 게이지가 아니라, 감사관의 요구를 손으로 읽고 8초 안에 통과했다는 짧은 숙련감을 느껴야 한다.
- 세 패턴만 학습하면 이후에는 속도와 연속 성공으로 깊이를 만들 수 있어 6개의 독립 미니게임보다 반복 피로와 유지보수 위험이 작다.
- 무페널티 실패와 건너뛰기를 유지해 방치형 흐름을 막지 않는다.

## 구현 결과

- 3구역 `연타 처리전`, 6구역 `좌우 교대 검인`, 9구역 `타이밍 봉인`으로 세 패턴을 하나씩 학습시킨다.
- 12구역은 연타→교대, 15구역은 교대→타이밍, 18구역은 연타→교대→타이밍으로만 조합한다.
- 새 보스 목표는 생산량이 아닌 직접 행동 횟수다. 자동 생산·콤보 보너스·피버 피니셔·기존 수치 진행 API는 패턴 보스를 대신 완료하지 않는다.
- 오입력은 진행을 깎지 않고 즉시 피드백한다. 실패·건너뛰기는 기존처럼 무페널티이며 성공 +35%와 후속 작전 회의 순서를 유지한다.
- 조작은 최소 44px 버튼, 키보드 네이티브 입력, 단계 전환 포커스 인계, NOW·판정 라이브 안내를 제공한다.
- `patternVersion`이 없는 진행 중 구버전 보스는 저장된 throughput 목표를 그대로 쓰며, 새 패턴 세이브는 단계·부분 진행·타이밍 원점을 복구한다.

## 검증 결과

- `npm test`: 13 files, 76/76 PASS.
- `npm run build`: PASS. 새 한글 문구를 포함하도록 Galmuri subset 산출물을 갱신했다.
- `scripts/_bosschecktest.mjs`: 모바일 390×844와 데스크톱 1280×900에서 세 패턴, 최종 조합, 키보드 전용 완료, 44px, overflow, reduced-motion, 성공·실패·건너뛰기·작전 오입력 가드·만료 복구 PASS.
- 무주입 실플레이: 240초, 2,246탭, 42구역, 보스 13회 성공·0회 실패·14번째 진행 중, 작전 13회, 피버 5회, 오류 0. `rapid`, `alternate`, `timing` 모두 반복 확인했다.
- Impeccable source detector: 변경 전후 동일한 기존 side-tab 4건만 남았고 보스 코드 신규 탐지는 0건이다. URL detector는 완료했으며 기존 전역 픽셀 UI 관련 탐지가 남는다.
- 스크린샷: `.qa-test-automations/evidence/2026-08-06/screenshots/SC-BOSS-PATTERN-*`, `SC-OPF-004-hands-on-adaptive-240s.png`.

## Claude 교차 리뷰

- `fable-delegate` review 모드, resolved models `claude-fable-5`, `claude-haiku-4-5-20251001`, effort `high`, cost `$0.47477`.
- 교차 리뷰가 지적한 구버전 active 세이브와 전 패턴 키보드 증거 공백을 로컬 소스에서 확인했다.
- 레거시 목표 보존·타이밍 중간 저장 회귀 테스트를 추가하고, 조합 단계 포커스 인계·키보드 교대/타이밍·NOW 라이브 안내를 구현해 E2E로 닫았다.
- 빠른 입력의 이중 집계 우려는 보스 버튼의 전파 차단과 실제 E2E에서 입력당 +1로 검증했다.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)

- 없음.

## 다음에 참고 (unknown 대응 이력)

- 보스 성공 직후 작전 카드로 연속 탭이 전달되던 과거 이력이 있으므로 패턴 조작은 boss 종료 시 즉시 비활성화하고 기존 2단계 작전 확정을 보존한다.
- 보스 상태는 저장 중 재접속될 수 있으므로 패턴의 다음 입력·연속 성공도 정규화 대상이다.

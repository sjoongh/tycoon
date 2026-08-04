# 2026-08-04 작전 카드와 개표 피버

## 목표 / 확정 사항
- 기존 픽셀 풍자 세계관과 표·해명·믿음 경제는 보존한다.
- 구역 돌파마다 세 가지 작전 중 하나를 선택해 감사 전까지 누적하는 로그라이크식 빌드를 추가한다.
- 선택한 플레이 행동으로 열기 게이지를 채우고, 가득 차면 10초 동안 개표 피버가 발동한다.
- 모바일 390×844를 우선하며 desktop에서도 같은 기능을 제공한다.

## Gate evidence
- 질문: `작전 카드 + 개표 피버`, `3구역마다 보스 사건`, `랜덤 수집 드롭` 중 이번 패치의 중심을 무엇으로 할지 제시했다.
- 1차 사용자 답: `ㄱㄱ 시작해` — dev-protocol상 선택 승인으로 확대하지 않고 재확인했다.
- 재확인 질문: `1번 추천안인 작전 카드 + 개표 피버로 진행할까요?`
- 사용자 답: `응 진행해 게임관련 스킬 있으면 쓰면서 구현하고 ㄱㄱ`
- 승인된 범위: 작전 3택1, 감사 전까지의 런 빌드, 행동 연계 열기, 10초 피버, 기존 스타일을 사용한 선택 모달·HUD, 관련 저장·감사 초기화·테스트.
- 미승인 가정: 별도 보스 사건, 신규 수집 통화, 광고·과금·푸시 알림은 구현하지 않는다.

### Design gate evidence

#### Mode and lock
- Mode: `small-feature`
- Application source writes: `unlocked`

#### Product interview
- [x] A real user answer or explicit summary approval was received
- Question: 세 가지 재미 개선 방향을 비교 제시하고 추천안을 재확인했다.
- User answer: `응 진행해 게임관련 스킬 있으면 쓰면서 구현하고 ㄱㄱ`
- Confirmed user, job, differentiation, success and failure criteria: 기존 게임 사용자가 구역마다 다른 플레이 결정을 하고 피버 직전의 기대감 때문에 다음 행동·다음 구역을 이어간다. 기존 시스템을 가리는 모달 남발이나 단순 통화 추가로 끝나면 실패다.

#### Design-direction interview
- [x] Existing visual direction and scope guard were explicitly accepted for this small feature
- Question: 기존 비주얼을 유지하는 `small-feature` 범위의 추천 메커닉을 승인할지 재확인했다.
- User answer: `응 진행해`

#### Visual-world decision
- [x] Not required: incumbent visual world is preserved; this is not `new`, `rebrand`, or visual-world replacement.
- Options: 기존 픽셀 개표국 컴포넌트·토큰·모션을 그대로 확장한다.
- User choice: 1번 추천안 진행.

#### High-fidelity comps
- [x] Not required for a scoped existing-world small feature.
- Comp paths or URLs: 기존 모바일 런타임 화면을 정본으로 사용.
- User decision: `approve`
- Adopt: 픽셀 프레임, Galmuri 폰트, 금색 성취색, 모바일 세로 밀도.
- Reject: 전역 팔레트·서체 교체, 신규 비주얼 월드, 일반적인 유리 카드/그라디언트 장식.

#### Implementation unlock
- [x] Every required small-feature gate above is complete
- Implementation unlocked: `yes`

## 계획
1. 작전 정의와 결정적 3장 드래프트를 데이터 모듈로 분리한다.
2. GameState에 런 한정 작전·피버 상태, 저장 정규화, 경제 효과, 행동별 열기를 배선한다.
3. 구역 완료 작전 선택 모달과 항상 읽히는 피버 HUD를 기존 UI 패턴으로 추가한다.
4. 단위 테스트로 구 세이브 호환·선택·피버·감사 초기화를 검증하고 Playwright로 실제 흐름을 검증한다.

## 판단 근거
- Delight thesis: 사용자가 구역을 넘길 때마다 “이번 감사 런의 성격을 내가 만들고 있다”고 느끼고, 열기 100 직전에는 한 행동만 더 하고 싶어야 한다.
- 신규 통화나 독립 메뉴보다 기존 구역·탭·사건·브리핑·필드 수집을 하나의 기대감 게이지로 묶는 편이 현재 시스템을 더 재미있게 만든다.
- 피버는 오프라인 생산에는 적용하지 않고 실시간 행동에만 적용해 재방문 보상과 액티브 플레이의 역할을 분리한다.
- 작전 드래프트는 구역 완료라는 의미 있는 순간에만 나타나며, 평상시 클릭을 모달로 방해하지 않는다.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)
- ⚠️ 첫 탭 작전 `수개표`를 비율 증가에서 `클릭 +1`로 조정했다. 초반 클릭력이 1일 때 `+12%`는 기존 정수 반올림 때문에 선택 직후 수치가 전혀 달라지지 않아, 첫 선택의 손맛과 카드 설명의 신뢰가 사라졌기 때문이다. 범위와 시스템 계약은 유지하며 밸런스 표현만 바꿨다. → 리뷰: [x] 2026-08-04 사용자와 리뷰 — `그대로 승인 ㄱㄱ`

## 구현 결과

- `src/data/operations.js`: 탭·성장·대응 3계열 6종 작전과 결정적 드래프트를 추가했다.
- `src/state/GameState.js`: 구 세이브 정규화, 작전 선택·누적, 행동별 열기, 10초 ×2 피버, 감사 초기화를 추가했다.
- `src/ui/DOMModalLayer.js`, `src/ui/DOMHud.js`, `src/world/WorldView.js`: 선택 모달, 열기 게이지, 피버 시각·수치 피드백을 기존 픽셀 UI에 연결했다.
- 자동 보좌관 행동은 열기를 채우지 않게 해 피버를 사용자의 능동 플레이 보상으로 유지했다.

## 검증

- `npm test -- --run`: 10 files, 45/45 pass.
- `npm run build`: pass. Phaser 대형 청크 경고는 기존 번들 구조로 이번 범위 밖이다.
- `node scripts/_operationfevertest.mjs`: 모바일 390×844 및 desktop 1280×900 pass. 3장 드래프트, 첫 카드 포커스, 70px 터치 대상, 선택 저장, 열기 98→실제 탭→피버 ×2, reload 복구, overflow 없음, reduced-motion을 확인했다.
- `impeccable detect src`: 이번 변경에서 신규 위반 0. 보고된 8건은 기존 side-tab/width transition 스타일이다.
- `impeccable detect http://localhost:5178/`: Firebase/Analytics 장기 연결로 30초 navigation timeout. Playwright 렌더 E2E는 통과했지만 detector 자체의 미완으로 공개한다.

## 다음에 참고 (unknown 대응 이력)
- `PRODUCT.md`와 `DESIGN.md`는 없지만 기존 CSS·도트 에셋·런타임 화면이 강한 디자인 정본이다. 좁은 기능에서는 새 정본을 발명하지 않는다.
- `.claude/references/architecture.md` 등 `/develop` 기본 문서는 저장소에 없어 기존 Phaser/Vite 코드 패턴을 직접 정본으로 삼는다.

## 인수 퀴즈

- 2026-08-04 사용자 답: 작전 카드 미인지, 개표 피버 `C`, 수개표 조정 이유 미인지.
- 결과: 개표 피버의 `능동 행동으로 열기 100 → 10초간 실시간 ×2`는 정답.
- 보충 설명: 작전 카드는 구역을 깰 때 뜨는 세 가지 강화 선택지이며 선택한 효과는 감사 전까지 쌓인다. 수개표 `클릭 +1`은 초반 `+12%`가 반올림되어 선택 직후 아무 변화도 보이지 않는 문제를 피한 것이다.
- 재시험: dev-protocol 규칙에 따라 없음.

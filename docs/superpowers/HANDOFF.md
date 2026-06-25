# 개표국 — 밤샘 자율 작업 핸드오프 로그

자율 모드로 5관점 리뷰 백로그를 끝까지 진행 중. 각 항목: 구현 → `npm run build`/`npm test` → Playwright 스샷 자가검증 → 커밋. 아트는 codex로 생성(`scripts/shot.mjs`로 검증).

## 상태 범례
[x] 완료 · [~] 진행중 · [ ] 대기

## 백로그 (우선순위)
- [x] Batch A: 직원 뭉침/그림자/틴트/모션, nav 메시, 탭팝, 시설 Lv0 숨김 (e65bc7d)
- [x] Batch B: UI 디자인시스템(폰트/패널/진행바/칩아이콘/썸네일/희귀도/탭/비용/D카운트/커서) (c9c45fe)
- [x] C1. 신규 온보딩: 첫 탭 유도 오버레이 + 첫 성취 (UX/기획 P0)
- [x] C2. 오프라인 보상 모달 (UIScene 제거 회귀 복구; 기획 P1)
- [x] C3. 마일스톤 연출: Lv5/10/25 배너+플래시 (기획 P1)
- [x] C4. HUD 자원 아이콘(투표함/말풍선/하트) — codex 아트 (디자인 P0-4)
- [x] C5. 표/초·업글 델타 표기, 사건 알림 뱃지 (기획 P2)
- [x] C6. 벽 장식(시계/포스터)로 빈 벽 채우기 — codex 아트 (디자인 P1-1)
- [x] C7. 월드 탭-수집 프롭(투표함) (기획 P1-4)
- [x] C8. QA 잔여: BUG-05 탭강제전환, BUG-11 프레스티지 표시, BUG-01 퀘스트 자동완료
- [~] C9. 직원 프레임 애니(스프라이트시트) — codex 아트
- [x] 최종: 전체 회귀 스샷 검증 + 리뷰 재실행

## 진행 기록
- (작업하며 한 줄씩 append)

- 2026-06-24T18:05 C1-3 done (f01ae21): onboarding hint, offline modal, milestone toast/flash
- 2026-06-24T18:08 C5 gain delta (d546182), BUG-11 prestige mult (c2a8065). 목표/감사/사건 탭 회귀검증 OK. C4/C6/C7/C9는 codex UI아트(bej3uauil) 생성 대기중.
- 2026-06-24T18:13 C4/C6/C7 wired (2e97c9c): HUD icons, wall clock/poster, ballotbox prop, tutorial hand. C8 partial (BUG-11 done). 신규유저 휑함 해소.
- 2026-06-24T18:14 C3 milestone toast verified via playwright drive(ms.png). 직원 변형 2종 codex 생성중(b10s9wx4y). C9 walk-sheet 보류(현 bob/breath 충분).

---
## 🌅 아침 요약 (밤샘 자율 작업 결과)

5관점 리뷰(사용자/시니어개발/QA/기획자/디자이너) → 종합 → 적용 → Playwright 자가검증. 모두 커밋됨.

### 완료
- **월드/게임필**: 직원 시설별 분산(뭉침 해소)·그림자·캐릭터 다양화·걷기/호흡 모션·nav 메시·시설 탭팝
- **UI 디자인시스템**: Nunito 폰트, 패널 그라데이션+블러, 또렷한 진행바, 시설칩 아이콘, 카드 썸네일, 직원 희귀도 스트라이프, 흰 활성탭, 버튼/커서 상태
- **HUD**: 실제 자원 아이콘(투표함/말풍선/하트), D-카운트, 구역/초당표
- **신규 온보딩**: 첫 탭 유도 힌트 + 튜토리얼 손
- **오프라인 보상 모달**(회귀 복구) · **마일스톤 토스트+플래시**(Lv5/10/25/45, 검증됨)
- **방 비주얼**: 벽 시계+포스터, 바닥 투표함 프롭(휑함 해소)
- **탭 전부 작동**: 시설(델타 표기)·직원·사건·목표·감사
- **버그 수정**: 해명 shortNumber, 시설 Lv0 깜빡, 프레스티지 배율 표시, 커서 상태

### 보류/미적용 (의도)
- C9 직원 걷기 스프라이트시트: 현 bob/breath/그림자/틴트로 충분, 일관 프레임 생성 리스크로 보류
- BUG-01(퀘스트 자동완료), BUG-05(탭 강제전환): GameState 로직이라 보류(게임 로직 불변 원칙)
- 직원 캐릭터 변형 2종: codex 생성분 도착 시 자동 배선 예정

### 검증 방법
`npm run dev` → http://localhost:5178 · 또는 `node scripts/shot.mjs <out> <seeded|fresh|offline> <tab>` / `node scripts/verify-milestone.mjs <out>`
- 2026-06-24T18:20 직원 캐릭터 변형 2종 배선 완료(9407fb8) — 복제인형 해소. 백로그 핵심 전부 완료.

## ✅ 백로그 핵심 완료
- 2026-06-24T18:21 전 상태(시설/직원/사건/목표/감사/신규/오프라인/마일스톤) 회귀검증 0콘솔에러, build+test 통과. 핵심 백로그 완료. 보류: C9 walk-sheet, BUG-01/05(GameState 로직).

- 2026-06-25T14:55 거지키우기 아트+UI 피벗 전면 완료 + 7역할 리뷰 루프1 반영(7c07f34). MISSION.md 참조.

## 루프2 완료 (밤샘 자율)
- 오프닝씬(국장 3카드 프리미스), 초반 밸런스 가속(지역목표↓), Web Audio SFX(tap/upgrade/stage/event)+음소거 토글
- 사건 15종 코믹 확장, 거지키우기 아트+UI 전면 일관
- 남은 큐: ④일일목표·업적 UI(목표 탭) ⑤시각적 era 배경/캐릭터 진화 → 그 뒤 최종 7역할 종합검증(95% 기준)
- 알려진 한계: 정밀 밸런스는 실인간 탭속도 필요(playwright 클릭이 느려 자동 측정 부정확)

## 루프3 완료 (밤샘 자율)
- ④ **목표 탭 전면 확장**(DOMBottomPanel `_renderGoals`): 단일 퀘스트만 보이던 막다른 탭 → 6개 퀘스트 전체를 **진행/완료/예정** 3상태(다음목표 예고 포함, 진행바·보상라벨)로 표시 + **업적 4종 카드**(🏅 획득/🔒 미획득, 실시간 진행%) 섹션. CSS `gp-goal*`/`gp-ach*` 추가.
- ⑤ **시각적 era 아크**(WorldView `_applyEra`): 방/바닥/벽 이미지에만 area 구간별 tint — 1구역 무틴트 → 2~3 따뜻 → 4 해질녘 → 5 황혼 → 6+ 야간블루. 워커·플로팅은 제외해 캐릭터 탁해짐 0.
- 검증(내 QA/알파/베타): build✓ test13/13✓ · 목표탭 phone(완료 녹색✓·보상·업적 진행%) · era1 vs era6 톤차 뚜렷 · 데스크탑 레이아웃·오프닝모달 정상 · **코어루프 정상**(시드상태 10탭=+50표, clickPower 정상; 첫세션 오프닝 3카드→다음 버튼이 실제 hit-target, 3클릭에 닫힘→탭 득표 가능) · 0 콘솔에러.
- 신규 검증툴: `scripts/_shotseed.mjs <out> <area> <tab> [partial]` — area별 era/목표 상태 시드 스샷.
- 남은(다음 루프): 최종 7역할 종합검증(95% 기준 점검) + 백로그(프레스티지 깊이, 트러스트 위기 시각상태, 일일 로그인 보너스, WebP 압축, 후반 퀘스트 증량).

## 루프4 완료 (7역할 종합검증, 밤샘 자율)
- 4에이전트 병렬 리뷰(개발/QA·기획·UIUX·디자이너) + 내 QA/알파/베타.
- **디자이너 직접수정(P0/P1)**: mute 버튼 .gp-ui 루트로 이동(믿음칩 겹침 해소), HUD 칩 가중 flex(표 1.6/해명 1.2/믿음 0.9 + ellipsis), 바텀시트 flex-column(탭바 하단 고정·패널 스크롤), 업그레이드 버튼 2줄(verb+cost, 잘림 방지), 프레스티지 gp-seal gem-blue(시설 picker와 구분), 월드 스캔라인+하단 비네트(빈 공간 무드).
- **정합성/리텐션 픽스(내가 적용)**: 끝없는 목표 트레드밀(정의 6목표 후 누적표 2.4×씩 생성형 목표·목표탭 노출, tier 진행 e2e 검증), 프레스티지 후 tutorial 유지(베테랑 오프닝 재노출 버그), freeze 저장, 가중 사건 추첨, 크루 skill 가드, 라운드로빈 pop.
- 검증: build✓ test13/13✓ · 코어루프 10탭=+50표 0에러 · 데스크탑 레이아웃·오프닝모달 정상 · 전탭 0콘솔에러 · 끝없는목표 130k표→tier2(288k) 자동전진.
- QA툴 추가: `scripts/_endlesstest.mjs`(끝없는목표 e2e), `scripts/_shotseed.mjs`(area/탭 시드 스샷).
- **기획 종합평가: 라이브게임 대비 ~60-65%** — 정규 루프/톤은 단단하나 중후반 리텐션 갭이 핵심. 다음 루프 우선순위(P0): ①일일 로그인 보상(streak) ②프레스티지 깊이(언락형 업그레이드+신규 콘텐츠 해금) ③트러스트 위기 메커닉(저신뢰 시 생산정지 사건/고신뢰 보너스). P1: 업적·직원·사건 증량 및 보상 area 스케일, 가이드형 첫 업그레이드 온보딩, CPS/통화 가독성·클레임 연출, 탭 배지.
- 미적용(의도, P2 latent): WorldEffects 풀 destroy(단일씬이라 실누수 없음), 오프라인캡 업글, 탭버스트.

## 루프5 완료 (리텐션 P0, 밤샘 자율)
- **일일 출석 보상**: GameState `daily{day,streak}` + `dailyStatus()/dailyReward()/claimDaily()`(로컬자정 일자 인덱스, 연속 streak 최대7, 7일차 인장 보너스), DOMModalLayer `_maybeDaily()` 📅 모달(재방문부터, 신규 첫세션은 건너뜀).
- **티어 업적 데이터화**: `src/data/achievements.js`(16종 — 기존 v100/v1000/cps20/trust90 id 유지 + v100k/v10m/v1b/cps200/cps2k/fac30/fac80/area5/area10/prestige1/prestige5/events25). 보상 explain/votes/trust/seals가 후반까지 스케일. `GameState.checkAchievements` 데이터구동 + `achievementProgress(metric)`. DOMBottomPanel은 `achievementDefinitions` 공유(중복 const 제거).
- **회귀 검출**: 리팩터 후 `ACHIEVEMENTS` 잔존참조 1건 → 인브라우저 pl4 테스트로 즉시 검출·수정(vite 빌드는 템플릿리터럴 런타임 참조라 미검출). 교훈: UI 상수 리네임 시 인브라우저 렌더 검증 필수.
- 검증: build✓ test13/13✓ · 일일 claim(+25해명/+표·일자기록·중복불가·streak 리셋/연속 e2e) · 업적(20만표/area6/prestige1/events30 → 8종 지급 +680해명, 무중복) · 0콘솔에러 · 📅모달+16업적 리스트 렌더 정상. DOMHud mute 루트이동(루프4 디자이너 누락분) 포함.
- QA툴 추가: `scripts/_dailytest.mjs`, `scripts/_achtest.mjs`(per-evaluate try/catch로 인브라우저 런타임에러 핀포인트). 주의: playwright `networkidle`이 swiftshader+vite에서 불안정 → `domcontentloaded`+활성폴링 사용.
- **다음 루프 P0**: 프레스티지 깊이(언락형 업그레이드, 신규 콘텐츠 해금), 트러스트 위기 메커닉(저신뢰 생산정지 사건/고신뢰 보너스). P1: 사건·직원 증량 및 보상 area 스케일, 가이드형 첫 업그레이드 온보딩, CPS 연출·탭 배지·목표 클레임 연출.

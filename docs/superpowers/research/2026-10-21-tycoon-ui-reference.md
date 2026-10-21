# 모바일 방치형/타이쿤 게임 UI 관례 조사 보고서

"믿어주세요 개표국" 아트 오버홀 가이드 (Phaser 3 + DOM UI, 세로 모바일, 픽셀아트)
작성일: 2026-10-21

**증거 표기 규칙**: 각 항목에 `[출처]`는 웹에서 직접 확인한 내용, `[관찰]`은 해당 게임을 직접 플레이한 기억에 기반한 묘사(스토어 스크린샷으로 재검증 권장). 블로킹된 페이지(Medium 원문, Game UI Database, fandom 일부)는 검색 스니펫만 활용했다.

---

## 0. 한 줄 결론

"진짜 게임처럼 안 보인다"는 문제의 원인은 거의 항상 **아이콘 하나하나의 완성도가 아니라 규칙의 부재**다. 레퍼런스 게임들은 공통적으로 (1) 한 가지 광원·한 가지 외곽선 규칙·한 가지 스케일, (2) 색에 의미를 하나씩만 배정(초록=살 수 있음, 회색=못 삼, 빨강=주목), (3) 모든 수치 변화에 트윈·팝업·파티클이 붙어 있다. 아래 스펙은 이 세 가지를 강제하는 쪽으로 설계했다.

---

## 1. "진짜 게임"처럼 읽히는 아이콘 관례

### 1-1. 크기 그리드
- **기본 그리드는 16px와 32px 두 가지만** 쓰고, 24px 같은 어중간한 크기는 금지. 스프라이트는 "같은 그리드 또는 깔끔한 배수(32×32 캐릭터, 16×16 타일, 24×24 금지)"를 공유해야 함 `[출처: sprite-ai 스타일가이드]` https://www.sprite-ai.art/blog/2d-pixel-art-style-guide
- 16×16은 "아이템·아이콘·소형 캐릭터에 이상적", 32×32는 "표정·장비·음영을 넣을 수 있는 스위트스폿" `[출처]` https://spritegen.io/guides/pixel-art-sizes-guide/ , https://pixnote.net/en/learn/shading/
- 16×16에서 실패하는 것 4가지: 눈2개+입, 4글자 넘는 텍스트, 내부 도형 여러 개, 확대해야 보이는 디테일 `[출처: neta.art]` https://neta.art/blog/16x16-pixel-art-rules
- UI 아이콘 일반 규칙: 8의 배수(8/16/24/32) 또는 모바일은 4의 배수, 동일 기능은 동일 스타일 `[출처: brunch "UI를 위한 아이콘"]` https://brunch.co.kr/@blckschrl/35
- **정수 배율 하나로 통일**(2x 또는 3x). 배경·스프라이트·UI의 픽셀 크기가 다르면 "다른 게임에서 온 것처럼" 보임 — 가장 흔한 아마추어 티 `[출처: 검색 요약 "mixels"]` https://www.spritefusion.com/pixel-snapper

### 1-2. 외곽선 두께·색
- **1px, 순검정 금지.** "몸체 색상의 어두운 버전"을 쓰면 스티커처럼 잘려 보이지 않음 `[출처]` https://spritegen.io/guides/how-to-draw-a-pixel-art-character/
- 전체 아이콘에 외곽선을 넣거나 아예 안 넣거나 **둘 중 하나로 통일**. "섞으면 끔찍해 보인다" `[출처: sprite-ai]`
- 32px 이상에서는 **sel-out(선택적 외곽선)**: 빛 받는 쪽 외곽선은 밝게, 그늘 쪽은 어둡게. 16px에서는 외곽선이 1px뿐이라 효과 제한적 `[출처: pixnote shading]` https://pixnote.net/en/learn/shading/
- 16px 아이콘에서는 전체 외곽선이 "면적의 1/3을 먹고 모든 물체를 스티커처럼 만든다" → 바닥 가장자리·유사 명도 접촉면·밝은 배경에 닿는 실루엣에만 `[출처: neta.art]`

### 1-3. 2–3톤 음영

| 크기 | 단계 | 구성 |
|---|---|---|
| 16×16 | 2 | Base + Shadow |
| 32×32 | 3 | Highlight + Base + Shadow |
| 48×48 | 3–4 | + Shadow 2 |

`[출처: pixnote shading 표]`

- 광원은 **좌상단 45°** 고정, 작품 전체에서 바꾸지 않음 `[출처: pixnote]`
- 그림자 색 = 명도↓, 채도 약간↑, 색상은 한색 쪽으로. 작은 스프라이트는 "색상 이동"보다 **"명도 차"**가 효과적(16×16 359쌍 분석: 명도 중앙값 -16.5, 색상이동 8° 이상은 2%뿐) `[출처: pixnote]`
- "필로우 셰이딩"(외곽선 따라 균일하게 어둡게) 금지 — "빛이 어디서 오는지 말할 수 있는가?"로 자가 검사 `[출처: pixnote]`
- 재질당 색 3개(base/shadow/highlight) + 외곽선 1개, 아이콘 전체 12–16색 안 `[출처: neta.art, spritegen]`

### 1-4. 광택/무광, 그림자, 뱃지·프레임
- **재화 아이콘(통화)**: 광택 1–2px 하이라이트 점(좌상단) + 둥근 실루엣 + 채도 높은 단일 색상 → 상단 바에서 16px로도 읽힘. 이것이 통화 아이콘과 액션 아이콘의 차이: **통화 = 색·광택·실루엣이 단순(동전/알/지폐 하나)**, **액션 = 글리프(화살표·플라스크·체크)로 명도 대비 위주, 색은 버튼이 담당** `[관찰: Idle Miner Tycoon 현금(초록 지폐)/슈퍼캐시, Egg Inc 현금/황금알, AdCap 달러]`. Egg Inc는 황금알을 "상단의 특정 아이콘"으로 추적 `[출처: Talk Android]` https://www.talkandroid.com/16189-egg-inc-ultimate-walkthrough-and-game-guide/
- **드롭섀도**: 아이콘 자체엔 넣지 않고(픽셀이 뭉개짐) **카드/버튼 패널에 1px 하단 베벨**로 입체감. "픽셀 UI는 상태를 거의 전부 1px 베벨로 전달 — 위·왼쪽 밝게, 아래·오른쪽 어둡게" `[출처: 검색 요약 pixnote/9-slice]` https://generalistprogrammer.com/tutorials/nine-slice-scaling-explained
- **레어도 프레임**: 매니저/직원 카드는 등급별 프레임 색이 상승(Idle Miner: Junior→Senior→Executive) `[출처 fandom 검색 요약; 색은 관찰: 청동/은/금 계열]` https://idleminertycoon.fandom.com/wiki/Managers
- **레벨 뱃지**: 건물/시설마다 "Lv 23" 알약형 버튼이 붙어 있고 그걸 누르면 업그레이드 패널이 열림 `[출처: BlueStacks IMT 가이드 "현재 레벨을 표시하는 버튼을 클릭"]` https://www.bluestacks.com/blog/game-guides/idle-miner-tycoon/idt-tips-tricks-en.html

### 1-5. 업그레이드 버튼의 구매 가능 상태(색 상태)
- **살 수 있음 = 초록 버튼**: IMT "초록 Upgrade 버튼" `[출처: BlueStacks]`
- **살 수 없음 = 회색/비활성**: Egg Inc "돈이 부족하면 구매 버튼이 회색으로 바뀌고 비활성처럼 보인다" `[출처: Medium 검색 스니펫]` https://medium.com/design-bootcamp/as-addictive-as-raising-chickens-1c59c804a5bf
- AdVenture Capitalist는 못 사는 버튼을 붉은 계열로 처리 `[관찰; 검증 필요]`. 일반 UI 관례로는 **회색(혹은 정상색의 40% 투명·탈채도)**이 표준이며, **빨강은 취소/위험 용도로 아껴 둘 것** `[출처: GameAnalytics UI 기사, LogRocket 버튼 상태]` https://www.gameanalytics.com/blog/how-to-make-your-game-ui-shine-and-increase-conversions , https://blog.logrocket.com/ux-design/designing-button-states/
- 색만으로 의미를 전달하지 말 것 — 흑백 변환 테스트에서 구분 안 되면 실패. 비활성은 색 + 베벨 제거 + 자물쇠/흐림 중 하나를 추가 `[출처: h-idris "Colour in game UI"]` https://h-idris.com/blog/game-ui-colour

### 1-6. 알림 점(레드닷)
- 위치는 **우상단 코너 오버레이**, 바쁜 배경과 분리되도록 **배경색 1px 링(컷아웃)**, 높이 16–20px(DOM 기준), 숫자는 "99+"로 절단 `[출처: Eleken Badge UI]` https://www.eleken.co/blog-posts/badge-ui-design
- **표시 기준: "유저가 실질적 보상을 얻을 수 있을 때"**(레벨업 가능, 무료 상품, 장비 강화 가능). 메인 HUD → 하위 UI까지 조건이 **상위로 전파**되어야 함. "빨간점은 고객과 한 약속" — 보상 없는 유도용 레드닷을 남발하면 유저가 점을 무시하거나 이탈 `[출처: woojinkim 블로그]` https://blog.woojinkim.org/where-to-use-red-dots/
- Idle Theme Park Tycoon: "새 놀이기구를 지을 돈이 모이면 하단 클립보드 아이콘에 **빨간 느낌표**" `[출처: SuperCheats 검색 요약]` https://www.supercheats.com/idle-theme-park-tycoon-walkthrough-guide
- Egg Inc: 수령 가능한 선물상자가 화면 우상단에 쌓임(알림을 "아이템"으로 표현) `[출처: Talk Android]`

---

## 2. 세로형 방치 게임 HUD 레이아웃 관례

### 2-1. 상단 재화 바
- **좌: 주 재화(아이콘 + 축약 숫자), 우: 프리미엄 재화 + 설정/상점**. 숫자는 초기부터 축약(6.4k, 2.3M) `[출처: Cookie Clicker Mobile 위키]` https://cookieclicker.wiki.gg/wiki/Cookie_Clicker_Mobile ; 김봉식은 1000=1.0A, 1000A=1.0B 알파벳 표기 `[출처: 나무위키]` https://namu.wiki/w/%EC%A4%91%EB%85%84%EA%B8%B0%EC%82%AC%20%EA%B9%80%EB%B4%89%EC%8B%9D
- 재화 칸은 **어두운 알약형 플레이트(9-slice) 위에 아이콘이 왼쪽으로 반쯤 튀어나온 형태** — 코인이 날아와 꽂히는 목표점 역할 `[관찰: IMT, Egg Inc 공통]`
- 초당 수익 카운터를 **항상 보이게** — "유저는 숫자가 커지는 걸 보는 것 자체를 즐긴다" `[출처: Machinations]` https://machinations.io/articles/idle-games-and-how-to-design-them
- 움직이는 배경 위 텍스트에는 **저투명 어두운 플레이트** `[출처: h-idris]`

### 2-2. 하단 탭 바
- 3–5개 아이콘, 핵심 기능은 한 탭 거리 `[출처: gendesigns 검색 요약]` https://gendesigns.ai/blog/mobile-ui-patterns-2026 ; 리니지M 등 한국 모바일도 "핵심 기능은 화면 하단 집중 배치" `[출처: prime-career]` https://prime-career.com/article/489/
- Cookie Clicker Mobile: Cookie / Store / Special / Stats / Misc의 **풀스크린 탭** 전환 `[출처: 위키]`
- Egg Inc: 하단에 거대한 **빨간 원형 부화 버튼**(닭 아이콘) + 좌우로 연구(플라스크)·알 선택·미션(클립보드)·상점 `[출처: Talk Android + Medium 스니펫]`
- 거지 키우기3: 홈 버튼 우상단, 인벤토리가 패치로 하단 버튼으로 이동(하단 = 자주 쓰는 것) `[출처: 경향게임스 리뷰 + 나무위키 검색 요약]` https://www.khgames.co.kr/news/articleView.html?idxno=129664
- **탭 아이콘은 색으로 구분하지 않고 글리프로 구분**, 활성 탭만 강조색 + 1px 위로 올림 `[관찰: IMT/Egg Inc 공통 — 탭 바는 단색]`. 이유: UI 색은 8–12개가 한계라 탭에 5색을 쓰면 상태색이 모자람 `[출처: h-idris]`

### 2-3. 건물/직원 카드 리스트(AdCap 행 구조가 사실상 표준)
AdVenture Capitalist 한 행 `[관찰 + PocketGamer 리뷰 출처]` https://www.pocketgamer.com/adventure-capitalist/review/

```
┌────────────────────────────────────────────────┐
│ (○ 아이콘)  [ ████████████ 수익 $1.2K ███░░ ]  │ ← 탭하면 차는 진행바, 중앙에 수익 텍스트
│  ▭ 37/50    [ Buy x1      $3.74 ] (초록/회색)  │ ← 아이콘 아래 보유수+다음 마일스톤 미니바
└────────────────────────────────────────────────┘
```

- 좌: 원형 아이콘 + 아래 "보유 수 / 다음 마일스톤" 미니 바. 중앙: 큰 진행바(수익 텍스트 오버레이). 우: 비용이 적힌 구매 버튼.
- Egg Inc 연구 행: 아이콘 · 이름 · 설명 · "3/10" 레벨 카운터 · 우측 비용 버튼, 티어로 섹션 분리, Common(현금)/Epic(황금알) 분리 `[출처: Talk Android]`
- IMT 업그레이드 팝업: 수치(인원·용량·속도) 전/후 비교 + 수량 선택 + 초록 비용 버튼 `[출처: BlueStacks + 관찰]`

### 2-4. Buy x1 / x10 / MAX 토글
- AdCap: 하나의 버튼을 눌러 **x1 → x10 → x100 → Next → Max 순환** `[출처: AdCap 위키]` https://adventure-capitalist.fandom.com/wiki/Buy_Multiplier
- IMT: 업그레이드 패널 안에서 **1 / 10 / 50 / Max** 선택 `[출처: BlueStacks]`
- Egg Inc: 연구 화면에 Max 구매 토글 존재 `[출처: fandom 포럼 검색 요약]` https://egg-inc.fandom.com/f/p/4400000000000330419
- Cookie Clicker Mobile: 건물에 "Buy Max" 버튼 `[출처: 위키]`
- 김봉식: 별도 토글 대신 **길게 누르면 레벨업 속도가 점점 빨라짐** `[출처: 나무위키 검색 요약]` — 토글을 안 쓸 거면 이 방식이 대안.
- **권장**: 리스트 헤더 우측에 세그먼트 토글 `[x1][x10][MAX]` 하나(전역), 선택값이 모든 행 버튼 라벨과 비용에 즉시 반영.

### 2-5. 진행바·레벨 뱃지
- Egg Inc: "모든 상태에 상태바가 있다" — 부화장 충만도, 판매까지 거리, 연구 진행, 목표 달성도 `[출처: Medium 스니펫]`
- IMT: 핵심 루프 4단계(채굴→운송→판매→업그레이드)를 **한 화면에 다 보이게**, 단계 사이 병목(choke point)이 눈에 보임 `[출처: GameAnalytics Kolibri 8교훈]` https://www.gameanalytics.com/blog/making-a-hit-idle-game-eight-lessons-from-kolibri-games
- 픽셀 진행바: 외곽 1px 어두운 프레임 + 안쪽 2톤 채움(위 1px 밝은 줄) + 마일스톤 틱 표시. 값 변화는 **스냅 대신 트윈** `[출처: itch.io juice 기사]` https://itch.io/blog/1059831/making-a-game-feel-juicy-with-simple-effects

---

## 3. 주스(Juice) 관례 — 구현 파라미터 포함

### 3-1. 숫자 팝업
- Cookie Clicker: 클릭 시 쿠키가 **살짝 작아지고**, 쿠키 **파티클** 튀고, 획득량 숫자가 **위로 떠오르며 페이드** `[출처: Cookie Clicker 위키]` https://cookieclicker.wiki.gg/wiki/Big_Cookie
- 파라미터(검증된 튜토리얼 값): 가로 지터 ±12px(겹침 방지), 상승 34px, 0.55s quad ease-out, 페이드는 0.15s 지연 후 0.55s, 크리티컬은 1.4배 + 금색 RGB(1,0.9,0.3), 라벨 풀 24개 재사용 `[출처: dev.to Godot 4]` https://dev.to/saltmire/how-to-make-floating-damage-numbers-in-godot-4-pooled-no-lag-1bnc
- "단순 상승보다 **바운스**가 '팝' 맛을 더한다", 색으로 종류 구분 `[출처: shweep Medium 검색 요약]` https://shweep.medium.com/damage-numbers-in-rpgs-1f0e3b1bc23a

### 3-2. 코인 → 지갑 플라이
- 표준: 보상 지점에서 6–10개 스프라이트를 30–50ms 간격으로 스폰 → **베지어 곡선(제어점을 위쪽)**으로 상단 재화 칸까지 → 도착 시 소멸 + 카운터 증가 `[출처: 검색 요약(Unity DOTween/Godot/Roblox 튜토리얼 공통 서술)]` https://medium.com/@trisledinh/unity-how-to-create-effect-coin-fly-in-less-than-15-minutes-9a2e7f72aff2 , https://codingquests.io/blog/godot-4-tween-tutorial-juice
- 순수 CSS 버전: 2s keyframe, `cubic-bezier(0.215,0.61,0.355,1)` 감속 / `cubic-bezier(0.755,0.05,0.855,0.06)` 가속, -200px 튀어오를 때 `scaleY(1.1)`, `onanimationend`로 DOM 제거, SFXR 효과음 동시 재생 `[출처: dev.to chr15m]` https://dev.to/chr15m/make-a-coin-up-game-animation-in-pure-css-and-javascript-3bj4
- 도착 시 재화 칸 **펀치 스케일 1.0→1.2→1.0(약 150ms)** + 숫자 틱업 `[관찰: IMT/Egg Inc 공통]`

### 3-3. 버튼 프레스 스쿼시
- 웹 기준 검증 파라미터: 0%: scale(0.88) → 50%: scale(1.05, 0.92) → 72%: scale(0.99, 1.02) → 100%: 1, 총 ~420ms, `transform-origin: 50% 100%`, 스프링 이징 `cubic-bezier(0.34,1.56,0.64,1)` (GSAP `back.out(1.7)`) `[출처: valdemird "Game feel on the web"]` https://valdemird.com/blog/game-feel-on-the-web/
- 픽셀 버튼은 스케일 대신 **베벨 반전 + 라벨 1px 아래로** 이동이 "눌림"으로 읽힘 `[출처: 검색 요약 pixnote/9-slice]`. 두 가지 병행 권장: 눌림 중 베벨 반전, 떼면 80–120ms 스프링 복귀.
- 실패 시 텍스트 흔들림, 성공 시 바운스 `[출처: itch.io juice]`

### 3-4. 해금/달성 연출
- 구성: 어두운 오버레이 → 카드 scale 0.6→1.05→1.0(back.out) → 뒤에서 **회전하는 광선(rays)** → 컨페티 파티클 → 효과음 `[관찰: IMT 매니저 획득/Egg Inc 티어 달성 공통; 에셋 관례는 itch "coin bursts, chest rays 4 rarities, level-ups, confetti" 검색 요약]` https://itch.io/game-assets/newest/released/tag-idle
- 파티클 참고값: 14개/버스트, 퍼짐 80–120px, 수명 0.55+rand*0.4s, 링 배치 + 0.6 지터, 중력 바이어스 -30px `[출처: valdemird]`
- 화면 흔들림 0.1–0.3s, 이징으로 감쇠, 크리티컬 순간 0.2s 슬로모 `[출처: itch.io juice]`
- 콤보 에스컬레이션: 연타 시 피치 상승(360Hz + streak×16Hz), 1.6s 무입력 시 리셋 `[출처: valdemird]`

### 3-5. 방치 중 "일하는" 애니메이션
- Egg Inc: 빨간 버튼을 누르면 "작은 닭들이 부화장에서 닭장으로 달려나감", 드론이 가끔 날아가고 탭하면 떨어짐(가변 보상) `[출처: Medium 스니펫, Talk Android]`
- IMT: 광차가 갱도를 오가고 엘리베이터가 오르내리며 **자원이 쌓이는 모습이 병목 표시 역할** `[출처: BlueStacks]`
- 김봉식: 몬스터 애니메이션을 **아예 생략하고 "자고 있다"는 컨셉으로 정당화**, UI는 하나로 통일해 재사용 — 저비용 전략의 극단 `[출처: 인벤 마프게임즈 인터뷰]` https://www.inven.co.kr/webzine/news/?news=148986
- Kairosoft: 탑다운 픽셀 사무실, 직원이 자리에서 2–4프레임 타이핑 루프, 아이디어가 떠오르면 머리 위 말풍선/별 팝업 `[관찰; 메뉴 기반 인터페이스는 TouchArcade 리뷰 출처]` https://toucharcade.com/2010/10/12/game-dev-story-review-create-your-own-game-company
- **권장 프레임 레이트**: 작업 루프 6–8fps 2–4프레임 + 전체 스프라이트 sine 바운스(진폭 1px, 주기 1.2s). 프레임 수보다 **말풍선·수치 팝업이 "일하고 있음"을 더 강하게 전달**.

---

## 4. 레퍼런스별 "이 게임이 가장 잘 보여주는 것" 요약

| 관례 | 최고 레퍼런스 | 구현자용 묘사 |
|---|---|---|
| 핵심 루프 한 화면 가시화 | Idle Miner Tycoon | 세로로 쌓인 갱도마다 "Lv N" 알약 + 매니저 얼굴 슬롯, 엘리베이터가 좌측 세로축, 창고가 상단. 자원이 쌓인 지점이 곧 병목. `[출처: GameAnalytics/BlueStacks]` |
| 카드형 행 + 구매 버튼 | AdVenture Capitalist | §2-3 도식. 버튼 라벨은 "Buy x1" 위, 비용 아래 두 줄. 토글은 리스트 위 단일 순환 버튼. `[출처: AdCap 위키/PocketGamer]` |
| 상태바 전면 사용, 회색 비활성 | Egg Inc | 평면·소프트 3D, "픽셀 퍼펙트 UI와 디테일한 그림자", 모든 수치에 바, 돈 부족 시 버튼 회색. `[출처: Medium 스니펫]` |
| 탭 피드백 3종 세트 | Cookie Clicker | 눌림(축소) + 파티클 + 떠오르는 숫자. 설정에서 끌 수 있음. `[출처: 위키]` |
| 레드닷 트리거 | Idle Theme Park Tycoon | 살 수 있을 때만 하단 클립보드에 빨간 느낌표. `[출처: SuperCheats]` |
| 저비용 UI 통일 | 중년기사 김봉식 | 패널 한 종류 재사용, 연출 최소화, 길게 누르면 가속 업그레이드. `[출처: 인벤/나무위키]` |
| 병맛 톤 + 즉각 피드백 | 거지 키우기 | 조잡해 보이지만 클릭 즉시 원 단위 숫자 피드백, 건물마다 업그레이드 메뉴 부착, 미니게임이 해금 게이트. `[출처: 경향게임스]` |
| 하우스 스타일 일관성 | Kairosoft | 전 작품 동일 캐릭터·메뉴 스타일. 단, 초기 모바일판은 "답답한 메뉴, 위아래 낭비 공간"으로 비판 → 세로 모바일에서 **PC식 메뉴창 그대로 쓰면 안 됨**. `[출처: TouchArcade/AppSpy]` https://www.appspy.com/game-dev-story/review/ |
| 사무실 타이쿤 메타 | Idle Office Tycoon | 시설 업그레이드·직원 훈련·장식·카드 수집·시즌 패스·Forbes 랭킹. 사무실 소재 UI 레퍼런스로 스토어 스크린샷 참조. `[출처: App Store]` https://apps.apple.com/us/app/idle-office-tycoon-money-game/id1617250285 |

---

## 5. 이 게임을 위한 권장 비주얼 스펙

### 5-1. 픽셀 방향
- **베이스 해상도**: UI 아이콘 16×16(HUD 재화·탭 글리프·버튼 내 아이콘), 32×32(시설/직원 카드 썸네일, 사건 일러스트). 캐릭터 스프라이트 32×32(필요 시 32×48).
- **배율**: 전역 **2x 정수 스케일**(CSS px 기준 16→32, 32→64). Phaser `pixelArt: true` + `zoom: 2`, DOM 쪽은 `image-rendering: pixelated` + 2배 배경 크기. 3x는 태블릿에서만, **화면 안에서 배율 혼용 금지**.
- **외곽선**: 전부 1px, 색은 `#2b1d2e`(순검정 금지). 32px 아이콘은 sel-out 허용(빛 받는 외곽은 재질 shadow색).
- **음영**: 32px = 3톤(highlight/base/shadow), 16px = 2톤(base/shadow). 광원 좌상단 고정. 광택점은 **재화 아이콘에만** 1–2px `#ffffff`.
- **드롭섀도**: 아이콘에는 없음. 패널·버튼은 하단 1px 어두운 베벨, 상단 1px 밝은 베벨.
- **폰트**: 숫자는 픽셀 비트맵 폰트(예: 한글 지원 "둥근모꼴"/"Galmuri"), 본문은 2x 그리드에 맞춘 정수 px 사이즈.
- **9-slice**: 패널 1종(어두운 navy), 버튼 3종(primary 초록 / secondary 크림 / disabled 회색), 카드 프레임 1종 + 레어도 색 변형. Pedro Medeiros 9-slice 튜토리얼 참조 `[출처]` https://lospec.com/pixel-art-tutorials/tags/ui

### 5-2. 팔레트 (Endesga 32 기반 + 소수 커스텀, 총 UI 가동색 ≤ 12)
Endesga 32는 "따뜻한 흙색 + 차가운 파랑"이 균형 잡힌 검증된 팔레트 `[출처: Lospec]` https://lospec.com/palette-list/endesga-32

**중립(UI 뼈대)**

| 역할 | HEX |
|---|---|
| 외곽선/최암부 | `#181425` (EN32) → 아이콘 외곽선은 따뜻하게 `#2b1d2e` |
| 패널 베이스(HUD·탭 바) | `#262b44` |
| 패널 하이라이트 베벨 | `#3a4466` |
| 보조 텍스트/비활성 아이콘 | `#8b9bb4` |
| 본문 텍스트 | `#c0cbdc` |
| 강조 텍스트/하이라이트 | `#ffffff` |
| 밝은 패널(카드 내부·종이) | `#ead4aa` / 그림자 `#e4a672` |

**재화 3종 (각 3톤 + 아이콘 메타포)**

| 재화 | 메타포 | Highlight | Base | Shadow | 비고 |
|---|---|---|---|---|---|
| **표 (votes)** | 투표용지(크림 종이 + 빨간 기표 도장) | `#ffffff` | `#ead4aa` | `#c9a97a`(커스텀) | 도장 `#e43b44`. 어두운 HUD 위에서 가장 밝은 재화 = 주 재화 |
| **해명 (explanations)** | 말풍선(점3개) | `#2ce8f5` | `#0099db` | `#124e89` | 사건 대응·소모 재화 느낌의 한색 |
| **믿음 (trust)** | 하트 또는 악수 | `#f6757a` | `#b55088` | `#68386c` | 보라 계열 — 경고 빨강(#e43b44)과 분리됨 |

**탭 5종 틴트** (탭 바 자체는 중립 navy, 글리프는 `#c0cbdc`; **활성 탭 글리프와 해당 패널 헤더 스트라이프에만** 틴트 사용)

| 탭 | 글리프 | 틴트 |
|---|---|---|
| 시설 | 건물/책상 | `#d77643` |
| 직원 | 사람 실루엣 | `#63c74d` |
| 사건 | 느낌표 사이렌 | `#e43b44` (경고 의미와 일부러 공유) |
| 목표 | 별/깃발 | `#feae34` |
| 감사 | 돋보기/클립보드 | `#5a6988` (관료적 차가운 회청) |

**상태색 (의미 1개씩 고정)** `[출처: h-idris "한 색 = 한 의미"]`

| 상태 | 면 | 하단 베벨 | 텍스트 |
|---|---|---|---|
| 구매 가능(primary) | `#63c74d` | `#3e8948` | `#ffffff` |
| 구매 불가(disabled) | `#5a6988` | `#3a4466` | `#c0cbdc`, 비용 숫자만 `#f6757a` |
| 잠김/MAX | `#3a4466` + 자물쇠 글리프 | `#262b44` | `#8b9bb4` |
| 보조 버튼 | `#ead4aa` | `#e4a672` | `#262b44` |
| 레드닷 | `#ff0044` + 1px `#262b44` 링 | — | `#ffffff` 숫자 |
| 진행바 채움 | 재화별 Base, 상단 1px Highlight | 프레임 `#181425` | — |

**자가 검증**: 메인 화면을 흑백으로 변환했을 때 (a) 살 수 있는 버튼과 못 사는 버튼이 구분되고 (b) 세 재화 아이콘의 실루엣이 서로 다르면 통과 `[출처: h-idris, sprite-ai 탈채도 테스트]`.

### 5-3. 레이아웃 (390×844 CSS px 기준, 2x)

```
┌──────────────────────────────────────┐
│ [표 ▣ 1.24M] [해명 ◯ 318] [믿음 ♥ 42]  ⚙ │  상단 바 h=48, navy 플레이트, 아이콘 32px
│  +3.1K/s                              │  초당 수익 작은 텍스트
├──────────────────────────────────────┤
│                                      │
│   Phaser 캔버스: 개표국 사무실 탑다운     │  ~45% 높이, 직원 작업 루프, 숫자 팝업, 코인 플라이 출발점
│                                      │
├──────────────────────────────────────┤
│ 시설        [x1][x10][MAX]            │  리스트 헤더 + 전역 수량 토글
│ ┌─[64px 썸네일] 개표기 Lv12 ───────────┐│
│ │  ███████░░░ 1.2K/주기                ││  카드 h=88, 9-slice 크림 패널
│ │  [ 업그레이드  ▣ 48.2K ] (초록/회색)  ││
│ └────────────────────────────────────┘│
│ ...                                   │
├──────────────────────────────────────┤
│  시설     직원     사건●    목표     감사  │  탭 바 h=64, 16px 픽셀 글리프 + 라벨, 활성 탭 1px 위로 + 틴트
└──────────────────────────────────────┘
```

### 5-4. 주스 기본값 (Phaser Tween / CSS 공통)

| 이벤트 | 값 |
|---|---|
| 버튼 눌림 | 베벨 반전 + 라벨 1px↓ 즉시; 떼면 scale 0.94→1.0, 110ms, `Back.easeOut` |
| 숫자 팝업 | x 지터 ±12px, y -34px, 550ms `Quad.easeOut`, 150ms 후 페이드, 대량 획득 시 1.4x 금색 |
| 코인 플라이 | 6–10개, 40ms 간격, 2차 베지어(제어점 y-80px), 600ms `Quad.easeIn`, 도착 시 재화 칸 scale 1.2→1.0 150ms + 숫자 틱업 |
| 진행바 | 값 변화 200ms `Linear` 트윈, 완료 순간 바 전체 1프레임 흰색 플래시 |
| 해금 팝업 | 오버레이 0→0.6 150ms, 카드 0.6→1.05→1.0 320ms `Back.easeOut`, 광선 회전 20°/s, 컨페티 14개 |
| 사건 발생 | 화면 흔들림 진폭 3px 200ms + 사건 탭 레드닷 + 캔버스 내 말풍선 |
| 방치 루프 | 직원 2–4프레임 6fps + sine 바운스 1px/1.2s, 1.6s 무입력 시 콤보 리셋 |
| 접근성 | `prefers-reduced-motion` 시 흔들림·파티클 생략 `[출처: valdemird/Eleken]` |

---

## 6. 아마추어 방치 게임의 안티패턴 (피할 것)

1. **픽셀 밀도 혼용(mixels)**: 배경 1x, 아이콘 2x, 어떤 건 3x — "다른 게임에서 온 것" 효과. 가장 먼저 잡아야 할 문제 `[출처: spritefusion 검색 요약]`
2. **외곽선 규칙 혼용**: 어떤 아이콘은 검정 외곽선, 어떤 건 없음 `[출처: sprite-ai]`
3. **순검정 외곽선 + 순백 하이라이트**: 스티커처럼 잘려 보임 `[출처: spritegen]`
4. **필로우 셰이딩 / 광원 불일치** `[출처: pixnote]`
5. **16px에 얼굴·글자·다중 내부 도형 욕심** `[출처: neta.art]`
6. **색 남발**: UI 색 30개는 "소통이 아니라 장식". 빨강이 위험·사건·할인·적팀을 동시에 의미하면 실패 `[출처: h-idris]`
7. **비활성 상태 부재**: 돈이 없어도 초록 버튼 → 눌렀는데 아무 일도 안 생김. 회색 + 베벨 제거 필수 `[출처: Egg Inc 스니펫, LogRocket]`
8. **레드닷 남발**: 보상 없는 유도용 점은 "약속 위반" → 무시·이탈 `[출처: woojinkim]`
9. **아이콘만 있고 라벨 없음**: "톱니=설정"은 학습된 뒤에만 통함. 탭에는 짧은 라벨 `[출처: GameAnalytics UI 기사]`
10. **숫자 즉시 스냅**: 바·카운터가 트윈 없이 점프 `[출처: itch.io juice]`
11. **숫자 축약 없음**: 1,240,000 대신 1.24M `[출처: Cookie Clicker Mobile]`
12. **CSS 안티앨리어싱 버튼(둥근 그라데이션, 흐린 그림자)을 픽셀아트 옆에 배치** — DOM UI 쪽은 반드시 `image-rendering: pixelated`, 정수 px, 9-slice PNG 또는 `box-shadow` 1px 하드 베벨로 통일.
13. **PC식 메뉴창을 세로 모바일에 그대로**: Game Dev Story 초기 iOS판이 "답답한 메뉴, 위아래 낭비 공간"으로 혹평 `[출처: TouchArcade/AppSpy]`
14. **핵심 루프가 화면 밖**: 벌고→쓰고→성장이 한 화면에서 안 보이면 병목도 보상도 안 보임 `[출처: GameAnalytics Kolibri]`
15. **탭 피드백 없음**: 눌림·파티클·숫자 셋 중 최소 둘 `[출처: Cookie Clicker 위키]`

---

## 7. 바로 실행할 작업 순서 (권장)

1. **규칙 문서 1장** 작성: 배율 2x, 그리드 16/32, 외곽선 `#2b1d2e` 1px, 광원 좌상단, 팔레트 §5-2, 상태색 의미표. (GameAnalytics가 말하는 "정확한 스타일 가이드" `[출처]`)
2. **9-slice 5종 + 재화 아이콘 3종(16/32 두 사이즈)** 먼저 — 이 8개만 바꿔도 "게임처럼" 보이는 비율이 가장 큼.
3. 버튼 상태 3종(가능/불가/잠김) + 레드닷 컴포넌트 → 전 리스트에 일괄 적용.
4. 주스 4종(눌림·숫자 팝업·코인 플라이·바 트윈)을 공용 함수로.
5. 탭 아이콘 5종, 시설/직원 32px 썸네일 교체.
6. 흑백 변환 테스트 + 50% 축소 테스트로 검수 `[출처: h-idris, neta.art]`.

---

## 참고 URL 전체
- https://www.sprite-ai.art/blog/2d-pixel-art-style-guide
- https://spritegen.io/guides/how-to-draw-a-pixel-art-character/
- https://spritegen.io/guides/pixel-art-sizes-guide/
- https://pixnote.net/en/learn/shading/
- https://pixnote.net/en/learn/game-assets/
- https://neta.art/blog/16x16-pixel-art-rules
- https://generalistprogrammer.com/tutorials/nine-slice-scaling-explained
- https://lospec.com/pixel-art-tutorials/tags/ui
- https://lospec.com/palette-list/endesga-32
- https://brunch.co.kr/@blckschrl/35
- https://h-idris.com/blog/game-ui-colour
- https://www.gameanalytics.com/blog/how-to-make-your-game-ui-shine-and-increase-conversions
- https://www.gameanalytics.com/blog/making-a-hit-idle-game-eight-lessons-from-kolibri-games
- https://www.kolibrigames.com/blog/game-design-behind-the-scenes/
- https://www.bluestacks.com/blog/game-guides/idle-miner-tycoon/idt-tips-tricks-en.html
- https://idleminertycoon.fandom.com/wiki/Managers
- https://adventure-capitalist.fandom.com/wiki/Buy_Multiplier
- https://www.pocketgamer.com/adventure-capitalist/review/
- https://medium.com/design-bootcamp/as-addictive-as-raising-chickens-1c59c804a5bf (스니펫만)
- https://www.talkandroid.com/16189-egg-inc-ultimate-walkthrough-and-game-guide/
- https://egg-inc.fandom.com/f/p/4400000000000330419
- https://cookieclicker.wiki.gg/wiki/Cookie_Clicker_Mobile
- https://cookieclicker.wiki.gg/wiki/Big_Cookie
- https://namu.wiki/w/%EC%A4%91%EB%85%84%EA%B8%B0%EC%82%AC%20%EA%B9%80%EB%B4%89%EC%8B%9D
- https://www.inven.co.kr/webzine/news/?news=148986
- https://namu.wiki/w/%EA%B1%B0%EC%A7%80%20%ED%82%A4%EC%9A%B0%EA%B8%B0
- https://www.khgames.co.kr/news/articleView.html?idxno=129664
- https://toucharcade.com/2010/10/12/game-dev-story-review-create-your-own-game-company
- https://www.appspy.com/game-dev-story/review/
- https://kairosoft.wiki.gg/wiki/Game_Dev_Story
- https://www.supercheats.com/idle-theme-park-tycoon-walkthrough-guide
- https://apps.apple.com/us/app/idle-office-tycoon-money-game/id1617250285
- https://blog.woojinkim.org/where-to-use-red-dots/
- https://www.eleken.co/blog-posts/badge-ui-design
- https://blog.logrocket.com/ux-design/designing-button-states/
- https://valdemird.com/blog/game-feel-on-the-web/
- https://itch.io/blog/1059831/making-a-game-feel-juicy-with-simple-effects
- https://dev.to/saltmire/how-to-make-floating-damage-numbers-in-godot-4-pooled-no-lag-1bnc
- https://dev.to/chr15m/make-a-coin-up-game-animation-in-pure-css-and-javascript-3bj4
- https://codingquests.io/blog/godot-4-tween-tutorial-juice
- https://shweep.medium.com/damage-numbers-in-rpgs-1f0e3b1bc23a
- https://machinations.io/articles/idle-games-and-how-to-design-them
- https://prime-career.com/article/489/
- https://gendesigns.ai/blog/mobile-ui-patterns-2026
- https://www.spritefusion.com/pixel-snapper

**한계 고지**: Game UI Database, Behance, Medium 원문, fandom 일부 페이지는 403/402로 직접 열지 못해 검색 스니펫에 의존했다. `[관찰]` 표기 항목(AdCap 행 구조의 세부, IMT/Egg Inc 상단 바 아이콘 배치, 레어도 프레임 색, 탭 바 단색 관례)은 스토어 스크린샷(App Store/Google Play)으로 한 번 대조한 뒤 스펙에 확정할 것을 권한다.

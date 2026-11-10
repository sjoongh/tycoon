# 모바일 아이들/타이쿤 UI·UX와 게임 필(juice) 레퍼런스 — 개표국 적용용 연구 노트

> 범위: 모바일 세로형(390×844 기준) 아이들/타이쿤 2018–2026. 수치는 출처가 있는 것만 적고, 출처 없는 추정은 "추정"으로 표시한다.
> 조사 한계(중요): Medium 기사 2건(Egg Inc 사용성 연구, 테일드 데몬 슬레이어 UI 설계)과 Game UI Database는 403/봇 차단으로 본문을 받지 못해 검색 스니펫 수준만 인용했다. 각 섹션의 Gaps에 명시.

---

## 1. HUD — 재화·수입/초·마일스톤 진행도·부스트를 어떻게 보여주는가 (항상 보이는 것 vs 요청 시)

### Takeaway
레퍼런스 게임은 "상단 = 상태(재화·수입·진행도), 하단 = 행동"을 일관되게 지킨다. 상단은 엄지가 닿지 않는 'hard zone'이므로 읽기 전용 정보만 두고, 누르는 것은 하단 1/3에 모은다. 진행도는 "모든 상태에 바가 있다"는 수준으로 상시 노출하고, 구매 불가 버튼은 회색 처리로 즉시 구분시킨다.

### Cited Findings
- Egg Inc 사용성 분석: "모든 상태에 진행 바가 있다(부화장 포화도, 농장 진행, 연구 레벨, 목표 달성)", "탭 가능한 모든 것은 전경에 있어 식별이 쉽고, 구매 버튼은 구매 불가 시 회색으로 바뀐다", "빨간 버튼을 누르면 병아리가 뛰어나오는 즉각 피드백" — [As Addictive as Raising Chickens (Medium, 검색 스니펫)](https://medium.com/design-bootcamp/as-addictive-as-raising-chickens-1c59c804a5bf)
- Egg Inc: "크기 조절 가능한 빨간 치킨 버튼", "수입·달걀 가치 같은 핵심 지표를 HUD에 상시 표시" — [Egg, Inc. (NamuWiki EN)](https://en.namu.wiki/w/Egg,%20Inc.)
- Cats & Soup: "금전 정보는 상단에 일관되게 표시", "하단 바에 음식 아이콘(탭하면 판매→코인)", "망치 아이콘 한 번으로 제작 메뉴", 제작 메뉴는 "카테고리별 미니멀 드롭다운 리스트"로 화면을 어지럽히지 않음 — [Exploring the Charming UI/UX Design of Cats&Soup (dev.to)](https://dev.to/jpdengler/exploring-the-charming-uiux-design-of-catssoup-3l9a)
- Idle Miner Tycoon: 화면 우하단에 도구 아이콘 버튼 → "Mine Overview"에서 모든 매니저 일괄 활성화(Activate) — [Idle Miner Tycoon Wiki: Managers](https://idleminertycoon.fandom.com/wiki/Managers)
- Idle Miner Tycoon(GDC 2019 해설): 설계 목표는 "몇 번 프레스티지하면 게임이 늘 똑같아 보이는 '시각적 진행 문제'" 해결 — 새 비주얼의 광산 추가, 프레스티지 강요 대신 광산 복수 보유; 업그레이드는 "어느 업그레이드가 최적인지 전략을 고민하게 만드는" 쪽으로 설계 — [GDC 2019: Deconstructing Idle Miner Tycoon (Mobile Free To Play)](https://mobilefreetoplay.com/gdc-2019-deconstructing-idle-miner-tycoon/)
- 모바일 게임 HUD 배치 규칙: "자연 구역(하단 1/3, 중앙·잡은 손 쪽)=주 행동", "스트레치 구역(중간 띠, 먼 하단 모서리)=보조 행동·탭·슬롯", "하드 구역(상단 1/3, 특히 먼 모서리)=점수·재화·레벨 같은 상태만, 눌러야 하는 것은 금지", "쉬고 있는 엄지 바로 아래는 비워 둔다(오탭의 원인)" — [Mobile game UI design: thumb zones, safe areas… (h-idris)](https://h-idris.com/blog/mobile-game-ui-design.html)
- 같은 글: 상단 인셋(상태바+노치)에는 읽거나 누르는 것을 두지 않음, 하단 인셋 약 34pt(홈 인디케이터), HUD 숫자는 "고대비·고정 위치면 본문보다 작아도 됨", 본문 최저 14–16pt, 움직이는 플레이 중 텍스트 16pt+ — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- My Perfect Hotel 공략: "UI 지표는 대시보드처럼 쓰며, 빨강/주황 상태는 곧 수익 누수" — [My Perfect Hotel (seeles.ai, 2차 자료)](https://www.seeles.ai/games/simulation/my-perfect-hotel-hotel-management-game)
- Idle Theme Park Tycoon: 어트랙션을 탭해 업그레이드, "업그레이드할 때마다 바가 차고, 바가 가득 차면 새 피처(외형 진화)가 추가", 하단 별 아이콘으로 에픽 업그레이드, (i) 아이콘으로 마일스톤별 수익 부스트 확인 — [Level Winner 가이드](https://www.levelwinner.com/idle-theme-park-tycoon-guide-tips-cheats-strategies-build-your-dream-theme-park-increase-your-profits/)
- 아이들 UI 3원칙(2차 자료): "탭→벌기→업그레이드 루프를 전면 중앙에, 불필요한 애니메이션·산만한 서브메뉴 없이", "열자마자 어디를 눌러야 할지 모르면 진 것", "고급 탭은 회색 처리해 두고 시스템이 열릴 때 툴팁식 온보딩으로 점진 공개" — [How to Make an Idle Game (apptrove)](https://apptrove.com/how-to-make-an-idle-game/)

### Inferences
- 개표국의 "상단 3 재화 칩 + 진행 바 + 지역 칩"은 레퍼런스 관행(상단=상태)과 일치한다. 단, 상단 칩이 탭 가능한 메뉴를 겸하고 있다면 hard zone 위반이므로 상세는 하단 시트에서 열리게 하는 편이 맞다(추정).
- Egg Inc·Idle Theme Park식 "다음 마일스톤까지 N레벨" 바는 시설 카드 내부에 두는 것이 관례이고, HUD 상단 바는 "지역/단계 진행" 하나만 두는 것이 혼동을 줄인다(추정).
- 부스트(×2 광고 등)의 상시 표시는 조사 범위에서 1차 자료를 찾지 못했다. Idle Miner의 "우하단 단일 버튼→일괄 활성화" 패턴은 참고 가능.

### Gaps
- Egg Inc Medium 사용성 연구 본문(접근성 지적·다크패턴 섹션) 미열람(403).
- Game UI Database의 Idle Theme Park Tycoon 화면 태그 미열람(403). AdVenture Capitalist·Cookie Clicker의 HUD 구성에 대한 1차 디자인 문서는 찾지 못함.
- "수입/초"를 HUD에 두는지 카드에 두는지에 대한 게임별 비교 자료 없음.

---

## 2. 하단 내비게이션/시트 관행 — 탭 수, 배지, "구매 가능" 표시, 스크롤 vs 페이지

### Takeaway
한국 방치형(테일드 데몬 슬레이어)은 1차 탭을 하단 고정으로 두고 2차·3차 탭을 1차 탭 바로 위에 쌓아 엄지 동선을 최소화한다. "구매 가능" 신호는 AdVenture Capitalist의 'Managers 탭 불 켜짐'처럼 탭 자체가 상태를 띠는 방식이 오래된 관례다. 팝업이 레이아웃을 밀어내 오탭을 유발하는 것이 가장 자주 지적되는 실패다.

### Cited Findings
- 테일드 데몬 슬레이어 UI 설계 글: "탭 버튼은 화면 하단에서부터 1차 탭→2차 탭→3차 탭 순으로 전개", "1차 탭이 하단에서 시작하므로 나머지 하위 탭도 화면 상단이 아닌 1차 탭 가까이에 위치", "탭을 아래에 두면 동선을 줄일 수 있으며, 모바일은 화면 하단에 바텀 내비게이션이 고정적으로 위치" — [사용성 UP! 모바일 게임 UI 설계하기 - 테일드 데몬 슬레이어 (Medium, 검색 스니펫)](https://medium.com/@sabaek/%EC%82%AC%EC%9A%A9%EC%84%B1-up-%EB%AA%A8%EB%B0%94%EC%9D%BC-%EA%B2%8C%EC%9E%84-ui-%EC%84%A4%EA%B3%84%ED%95%98%EA%B8%B0-%ED%85%8C%EC%9D%BC%EB%93%9C-%EB%8D%B0%EB%AA%AC-%EC%8A%AC%EB%A0%88%EC%9D%B4%EC%96%B4-3d9bd67529c3)
- 같은 게임 유저 평: "방치형 게임 중 UI가 가장 직관적이고 편하다", 한 손 세로형 — [게임인사이트 체험기](http://www.gameinsight.co.kr/news/articleView.html?idxno=24056); [게임뷰](https://m.gamevu.co.kr/news/articleView.html?idxno=22104)
- AdVenture Capitalist 초반: "레몬 옆 탭 바를 계속 눌러 매니저를 살 돈을 모으면 **Managers 탭의 불이 켜진다**(light turning on when you have enough cash)" — [SuperCheats Walkthrough](https://www.supercheats.com/adventure-capitalist-cheats-tips-walkthrough/walkthrough/)
- Cats & Soup: 유저 불만 — "자동 업그레이드 버튼이 무작위 스테이션을 올림 → 수프/휴식/손질 등 하위 카테고리 요청", "상세 툴팁·업그레이드 분류 개선 요청" — [dev.to Cats&Soup](https://dev.to/jpdengler/exploring-the-charming-uiui-design-of-catssoup-3l9a)
- 아이들 게임 UI 불만(itch.io 코멘트·데브로그): "정보 팝업이 인터페이스를 밀어내서 플레이 중 여러 번 오클릭", "아이들 게임인데 위아래 스크롤을 계속 해야 함", "버튼이 너무 빽빽함", "텍스트가 너무 작아 읽기 어려움" — [itch.io post 15598703](https://itch.io/post/15598703); [itch.io post 14706654](https://itch.io/post/14706654); [Idle Shrooms comments](https://alkyer.itch.io/idle-shrooms/comments); [Idlewords UI Updates devlog](https://yurglepop.itch.io/idlewords/devlog/625540/ui-updates)
- 패널 닫기 접근성: "전체 화면 패널을 먼 모서리까지 손을 뻗지 않고 닫을 수 있어야 함"(20분 단일 기기 테스트 항목 4) — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 확인 버튼 위치: "직전 버튼과 정확히 같은 자리에 확인 버튼을 두지 말 것(실수 더블탭 구매 방지)" — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 터치 타깃 간격: ≥44pt 타깃끼리 최소 8pt, 32–44pt 타깃끼리 최소 12pt — [Tap Targets and Thumb Zones (72Technologies)](https://www.72technologies.com/blog/tap-targets-thumb-zones-mobile-ux)

### Inferences
- 개표국 5탭(시설·직원·사건·목표·감사)은 테일드식 "하단 1차 탭 고정" 관행과 부합. 탭 안의 세부 필터(2차 탭)는 시트 상단이 아니라 **탭바 바로 위**에 두는 것이 동선상 유리하다(테일드 글의 원칙에서 유도).
- "구매 가능" 신호는 (a) 탭 아이콘 점등/배지 + (b) 카드 버튼 색상 두 층으로 두되, 배지는 '지금 살 수 있음' 하나의 의미로 고정해야 피로를 막는다(추정; 다수 배지에 대한 정량 자료는 없음).
- 3단 시트의 peek 상태에서 탭바가 고정이면, 시트 높이가 변할 때 탭바 위치가 변하지 않아야 한다 — 레이아웃 이동이 오탭의 1순위 원인이라는 유저 불만과 직결.

### Gaps
- 탭 수(4 vs 5 vs 6)에 대한 비교 데이터나 디자이너 권고를 찾지 못함.
- 배지/알림 점의 개수·색상 관행에 대한 1차 자료 없음. "초록 화살표" 아이콘 관행(Idle Miner 등)의 공식 설명도 찾지 못함.
- 테일드 글의 본문(3차 탭 구성, 크기 수치) 미열람.

---

## 3. 업그레이드 어포던스 — 버튼 색 상태, 홀드 구매, 배수 토글, 비용 미리보기, 마일스톤 바, 숫자 표기·폰트

### Takeaway
"구매 불가=회색"은 Egg Inc 등에서 확인된 표준이다. 마일스톤 바는 Idle Theme Park처럼 "업그레이드마다 바가 차고, 가득 차면 외형 진화"가 모범. 숫자는 K/M/B/T→aa 2글자 체계가 글로벌 표준(aa=10^15)이고, 한국산 클리커는 가끔 만/억/조(1e4 단위)를 쓴다. 표시는 소수 2자리("0.##")가 관례.

### Cited Findings
- 구매 불가 버튼 회색 처리(Egg Inc) — [Medium 스니펫](https://medium.com/design-bootcamp/as-addictive-as-raising-chickens-1c59c804a5bf)
- Idle Theme Park: "업그레이드마다 바가 차고 가득 차면 새 피처 추가(각 어트랙션 진화가 눈에 보임)", 마일스톤 업그레이드마다 수익 부스트 — [Level Winner](https://www.levelwinner.com/idle-theme-park-tycoon-guide-tips-cheats-strategies-build-your-dream-theme-park-increase-your-profits/)
- 숫자 표기(글로벌): K=10^3, M=10^6, B=10^9, T=10^12, 이후 aa·ab·ac…; "Egg Inc, Idle Miner Tycoon, Gold and Goblins 등 대부분 모바일 아이들에서 aa=10^15"; "새 접미사는 시각적 마일스톤", "글자 체계는 한눈에 읽히고 3.4e21보다 정서적으로 더 크게 느껴진다"; Cookie Clicker는 가독성을 위해 긴 영어 단위명(short scale)을 기본으로 쓰고 'Short numbers'는 옵트인 — [Big Number Notation Explained (simpleidle)](https://www.simpleidle.com/learn/big-number-notation-explained)
- InnoGames 구현: 게임 디자인과 합의해 과학/공학 표기 대신 글자 표기(K, M, B, T, AA, AB, AC) 채택, 표시 포맷은 `Value.ToString("0.##") + 단위`(소수 최대 2자리), 1000 단위로 정규화 — [Dealing with huge numbers in idle games (InnoGames)](https://blog.innogames.com/dealing-with-huge-numbers-in-idle-games/)
- 나무위키 '증분 게임' 표기법 정리: 전통 표기(K/M/B)는 "e33을 넘어가면 일상에서 접하기 힘든 단위라서 가독성이 크게 떨어짐", 알파벳 표기는 "전통 표기법보다 가독성이 훨씬 뛰어남", 한자 표기(만/억/조, 1e4 단위)는 "한국산 클리커 게임에는 가끔 보인다(예: 거지 키우기)" — [증분 게임 (나무위키)](https://namu.wiki/w/%EC%A6%9D%EB%B6%84%20%EA%B2%8C%EC%9E%84)
- 한국어는 만(1e4) 단위로 끊고 영어는 천(1e3) 단위로 끊는 구조적 차이 — [Korean numerals (Wikipedia)](https://en.wikipedia.org/wiki/Korean_numerals); 조선시대 방치형 클리커 '주모 키우기'가 별도 단위표(만·억·조… 한자 단위)를 쓴 사례 — [주모 키우기 단위 표 (나무위키)](https://namu.wiki/w/%EC%A3%BC%EB%AA%A8%20%ED%82%A4%EC%9A%B0%EA%B8%B0!%20-%20%EC%A1%B0%EC%84%A0%EC%8B%9C%EB%8C%80%20%EB%B0%A9%EC%B9%98%ED%98%95%20%ED%81%B4%EB%A6%AC%EC%BB%A4%20%EB%8B%A8%EC%9C%84%20%ED%91%9C)
- 성장 배율 참고: 레벨당 생산 ×1.1, 비용 ×1.15(한 디자이너의 예시); "인간은 차이를 선형이 아니라 지수적으로 감지"하므로 지수 성장이 체감 진행에 맞음 — [Idle Game Design Principles (Eric Guan)](https://ericguan.substack.com/p/idle-game-design-principles)
- 버튼 눌림 피드백: `scale(0.97)` on :active, 100–160ms; 재생 과속(playful)은 0.95로 눌렀다가 80ms에 1.05 오버슈트 후 120ms에 1.0 안착(스프링) — [emilkowalski/review-animations STANDARDS.md](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md); [LottieFiles motion-design state-feedback](https://github.com/LottieFiles/motion-design-skill/blob/main/skills/motion-design/patterns/state-feedback.md)
- 눌림 확인은 "엄지가 버튼을 가리므로 접촉면 바깥(테두리·글로우·스케일)에서 보여줘야" 하며 "약 100ms 안에 인지" — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 가격 상승 폭 토론(개발자 포럼, 2차): 아이들 게임 업그레이드 가격 증가율 질의 — [Roblox DevForum](https://devforum.roblox.com/t/how-much-should-the-prices-of-an-upgrade-go-up-by-in-an-idle-game/2211689)

### Inferences
- 개표국은 한국어 정치 풍자라는 톤상 **만/억/조 표기**가 몰입에 맞지만, 1e4 단위는 자릿수가 4개씩 늘어 칩 폭이 들쭉날쭉해진다. "1.23억표"처럼 소수 2자리 + 단위 1글자로 고정 폭(탭ular 숫자) 처리하면 InnoGames의 "0.##" 관례와 호환된다(추정). 조(1e12)를 넘길 일이 드물면 K/M/B 체계보다 오히려 단위 수가 적어 유리.
- x1/x10/MAX 토글의 표준 UI 자료는 찾지 못했다. AdCap의 "Managers 불 켜짐"처럼 **MAX 선택 시 버튼에 '×N개' 수량과 총액을 함께 표기**하는 것이 비용 미리보기 역할을 겸한다(추정).
- "구매 가능" 버튼 색은 녹색 계열, 불가 시 채도 제거 + 라벨 유지(가격은 계속 보이게)가 레퍼런스와 일관.

### Gaps
- 홀드-투-바이(길게 눌러 연속 구매), 배수 토글(x1/x10/x100/MAX)의 관행을 정리한 디자인 1차 자료를 찾지 못함(Steam 미니 클리커의 Shift/Ctrl 모디파이어 사례만 존재).
- 폰트 선택(숫자용 서체, tabular figures)에 관한 게임별 자료 없음.
- "다음 마일스톤까지 N레벨" 바의 구체 치수(높이·세그먼트 수)는 찾지 못함.

---

## 4. Juice — 탭/구매/마일스톤 피드백의 구체 수치와 우선순위

### Takeaway
공통 합의: 피드백은 100ms 안에 시작해야 하고, 플래시 50–100ms, 히트스톱 50–100ms, 흔들림은 약 2–3px / 강 8–10px, 파티클 20–30개(그 이상은 혼란), 플로팅 숫자 1–2초. 디자이너들이 꼽는 최상위 3요소는 히트스톱·사운드 일치·카메라 제어이며, 흔들림·파티클은 희소하게 써야 임팩트가 남는다. "완성 후에 폴리시하라"가 Juice 토크의 전제.

### Cited Findings
- "Juice it or lose it"(Jonasson & Purho) 요지: 주스란 "끊임없고 풍부한 사용자 피드백 — 만지면 튀고 꿈틀대고 소리가 나는 것", "최소 입력에 최대 출력", 기법: 색·트위닝·스케일/스트레치·파티클·화면 흔들림·눈 붙이기·사운드 — [Juice (bradwoods garden)](https://garden.bradwoods.io/notes/design/juice); [cobble.games 요약](https://cobble.games/wise-inspiring-smart/game-design/juice-it-or-lose-it)
- 같은 토크 재현 블로그의 기법 목록(패들 속도 기반 스쿼시/스트레치, 충돌 시 공 확대·색 변경·흔들림, 블록 파괴 시 축소·회전·어둡게, 충돌 시 전체 블록 미세 이동, 충돌 유형별 파티클, 궤적 트레일, 벽/블록 충돌음 분리, 연속 타격 시 피치 상승) — "**모든 것을 N번째 자리까지 폴리시할 수 있다, 보기만 하면 된다**", 단 "**최종본이 되기 전엔 폴리시 시작하지 말라**"; 수치 파라미터는 제시되지 않음 — [Arzola's Dev Blog: GDCR Juice it or lose it](https://devblog.heisarzola.com/gdcr-juice-it-or-lose-it/)
- Vlambeer "The Art of Screenshake"(Nijman, 2013): 약 30가지 — 기본 애니·사운드, 큰 총알, 머즐 플래시, 임팩트 이펙트, 넉백, 영속성(탄피·연기), 카메라 lerp/kick, 화면 흔들림, **sleep(적중 시 순간 정지)**, 반동, 저음 보강 등 — [Game Developer: Squeezing more juice](https://www.gamedeveloper.com/design/squeezing-more-juice-out-of-your-game-design-); [DK Liao 재현 효과 분해](https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects); [원본 영상](https://www.youtube.com/watch?v=AJdEqssNZ-U)
- 피드백 파라미터(게임 피드백 블로그, 2026): 플래시 50–100ms; 흔들림 약공격 2–3px·강공격 8–10px, 지속은 플래시와 동일; 진동 0.08–0.12s(강 0.15–0.2s), 약 40Hz, 강도 약 30%/강 70%; **사운드는 진동 후 12ms 이내**; 파티클 20–30개(그 이상은 시각적 혼란), 초속 200–400px, 수명 0.5–1s; 플로팅 텍스트 1–2초, 타격점 근처·캐릭터 가리지 않게; 히트스톱 0.05–0.1s(애니만 멈추고 월드는 안 멈춤); 순서 "진동+사운드 동시 → 플래시(+20ms) → 파티클(+50ms) → 플로팅 텍스트(+100ms)"; 일반 공격 피드백 빈도 상한 3–5회/초; "100ms 안에 피드백이 없으면 지연으로 느낌"; **최상위 3요소: 히트스톱·사운드 일관성·카메라 제어** — [Where Does Game Feel Come From (eastondev)](https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/)
- 웹 구현 수치(Game feel on the web): 스쿼시&스트레치 총 ~420ms, scaleX/scaleY 반대 방향 4키프레임, 이징 `cubic-bezier(0.22,1,0.36,1)`, 스프링 변형 `cubic-bezier(0.34,1.56,0.64,1)`(= back.out(1.7)), transform-origin 바닥(50% 100%); 히트스톱 60–90ms(파괴적 확인 60–80ms); 흔들림 3단계 + "1도 미만의 회전 추가", ~600ms; 파티클 기본 14개(8+tier×5), 퍼짐 80–115px, 수명 0.55–0.95s, 위쪽 바이어스 −30px; 합성음 0.12s(연속 시 0.07s), 어택 ~12ms, ±4% 디튠, 스트릭마다 +16Hz(24단계 상한); **콤보 티어 10/20/30/50, 1.6초 무입력 시 리셋, 흔들림은 티어 3 이상에서만**; `prefers-reduced-motion`이면 모션·파티클·흔들림 비활성 — [Game feel on the web (valdemird)](https://valdemird.com/blog/game-feel-on-the-web/)
- UI 모션 표준: 버튼 눌림 100–160ms, 툴팁 125–200ms, 드롭다운 150–250ms, 모달/드로어 200–500ms, UI 애니 상한 300ms; 진입/퇴장 `cubic-bezier(0.23,1,0.32,1)`, 화면 내 이동 `cubic-bezier(0.77,0,0.175,1)`, iOS식 드로어 `cubic-bezier(0.32,0.72,0,1)`; "UI에는 절대 ease-in 금지"; 스프링 duration 0.5·bounce 0.1–0.3; transform/opacity만 애니; 감소 모션 시 "불투명도·색 전환은 유지하고 transform 모션만 제거 — 감소는 0이 아니라 '더 적고 부드럽게'" — [emilkowalski STANDARDS.md](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md)
- 햅틱: "중요 순간(구매, 적중)에 아껴 쓸 것" — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)

### Inferences
- 개표국 현재 요소(국장 스쿼시, +N 플로팅, 투표지 파티클, 콤보, 날아가는 투표지)는 Juice 목록의 대부분을 이미 갖췄다. 레퍼런스 수치로 점검할 항목: 탭 스쿼시 전체 길이(420ms는 캐릭터용이며 버튼은 160ms 이내), 플로팅 숫자 1–2초 유지 여부, 파티클 상한 20–30, 콤보 리셋 1.6초 근방, 흔들림은 콤보 상위 티어/마일스톤에만.
- "구매" 피드백은 플레이어가 가장 자주 수행하는 행동이므로 "탭보다 한 단계 큰" 피드백(짧은 햅틱 + 카드 바운스 + 시설 스프라이트 펄스)으로 차등화하고, "마일스톤/진화"에만 흔들림·슬로모·카메라 줌을 배정하는 3단계 위계가 레퍼런스 합의(흔들림 희소성, 티어 3+)와 맞다(추정).
- 숫자 롤업(count-up)의 권장 길이는 1차 자료를 찾지 못했다. UI 애니 상한 300ms 원칙과 플로팅 텍스트 1–2초 사이에서 HUD 롤업은 300–600ms 정도가 합리적(추정).

### Gaps
- Game Feel(Swink) 책의 아이들 게임 적용 논의는 찾지 못함.
- 아이들 게임 특화 "구매 피드백" 수치(예: Idle Miner의 업그레이드 시 효과 길이)는 공개 자료 없음.
- 숫자 롤업 지속시간, 콘페티 개수에 관한 1차 자료 없음.

---

## 5. 캐릭터의 생동감 — 아이들 루프, 깜빡임, 구매 반응, 말풍선, 이모트

### Takeaway
캐주얼/모바일용 아이들 루프는 2–4초, 깜빡임은 2–4초 간격·1프레임, 피젯(한 번짜리 동작)은 30–60초마다. 핵심 원칙은 "서로 다른 주기의 모션 2개 이상을 겹쳐라 — 전부 동기화되면 로봇 같다". Cats & Soup는 "요소와 상호작용할 때 미세 애니메이션 + 점진적 진행 표시 + 부드러운 전환"이 톤을 만든다.

### Cited Findings
- 아이들 애니 가이드: 단순 호흡 아이들 2–4초, 체중 이동 포함 복합 사이클 8–12초; 휴식 호흡 15–20회/분(경계 20–25), 수직 이동 1–2cm; 발 사이 체중 이동 4–8초 주기; **피젯은 30–60초마다 짧은 원샷 클립**(옷 매만지기, 목 긁기, 어깨 돌리기); 모바일/캐주얼은 2–4초 짧은 루프에 보조 모션 단순화 — [Idle Animation for Games: Design Guide (mocaponline)](https://mocaponline.com/blogs/mocap-news/idle-animation-game-dev-guide)
- 픽셀/캐주얼 가이드: "깜빡임은 루프 시간 기준 2–4초마다, 1프레임, 눈을 다시 그리지 말고 찌그러뜨려라", "서로 다른 주기의 모션 두 개(4프레임 호흡 + 몇 루프마다 깜빡임)가 유기적이고, 전부 동기화되면 로봇 같다" — [Pixel Art Idle Animation (piximelon)](https://piximelon.com/guides/pixel-art-idle-animation/)
- 다른 구현 예: 주인공 아이들 위에 2.5초마다 깜빡임 오버레이 — [GDevelop Forum](https://forum.gdevelop.io/t/solved-making-my-character-blink/46268)
- Cats & Soup: "요소와 상호작용할 때 미세한 애니메이션", "행동의 효과를 보여주는 점진적 진행 표시", "부드러운 전환이 행동 사이를 안내", "차분한 애니메이션이 고요한 분위기", 손그림·얇고 부드러운 선·동화책 같은 온기 — [dev.to Cats&Soup](https://dev.to/jpdengler/exploring-the-charming-uiux-design-of-catssoup-3l9a); [CatSwoppr 리뷰](https://www.catswoppr.io/post/catswoppr-game-review-cats-and-soup)
- Egg Inc: 빨간 버튼을 누르면 병아리가 뛰어나오는 즉각 반응 — [Medium 스니펫](https://medium.com/design-bootcamp/as-addictive-as-raising-chickens-1c59c804a5bf)
- Cookie Run: Kingdom은 쿠키 정보·오버월드 상호작용용 말풍선(꼬리 있음/없음 두 종류, 확장·축소 가능)을 사용 — [Cookie Run Kingdom OCs wiki: Resources and Assets](https://cookierunocs.fandom.com/wiki/Resources_and_Assets/Kingdom/Fanmade) (2차·팬 자료)
- 주스 기법으로 "물체에 눈 붙이기(personality touch)" — [bradwoods Juice](https://garden.bradwoods.io/notes/design/juice)

### Inferences
- 개표국 직원 스쿼시/스트레치 루프와 심부름 걷기는 "주기가 다른 모션 겹치기"를 직원 간에 위상 차(phase offset)를 주어 적용하면 로봇 느낌을 피할 수 있다(가이드 원칙에서 유도). 국장에게는 호흡(2–4초) + 깜빡임(2–4초, 비동기) + 피젯(30–60초) 3층 구조가 최소 사양.
- 구매/마일스톤 시 국장·직원의 "반응"(점프, 말풍선 한 줄)은 Egg Inc의 즉각 반응과 Cookie Run의 말풍선 관행을 결합한 형태로, 풍자 톤의 텍스트를 싣기 좋은 자리다(추정). 말풍선은 1–2초(플로팅 텍스트 기준) 또는 탭으로 닫힘이 적절(추정).

### Gaps
- Cats & Soup·Animal Restaurant·Cookie Run Kingdom의 캐릭터 반응 타이밍·이모트 종류를 정리한 1차 디자인 자료는 찾지 못함.
- Idle Miner Tycoon 일꾼 애니메이션 사양 자료 없음.

---

## 6. 온보딩/FTUE — 첫 60초, 포인터 손, 첫 자동화 시점, 첫 업그레이드 점등

### Takeaway
아이들 장르의 약속은 "첫 1분 안에 입력 없이 숫자가 오르는 것"을 보여주는 것이며, 첫 세션에 "첫 자동화·첫 큰 배수·첫 오프라인 수익 확인" 3개의 아하 모먼트를 넣으라는 것이 업계 권고다. 튜토리얼은 한 번에 하나의 메커닉, UI는 필요할 때 등장, 5분 안에 실제 플레이. Egg Inc는 "다음 단계를 하이라이트하고 메커니즘을 점진적으로 드러내는 가이드"로 평가받는다.

### Cited Findings
- Egg Inc: "배우기 매우 쉽다 — 가이드가 무엇을 할지 알려주고, 시작을 안내하고, 다음 단계를 하이라이트하고, 하나씩 배울 때 메커니즘을 점진적으로 드러낸다", "압도되지 않고 온보딩을 통과" — [Medium 스니펫](https://medium.com/design-bootcamp/as-addictive-as-raising-chickens-1c59c804a5bf)
- AdVenture Capitalist: 첫 실행 시 튜토리얼 제공, 레몬 가판대 탭→재투자, "매니저를 살 돈이 모이면 Managers 탭에 불이 켜짐", 매니저는 오프라인에도 작동 — [SuperCheats](https://www.supercheats.com/adventure-capitalist-cheats-tips-walkthrough/walkthrough/); [Pocket Gamer](https://www.pocketgamer.com/adventure-capitalist/adventure-capitalist-tips-and-cheats-for-making-money/); [Mistplay 가이드](https://www.mistplay.com/blog/adventure-capitalist-guide)
- 아이들 개발 가이드(2차): "첫 1분 안에 입력 없이 숫자가 오르는 걸 보여줘야 한다 — 그것이 장르의 약속", "첫 세션은 첫 자동화·첫 큰 배수·첫 오프라인 체크인의 3개 '아하'를 전달", "자동화 해금은 신중히 — 너무 이르면 이탈", 소프트런치 기준 D1 35–45%, D7 15–20%, D30 5–10%, 그 아래면 "약한 첫 세션 경험 또는 평평한 진행 곡선"이 원인이며 "보상 페이싱·오프라인 상한·첫 프레스티지 위치"가 리텐션을 가장 많이 움직임 — [Idle game development (Game-Ace)](https://game-ace.com/blog/idle-game-development/) (본문 미열람, 검색 요약 기반)
- FTUE 일반 규칙: "5분 안에 실제 플레이가 아니면 플레이어를 신뢰하지 않는다는 뜻", "한 번에 한 메커닉, 안전한 맥락에서 가르친 뒤 결합", "작업 기억 3–7개 → 점진 공개", "UI는 필요할 때 등장, 전면 로드 금지", 하지 말 것: 기본 조작 설명 팝업, 실험 금지, 스킵 없음; 측정 포인트: 튜토리얼 시작, 각 메커닉 게이트 통과, 첫 이탈 — [First Time User Experience: The 60 Seconds… (Recognizing Patterns)](https://recognizingpatterns.substack.com/p/first-time-user-experience-your-player)
- Skillz 튜토리얼 모범 사례 문서(참조만) — [Skillz Tutorial Best Practices](https://docs.skillz.com/docs/28.0.17/tutorials/)
- 모바일 "첫 60초: 아이콘 탭 → 재미있는 일; 모든 스플래시/로그인이 설치를 비용으로 치른다", 테스트: "신규 플레이어로 60초 — 재미까지 탭 수 세기" — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 참여 빈도 설계: 첫 세션 15–60분 적극 참여 후 시간→일→주 단위로 감소; 짧은 주기(20분)·중간(5시간)·긴(2일) 여러 "시계" — [Eric Guan](https://ericguan.substack.com/p/idle-game-design-principles)
- Deconstructor of Fun 아이들 특집(Hyper Hippo, AdCap 제작사) 팟캐스트 존재 — [How to Make a Hyper Successful Idle Game (DoF podcast)](https://creators.spotify.com/pod/profile/deconstructoroffun/episodes/How-to-Make-a-Hyper-Successful-Idle-Game-e135s9u) (내용 미청취)

### Inferences
- 개표국 첫 60초 목표 상태(추정, 레퍼런스에서 유도): 0–10초 국장 탭으로 +N 체감 → 20–40초 첫 시설 구매 버튼 점등(녹색) → 60초 이내 첫 직원(자동화) 등장으로 "손 떼도 숫자가 오름" → 첫 종료 전 오프라인 수익 예고. 포인터 손은 "다음 단계 하이라이트" 한 곳만.
- 5개 탭을 처음부터 다 열지 말고(사건·감사 등) 회색 잠금 + 해금 시 툴팁이 apptrove·FTUE 글의 '점진 공개'와 일치.

### Gaps
- 레퍼런스 게임별 "첫 자동화 도달 시각(초)" 실측 자료는 없음. "포인터 손" 사용의 디자인 가이드도 1차 자료 없음.
- Game-Ace 본문과 DoF 팟캐스트 내용은 직접 확인 못 함.

---

## 7. 접근성·인체공학 — 엄지 구역, 44px, 감소 모션, 큰 글자, 금색/어두운 UI 대비

### Takeaway
iOS 44×44pt, Android 48×48dp, WCAG 2.2 최소 24×24 CSS px이 바닥선이고, 게임에서는 주 행동 버튼 64–80dp, 메뉴 행 56dp 전체 폭을 권한다. 감소 모션은 "흔들림·파티클·빠른 카메라 제거, 불투명도 전환은 유지", 깜빡임은 초당 3회 이하. 밝은 햇빛을 가정해 "색만으로 상태를 표현하지 말고 텍스트에 자체 대비(스크림/외곽선)를 주라"는 것이 게임 특유의 규칙.

### Cited Findings
- 타깃 크기: Apple 44×44pt, Android 48×48dp, WCAG 2.2 Target Size(Minimum) 24×24 CSS px — [Touch Target Size for Mobile (WeAccess)](https://www.weaccess.ai/blogs/mobile-touch-target-size)
- 게임 권장 표: 주 행동 64–80dp, 메뉴/리스트 행 56dp 전체 폭, 아이콘 버튼 48dp 시각/56dp 히트, 간격 8dp 최소·12–16dp 권장(파괴적 행동은 더), "히트 영역과 아트워크는 별개(40px 아이콘을 56px 투명 버튼 안에)" — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 간격: ≥44pt 타깃 간 8pt, 32–44pt 타깃 간 12pt — [72Technologies](https://www.72technologies.com/blog/tap-targets-thumb-zones-mobile-ux)
- 햇빛·시야 조건: "햇빛과 50% 밝기에서 테스트", "텍스트는 스크림/외곽선으로 자체 대비 — 아트워크에 의존 금지", "**색만으로 상태 표현 금지(햇빛이 채도를 떨어뜨림)**", "살짝 더러운 화면을 비스듬히 들고 확인" — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 감소 모션: `prefers-reduced-motion` 감지 시 화면 흔들림·파티클·패럴랙스·빠른 카메라·플래시를 줄이거나 제거; 흔들림은 "쓰지 않거나 끌 수 있게"; WCAG 2.3.1 초당 3회 초과 플래시 금지; 텍스트 크기 25/50/100% 확대 옵션 사례; PC/콘솔 1080p 기본 최소 32px·최대 46px까지 확대 권고 — [Gaming Accessibility Options (Gloobia)](https://gloobia.com/gaming-accessibility-options/); [Accessible Games Initiative Tags and Criteria (2025 PDF)](https://accessiblegames.com/wp-content/uploads/2025/07/Accessible-Games-Initiative-Tags-and-Criteria_July-2025.pdf); [Game Accessibility (abratabia)](https://abratabia.com/game-accessibility/)
- 감소 모션의 올바른 해석: "불투명도·색 전환은 유지, transform 기반 모션 제거; 0이 아니라 더 적고 부드럽게" — [emilkowalski STANDARDS.md](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md)
- 텍스트 크기(모바일 게임): 본문 14–16pt 바닥, 움직이는 플레이 16pt+, HUD 숫자는 고대비·고정 위치면 더 작아도 됨 — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 설계 기준 해상도 "390×844 세로 기준으로 pt 설계, 2×/3× 내보내기, 고정 좌표 대신 앵커+세이프에어리어" — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)
- 운동 장애 관점의 터치 타깃 문제 — [Siteimprove](https://www.siteimprove.com/blog/motor-impairments-and-mobile-ui-the-touch-target-problem/)

### Inferences
- 개표국 하단 시트 탭 5개를 390px 폭에 두면 탭당 78px — 44pt 이상이므로 충족. 시설 카드의 x1/x10/MAX 세그먼트는 32–44pt 범위일 가능성이 높아 **간격 12pt** 규칙을 점검해야 한다(추정).
- 금색 숫자 + 따뜻한 파스텔 배경은 햇빛에서 채도가 빠지면 대비가 급락하는 조합이므로, 재화 칩 숫자에 어두운 외곽선/스크림을 주고 "구매 가능"을 색 외에 아이콘(↑)이나 라벨로 이중 표기해야 한다(h-idris 규칙에서 유도).
- Phaser 캔버스의 파티클·흔들림·콤보 연출은 OS 감소 모션 설정(`prefers-reduced-motion`)과 인게임 토글 둘 다로 끌 수 있어야 하며, 끌 때도 +N 텍스트·불투명도 전환은 남긴다.

### Gaps
- 금색/어두운 UI의 WCAG 대비비를 실제 측정한 게임 사례는 찾지 못함.
- 모바일 게임의 "큰 텍스트" 옵션 채택률·치수(모바일 기준) 1차 자료 없음(위 32/46px은 PC/콘솔 1080p 기준).

---

## 8. 아이들 게임 리뷰에서 반복 지적되는 UI 실패

### Takeaway
반복 지적은 (1) 팝업이 레이아웃을 밀어 오탭 유발, (2) 아이들인데 스크롤을 계속 해야 함, (3) 버튼 과밀, (4) 작은 글자, (5) 자동 업그레이드의 대상 불명확(Cats & Soup) 다섯 가지로 수렴한다. 수익 측면에서는 "약한 첫 세션"이 리텐션 저하의 최대 원인으로 지목된다.

### Cited Findings
- "정보 팝업이 인터페이스를 움직여 여러 번 오클릭" — [itch.io post](https://itch.io/post/15598703)
- "아이들 게임에서 위아래 스크롤을 계속해야 하는 점이 경험을 해침" — [itch.io post](https://itch.io/post/14706654)
- "버튼이 너무 빽빽함" — [itch.io post](https://itch.io/post/8634222)
- "UI 텍스트가 너무 작아 읽기 어려움" — [Idle Shrooms comments](https://alkyer.itch.io/idle-shrooms/comments)
- Cats & Soup 자동 업그레이드가 무작위 스테이션을 올려 하위 카테고리 요청 — [dev.to](https://dev.to/jpdengler/exploring-the-charming-uiux-design-of-catssoup-3l9a)
- 리텐션 기준 미달 시 "약한 첫 세션 경험 또는 평평한 진행 곡선" — [Game-Ace](https://game-ace.com/blog/idle-game-development/)
- 설계 원칙 위반 사례로 "열자마자 어디를 눌러야 할지 모르면 진 것" — [apptrove](https://apptrove.com/how-to-make-an-idle-game/)
- 증분 게임의 광고 패턴: "광고를 보면 특정 시간 동안 가속", 광고 제거 구매 — [증분 게임 (나무위키)](https://namu.wiki/w/%EC%A6%9D%EB%B6%84%20%EA%B2%8C%EC%9E%84)

### Inferences
- 개표국 3단 시트는 "스크롤 대신 접힘 단계"로 스크롤 피로를 줄이는 장치이지만, half 상태에서 카드가 2장 미만만 보이면 결국 스크롤이 생기므로 half 높이는 "카드 2.5장"처럼 다음 카드가 살짝 보이게 맞추는 것이 좋다(추정).
- 사건(이벤트) 팝업은 월드 위에 띄우되 시트·탭바 레이아웃을 밀지 않는 오버레이여야 한다(오탭 불만과 직결).

### Gaps
- 앱스토어 리뷰 텍스트 마이닝 수준의 정량 자료(예: UI 불만 비율)는 찾지 못함. Reddit 스레드 접근 불가.

---

## 9. 우선순위 비평 체크리스트 (개표국 화면 점검용, 기대 효과 순)

### Takeaway
아래 16개 항목은 위 출처에서 도출했으며, 상위일수록 리텐션·오탭·가독성에 직접 영향이 큰 것으로 판단했다(순서 자체는 추정).

### Cited Findings
- 체크리스트 각 항목의 근거는 괄호 안 섹션 번호의 인용을 따른다. 추가 1차 출처: 단일 기기 20분 테스트 프로토콜(한 손 5분, 햇빛 사진, 먼 모서리 없이 패널 닫기, 8dp 간격 측정, 주 행동 20연타 더블파이어 확인, 신규 플레이어 60초 탭 수, 낯선 사람에게 2분 무언 관찰) — [h-idris](https://h-idris.com/blog/mobile-game-ui-design.html)

### Inferences
1. **첫 60초 안에 "손 떼도 숫자가 오른다"가 보이는가?** 첫 직원(자동화) 등장 시각을 측정하고 60초 이내로 당길 것. 첫 세션에 자동화·큰 배수·오프라인 수익 3개 아하를 배치했는가. (§6)
2. **열자마자 눌러야 할 곳이 하나로 보이는가?** 국장 + 점등된 첫 구매 버튼 외의 요소(잠긴 탭·배지)는 회색/숨김. (§1, §6)
3. **레이아웃을 밀어내는 팝업이 없는가?** 사건·보상 팝업은 오버레이, 탭바·시트 높이는 팝업으로 변하지 않음. (§2, §8)
4. **탭 피드백이 100ms 안에 시작하고, 눌림 표시가 엄지 바깥에서 보이는가?** 버튼 scale 0.95–0.97, 100–160ms, ease-out, ease-in 금지. (§3, §4)
5. **피드백 위계 3단이 있는가?** 탭(플로팅 +N, 파티클 ≤20–30, 짧은 음) < 구매(햅틱 0.08–0.12s + 카드 바운스 + 시설 펄스) < 마일스톤/진화(흔들림 8–10px·히트스톱 60–90ms·카메라 줌·콘페티). 흔들림은 콤보 상위 티어/마일스톤에만. (§4)
6. **사운드와 진동이 동시(≤12ms)이고, 피드백 빈도가 초당 3–5회를 넘지 않는가?** 연타 시 파티클·사운드 폴링/쓰로틀. (§4)
7. **"구매 가능" 상태가 색 + 다른 신호(아이콘/라벨/탭 점등)로 이중 표기되는가?** 불가 시 회색이지만 가격은 계속 보이는가. (§1, §3, §7)
8. **숫자 표기가 한 체계로 일관되고 폭이 안정적인가?** 만/억/조(1e4) 채택 시 "1.23억" 소수 2자리 고정 + 탭ular 숫자; HUD·카드·플로팅 텍스트가 같은 포맷. (§3)
9. **시설 카드에 "다음 마일스톤까지" 바가 있고, 도달 시 외형 변화(진화)가 월드에 보이는가?** (§1, §3)
10. **상단 HUD에 눌러야 하는 요소가 없는가?** 상세는 하단 시트에서. 상단 인셋·노치 영역에 숫자가 걸리지 않는가. (§1, §7)
11. **2차 탭/필터가 하단 탭바 바로 위에 있는가(시트 상단이 아니라)?** 전체 펼침 시트를 먼 모서리 없이 닫을 수 있는가(드래그·하단 닫기). (§2)
12. **x1/x10/MAX 세그먼트와 업그레이드 버튼이 44pt 이상, 간격 8–12pt인가?** 20연타 시 더블파이어·오구매가 없는가, 확인 버튼이 직전 버튼 자리와 겹치지 않는가. (§3, §7)
13. **캐릭터가 세 층의 비동기 모션(호흡 2–4s, 깜빡임 2–4s, 피젯 30–60s)을 갖고, 직원끼리 위상이 어긋나는가?** 구매·마일스톤에 캐릭터 반응(점프/말풍선 1–2s)이 있는가. (§5)
14. **플로팅 +N이 1–2초 유지되고 캐릭터·버튼을 가리지 않는가?** 콤보 리셋 약 1.6s, 콤보 티어 임계(10/20/30/50 등)가 있는가. (§4)
15. **감소 모션 옵션(OS 설정 + 인게임 토글)이 흔들림·파티클·카메라만 끄고 불투명도 전환·+N은 남기는가?** 플래시 ≤3회/초. (§7)
16. **햇빛·50% 밝기에서 금색 숫자가 읽히는가?** 재화 숫자에 외곽선/스크림, 본문 ≥14–16pt, 작은 캡션도 고대비. (§7)

### Gaps
- 항목 순서(기대 효과)는 정량 근거가 아니라 출처들의 강조도(첫 세션·오탭·100ms 규칙)를 바탕으로 한 판단이다.
- Egg Inc 사용성 연구와 테일드 데몬 슬레이어 UI 글의 본문, Game UI Database 스크린샷 태그, DoF 아이들 팟캐스트는 접근 불가로 반영하지 못했다. 이 네 소스는 사용자 Chrome에서 직접 열어 보완하는 것을 권한다.

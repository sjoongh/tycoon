# 모바일 방치형/타이쿤 게임의 "월드 성장" 시각화 레퍼런스 (world_progression)

조사일: 2026-11-10. 대상: Idle Miner Tycoon, Idle Theme Park Tycoon, Idle Supermarket Tycoon, Idle Bank Tycoon, Idle Restaurant Tycoon, My Perfect Hotel, Cats & Soup(고양이와 스프), Egg Inc, 거지키우기, 중년기사 김봉식, AdVenture Capitalist, Tap Titans 2.

적용 대상(개표국): 고정 7x7 아이소 단일 룸, 시설 6종×비주얼 5티어, 국장 5단계, 직원 최대 3명, 지역 사다리 16+단계(경로당→…→우주정거장), 감사(프레스티지). 현재 "룸이 커지지 않는다"가 최대 결핍.

표기 규칙: `[관측]` = 출처가 있는 사실. `[추론]` = 출처 기반 추정 또는 일반 지식(검증 필요). `[권고]` = 개표국 적용 제안.

주의: Fandom 위키(idleminertycoon / idle-themepark-tycoon / egg-inc / tap-titans-2 등)는 조사 시점에 HTTP 402로 직접 조회가 막혀, 검색 스니펫에 노출된 수치만 인용했다. 해당 항목은 "스니펫 기반"으로 표시.

---

## KQ1. 타이틀별: "세계가 커졌다/좋아졌다"를 어떻게 보여주는가

### Takeaway
선두 타이틀은 (a) **한 축으로 증식하는 유닛**(수직 갱도·층·구역·플롯), (b) **같은 구조의 더 큰 새 장소로 이주**(프레스티지=새 광산/새 도시/새 은행/새 호텔/새 숲), (c) **건물 자체의 티어 외형 교체**(Egg Inc 19단 서식지, 12단 차량) 중 최소 둘을 겹쳐 쓴다. 숫자만 커지는 게임(AdCap, Tap Titans류)도 "행성 이동/14개 렐름"처럼 배경 세트 교체를 거대 마일스톤에 묶는다.

### Cited Findings

**Idle Miner Tycoon (Kolibri Games)**
- 광산 1개당 일반 갱도 최대 30개, 코어 갱도 5개 추가(총 35). 갱도 1개당 최대 레벨 800. 창고·엘리베이터 최대 2400(코어 해금 시 2800). 7개 대륙. — [Kolibri Help Center](https://kolibri-games.helpshift.com/hc/en/3-idle-miner-tycoon/faq/53-what-are-the-maximum-levels/)
- 갱도 레벨 10/50/100/200/400에서 **작업자 1명씩 추가**(시각적으로 인원이 늘어남). 레벨 구간 증분 10, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800. 코어 갱도(31~35)는 "노란 모래색 배경"으로 구분. (스니펫 기반) — [IMT Fandom: Mineshafts](https://idleminertycoon.fandom.com/wiki/Mineshafts)
- 코어 갱도 해금 조건: "7대륙 광산 중 하나에서 **프레스티지 5** 도달 + 30번째 갱도 해금". — [Kolibri Help Center](https://kolibri-games.helpshift.com/hc/en/3-idle-miner-tycoon/faq/53-what-are-the-maximum-levels/)
- GDC 2019 디컨: "몇 번 프레스티지하면 게임이 늘 똑같이 느껴진다"는 문제를 **새 비주얼 광산 투자**로 해결. 플레이어는 원래 광산을 유지한 채 여러 광산으로 확장 가능(강제 리셋 아님). "Idle games should take note of the visual changes necessary to drive a new style of engagement." — [Mobile Free To Play: GDC 2019 Deconstructing IMT](https://mobilefreetoplay.com/gdc-2019-deconstructing-idle-miner-tycoon/)
- 핵심 루프 4단계(채굴→운반→판매→업그레이드)를 **한 화면에 모두 보이게** 설계; 단계 사이 "choke point"가 진행 속도와 과금 포인트. 주간 업데이트 160회+ (신자원, 탐험 지역, 원정, 스킬트리, 한정 이벤트 광산, 시즌패스). MVP D1 리텐션 63~81%. — [GameAnalytics: 8 lessons from Kolibri](https://www.gameanalytics.com/blog/making-a-hit-idle-game-eight-lessons-from-kolibri-games)
- 치즈 광산(2017 만우절)이 최초 이벤트 광산 → 이후 주간 이벤트 광산 체제, 127번째 이벤트 광산까지 운영. 매주 1회 업데이트. — [Kolibri blog: Can We Talk About Cheese?](https://www.kolibrigames.com/blog/can-we-talk-about-cheese/), [Kolibri blog: LiveOps](https://www.kolibrigames.com/blog/creating-the-game-you-want-with-liveops/)

**Idle Theme Park Tycoon (Codigames)**
- 한 파크 안의 섬 7개: Paradise(시작) → Wild → Horror → Pirate → Moon → Frenetic → Desert. 수입 배율: Wild/Horror/Pirate 각 +200%, Moon +300%, Frenetic +400%, Desert +500%. "새 섬 돈이 모이면 바로 해금하라. 현금은 가져갈 수 없지만 새 어트랙션+높은 배율로 금방 복구." — [Level Winner](https://www.levelwinner.com/idle-theme-park-tycoon-farming-guide-tips-tricks-to-get-rich-quick/), [AppGamer](https://www.appgamer.com/idle-theme-park-tycoon/strategy-guide/best-tips-and-hints)
- 섬 가격 예: Wild 500K, Horror 2B, Pirate 1T. 각 섬은 **이전 어트랙션을 모두 유지 + 테마 신규 1종 추가**(Pirate: Shooting Gallery, Ferris Wheel, Roller Coaster, Jungle Ride, Valley of Terror, Treasure Island). — [Touch Tap Play](https://www.touchtapplay.com/idle-theme-park-tycoon-islands-guide-attractions/)
- 파크 단위 이주: Aqua Park(2번째)는 "기본 파크에서 Pirate Island 구매 시" 해금, Terror Park(3번째). (스니펫 기반) — [ITPT Fandom: Aqua Park](https://idle-theme-park-tycoon.fandom.com/wiki/Aqua_Park), [Terror Park](https://idle-theme-park-tycoon.fandom.com/wiki/Terror_Park)
- 새 섬 구매 시 "다시 시작하지만 현금 부스트 + 더 넓은 건설 공간". — [Google Play 설명](https://play.google.com/store/apps/details?id=com.codigames.idle.theme.park.tycoon&hl=en)

**Idle Supermarket Tycoon (Codigames)**
- 도시 사다리 10단: Residential Area → Small Town → Small City → Miami Beach → Beverly Hills → Paris → London → Tokyo → Hong Kong → New York. "프레스티지 = 현재 슈퍼마켓을 팔고 새 도시에 새 슈퍼마켓 개점". Miami Beach부터 급격히 길어짐. — [WriterParty](https://writerparty.com/party/idle-supermarket-tycoon-unlock-all-cities-guide/); 도시명은 업적 목록으로도 확인 — [Exophase 업적](https://www.exophase.com/game/idle-supermarket-tycoon-android/achievements/)
- 이주 시 부서 레벨·주차장·광고가 리셋되지만 영구 수익 부스트로 빠르게 복귀. 채소 코너 하나로 시작 → 부서를 하나씩 해금(제과, 세탁, 생선 등). — [Level Winner](https://www.levelwinner.com/idle-supermarket-tycoon-guide-tips-cheats-strategies-to-maximize-your-profits/), [AppGamer](https://www.appgamer.com/idle-supermarket-tycoon/strategy-guide/how-to-play-idle-supermarket-tycoon)

**Idle Bank Tycoon (Kolibri Games)**
- 방 4개: Main Hall(업그레이드 항목 6), Service Desk(3), Marketing Desk(4), Vault(5: Vault, Cash Carts, Security Equipment, Monitors, Statue). 모든 항목을 맥스해 100%가 되면 은행이 "sold" 표시되고 **더 큰 다른 지역 은행**으로 이동. "2번째 이후 은행은 더 크고 방마다 항목이 많아 더 오래 걸린다." — [Level Winner](https://www.levelwinner.com/idle-bank-tycoon-money-empire-guide-tips-tricks-strategies/), [FatWallet Refugee](https://fatwalletrefugee.com/2024/02/27/idle-bank-tycoon/)
- 평판(Reputation)=레벨. 업그레이드마다 평판 상승, 매니저 레벨 6, Business Mode 레벨 7 해금. 퀘스트→마일스톤→프레스티지 3층 구조. 프레스티지 시 **소프트 통화 유지**한 채 새 은행 이동. 비판: "어느 구역이 어느 부서인지, 어디를 탭해야 하는지 구분이 어렵다" — 경쟁작 대비 플레이 가능/불가능 공간 구분이 약함. — [PocketGamer.biz 디컨](https://www.pocketgamer.biz/game-analysis-deconstructing-idle-bank-tycoon-by-kolibri-games/)
- 체감 속도: 필자가 24시간 내 Bank 3, 7일차 Bank 6 도달. — [FatWallet Refugee](https://fatwalletrefugee.com/2024/02/27/idle-bank-tycoon/)

**Idle Restaurant Tycoon (Kolibri Games)**
- 테이블 단위 업그레이드(테이블·장식·의자·접시·음료·양념 각각 레벨업) + **방(room) 해금으로 매장 확장**. 각 방 전체 맥스 → 별(star) 획득 → 별 요구치 충족 시 새 지역 레스토랑 해금, 집 아이콘으로 매장 전환. — [CouchClicker](https://www.couchclicker.com/idle-restaurant-tycoon-guide-tips-tricks-and-strategies/)

**My Perfect Hotel (SayGames, 아케이드 아이들)**
- 호텔 8개: Drive Motel → Beach → Mountain → Rising Sun → Overwater → Spooky → Moon → Festival. **호텔마다 8레벨**, 8레벨 완료 시 다음 호텔 해금 후 레벨 1부터. 통화·스킬은 이월, 직원·호텔별 업그레이드(청소 속도 등)는 미이월. — [SimpleGameGuide](https://simplegameguide.com/my-perfect-hotel-levels-hotels/)
- 디컨: 방을 돈으로 순차 해금; 화장실·창고·식당·바·수영장·주차장이 특정 호텔 레벨에서 등장. 호텔 고유 통화 색상. 직원(청소부·리셉션·웨이터·로더·바텐더)이 눈에 보이게 일함. 튜토리얼 없이 "늘어나는 시각적 복잡도"로 진행을 전달. — [ARPU Brothers 디컨](https://arpubrothers.com/blog/my-perfect-hotel-arcade-idle-deconstruction/)
- "호텔 100% 완성 시 다른 레이아웃·더 넓은 면적·추가 기능의 새 호텔 해금". — [gamulo 가이드](https://gamulo.com/game/my-perfect-hotel/)

**Cats & Soup (HIDEA/네오위즈)**
- 공식 FAQ: "확장은 숲이 꽉 찼을 때만 가능", 우하단 망치 버튼. — [공식 FAQ](https://nwzrise.oqupie.com/portals/1694/articles/66186)
- 첫 확장은 시작 직후, 2번째는 스포트라이트 건설 직후 50골드. 확장 목적 = 새 시설 배치 공간 + 희귀 고양이 초대. — [Touch Tap Play](https://www.touchtapplay.com/how-to-expand-the-forest-in-cats-soup/)
- 2025-10 업데이트: 기존 숲과 **분리된 "새로운 숲"**을 추가하고 고양이가 **연결 통로**로 맵 간 이동. 숲 테마 리뉴얼("으스스한 숲": 테마별 특수효과, 전용 NPC, 이스터에그) — 숲 외형뿐 아니라 UI·장식도 함께 교체. — [베타뉴스](https://www.betanews.net/article/view/beta202510240013), [시사위크](https://www.sisaweek.com/news/articleView.html?idxno=230107)
- 시설 최대 업그레이드 레벨 24000, 좌하단 버튼 길게 눌러 싼 순서로 자동 업그레이드. — [나무위키: 고양이와 스프](https://namu.wiki/w/%EA%B3%A0%EC%96%91%EC%9D%B4%EC%99%80%20%EC%8A%A4%ED%94%84)

**Egg, Inc. (Auxbrain)**
- 서식지(Hen house) **19단계** (COOP 250마리 → CHICKEN UNIVERSE 6억). 차량 **12단계**(TRIKE 5,000개 → HYPERLOOP TRAIN; 하이퍼루프는 역 설치에 골든에그 5만). 부화장 외형은 **알 종류에 따라 변화**, 창고 외형은 차량 수·적재량에 따라 변화. 사일로 기본 2 → 최대 10. — [en.namu.wiki: Egg Inc Vehicles and Buildings](https://en.namu.wiki/w/Egg,%20Inc./%EC%B0%A8%EB%9F%89%20%EB%B0%8F%20%EA%B1%B4%EB%AC%BC)
- 서식지 용량 예: Coop 250, Shack 500, Super Shack 1,000, Short House 2,000, The Standard 5,250, Long House 10,000, Double Decker 21,000, Warehouse 52,500, Center 105,000, Bunker 210,000, Eggkea 525,000, HAB 1000 1,050,000, Hangar 2,100,000 … (스니펫 기반) — [Egg Inc Fandom: Habitats](https://egg-inc.fandom.com/wiki/Habitats)
- 알 종류 전환 = "새 알로 업그레이드하면 재시작하되 기본가가 높아짐", 후반 알·차량은 미래 테마. 프레스티지는 닭·일반연구·서식지·사일로·차량을 리셋하고 알을 Edible로 되돌림, 소울에그는 농장 가치 기준. — [Wikipedia: Egg, Inc.](https://en.wikipedia.org/wiki/Egg,_Inc.), [Egg Inc Fandom: Prestige](https://egg-inc.fandom.com/wiki/Prestige)

**거지키우기 (마나바바)**
- 자산 사다리: 부동산 7단계(단독주택→50층 빌딩), 기업 19개(떼쓸라→애플들), 도시 10개(타이베이→서울, 서울 최대 93~104레벨), 행성 7개(수성→해왕성, 최종 콘텐츠). 인벤토리에서 **배경 구매·변경** 가능. 레벨 구간마다 "회상카드"로 스토리. 환생 시 대부분 초기화, 마나/환생횟수/보물거지/유물/부자의 탑 등 유지, 환생 보너스 300~1000레벨 구간별 누적. 2019-06 대규모 업데이트로 기업·도시 개편+행성 추가. — [나무위키: 거지 키우기](https://namu.wiki/w/%EA%B1%B0%EC%A7%80%20%ED%82%A4%EC%9A%B0%EA%B8%B0)
- NDC 강연: 서사가 "구걸→투자→카카오·네이버 같은 기업 인수→우주 진출"로 에스컬레이션. 마우스로 떨리게 그린 의도적 조악함이 아이덴티티. — [게임와이 NDC 기사](http://www.gamey.kr/news/articleView.html?idxno=1599967), [인벤 NDC2016](https://www.inven.co.kr/webzine/news/?news=155506&site=hit)
- 후속작 '거지키우기3 부동산'은 건물 구매에서 **건물 안에서 장사**(요식업)로 공간 표현 확장. — [경향게임스](https://www.khgames.co.kr/news/articleView.html?idxno=129664)

**중년기사 김봉식 (마프게임즈)**
- 1000층 탑 구조, 층마다 몬스터 5마리, 10층마다 특별 회랑, 100층마다 드래곤 보스. 초기 장비 "작은 투구·쫄쫄이·식탁보·주방장갑", 무기 나뭇가지→전설무기, 코스튬으로 외형 변화. 100층까지 층당 몬스터 체력 +15%. 업적명 기준 1000층이면 "우주까지". — [나무위키: 중년기사 김봉식](https://namu.wiki/w/%EC%A4%91%EB%85%84%EA%B8%B0%EC%82%AC%20%EA%B9%80%EB%B4%89%EC%8B%9D)
- 인터뷰: 약 1개월 개발, 70만 DL. 몬스터 애니메이션 없음은 "자고 있어서 맞아도 가만히 있다"는 컨셉으로 정당화(시각 절충). 만화 스토리가 가장 호평. — [인벤 마프게임즈 인터뷰](https://www.inven.co.kr/webzine/news/?news=148986&site=lostark)

**AdVenture Capitalist (Hyper Hippo)**
- 지구 사업 10개(레모네이드→오일 컴퍼니). 달 해금 $100조(오일컴퍼니 약 100개 시점). 화성(2015-09 추가)은 사업 9개, 별도 통화·엔젤·BGM, Profit Martians 메커닉. 행성 간 자유 이동(Mission Control). 엔젤 리셋 시 골드·메가벅스·구매 아이템 유지, 사업 레벨·현금 리셋. 캐피탈리스트 아바타 의상/액세서리가 부스트 겸 외형 변화. — [en.namu.wiki: AdVenture Capitalist](https://en.namu.wiki/w/AdVenture%20Capitalist), [AdCap Fandom: Mars](https://adventure-capitalist.fandom.com/wiki/Mars)

**Tap Titans 2 (Game Hive)**
- "150,000+ 레벨, 150+ 타이탄, **14개 손그림 렐름**." 렐름별 스테이지 구간 표는 확보 못 함(Fandom 402). — [App Store](https://apps.apple.com/us/app/tap-titans-2-hero-legends/id1120294802), [Google Play](https://play.google.com/store/apps/details?id=com.gamehivecorp.taptitans2&hl=en)
- 원작 Tap Titans 존 예: Mystic Castle, Rain Forest, Enchanted Garden, Arctic Iceberg 등 스테이지 구간별 배경 교체. (스니펫 기반) — [Tap Titans Fandom: Zones](https://tap-titans.fandom.com/wiki/Zones)

### Inferences
- `[추론]` 성장 시각화는 세 축이 반복된다: **(1) 증식 축**(IMT 갱도 30+5, MPH 방/층, Cats&Soup 플롯, Bank 방 4개×항목), **(2) 이주 축**(Supermarket 10도시, MPH 8호텔, ITPT 7섬→3파크, Bank N은행, Egg 알 종류, 거지 도시10/행성7, AdCap 지구→달→화성), **(3) 티어 교체 축**(Egg 서식지 19/차량 12, IMT 작업자 수 5단계 증가, 김봉식 장비). 개표국은 (3)만 있고 (1)(2)가 비어 있다.
- `[추론]` 이주 축의 공통 숫자감: 한 장소에서 다음 장소까지 "1~7일" 단위(Bank 3 in 24h, Bank 6 in 7d; MPH 호텔당 8레벨; Supermarket은 4번째 도시부터 급격히 길어짐). 즉 초반 3~4개 장소는 빠르게 통과시켜 "세계가 바뀐다"는 약속을 D1~D7 안에 여러 번 증명한다.
- `[추론]` 일반 지식(미인용, 검증 필요): IMT는 세로 스크롤 단면도로 다음 갱도 자리가 아래에 "New Shaft + 가격" 버튼으로 노출; Codigames 계열은 잠긴 플롯을 가격표 입간판/공터로 표시; My Perfect Hotel은 반투명 윤곽+가격 바닥패드 위에 서서 돈을 쏟아붓는 "pour money" 방식으로 건설; Cats&Soup은 세로 스크롤 숲에서 잠긴 땅이 안개/나무로 덮여 있고 확장 시 걷힘. 이 네 가지는 출처를 못 찾았으므로 Gaps에도 기재.

### Gaps
- Fandom 위키(IMT/ITPT/Egg Inc/Tap Titans 2) 본문을 열 수 없어, 갱도 해금 가격 테이블·ITPT 섬 5~7 가격·TT2 렐름별 스테이지 범위는 확보 못 함.
- Idle Bank Tycoon 은행 목록(지점명/순서)과 각 은행의 방 추가 여부: 공개 가이드에 없음. "더 크고 항목이 많다"까지만 확인.
- Idle Supermarket Tycoon 도시별 해금 금액/레벨: 가이드에 명시 없음.
- 잠긴 구역의 구체 연출(점선/공사 테이프/안개/입간판)을 서술한 1차 문헌을 찾지 못함. 스크린샷 기반 확인 필요.

---

## KQ2. 확장(Expansion): 단계 수·트리거·잠긴 구역 표현·확장 순간 연출

### Takeaway
확장 단계는 "한 장소 안에서 5~35단계"(IMT 갱도 30+5, ITPT 섬 7, Bank 방 4개×3~6항목, MPH 방 순차 해금)와 "장소 이주 7~10단계"(Supermarket 10, MPH 8, 거지 도시 10/행성 7)로 2중 구조이며, 트리거는 거의 전부 **현금(또는 완성률 100%/별)** 이고 레벨 트리거는 보조. 확장은 "꽉 찼을 때만"(Cats&Soup) 같은 **포화 조건**으로 자연스럽게 요구를 만든다.

### Cited Findings
- 단계 수/트리거 요약(출처는 KQ1 각 항목 참조):
  - IMT: 광산당 갱도 30(+코어 5, 프레스티지 5 조건). 대륙 7. 이벤트 광산 127+. — [Kolibri Help](https://kolibri-games.helpshift.com/hc/en/3-idle-miner-tycoon/faq/53-what-are-the-maximum-levels/), [Kolibri blog](https://www.kolibrigames.com/blog/can-we-talk-about-cheese/)
  - ITPT: 섬 7개(500K / 2B / 1T …), 섬마다 신규 어트랙션 1종, 파크 3개+. — [Touch Tap Play](https://www.touchtapplay.com/idle-theme-park-tycoon-islands-guide-attractions/), [Level Winner](https://www.levelwinner.com/idle-theme-park-tycoon-farming-guide-tips-tricks-to-get-rich-quick/)
  - Supermarket: 도시 10, 트리거 = 현금(큰 매장 비용) 후 프롬프트. — [AppGamer](https://www.appgamer.com/idle-supermarket-tycoon/strategy-guide/how-to-play-idle-supermarket-tycoon)
  - Bank: 방 4개 × 3~6 항목 = 18항목 100% → 다음 은행. 평판 레벨로 기능 해금(6: 매니저, 7: Business Mode). — [Level Winner](https://www.levelwinner.com/idle-bank-tycoon-money-empire-guide-tips-tricks-strategies/), [PocketGamer.biz](https://www.pocketgamer.biz/game-analysis-deconstructing-idle-bank-tycoon-by-kolibri-games/)
  - Restaurant: 방 해금(현금) + 방 맥스→별→새 지점(별 요구치). — [CouchClicker](https://www.couchclicker.com/idle-restaurant-tycoon-guide-tips-tricks-and-strategies/)
  - MPH: 호텔 8 × 레벨 8; 시설(화장실·창고·식당·바·수영장·주차장)은 호텔 레벨 트리거, 방은 현금. — [SimpleGameGuide](https://simplegameguide.com/my-perfect-hotel-levels-hotels/), [ARPU Brothers](https://arpubrothers.com/blog/my-perfect-hotel-arcade-idle-deconstruction/)
  - Cats&Soup: 트리거 = **숲 포화** + 골드(2번째 50골드); 2025-10부터 별도 맵 "새 숲"을 통로로 연결. — [공식 FAQ](https://nwzrise.oqupie.com/portals/1694/articles/66186), [Touch Tap Play](https://www.touchtapplay.com/how-to-expand-the-forest-in-cats-soup/), [베타뉴스](https://www.betanews.net/article/view/beta202510240013)
  - 거지키우기: 부동산 7 / 기업 19 / 도시 10 / 행성 7, 모두 현금(+레벨 상한). — [나무위키](https://namu.wiki/w/%EA%B1%B0%EC%A7%80%20%ED%82%A4%EC%9A%B0%EA%B8%B0)
  - AdCap: 달 $100T 현금 트리거. — [en.namu.wiki](https://en.namu.wiki/w/AdVenture%20Capitalist)
- ITPT 섬 구매 시 "현금은 못 가져가지만 새 어트랙션 + 더 높은 배율" — 즉 확장 = 소프트 리셋 + 보상. — [AppGamer](https://www.appgamer.com/idle-theme-park-tycoon/strategy-guide/best-tips-and-hints)
- Idle Bank Tycoon의 실패 사례: 플레이 가능 공간과 장식 공간의 구분이 흐려 "어디를 탭할지" 혼란 → 확장/잠금 구역의 **명확한 데마케이션**이 필요하다는 반증. — [PocketGamer.biz](https://www.pocketgamer.biz/game-analysis-deconstructing-idle-bank-tycoon-by-kolibri-games/)

### Inferences
- `[추론]` 트리거 유형별 역할: 현금 트리거(대부분) = 자연스러운 저축 목표; 포화 트리거(Cats&Soup) = "자리 없음"이라는 **공간적 결핍**이 확장을 원하게 만듦; 완성률/별 트리거(Bank/Restaurant/MPH) = 현 공간을 다 쓰게 강제한 뒤 이주. 개표국은 시설 6개×5티어라 "완성률"이 이미 계산 가능하므로 Bank식 100%→이주가 가장 적은 신규 시스템으로 붙는다.
- `[권고]` 개표국 7x7 단일 룸을 유지하되 **2중 확장**을 추가: (A) 룸 내부 증식 — 7x7을 "구획(zone)" 3~4개로 쪼개 1구획(3x3 중앙)부터 시작, 현금/완성률로 2→3→4구획 개방(안쪽에서 바깥 링으로). 잠긴 구획은 **공사 테이프 + 박스 더미 + 가격 입간판**(선거 현장 톤: "개표소 증설 예정" 표지). (B) 지역 이주 — 현 지역 시설 완성률 100% 또는 지역 목표 득표 수 달성 시 "이전 승인" → 감사(프레스티지)와 결합하지 않고 Supermarket식 **매각→이주**로 분리하면 프레스티지 빈도와 무관하게 세계가 바뀐다.
- `[권고]` 확장 순간 연출 최소 세트: 테이프 끊김 → 바닥 타일 순차 등장(아이소 다이아몬드 페이드-인, 행 단위 60ms 스태거) → 카메라 소폭 줌아웃(1.0→0.92) → 새 구획에 박스/임시 책상 소품 자동 배치 → 직원 1명이 걸어 들어감. 참고 기준: IMT/MPH는 "시각적 복잡도 증가" 자체를 튜토리얼 대신 쓴다 — [ARPU Brothers](https://arpubrothers.com/blog/my-perfect-hotel-arcade-idle-deconstruction/).

### Gaps
- 각 게임의 확장 순간 애니메이션(지속 시간, 카메라 이동, 파티클)을 기술한 문헌 없음 — 영상 프레임 분석 필요.
- 잠긴 구역의 구체 표현(점선·테이프·안개·"Coming soon" 입간판) 중 어느 게임이 어느 방식을 쓰는지 인용 가능한 자료 없음.

---

## KQ3. 카메라: 고정 vs 줌아웃 vs 스크롤/팬, 핀치 줌, 캐릭터 가독성

### Takeaway
문헌상 확인되는 원칙은 하나다: Kolibri는 **핵심 루프 4단계를 한 화면에** 유지하는 것을 설계 원칙으로 못 박았고(세로 단면도+스크롤), 공간이 커지는 게임(MPH, Cats&Soup, ITPT)은 **스크롤/팬 + 포커스 전환**으로 대응한다. "월드가 커질 때 캐릭터 가독성"을 다룬 1차 자료는 못 찾았다.

### Cited Findings
- Kolibri 원칙: "Show the core gameplay loop all on one screen" — 채굴→운반→판매→업그레이드 4단계를 동시에 보이게. — [GameAnalytics](https://www.gameanalytics.com/blog/making-a-hit-idle-game-eight-lessons-from-kolibri-games)
- Cats&Soup 2025-10: 확장을 **별도 맵**으로 두고 통로로 전환 — 한 화면에 모두 담지 않고 맵 단위로 분리하는 선택. — [베타뉴스](https://www.betanews.net/article/view/beta202510240013)
- Idle Bank Tycoon: 공간 가독성 부족(탭 위치 혼란)이 디컨 리뷰에서 핵심 비판. — [PocketGamer.biz](https://www.pocketgamer.biz/game-analysis-deconstructing-idle-bank-tycoon-by-kolibri-games/)
- 2D 카메라 일반론(비-아이들): 다수 객체 포함 시 평균 위치로 보고 필요한 만큼 줌아웃(Smash Bros 사례). — [Game Design Skills: 2D camera guide](https://gamedesignskills.com/game-design/camera-design-2d-side-scroller-games/)

### Inferences
- `[추론]` 일반 지식(미인용): IMT는 세로 1축 스크롤(위 창고/엘리베이터, 아래로 갱도 증식)이라 캐릭터 크기를 바꾸지 않고 무한 확장; Egg Inc는 3D 농장에 핀치 줌·드래그 팬 허용; MPH는 3인칭 추적 카메라로 호텔이 커져도 플레이어 중심; Codigames는 아이소 맵을 드래그 팬+핀치 줌. 즉 "고정 카메라로 세계가 커지는" 레퍼런스는 거의 없고, **스크롤 축을 하나 정하거나 포커스 카메라**를 쓴다.
- `[권고]` 개표국(Phaser 캔버스, 세로 모바일, 하단 3단 시트)에는 **"고정 프레이밍 + 단계별 줌 프리셋"** 이 가장 안전: 구획 1개 때 줌 1.25(중앙 3x3을 크게), 구획 추가마다 1.1→1.0→0.9로 **이산적 줌아웃**(연속 핀치 줌 대신). 국장/직원 스프라이트는 월드 스케일과 분리해 최소 픽셀 크기(예: 화면 높이의 7%)를 보장하고, 줌 0.9 이하에서는 머리 위 아이콘(말풍선/작업 아이콘)을 월드 스케일에서 제외(DOM 오버레이 또는 scale 보정).
- `[권고]` 지역 이주(Supermarket식)는 같은 7x7(또는 9x9) 템플릿에 **배경/벽/바닥 타일셋 교체**로 처리하면 카메라 로직 변경 없이 "새 장소"가 된다. Cats&Soup의 "별도 맵+통로" 모델은 개표국엔 과하다(직원 3명·시설 6개 규모).

### Gaps
- 캐릭터 가독성 유지 기법(스케일 보정, LOD)을 명시한 모바일 아이들 1차 자료 없음.
- 각 게임의 핀치 줌 범위(min/max scale) 수치 없음.

---

## KQ4. 건물 티어: 티어 수, 바뀌는 요소, 마일스톤 축하

### Takeaway
티어 수는 극단적으로 갈린다 — Egg Inc 서식지 19단/차량 12단(외형 전면 교체), IMT 갱도는 800레벨 중 **5개 인원 마일스톤(10/50/100/200/400)** 에서만 눈에 띄는 변화, Bank는 방마다 3~6개 소품 항목을 개별 레벨업. 공통점은 "숫자 레벨은 수백~수만, 외형 변화는 5~20단계"라는 **이산적 시각 마일스톤**이다.

### Cited Findings
- IMT: 갱도 레벨 10/50/100/200/400에서 작업자 +1(시각 인원 1→6). 레벨 상한 800. 코어 갱도는 배경색 변경. (스니펫) — [IMT Fandom](https://idleminertycoon.fandom.com/wiki/Mineshafts)
- Egg Inc: 서식지 19종, 차량 12종, 부화장 외형=알 종류 종속, 창고 외형=차량 수·적재량 종속. — [en.namu.wiki](https://en.namu.wiki/w/Egg,%20Inc./%EC%B0%A8%EB%9F%89%20%EB%B0%8F%20%EA%B1%B4%EB%AC%BC); Hen House Remodel 8단(+40%), Hen House A/C 50단(+250%)은 수치만 변화. — [Egg Inc Fandom: Research](https://egg-inc.fandom.com/wiki/Research)
- Idle Bank Tycoon: 방 4개 안에 Vault/Cash Carts/Security Equipment/Monitors/Statue 등 **소품 단위** 업그레이드 항목(합 18개); 완성률을 방별 % 로 표시하는 통계 패널. — [FatWallet Refugee](https://fatwalletrefugee.com/2024/02/27/idle-bank-tycoon/), [Level Winner](https://www.levelwinner.com/idle-bank-tycoon-money-empire-guide-tips-tricks-strategies/)
- Idle Restaurant Tycoon: 테이블 1개 = 테이블/장식/의자/접시/음료/양념 6개 서브 항목. — [CouchClicker](https://www.couchclicker.com/idle-restaurant-tycoon-guide-tips-tricks-and-strategies/)
- Cats&Soup: 시설 레벨 최대 24000(외형과 무관한 숫자 스케일). — [나무위키](https://namu.wiki/w/%EA%B3%A0%EC%96%91%EC%9D%B4%EC%99%80%20%EC%8A%A4%ED%94%84)
- MPH: 방 하나당 침대/TV/욕실 업그레이드 3축, "Room 4·5 해금 전에 Room 1~3 맥스" 권장 — 방 내부 소품이 늘어나는 구조. — [whisperofthehouse 가이드](https://www.whisperofthehouse.com/my-perfect-hotel)
- 김봉식: 장비 외형(나뭇가지→전설무기), 코스튬으로 캐릭터 변화; 몬스터는 무애니메이션을 컨셉으로 정당화. — [나무위키](https://namu.wiki/w/%EC%A4%91%EB%85%84%EA%B8%B0%EC%82%AC%20%EA%B9%80%EB%B4%89%EC%8B%9D), [인벤](https://www.inven.co.kr/webzine/news/?news=148986&site=lostark)

### Inferences
- `[추론]` 개표국의 "시설 5티어"는 업계 범위(5~19) 하단이지만 충분하다. 부족한 것은 티어 사이를 메우는 **소품 축적(Bank/Restaurant 모델)** 과 **인원 마일스톤(IMT 모델)** 이다.
- `[권고]` 시설 티어 전환 외에 두 레이어 추가: (1) 티어 내부 "소품 레벨" 2~3개(서류 더미 높이, 모니터 수, 조명 켜짐, 바닥 카펫) — 레벨 10/25/50에서 추가; (2) 직원 3명 상한을 "보이는 보조 인력"으로 우회 — 시설 티어 3/5에서 **비플레이어 NPC(참관인, 경찰, 기자)** 가 시설 옆에 상주. 이렇게 하면 Bank식 방별 완성률 %를 그대로 시트 UI에 노출해 이주 트리거로 쓸 수 있다.
- `[권고]` 마일스톤 축하: 티어 업 시 시설 스프라이트 교체 + 짧은 "리본 커팅/현수막 펼침" 1.2초, 전 시설 티어 5 달성 시 룸 전체 조명 톤 변경(야간 네온) — 문헌에선 세부 연출 미확인이므로 설계 재량.

### Gaps
- 각 게임의 "티어 업 축하 연출"(지속시간·파티클·사운드)을 기술한 자료 없음.
- Codigames 계열 어트랙션의 비주얼 티어 수(업그레이드 몇 단계마다 외형 변화)는 미확인.

---

## KQ5. 앰비언트 라이프: 군중 스케일링, 차량/택배, 낮밤, 날씨, 시즌 스킨

### Takeaway
확인된 것은 "직원/방문객이 눈에 보이게 늘어난다"(IMT 작업자 마일스톤, MPH 직원 직군 5종, Bank 운반 카트, Egg Inc 차량 12단)와 "시즌 테마 리스킨은 숲/UI/장식/전용 NPC/이스터에그를 세트로 교체"(Cats&Soup)이다. 낮밤·날씨 사이클을 명시한 1차 자료는 못 찾았다.

### Cited Findings
- IMT 작업자 수 마일스톤(10/50/100/200/400). (스니펫) — [IMT Fandom](https://idleminertycoon.fandom.com/wiki/Mineshafts)
- MPH: 청소부·리셉션·웨이터·로더·바텐더가 "눈에 보이게 역할 수행". — [ARPU Brothers](https://arpubrothers.com/blog/my-perfect-hotel-arcade-idle-deconstruction/)
- Bank: Vault→Main Hall 사이 **Cash Carts(운반 카트)** 가 돈을 옮기는 것이 업그레이드 항목이자 시각 요소; Marketing이 고객을 끌어오고 평판 별로 "더 부유한 고객층" 해금(고객 외형 티어). — [Level Winner](https://www.levelwinner.com/idle-bank-tycoon-money-empire-guide-tips-tricks-strategies/), [FatWallet Refugee](https://fatwalletrefugee.com/2024/02/27/idle-bank-tycoon/)
- Egg Inc: 차량 12단계(TRIKE→HYPERLOOP), 창고 외형이 차량 수·적재량에 따라 변함. — [en.namu.wiki](https://en.namu.wiki/w/Egg,%20Inc./%EC%B0%A8%EB%9F%89%20%EB%B0%8F%20%EA%B1%B4%EB%AC%BC)
- Supermarket: 주차장 사용률 100% 근접 시 관리 화면에 빨간 경고 — 주차장(차량 수)이 수요 지표. — [Level Winner](https://www.levelwinner.com/idle-supermarket-tycoon-guide-tips-cheats-strategies-to-maximize-your-profits/)
- Cats&Soup 시즌 리스킨: 테마별 특수효과·전용 NPC·이스터에그, 숲 외형+UI+장식 동시 교체, 교환 상점 의상 4·가구 15·램프 2. — [베타뉴스](https://www.betanews.net/article/view/beta202510240013)
- IMT 이벤트 광산 127개(치즈 광산 등 테마 리스킨 주간 운영). — [Kolibri blog](https://www.kolibrigames.com/blog/can-we-talk-about-cheese/)
- AdCap: 행성마다 고유 BGM·배경, 아바타 의상. — [AdCap Fandom: Mars](https://adventure-capitalist.fandom.com/wiki/Mars), [en.namu.wiki](https://en.namu.wiki/w/AdVenture%20Capitalist)

### Inferences
- `[추론]` 군중은 "수입에 비례한 연속 스케일"보다 **임계값 기반 이산 증가**(IMT 5단계, Bank 고객 티어)가 일반적이며, 모바일 성능과 가독성 때문으로 보인다.
- `[권고]` 개표국 앰비언트 3종 세트: (1) **투표함 반입 차량/택배 카트** — 시간당 득표량 임계 3단계로 차량 종류 교체(리어카→1톤 트럭→호송차), 룸 가장자리 도크에서 출입; (2) **방문객 티어** — 지역 사다리에 맞춰 참관인→기자→국회의원→외신 등 NPC 외형 교체(Bank "부유한 고객층" 모델), 동시 표시 상한 4~6명; (3) **낮밤 사이클**은 개표 서사(개표는 밤에 한다)와 맞아 저비용 고효과 — 실제 시계 또는 세션 시간 기반 틴트+창문 조명. 시즌 리스킨은 Cats&Soup처럼 **벽지/바닥/UI 프레임/전용 NPC** 를 한 묶음으로 설계해 선거일·명절 이벤트에 재사용.

### Gaps
- 낮밤/날씨 사이클을 운영하는 아이들 타이쿤의 1차 자료 없음(개인 관찰로는 Egg Inc 등에 존재하나 인용 불가).
- 방문객 수와 수입의 정량 매핑을 공개한 게임 없음.

---

## KQ6. 프레스티지/시대(Era): 리셋 vs 리스킨 vs 새 장소, "새 장소"의 시각 처리

### Takeaway
2018년 이후 주류는 **"프레스티지 = 새 장소로 이주"** 다(Supermarket 10도시, Bank N은행, MPH 8호텔, ITPT 섬/파크, Egg Inc 알 종류, 거지 도시/행성, AdCap 행성). 순수 숫자 리셋(AdCap 엔젤, Egg 소울에그)은 별도 레이어로 공존하며, IMT는 "리셋 강제 없이 광산을 추가"하는 병렬 모델을 택했다.

### Cited Findings
- IMT: 프레스티지로 완전 리셋하지 않고 **원래 광산을 유지한 채 여러 광산으로 확장** 가능; 새 비주얼 광산이 "진행 이유". — [Mobile Free To Play](https://mobilefreetoplay.com/gdc-2019-deconstructing-idle-miner-tycoon/)
- Supermarket: 프레스티지 = 매장 매각 + 새 도시(10단). — [WriterParty](https://writerparty.com/party/idle-supermarket-tycoon-unlock-all-cities-guide/)
- Bank: 마일스톤 전부 완료 → 프레스티지 → 보상 + **새 은행**, 소프트 통화 유지. — [PocketGamer.biz](https://www.pocketgamer.biz/game-analysis-deconstructing-idle-bank-tycoon-by-kolibri-games/)
- MPH: 호텔 8레벨 완료 → 다음 호텔(다른 레이아웃·더 넓은 면적·고유 통화 색), 직원·호텔별 업글 미이월. — [SimpleGameGuide](https://simplegameguide.com/my-perfect-hotel-levels-hotels/), [ARPU Brothers](https://arpubrothers.com/blog/my-perfect-hotel-arcade-idle-deconstruction/)
- ITPT: 섬 구매 = 현금 포기 + 배율 상승, 파크 단위(Aqua/Terror)로 또 한 번 이주. — [AppGamer](https://www.appgamer.com/idle-theme-park-tycoon/strategy-guide/best-tips-and-hints), [ITPT Fandom: Aqua Park](https://idle-theme-park-tycoon.fandom.com/wiki/Aqua_Park)
- Egg Inc: 알 종류 전환은 농장 리셋이지만 **부화장·차량·서식지 외형이 알/미래 테마로 바뀜**; 프레스티지는 소울에그만 남기고 Edible로 복귀. — [Wikipedia](https://en.wikipedia.org/wiki/Egg,_Inc.), [en.namu.wiki](https://en.namu.wiki/w/Egg,%20Inc./%EC%B0%A8%EB%9F%89%20%EB%B0%8F%20%EA%B1%B4%EB%AC%BC)
- 거지키우기: 환생(수치 리셋) + 도시 10/행성 7(장소 사다리)이 별개 레이어, 배경은 인벤토리에서 구매. — [나무위키](https://namu.wiki/w/%EA%B1%B0%EC%A7%80%20%ED%82%A4%EC%9A%B0%EA%B8%B0)
- AdCap: 엔젤 리셋(수치) + 달/화성(장소, 별도 통화·엔젤·BGM) 병렬. — [en.namu.wiki](https://en.namu.wiki/w/AdVenture%20Capitalist)
- Cats&Soup: 리셋 없이 **테마 리뉴얼**(으스스한 숲)과 **새 숲 추가**로 시대감. — [베타뉴스](https://www.betanews.net/article/view/beta202510240013)

### Inferences
- `[추론]` 개표국의 "지역 사다리 16+"는 Supermarket(10)/MPH(8)/거지 도시(10)보다 길다. 레퍼런스들은 장소 하나당 고유 레이아웃/테마 아트를 만들지만, 16개를 모두 고유 아트로 만들기는 비용이 크다. 거지키우기가 도시 10개를 **텍스트+아이콘 사다리**로 처리하고 배경은 별도 구매로 둔 점, Egg Inc가 알 종류로 **같은 농장의 색/소품만 바꾸는** 점이 비용 절감 모델이다.
- `[권고]` 16+ 지역을 **4개 시대(Era) × 4지역**으로 묶는다: 시대 = 동네(경로당~주민센터) / 관청(구청~시청) / 중앙(도청~중앙개표청) / 우주(우주정거장…). 시대마다 **벽·바닥 타일셋·창문 밖 배경·방문객 NPC 세트·BGM** 을 교체(Egg Inc/AdCap 모델), 시대 안 지역 전환은 **현판·배너·룸 크기(5x5→7x7→9x9) 한 단계** 만 바꾼다(거지 모델). 감사(프레스티지)는 Bank/IMT처럼 "수치 리셋 + 이주 승인"으로 묶되, IMT 모델대로 **이전 지역 룸을 미니어처로 복도/벽 액자에 남겨** 누적감을 준다.
- `[권고]` 이주 연출은 Supermarket의 "매각 프롬프트" 대신 개표국 서사에 맞게 "상급 기관 승격 통지서 → 이삿짐 박스 포장 → 암전 → 새 룸에 박스가 쌓인 상태로 시작(첫 탭으로 개봉)"으로 하면 "리셋"이 아니라 "승격"으로 읽힌다.

### Gaps
- MPH 호텔별 레이아웃 차이(층수·면적)와 ITPT 파크별 맵 크기 수치는 확인 불가.
- "이전 장소를 보존/표시하는" UX(IMT 광산 선택 화면 외)의 구체 사례 서술 없음.

---

## KQ7. 디자이너/포스트모템이 말하는 "보이는 성장"의 리텐션 가치

### Takeaway
가장 직접적인 1차 발언은 Kolibri의 GDC 2019 디컨("몇 번 프레스티지하면 똑같아 보인다 → 새 비주얼 광산으로 해결")과 "핵심 루프를 한 화면에"이며, 주간 이벤트 광산 127개·업데이트 160회라는 운영 수치가 그 가치를 뒷받침한다. 리텐션 %와 시각 성장의 인과를 수치로 분리한 자료는 없다.

### Cited Findings
- "after a few prestiges, the game starts to feel the same all the time" → 새 비주얼 광산 투자; "Idle games should take note of the visual changes necessary to drive a new style of engagement"; Kolibri 일 매출 약 $200K. — [Mobile Free To Play](https://mobilefreetoplay.com/gdc-2019-deconstructing-idle-miner-tycoon/)
- Kolibri 8교훈: 핵심 루프 한 화면, 주간 업데이트(신자원·탐험 지역·이벤트 광산·시즌패스) 160회+, MVP D1 63~81%(업계 ~40% 대비), 광고 60%/IAP 40%. — [GameAnalytics](https://www.gameanalytics.com/blog/making-a-hit-idle-game-eight-lessons-from-kolibri-games)
- "Idle progress collection"을 앱 실행 시가 아닌 코어 루프 안에 넣어 활동·리텐션을 올린 Idle Heroes 사례; 아이들 장르는 비주얼 충실도는 올랐으나 플레이 혁신은 약했다는 평. — [Deconstructor of Fun: Idle Heroes](https://www.deconstructoroffun.com/blog/2018/2/27/u6ap146ff5rkmm7fj1qzuhggp395l4)
- Idle Bank Tycoon 비판: 공간 구분 불명확이 UX 결함으로 지목 → 보이는 성장도 **읽히지 않으면** 무효. — [PocketGamer.biz](https://www.pocketgamer.biz/game-analysis-deconstructing-idle-bank-tycoon-by-kolibri-games/)
- MPH: 튜토리얼 없이 "늘어나는 시각적 복잡도"가 진행 전달. — [ARPU Brothers](https://arpubrothers.com/blog/my-perfect-hotel-arcade-idle-deconstruction/)
- 거지키우기 NDC: 성공 요인은 서사 에스컬레이션(구걸→기업 인수→우주)과 유저 소통; "재미있기만 하면 된다". — [게임와이](http://www.gamey.kr/news/articleView.html?idxno=1599967), [앱인토스 블로그](https://toss.im/apps-in-toss/blog/manababa)
- 김봉식: 만화 스토리가 최대 호평 요소, 1개월 개발 70만 DL. — [인벤](https://www.inven.co.kr/webzine/news/?news=148986&site=lostark)

### Inferences
- `[추론]` 한국 방치형 2종(거지·김봉식)은 공간 성장 대신 **서사 에스컬레이션(회상카드/만화)** 으로 "커졌다"를 전달했다. 개표국의 정치 풍자 톤은 이 모델과 궁합이 좋다 — 지역 승격마다 1컷 풍자 카드(신문 1면)를 붙이면 아트 비용 대비 성장 체감이 크다.
- `[권고]` 우선순위(비용 대비 체감): ① 룸 구획 3~4단계 개방(테이프→타일 등장→줌 프리셋) ② 시대 4종 타일셋/배경 교체 + 지역별 현판 ③ 방문객 NPC 티어 + 반입 차량 3단계 ④ 시설 티어 사이 소품 레벨 ⑤ 승격 1컷 카드 ⑥ 낮밤 틴트. ①②가 "룸이 안 커진다"는 지적에 직접 대응한다.

### Gaps
- "시각적 성장 유무"를 A/B로 분리한 리텐션 수치 공개 사례 없음.
- Codigames(Theme Park/Supermarket) 자체 포스트모템·GDC 발표 자료 미발견.
- Tap Titans 2 렐름 전환이 리텐션에 미친 영향에 대한 개발사 발언 미발견.

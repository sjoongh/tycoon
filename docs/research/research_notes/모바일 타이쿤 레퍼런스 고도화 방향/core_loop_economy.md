# 모바일 아이들/타이쿤 레퍼런스의 코어 루프·경제 설계 (탭/방치 균형, 비용·수익 곡선, 자동화, 마일스톤, 프레스티지, 오프라인, 1분~4주 페이싱)

조사일 2026-11-10. 대상: AdVenture Capitalist(AdCap), Cookie Clicker, Egg Inc, Idle Miner Tycoon(IMT), Clicker Heroes, Tap Titans 2(TT2), Idle Theme Park, Idle Supermarket, Cats & Soup, Realm Grinder, Frozen City + 인디 4종 사례(Idle Ronin/AI Factory/Summoner, ONI Realms). 비교 기준점으로 개표국 현재 수치는 리포 소스(`src/state/GameState.js`, `src/data/facilities.js`, `src/data/staff.js`)에서 직접 읽었다.

표기: [검증] = 1차 소스/위키에서 확인, [추정] = 2차 소스·기억 기반으로 수치 미검증.

---

## 1. 비용 성장 계수·수익 배수·병렬 생성기 수·자동화 시점

### Takeaway
레퍼런스 장르 표준은 "레벨당 비용 ×1.07~1.15, 생산은 레벨당 선형, 25/50/100 단위 마일스톤에서 ×2~×4, 생성기 10~20종, 각 생성기 기본가는 이전의 ×10 내외"이며 수백 레벨을 올리는 긴 사다리다. 개표국은 레벨당 ×1.48(시설)·×1.62(직원), 최대 35~60레벨, 시설 간 기본가 비율 ×1.8~3.3의 "짧고 가파른 사다리"로 장르 표준과 구조가 다르다.

### Cited Findings
- 코어 공식: `cost_next = cost_base × rate_growth^owned`, `production_total = production_base × owned × multipliers`. 지수 비용은 어떤 다항 생산도 결국 추월하므로 배수·프레스티지로 보정한다 — [Pecorella, The Math of Idle Games Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)
- AdCap 레모네이드: 성장률 1.07, 기본가 4(정확히 3.738), 기본 생산 1.67/s, 25·50개 보유 시 ×2(중첩). 10개 보유 시 다음 가격 7.87, 생산 16.7/s — [Pecorella Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)
- AdCap 오일 컴퍼니(10번째 사업): 초기비용 $25,798,901,760, 계수 1.07, 초기수익 $29,668,737,024, 초기수익/초기비용 비율 1.15; ×10 계수 1.97, ×100 계수 868 — [AdCap wiki: Oil Company (검색 발췌)](https://adventure-capitalist.fandom.com/wiki/Oil_Company)
- AdCap에서 Newspaper는 다른 사업을 곱해 주는 식으로 "저가 생성기의 관련성 유지"를 해결 — [Pecorella GDC EU 2016 슬라이드](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- Cookie Clicker: 가격 = 기본가 × 1.15^(보유−무료보유). 건물 20종. 기본가/기본 CpS: Cursor 15/0.1, Grandma 100/1, Farm 1,100/8, Mine 12,000/47, Factory 130,000/260, Bank 1.4M/1,400, Temple 20M/7,800, Wizard Tower 330M/44,000, Shipment 5.1B/260,000, Alchemy Lab 75B/1.6M, Portal 1T/10M, Time Machine 14T/65M, Antimatter 170T/430M, Prism 2.1Q/2.9B … You 540 Sp/510T. 인접 건물 기본가 비율 약 ×10~12. 10개 일괄 구매가 = 단가 × 20.3037, 100개 = × 7,828,749.67 — [Cookie Clicker wiki.gg Buildings](https://cookieclicker.wiki.gg/wiki/Buildings)
- Cookie Clicker 프레스티지 배수를 2배로 하려면 누적 쿠키 8배 필요(세제곱근) — [dinogame 분석](https://dinogame.gg/blog/how-cookie-clicker-progression-works/)
- Clicker Heroes: 생성기 25개마다 ×4 보너스, 생성기 2,000개마다 프레스티지 통화 1개 — [Pecorella GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 일괄 구매(x10/x100/MAX) 총액·최대 구매 수는 등비급수 닫힌식으로 계산(루프 불필요) — [Pecorella Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)
- 인디 4종 실측: Idle Ronin 유닛 레벨당 +14%(~300lv), 이후 +12.5%(~1000lv), 이후 +11.5%("오래 할수록 완만"); Idle AI Factory 공장 레벨당 ×1.8; Idle Summoner 소환 체인 단계당 ×1.87(56→105→196→367골드) — [ONI Realms: How to Design an Idle Game](https://onirealms.com/guides/how-to-design-an-idle-game/)
- 30일에 7종 만든 개발자: "업그레이드 비용 레벨당 ×1.15가 기본값", 선형 비용은 "진행이 빙하처럼 느려지는 데드존"을 만든다 — [dev.to: 7 Idle Games in 30 Days](https://dev.to/aguier/i-built-7-idle-games-in-30-days-what-i-learned-about-incremental-design-5d3f)
- IMT: 아래 갱도는 위 갱도보다 평균 약 500배 수익, 엘리베이터·창고는 함께 올려야 병목이 안 생김 — [Kolibri 블로그 Let's Dig In](https://www.kolibrigames.com/blog/lets-dig-in/)
- Pecorella: 최적 구매 패턴이 항상 최상위 생성기만 가리키면 밸런스 문제; 저가 생성기 관련성은 (a) 공격적 배수, (b) 보유 기반 보너스, (c) 프레스티지 통화를 보유량에 연결, (d) 보유 배수로 해결 — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 개표국 현재치(소스): 시설 비용 `cost × 1.48^level`, 해명 비용 `× 1.18^level`, 직원 비용 `× 1.62^level`, 직원 해명 `× 1.24^level` (`src/state/GameState.js` facilityCostAt/staffCostAt); 시설 기본가 28/92/180/450/980/1750, cps 0.8/2.8/1.7/9.2/14/21, maxLevel 60/55/50/45/40/35 (`src/data/facilities.js`); 마일스톤 `FACILITY_MILESTONES = [25, 50, 100]` ×2, maxLevel 초과분 제외 (`GameState.js:70`).

### Inferences
- 개표국 시설 사다리는 1.48^60 ≈ 1.6×10^10 배 범위인데 Cookie Clicker 건물 하나를 60레벨 올리면 1.15^60 ≈ 4,400배에 불과하다. 즉 우리는 "한 시설을 오래 키우는 재미"가 아니라 "빠르게 벽에 닿고 프레스티지/구역으로 넘기는" 구조. 이는 장르 표준보다 Idle Theme Park·Idle Supermarket형(짧은 사다리 + 새 섬/도시로 이사)에 가깝다. 어느 쪽이든 의식적 선택이어야 하는데, 마일스톤 25/50/100 세트는 긴 사다리 전제라 서로 맞지 않는다(100은 어느 시설도 못 닿고, 50은 3개 시설만 가능).
- 시설 간 기본가 비율 ×1.8~3.3은 Cookie Clicker ×10~12 대비 좁아, "다음 시설 개방"이 큰 사건이 되기 어렵고 6개가 거의 동시에 의미를 가진다. 생성기 6종은 레퍼런스(10~20종)보다 적다 — 병렬 선택지를 구역별 시설 변형/업그레이드 트리로 보강할 필요.
- 레퍼런스는 생산을 레벨당 선형으로 두고 지수 비용을 마일스톤(×2~×4)으로 간헐 보정한다. 개표국은 비용 지수가 매우 커서 마일스톤 ×2의 체감이 상대적으로 작다(1.48^2 ≈ 2.19, 즉 2레벨치 비용 상승과 동일).

### Gaps
- AdCap 10개 사업 전체의 계수 표(기억상 Newspaper 1.15, Car Wash 1.14, Pizza 1.13, Donut 1.12, Shrimp 1.11, Hockey 1.10, Movie 1.09, Bank 1.08, Oil 1.07)와 언락 표(25/50/100/200/300/400 ×2 이익, 이후 100 단위)는 fandom 위키가 402로 차단되어 검증 실패 — [추정]. Lemonade 1.07, Oil 1.07/1.15 비율만 [검증].
- Clicker Heroes 영웅 비용 성장 1.07/레벨, 25/50/75/100/125/150/175/200 레벨 ×2(200 이후 25마다 ×4)는 [추정](기억). 슬라이드는 "25개마다 ×4"만 명시.
- Egg Inc·IMT·Cats & Soup의 레벨당 비용 계수 원시값은 찾지 못함.

---

## 2. 프레스티지: 첫 프레스티지 시점, 보너스 크기, 통화 공식, 이월 범위, 소프트 리셋 vs 신규 레이어

### Takeaway
표준 공식은 "누적 수입의 제곱근/세제곱근/0.2 지수"로 프레스티지 통화를 계산하고, 통화 1개당 +1~10%(AdCap 2%, Cookie 1%, Clicker Heroes 10%, Egg Inc 10%) 선형 가산한 뒤 영구 업그레이드로 곱연산을 얹는다. 첫 프레스티지는 모바일 아이들에서 수 시간~1~2일, 이후 "통화 2배(또는 +50~200%)가 되면 리셋"이 공통 규칙이다. 개표국은 인장을 수입이 아니라 구역·시설·사건 수에서 계산하는 비표준 방식이고 인장당 +2.5% 가산이다.

### Cited Findings
- 경험칙: 프레스티지 통화를 +50%~+200% 얻을 수 있을 때 리셋; 통화는 log 또는 분수 지수(제곱근)로 성장 억제; "가치 있는 프레스티지 지점에 규칙적으로 도달"하게 설계; 사이클이 빨라지면 플레이어가 리셋 기준을 높이고, 느려지면 지루해져 메타 프레스티지가 필요 — [Pecorella GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 다음 사이클 설계 질문: 초반 구간이 빠른가(힘의 성장 체감), 지난번보다 눈에 띄게 멀리 가는가 — [같은 슬라이드](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- AdCap 엔젤: `150 × √(누적 생애 수입 / 1e15) − 사용한 엔젤`(Earth 150, Moon 165, 내림), 엔젤 1개당 이익 +2% — [Steam 토론: Real formula](https://steamcommunity.com/app/346900/discussions/0/620712999971234569/); [helpshift FAQ](https://screenzilla.helpshift.com/hc/en/5-adventure-capitalist/faq/3-how-do-i-get-angels/); 첫 엔젤은 누적 약 444.4억에서 등장 — [worldwiki 가이드](https://worldwiki.games/games/adventure-capitalist/guide/kogda-sbrasyvat-radi-angelov/)
- AdCap 공식 FAQ: 첫 리셋 50~300 엔젤, 이후 "2배가 될 때마다"; 커뮤니티는 첫 리셋 100+ 또는 200~500 권장; "합리적으로 하면 하루 이틀" — [worldwiki](https://worldwiki.games/games/adventure-capitalist/guide/kogda-sbrasyvat-radi-angelov/); [gameplay.tips](https://gameplay.tips/guides/adventure-capitalist-basic-guide-angels-events-suits-badges.html); [PlayStationTrophies 가이드](https://www.playstationtrophies.org/forum/topic/275853-adventure-capitalist-trophy-guide-amp-roadmap/)
- AdCap 엔젤 소비 손익분기: 배수 Y 업그레이드 가격 P의 손익분기 = `P × Y/(Y−1)` 엔젤(×3이 10k면 15k); 커뮤니티 룰: ×2는 보유 엔젤 20% 이하, ×3 30%, ×4 40%, ×5~9 50%, ×10+ 60%일 때 구매 — [Steam 토론](https://steamcommunity.com/app/346900/discussions/0/618460171313623228/); [gameplay.tips](https://gameplay.tips/guides/adventure-capitalist-basic-guide-angels-events-suits-badges.html)
- Cookie Clicker: 프레스티지 레벨 = (누적 쿠키 / 1e12)^(1/3), 레벨당 +1% CpS(단, 천상 업그레이드 5종 5/25/50/75/100%로 해금한 비율만 적용), 리셋 기준은 "현재 레벨을 최소 2배로 늘릴 수 있을 때"; 업적·천상 업그레이드·슈가럼프 슬롯 이월 — [cookieclickernew 어센션 가이드](https://cookieclickernew.com/blog/cookie-clicker-ascension-guide/)
- Clicker Heroes: 영웅 합산 2,000레벨당 히어로 소울 1, 소울당 DPS +10%, 첫 어센션은 110/120/130존 프라이멀 보스 후(존 130 권장), 첫 어센션 5~8소울; 트랜센던스(2차 레이어) 존 300 해금, 소울 10배마다 에인션트 소울 5, 에인션트 소울 비용 +58%씩 — [Clicker Heroes 블로그](https://blog.clickerheroes.com/ascension-in-clicker-heroes-the-ultimate-guide/); [clickerheroes.dev 가이드](https://clickerheroes.dev/guides/new-player-guide); [SteamAH 종합 가이드](https://steamah.com/clicker-heroes-comprehensive-guide-v-1-0e11/)
- Egg Inc: 신규 소울에그 ∝ (프레스티지 수입)^k, k는 구간별 0.15→0.21(후반 0.21; 소울에그 2배에 수입 약 27배 필요), 소울에그당 수익 +10%(Soul Food 연구로 최대 +150%), 프로피시 에그는 `(1.05+0.01R)^P` 곱연산; 소울에그는 선형, 프로피시는 지수 — [JZR: Egg Inc Math](https://jzr.uz/blog/egg-inc-mystical-eggs-math)
- TT2: 프레스티지 해금 Sword Master 600레벨(약 스테이지 100), 렐릭 = (영웅 1,000레벨당 1 + 스테이지 보너스[90 이후 15스테이지마다 증가]) × 1~3(영웅 생존·포션 여부) — [player.one 가이드](https://www.player.one/tap-titans-2-beginners-guide-artifact-tiers-pets-clans-when-prestige-and-more-575174); [TT 위키 Prestige (검색 발췌)](https://tap-titans.fandom.com/wiki/Prestige)
- Realm Grinder: 젬 = floor(((1 + 4n/5e11)^0.5 − 1)/2) ≈ √(코인/5e11)(abdication); 2차 레이어 reincarnation은 1 Oc(1e27) 젬에서 첫 해금, 이후 1,000배씩 — [Realm Grinder wiki Abdication/Reincarnation (검색 발췌)](https://realm-grinder.fandom.com/wiki/Reincarnation)
- IMT: 프레스티지는 광산 단위로 최대 6회, 회차마다 더 큰 배수(6회차 예: Sunstone ×120, Celestine ×127, Coal ×145), 잔여 현금·슈퍼캐시·다른 광산은 유지, 비용은 현금 — [Kolibri helpshift](https://kolibri-games.helpshift.com/hc/en/3-idle-miner-tycoon/faq/48-how-does-the-prestige-system-work/?p=all); [IMT wiki 각 광산 페이지 (검색 발췌)](https://idleminertycoon.fandom.com/wiki/Prestige)
- Idle Theme Park: 다음 섬 구매 시 수입 +200%(현재 섬 매각 후 이동) — [LevelWinner](https://www.levelwinner.com/idle-theme-park-tycoon-guide-tips-cheats-strategies-build-your-dream-theme-park-increase-your-profits/); Idle Supermarket: 새 도시 해금 시 이전 마트 매각, 부서 리셋 + 이익 보너스 — [LevelWinner](https://www.levelwinner.com/idle-supermarket-tycoon-guide-tips-cheats-strategies-to-maximize-your-profits/)
- Frozen City: 마을 업그레이드 리스트 완료 → 다음 빈 마을(소프트 리셋), 영웅만 이월 — [Naavik Frozen City](https://naavik.co/deep-dives/frozen-city-deconstruction/)
- 인디 실측: Idle AI Factory `AI Cores = (2×(level−30)^1.35 + 2×stars) × [1|1.5|2]`; Idle Summoner는 스테이지가 영구 +1% 데미지 레벨로 전환 — [ONI Realms](https://onirealms.com/guides/how-to-design-an-idle-game/); 소규모 프로토타입 룰: `bonus = floor(√(points/1000))`, `mult = 1 + 0.1×bonus`, 첫 프레스티지 10~15분 내 — [dev.to 7 games](https://dev.to/aguier/i-built-7-idle-games-in-30-days-what-i-learned-about-incremental-design-5d3f)
- 개표국 현재치(소스): 감사 가능 조건 `area ≥ 4 || facilityTotal ≥ 55 || completed ≥ 3`; 인장 = max(4, (area−3)×4 + floor(facilityTotal/12) + floor(totalEvents/3)) × (1+sealPct) × (1+sealMult); 훈장 = 최고 구역 갱신분(구역당 1); 배수 = `(1 + seals×0.025) × (1 + 0.06×(1+runsMult)×runs/(1+runs/40))` (`GameState.js` prestigePreview/prestigeMultiplierRaw).

### Inferences
- 개표국 인장 공식은 생애 수입과 무관하므로 "같은 구역에서 더 오래 벌어도 인장이 늘지 않는다". 레퍼런스의 핵심 감각 — "지금 리셋하면 +X%, 1시간 더 하면 +Y%"의 연속적 트레이드오프 — 가 없고, 구역 돌파라는 이산 이벤트에만 묶여 있다. 사건 수(totalEvents/3)는 생애 누적이라 플레이 시간에 따라 자동 증가해 "감사 스팸"과 "오래 버티기" 어느 쪽도 명확한 유인이 없다.
- 인장당 +2.5% 가산은 AdCap 2%·Cookie 1%와 같은 급이지만 저들은 통화가 수백~수만 개로 불어난다(√ 또는 ∛ of 1e15~1e24). 개표국 인장은 회차당 수~수십 개라 배수 성장이 느리고, runs 보너스가 그 공백을 메우는 구조다. 인장 산출을 `k × √(이번 회차 수입/기준)` 또는 Egg Inc식 0.2 지수로 바꾸고 기준치를 구역별로 내려 주면 "더 벌수록 더 받는다"가 생긴다.
- 2차 레이어(훈장)는 "최고 구역 갱신"에 묶여 Clicker Heroes 트랜센던스·Realm Grinder 리인카네이션처럼 "충분히 깊어졌을 때만 열리는" 설계와 방향이 같다. 다만 저들은 2차 레이어가 새 규칙(새 에인션트/새 종족)을 여는데, 개표국 훈장은 영구 업그레이드 상점이라 신규 메커닉 개방 역할이 약하다.

### Gaps
- Cats & Soup의 새 지역 해금 조건·보너스 수치, Egg Inc 첫 프레스티지 권장 시점(시간)은 신뢰 가능한 1차 소스에서 찾지 못함.
- Clicker Heroes 프라이멀 보스 소울 공식(존 기반 지수식)은 미확인.

---

## 3. 능동(탭) vs 방치: 탭을 강제하지 않고 보상하는 방법과 능동/방치 수입 비율

### Takeaway
레퍼런스는 탭 자체를 수입원으로 두기보다 "짧고 강한 버스트(×7 77초, ×777 13초, 5분~수 시간 쿨다운 스킬)"와 "현장에 있을 때만 열리는 선택(골든쿠키, 보스 탭, 슈퍼매니저 발동)"으로 능동을 보상한다. 능동/방치 비율의 공식 수치는 드물고, 소규모 개발 룰은 오프라인 = 능동의 50%다.

### Cited Findings
- Pecorella 분류: 액티브 스킬은 "강력, 긴 쿨다운(5분~수 시간), 플레이어 주체성과 버스트/고비 돌파"; 인센티브 광고는 보통 배수로 구현; 클리커의 "신체성은 재미이자 피로" — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- Cookie Clicker 골든쿠키: 기본 스폰 간격 300~900초, 화면 체류 13초; Frenzy(~40%) ×7 CpS 77초; Lucky(~40%) 즉시 은행의 15%+13 또는 15분치 CpS 중 적은 쪽; Click Frenzy(~3%) 클릭당 ×777 13초; Building Special(~8%) 30초; Dragon Harvest ×15 60초; Cookie Storm 0.7%; Lucky day·Serendipity는 스폰 간격 ×0.5씩, Get lucky는 지속 ×2 — [Cookie Clicker wiki.gg Golden Cookie](https://cookieclicker.wiki.gg/wiki/Golden_Cookie)
- Frenzy×Click Frenzy 중첩 = 7×777 = 클릭당 5,439배; "진짜 이득은 중첩 골든쿠키 조합" — [cookieclickercalc 콤보 가이드](https://cookieclickercalc.com/articles/golden-cookie-combos)
- Clicker Heroes: 시작 빌드는 방치(Siyalatas/Libertas), 능동/하이브리드는 Juggernaut/Bhaal/Fragsworth; 하이브리드는 소울의 10%를 방치 에인션트에 — [clickerheroes.dev](https://clickerheroes.dev/guides/new-player-guide); [SteamAH](https://steamah.com/clicker-heroes-comprehensive-guide-v-1-0e11/)
- IMT: 광고 부스트는 곱연산(2X 광고 + 10X 부스트 = 20X); 최적 세션 = 부스트 발동 → 즉시현금 아이템(부스트된 수입 기준) → 슈퍼매니저 쿨다운 동안 방치 — [Kolibri Let's Dig In](https://www.kolibrigames.com/blog/lets-dig-in/)
- War Tortoise: "플레이어 상호작용이 강력하지만 빠른 탭을 요구하지 않음"이 장점으로 언급 — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 오프라인 = 능동률의 50%: "생산적이라 느끼되 능동이 무의미해지지 않게" — [dev.to 7 games](https://dev.to/aguier/i-built-7-idle-games-in-30-days-what-i-learned-about-incremental-design-5d3f)
- Idle AI Factory 오프라인 속도 클램프: 느린 트립 20초당 현재 레벨 코인의 5%, 빠른 트립 8초당 15%, 최소 3분 부재 후 보상 — [ONI Realms](https://onirealms.com/guides/how-to-design-an-idle-game/)
- 플레이어 동기(Quantic Foundry, 아이들 3종): 70% "코어 게이머", 20% "하드코어", 상위 동기 완성(Completion)과 힘(Power) — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 개표국 현재치(소스): 오프라인 수입률 0.72 × (1+offlinePct+title) (`offlineRateFor`), 탭은 콤보/피버로 배수.

### Inferences
- 개표국의 오프라인 72%는 dev.to 룰(50%)보다 관대하고, 피버/콤보가 능동 보상의 전부라면 "현장에 있어야만 생기는 랜덤 기회"(골든쿠키식 이벤트 팝업, 제한 시간 선택지)가 빠져 있다. 개표국의 사건(事件) 시스템을 "온라인일 때만 등장·13~30초 내 선택·×7급 단기 버스트 또는 은행의 15%" 형태로 쓰면 골든쿠키와 동일한 역할을 정치 풍자 톤으로 수행할 수 있다.
- 능동/방치 비율의 레퍼런스 수치는 없으나, 골든쿠키 기대값을 보면 Cookie Clicker 능동 플레이어는 Frenzy 77초/평균 ~10분 간격 ≈ 수입 +~70~100%(추정) 수준이다. "능동은 방치의 1.5~3배, 단 피로 없이"가 실무 목표치로 합리적.

### Gaps
- 능동/방치 수입 비율의 공개 실측치(AdCap/IMT/Egg Inc)는 찾지 못함. 위 Cookie Clicker 기대값은 [추정].

---

## 4. 오프라인 수입: 상한, 비율, 광고 2배, 복귀 화면

### Takeaway
상한은 2시간(Egg Inc 초기, Idle Theme Park, Frozen City)~8시간(Idle Ronin, IMT 업그레이드 후)~24시간(Idle Summoner)이 관찰되며, 상한이 짧을수록 재접속을 자주 요구한다. "복귀 시 광고로 2배"는 장르 표준 배치이고, Pecorella는 Egg Inc의 2시간 상한을 "실수, 나 자신이 이탈한 이유"라 평가했다. 개표국의 8시간+업그레이드·72%·이월(carry)은 관대한 편이다.

### Cited Findings
- Egg Inc: 오프라인 2시간 제한 — "실수였다고 생각한다, 나도 이것 때문에 이탈" — [Pecorella GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- Idle Theme Park: 오프라인 시 파크 2시간만 영업, 복귀 시 광고로 오프라인 수입 2배 — [LevelWinner](https://www.levelwinner.com/idle-theme-park-tycoon-guide-tips-cheats-strategies-build-your-dream-theme-park-increase-your-profits/)
- Idle Supermarket: 복귀 때마다 광고/젬으로 오프라인 수입 2배 — [LevelWinner](https://www.levelwinner.com/idle-supermarket-tycoon-guide-tips-cheats-strategies-to-maximize-your-profits/)
- Frozen City: 오프라인 상한 2시간, $14.99 월구독으로 6시간; 광고 2배 없음(장르 표준 대비 공백으로 지적) — [Naavik](https://naavik.co/deep-dives/frozen-city-deconstruction/)
- 인디 4종: Idle Ronin 8시간, Idle AI Factory 2→8시간(연구로 확장), Idle Summoner 24시간; "상한은 얼마나 자주 돌아오게 할지를 결정" — [ONI Realms](https://onirealms.com/guides/how-to-design-an-idle-game/)
- 광고 배치 표준: 15~30초 광고 ↔ 오프라인 2배·30분 생산 2배·소프트 통화 상자; 가장 강한 배치는 복귀 오프라인 더블러·타임드 부스트·타임스킵 — [onirealms idle-games-explained (검색 발췌)](https://onirealms.com/guides/idle-games-explained/)
- AdCap(2015): 수익화 레버 = 현금 주입, 타임워프, 속도 배수, 즉시 프레스티지, 옵트인 광고(광고로 ×2 부스트 4시간) — [GDC 2015 Pecorella 전사](https://archive.org/stream/GDC2015Pecorella/GDC2015-Pecorella_djvu.txt)
- "게임을 떠나는 것이 똑똑한 선택처럼 느껴지는 상황을 만들라"; 아이들은 부재를 벌하지 않고 보상하므로 복귀가 항상 보너스처럼 느껴짐 — [Mobile Free To Play](https://mobilefreetoplay.com/why-you-should-care-about-idle-games/)
- 개표국 현재치(소스): 상한 8h + 영구 업그레이드 `offlineHr`, 비율 0.72, 미적용분은 `offlineCarryVotes`로 이월 (`GameState.js` applyOfflineProgress/offlineCapMsFor).

### Inferences
- 개표국은 "상한이 짧아 이탈" 위험은 없지만 반대로 2시간 단위 재접속 유인이 약하다. 레퍼런스의 처방은 상한을 줄이는 게 아니라, 상한 내 "첫 2시간은 100%, 이후 체감(예: 2h까지 1.0, 8h까지 0.5)" 같은 구간 가중으로 자주 들어올수록 유리하게 하되 하루 1회 접속자도 손해 보지 않게 하는 것이다.
- 복귀 화면은 (1) 오프라인 수입, (2) 광고/해명으로 ×2, (3) 부재 중 벌어진 사건 요약(개표국 테마에 적합: "당신이 없는 사이 ○○ 논란이…")의 3단 구성이 표준. 개표국의 백로그(backlog)와 믿음 하락은 오프라인 중 적용 여부와 복귀 화면 설명이 핵심이다.

### Gaps
- AdCap·IMT·Cookie Clicker 모바일판의 정확한 오프라인 상한 시간과 오프라인 수입 비율(%)은 1차 소스로 확인하지 못함.

---

## 5. 병목/관리 시스템(엘리베이터·창고, 배송 vs 산란, 계산대 줄)을 벌이 아닌 재미로 만드는 법

### Takeaway
레퍼런스 병목은 (a) 두 개의 한정자가 서로 쫓고 쫓기는 "이중 리미터"(Egg Inc: 산란율 vs 배송 용량, IMT: 갱도 vs 엘리베이터 vs 창고), (b) 어느 쪽이 병목인지 한눈에 보이는 신호(빨간 표시, 사용률 100%, 빈 카트), (c) 해결 수단이 항상 구매 가능한 업그레이드라는 세 조건으로 "벌"이 아닌 "다음에 뭘 살지"의 결정 문제가 된다. 손실은 "덜 번다"(기회비용)이지 "자산이 깎인다"가 아니다.

### Cited Findings
- Egg Inc: "이중 리미터(산란율과 판매율)가 시간이 지나며 흥미로운 결정을 만든다" — [Pecorella GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf); 수익은 배송 가능량으로 제한, 초보 실수는 차량 무시, 현재 병목이 무엇인지 보고 차량 vs 산란 중 선택 — [tap-guides Egg Inc 가이드](https://tap-guides.com/2025/10/24/egg-inc-beginners-guide/)
- IMT: 엘리베이터 레벨 = 적재량·이동속도·적재속도, 창고 레벨 = 운반자 적재량·적재속도·보행속도; 창고와 엘리베이터 차이가 크면 카트 운반자가 빈손으로 다님; 권장 엘리베이터가 창고보다 5~10레벨 위 — [AppGamer IMT](https://www.appgamer.com/idle-miner-tycoon/strategy-guide/how-to-play-idle-miner-tycoon); 엘리베이터·창고는 함께 업그레이드 — [Kolibri](https://www.kolibrigames.com/blog/lets-dig-in/)
- Idle Supermarket: 계산대가 성장의 병목, 줄이 길면 고객이 화내고 이탈(판매 미집계 — 부동산 등 고가 부서면 손실 큼); 해법은 계산대 추가·캐셔 업그레이드·익스프레스 레인; 관리 화면에서 개선 필요 항목은 빨간색, 주차장 사용률 100% 근접 시 잠재 고객 손실 — [AppGamer](https://www.appgamer.com/idle-supermarket-tycoon/strategy-guide/how-to-play-idle-supermarket-tycoon); [LevelWinner](https://www.levelwinner.com/idle-supermarket-tycoon-guide-tips-cheats-strategies-to-maximize-your-profits/)
- Idle Theme Park: 놀이기구마다 좌석 수(동시 이용)와 대기줄 길이(대기 가능 인원)를 별도 업그레이드 — [LevelWinner](https://www.levelwinner.com/idle-theme-park-tycoon-guide-tips-cheats-strategies-build-your-dream-theme-park-increase-your-profits/)
- Frozen City: 건물 산출 = 영웅 배수 × 노동자 수 × 1인당 생산; 영웅(가챠) 부족이 진행을 "급정지"시키는 병목 → 의도된 과금 마찰이지만 "지속 성장"이라는 장르 약속을 훼손, 세션·플레이타임이 순수 아이들보다 낮음 — [Naavik](https://naavik.co/deep-dives/frozen-city-deconstruction/)
- 비표준 성장 모델: 생성기가 생성기를 만드는 도함수형(Derivative Clicker, Swarm Simulator), 조합형(피자 재료 nCr), 노드 연결형(도시 간 교역로 n(n−1)/2) — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 개표국 현재치(소스): 시설별 `capacity` 가중치(0.5/1.8/0.6/1.0/1.6/0.9; "분류·기록이 병목을 푼다"), 백로그 시 믿음(trust) 하락, `trustDecay` 구역당 증가 (`src/data/facilities.js`, `GameState.js` trustDecay).

### Inferences
- 개표국의 병목은 레퍼런스와 달리 "믿음이 깎인다"는 자산 손실형이다. Idle Supermarket도 고객 이탈이라는 손실이 있지만 그 손실은 "그 거래만 날아감"이며 누적 상태를 훼손하지 않는다. 믿음 하락이 복구 가능하고 상한선이 있더라도, 오프라인 복귀 시 "내가 없는 동안 믿음이 떨어져 있었다"는 경험은 FarmVille형 벌칙으로 읽힐 위험이 있다(Mobile Free To Play가 아이들의 장점으로 꼽은 "부재는 보너스"의 반대).
- 레퍼런스 처방으로 번역하면: (1) 접수(intake) vs 처리(capacity)를 두 개의 게이지로 항상 나란히 표시하고 병목 쪽을 빨간색, (2) 백로그는 "미처리 표가 쌓여 있다 = 돌아오면 피버로 한꺼번에 처리할 기회(보너스)"로 전환, (3) 믿음 하락은 온라인 중 방치했을 때만(또는 사건 선택 실패 시만) 적용, (4) 접수량을 올리는 수단(홍보/언론)과 처리량을 올리는 수단(분류/기록)을 의도적으로 번갈아 구매하게 하는 비용 설계(IMT의 "엘리베이터 5~10레벨 위" 같은 명시 룰을 UI 힌트로).

### Gaps
- Egg Inc 차량 용량·산란율의 구체 수식, Idle Supermarket의 고객 인내 시간(초)은 미확인.

---

## 6. 2차 통화와 소프트 게이트(연구 포인트·젬·키)가 해금을 페이싱하는 방식

### Takeaway
2차 통화는 (a) 주 통화로 못 사는 "자동화·영구 효과"의 전용 화폐(AdCap 엔젤 업그레이드, Egg Inc 골든에그/연구, IMT 슈퍼캐시·젬), (b) 소비 시 프레스티지 보너스 손실이라는 트레이드오프(AdCap 엔젤 지출), (c) 깊이를 밀어야만 나오는 희소 통화(Clicker Heroes 에인션트 소울, 개표국 훈장)의 3층으로 쓰인다. 개표국 해명(解明)은 시설/직원 해명 비용이 ×1.18/×1.24로 별도 사다리라 "두 통화가 서로 다른 속도로 벽이 되는" 구조는 이미 있다.

### Cited Findings
- AdCap: 엔젤은 보너스(2%/개)이자 소비 통화(배수 업그레이드) — 소비하면 보너스가 줄어 손익분기 `P×Y/(Y−1)`을 계산해야 함 — [Steam 토론](https://steamcommunity.com/app/346900/discussions/0/618460171313623228/); 프레스티지 통화는 "보상 부스트 상실을 대가로 소비 가능"이 일반 패턴 — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- Egg Inc: Soul Food(에픽 연구, 최대 140레벨)로 소울에그당 10%→150%, Prophecy Bonus 연구로 프로피시 1.05→1.10 — 2차 통화(골든에그)가 프레스티지 효율 자체를 올림 — [JZR](https://jzr.uz/blog/egg-inc-mystical-eggs-math)
- IMT: 슈퍼매니저 31종(능동 타임드 부스트 + 패시브), 본토 젬으로 해금; 광산·대륙·제국 3단 스킬트리(영구 수입 배수), 페이스북 친구당 +5% 최대 +100% — [Kolibri Super Manager 2.0](https://www.kolibrigames.com/blog/introducing-super-manager-2-0/); [Kolibri Let's Dig In](https://www.kolibrigames.com/blog/lets-dig-in/)
- Clicker Heroes: 에인션트 소울은 히어로 소울 10배마다 5개, 비용 +58%/개 — 2차 레이어 통화를 로그 스케일로 — [SteamAH](https://steamah.com/clicker-heroes-comprehensive-guide-v-1-0e11/)
- Realm Grinder: 2차 리셋(reincarnation) 요구치 1e27 젬, 이후 ×1,000 — [RG wiki (검색 발췌)](https://realm-grinder.fandom.com/wiki/Reincarnation)
- Frozen City: 타임머신 $0.99/120분 가속, 구독 $9.99~19.99; "광고로 5~10분 가속" 옵션 부재가 공백 — [Naavik](https://naavik.co/deep-dives/frozen-city-deconstruction/)
- 인디 안전장치: 소환 실패 시 다음 +1%(최대 +20%), 피처드 유닛 30코어 내 확정(기본 12%), 무료 보상은 "현재 레벨이 필요로 하는 코인의 비율(1.0 ≈ 트럭 10회분)"로 사이징 — [ONI Realms](https://onirealms.com/guides/how-to-design-an-idle-game/)
- AbyssRium: 마일스톤 배수를 물고기 구매(수집)에 묶어 "수집 시스템이 메커닉에 내장" — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 개표국 현재치(소스): 해명 초당 `0.55 + notice×0.2 + server×0.16 + studio×0.12` (`explainPerSecondFor`), 칭호 뽑기 비용 `40 × 1.13^draws` (`GameState.js:2630`), 인장 상점(sealPct/sealMult/offlineHr/capBoost…)과 훈장 상점 분리.

### Inferences
- 개표국 해명은 "시설 3종이 선형으로 생산하는 두 번째 주통화"라 Egg Inc 골든에그·IMT 젬처럼 희소하지 않다. 소프트 게이트로 쓰려면 (1) 특정 시설/직원 고레벨(예: 20/35/50)에서만 해명 요구, (2) 사건 선택의 "해명" 분기 비용, (3) 광고 대체 통화(오프라인 ×2, 피버 연장)로 역할을 좁히는 편이 레퍼런스에 가깝다.
- 무료 보상 사이징 룰("현재 단계가 필요로 하는 비용의 비율")은 개표국 사건 보상·일일 퀘스트 보상 설계에 바로 적용 가능 — 절대값이 아니라 "현재 다음 업그레이드 비용의 x%"로 정의.

### Gaps
- Cats & Soup의 2차 통화(물고기/골드/젬)와 지역 해금 페이싱 수치는 신뢰 소스 부재.

---

## 7. 세션 설계: 30초·3분·15분 세션이 각각 하는 일과 일일 세션 수

### Takeaway
벤치마크는 하루 5~6세션, 세션 6~8분, 일 플레이 21~35분(상위 10~25%)이다. 30초 세션은 "수금 + 광고 2배 + 가장 비싼 것 하나 구매", 3분은 "부스트 발동 + 일괄 구매 + 사건/퀘스트 처리", 15분은 "프레스티지 재빌드·이벤트·보스"가 레퍼런스의 암묵적 분담이며, 좋은 세션 종료는 "다음 목표가 비싸서 떠나는 게 합리적"일 때 발생한다.

### Cited Findings
- GameAnalytics 아이들 벤치마크: 상위 10% D1 45.55%, 상위 25% D1 39.40%; 일 플레이 34.92분(상위10%)/21.0분(상위25%); 일 세션 5.82/5.03; 평균 세션 7분/6분; 아이들 전체 평균 5.3세션/일, 8분/세션 vs 하이퍼캐주얼 4.6세션; DAU/MAU 18% vs 10.5%; ARPDAU 9배 — [GameWorldObserver/GameAnalytics](https://gameworldobserver.com/2020/12/22/gameanalytics-names-benchmark-engagement-metrics-idle-games)
- 아이들/AFK 장르 일반: D1 35~50%, D7 20~30%, D30 10~15%; D7→D30 이탈의 주원인은 콘텐츠 깊이 — [Playio 장르별 리텐션](https://blog.playio.co/retention-by-game-genre)
- AdCap(2015, Kongregate 모바일 초기): D1·D7 일별 리텐션 모두 약 60~70%; 생애 ARPPU $13.18~17.59 — [GDC 2015 전사](https://archive.org/stream/GDC2015Pecorella/GDC2015-Pecorella_djvu.txt)
- 세션 종료 설계: "플레이어가 게임을 떠나는 것이 똑똑하다고 느끼는 상황을 만들라" — 비싼 업그레이드가 자연 종료점 — [Mobile Free To Play](https://mobilefreetoplay.com/why-you-should-care-about-idle-games/)
- IMT 권장 세션 루틴: 부스트 → 즉시현금 → 슈퍼매니저 쿨다운 동안 방치("가장 시간 효율적") — [Kolibri](https://www.kolibrigames.com/blog/lets-dig-in/)
- Frozen City: 24분 압축 하루 중 12분은 노동자 수면 → "다운타임에 할 일이 없다"가 비판 — [Naavik](https://naavik.co/deep-dives/frozen-city-deconstruction/)
- 5분 테스트(프로토타입 룰): 첫 업그레이드 60초 내, 첫 자동화 3분 내, 첫 프레스티지 10~15분 내, 단계 전환은 능동 3~5분마다 — [dev.to 7 games](https://dev.to/aguier/i-built-7-idle-games-in-30-days-what-i-learned-about-incremental-design-5d3f)
- 장기 페이싱 목표치(Block Brain): XP = round(19.7 × level^2.3), 레벨 5 = 1일차, 15 = 2주, 30 = 2개월, 50 = 6개월 — [ONI Realms](https://onirealms.com/guides/how-to-design-an-idle-game/)
- AdCap 이벤트: 2~4일, 상위 보상 85,000~120,000점, 골든 골 3시간 만료 — [gameplay.tips](https://gameplay.tips/guides/adventure-capitalist-basic-guide-angels-events-suits-badges.html)
- Pecorella 디자인 원칙(2015): "상호작용 없는 진행", "비용과 힘의 급성장", "울퉁불퉁하게 만들라(Make It Bumpy)" — [GDC 2015 전사](https://archive.org/stream/GDC2015Pecorella/GDC2015-Pecorella_djvu.txt)

### Inferences
- 벤치마크(5~6세션 × 6~8분)를 개표국에 대입하면 하루 구조는 "아침 복귀(오프라인 수금·×2·사건 정리) → 점심 3분(부스트·일괄구매) → 저녁 15분(구역 보스·감사·주간 목표)"가 되고, 1분~4주 페이싱 표는 이 리듬 위에 놓아야 한다. 첫 세션 내 첫 자동화(직원 고용), 첫 날 안 첫 감사가 가능하도록 `canPrestige` 조건(area ≥ 4 등)의 도달 시간을 실측해야 한다.
- "Make It Bumpy": 마일스톤·사건·보스가 예측 가능한 간격으로 오면 평탄해진다. 25/50/100 고정 마일스톤 + 구역 보스 외에 랜덤 등장 요소(골든쿠키형)가 세션 내 서프라이즈를 담당해야 한다.

### Gaps
- 30초/3분/15분 세션별 행동 분담은 레퍼런스 설계 문서가 아니라 가이드·루틴에서 유추한 것 [추정]. 레퍼런스의 세션 길이 분포 원자료는 없음.

---

## 8. 아이들 게임이 플레이어를 잃는 이유(중반 지루함·수치 정체)와 처방

### Takeaway
공통 진단은 "D7~D30 콘텐츠 사막": 코어 메커닉이 진화하지 않고, 프레스티지가 '가속'이 아니라 '반복'으로 느껴지며, 병목이 진행을 급정지시킬 때 이탈한다. 처방은 새 규칙을 여는 다층 프레스티지, 수집/완성 동기의 메커닉 내장, 서사로 감싼 숫자, 정기 콘텐츠 드립, 그리고 부재를 벌하지 않는 복귀 설계다.

### Cited Findings
- "전통적 아이들은 초반에 몰입을 몰아넣고 프레스티지 리셋으로 수명을 늘리는데, 중반의 예측 가능한 '콘텐츠 사막'이 이탈 대부분을 만든다"; "프레스티지는 벌이 아니라 가속처럼 느껴져야 한다"; 리셋 레이어가 "독특한 플레이를 '업그레이드 사고 기다리기'로 대체하는 나쁜 습관" — [pinkcrow 아이들 가이드 (검색 발췌)](https://pinkcrow.net/game-idea/best-idle-games/); [dinogame 심리](https://dinogame.gg/blog/psychology-of-idle-games/)
- 처방: Melvor Idle·Antimatter Dimensions처럼 Infinity/Eternity/Reality 각 레이어가 새 메커닉 개방; 콘텐츠 드립; "플레이어는 숫자가 아니라 숫자를 감싼 서사에 몰입" — [같은 검색 발췌](https://pinkcrow.net/game-idea/best-idle-games/)
- D1 강하고 D7 붕괴 = 코어 메커닉이 진화하지 않는 "콘텐츠 소진"; 진행 벽에서 이탈하는 플레이어는 게임이 정적이거나 그라인드가 급해졌다고 느낌; 첫 주 내내 새 기능·도전·목표 필요 — [Playio](https://blog.playio.co/retention-by-game-genre); [GameAnalytics 16 reasons](https://www.gameanalytics.com/blog/16-reasons-players-leaving-game)
- 아이들 플레이어 상위 동기는 완성과 힘 → "수집·완성 요소를 아이들 메커닉에 넣을 수 있는가" — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 프레스티지 사이클이 느려지면 "지루해질 수 있다, 반드시 메타 프레스티지가 있어야" — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- Frozen City 이탈 신호: 가챠 병목으로 진행 급정지, 이벤트가 매번 동일·이월 없음 → 투자 의욕 저하, 세션·플레이타임이 순수 아이들보다 낮음 — [Naavik](https://naavik.co/deep-dives/frozen-city-deconstruction/)
- Egg Inc 2시간 오프라인 상한이 설계자급 플레이어의 이탈 원인 — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 아이들의 "미끼 교체": 능동 탭(코어) → 전략적 자원 관리(메타)로 세션이 거듭될수록 깊어지며 번아웃 방지 — [Mobile Free To Play](https://mobilefreetoplay.com/why-you-should-care-about-idle-games/)

### Inferences
- 개표국은 사건·보스·구역·훈장이라는 "서사 포장"과 "깊이 게이트"를 이미 갖춰 중반 사막 처방의 재료가 있다. 부족한 것은 (1) 프레스티지가 "가속"으로 느껴지게 하는 재빌드 속도(초반 구간 자동 스킵·시작 보너스), (2) 레이어마다 새 규칙(훈장 상점이 아니라 새 시설/새 직원 타입/새 사건군 해금), (3) 수집(16+ 구역 도감·칭호·캐릭터) 완성이 배수로 연결되는 AbyssRium형 고리.

### Gaps
- 아이들 장르 중반 이탈의 코호트 데이터(D7→D30 곡선, 프레스티지 횟수별 리텐션)는 공개 1차 자료를 찾지 못함. 위 D1/D7/D30 범위는 2차 블로그 집계 [추정 등급].

---

## 9. 개표국 적용: 비판 프레임과 우선순위별 격차·기회 (공식·비율·시점 포함)

### Takeaway
레퍼런스 대비 개표국은 (1) 수입과 무관한 프레스티지 통화, (2) 짧고 가파른 시설 사다리와 거기에 맞지 않는 마일스톤, (3) 벌칙형 병목, (4) 현장 전용 랜덤 기회 부재, (5) 역할이 넓은 해명 통화가 가장 큰 구조적 격차다. 아래 우선순위는 "장르 표준 공식과의 거리 × 리텐션 영향"으로 정렬했고, 수치는 레퍼런스 근거를 단 제안값이다(실측 후 조정 필요).

### Cited Findings (비판 프레임 — 각 축의 레퍼런스 기준)
- 축 A 비용·수익 곡선: 레벨당 ×1.07~1.15, 생성기 10~20종, 인접 기본가 ×10 — [Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i); [wiki.gg Buildings](https://cookieclicker.wiki.gg/wiki/Buildings)
- 축 B 마일스톤: 25/50(AdCap ×2), 25개마다 ×4(Clicker Heroes), 저가 생성기에 전역 배수 역할(Newspaper) — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 축 C 프레스티지: √/∛/^0.2 of 누적 수입, +50~200% 또는 2배 규칙, 통화당 1~10% — [worldwiki AdCap](https://worldwiki.games/games/adventure-capitalist/guide/kogda-sbrasyvat-radi-angelov/); [cookieclickernew](https://cookieclickernew.com/blog/cookie-clicker-ascension-guide/); [JZR](https://jzr.uz/blog/egg-inc-mystical-eggs-math)
- 축 D 능동 보상: 긴 쿨다운 스킬, ×7/77초형 랜덤 버스트, 피로 없는 상호작용 — [wiki.gg Golden Cookie](https://cookieclicker.wiki.gg/wiki/Golden_Cookie); [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)
- 축 E 오프라인: 2h 상한은 이탈 원인, 광고 ×2 표준, 부재는 보너스 — [GDC EU 2016](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf); [Mobile Free To Play](https://mobilefreetoplay.com/why-you-should-care-about-idle-games/)
- 축 F 병목: 이중 리미터 + 가시 신호 + 구매로 해결, 손실은 기회비용 — [AppGamer IMT](https://www.appgamer.com/idle-miner-tycoon/strategy-guide/how-to-play-idle-miner-tycoon); [AppGamer Supermarket](https://www.appgamer.com/idle-supermarket-tycoon/strategy-guide/how-to-play-idle-supermarket-tycoon)
- 축 G 세션/페이싱: 5~6세션 × 6~8분, 첫 자동화 3분, 첫 프레스티지 당일 — [GameAnalytics](https://gameworldobserver.com/2020/12/22/gameanalytics-names-benchmark-engagement-metrics-idle-games); [dev.to](https://dev.to/aguier/i-built-7-idle-games-in-30-days-what-i-learned-about-incremental-design-5d3f)

### Inferences (우선순위별 격차와 제안)
1. **[최우선] 인장 산출을 회차 수입 기반 연속 함수로 교체.** 제안: `인장 = floor(K × (이번 회차 처리 표 / B_area)^0.5)` + 현행 구역·사건 가산을 보너스 항으로 유지. B_area는 구역 4 도달 시 평균 누적치로 두어 첫 감사가 10~20인장이 되게 하고(AdCap 첫 리셋 50~300엔젤·2%와 같은 "첫 리셋 +100~200%" 체감을 2.5%×40~80 = +100~200%로 맞춤), 감사 미리보기에 "지금 +N / 1시간 후 예상 +M"을 표시. 리셋 권장 규칙은 "누적 인장이 2배가 될 때"를 UI 힌트로 제공. 근거: 축 C 전부.
2. **[최우선] 시설 사다리 재설계 — 둘 중 하나를 명시적으로 선택.** (a) 장르 표준형: 비용 ×1.15~1.20/레벨, maxLevel 200~300, 마일스톤 25/50/100/150/200/250 ×2(저가 시설은 Newspaper형 전역 +% 배수), 시설 기본가 비율 ×8~12로 벌림, 7~8번째 시설을 구역 8·12에서 해금. (b) 섬 이사형(Idle Theme Park/Supermarket): 현행 ×1.48·짧은 사다리를 유지하되 마일스톤을 10/20/30/40/50으로 내려 모든 시설이 2~3개는 밟게 하고, 구역 이동 시 "+200% 수입(섬 매각)"과 같은 큰 점프를 명시. 어느 쪽이든 현행 [25,50,100]은 수정 필요. 근거: 축 A·B, 소스 `FACILITY_MILESTONES`, `facilityCostAt`.
3. **[높음] 병목을 벌칙형에서 기회형으로.** 접수/처리 이중 게이지 상시 표시(병목 쪽 빨간색), 백로그는 "복귀 시 피버로 소진하면 ×1.5 보너스"로 전환, 믿음 하락은 온라인 중 60초 이상 백로그 방치 또는 사건 오답 시에만 적용, 오프라인 중엔 하락 없음. "분류·기록은 접수보다 N레벨 위로" 같은 IMT식 명시 힌트. 근거: 축 F·E.
4. **[높음] 현장 전용 랜덤 기회(골든쿠키의 풍자 버전).** 온라인 중 5~15분 간격(초기 상한 짧게 → 영구 업그레이드로 단축), 13~20초 체류, 효과 분포 예: "특보 ×7 처리속도 77초(40%)", "후원금 = 은행의 15% 또는 15분치 수입 중 적은 쪽(40%)", "탭 광풍 ×100 탭 13초(5%)", "국장 담화 전 시설 ×1.5 30초(10%)". 사건(事件) 시스템을 이 슬롯에 통합하면 신규 UI 없이 가능. 능동 목표치: 방치 대비 1.5~3배, 연타 의존 없음. 근거: 축 D.
5. **[중간] 오프라인 구간 가중과 복귀 화면 3단.** 상한 8h 유지, 가중 0~2h 1.0 / 2~8h 0.6(현행 0.72 평균 유지), 복귀 화면 = 수입 → 광고/해명 ×2 → "부재 중 사건 1건(선택 필요)". 하루 1회 접속자도 손해 없게 carry 유지. 근거: 축 E.
6. **[중간] 해명 역할 축소·소프트 게이트화.** 해명 요구를 시설 20/35/50레벨 돌파와 사건 분기·피버 연장·오프라인 ×2 대체로 한정, 생산은 시설 선형이 아니라 "사건 해결·보스 보상"으로 이동해 희소성 확보. 무료 보상은 "다음 업그레이드 비용의 x%"로 사이징. 근거: 축 6절 Egg Inc/IMT/ONI.
7. **[중간] 프레스티지를 '가속'으로: 재빌드 스킵.** 감사 후 처음 N분은 ×5~×10 시작 부스트 또는 구역 1~2 자동 완료(Nonstop Knight의 "초반 스킵" 사례), runs 보너스는 유지하되 인장 수입이 연속 함수가 되면 `0.06×runs` 기울기 재조정. 근거: 축 C, 8절.
8. **[중간] 훈장 레이어에 새 규칙 부여.** 훈장은 상점이 아니라 "새 시설 타입/새 직원 직군/새 사건군(예: 특검·언론·국제감시단)"을 해금하는 열쇠로, Clicker Heroes 트랜센던스·Realm Grinder 리인카네이션처럼 "레이어마다 메커닉이 바뀜". 근거: 8절.
9. **[낮음·측정 먼저] 1분~4주 페이싱 표 실측.** 목표: 첫 업그레이드 ≤60초, 첫 직원 ≤3분, 첫 마일스톤 ≤10분, 첫 감사 당일(2~4시간 플레이), 2주 내 구역 8~10, 4주 내 훈장 2~3개. 벤치마크 5~6세션×6~8분으로 세션 스크립트(30초: 수금·×2·1건 구매 / 3분: 부스트·일괄구매·사건 / 15분: 보스·감사·주간 목표)를 정의하고 시뮬레이터로 검증. 근거: 축 G.
10. **[낮음] 수집·완성 고리.** 구역 도감·칭호·캐릭터 완성률을 전역 배수에 연결(AbyssRium형). 아이들 플레이어 상위 동기 "완성·힘"에 직접 대응.

### Gaps
- 제안 수치(K, B_area, 가중 0.6, 간격 5~15분 등)는 레퍼런스 비율을 개표국 스케일로 옮긴 추정값이며 실측·시뮬레이션 검증 전이다 [추정].
- 개표국의 현재 "첫 감사까지 실제 소요 시간", 시설별 payback 분포, 세션 길이 분포 데이터는 이번 조사 범위 밖(텔레메트리 필요).

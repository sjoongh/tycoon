# 2026-11-11 — 골든 이벤트 + 보상 슬롯(광고 자리 추상화) + AdMob 어댑터

## 골든 이벤트 (중기 #5, Cookie Clicker 골든쿠키 분포)
- 황금 투표함을 탭하면 결과가 랜덤: 특보 40%(생산 ×7, 77초) / 후원금 40%(min(보유 표 15%+13, 15분치 생산)) / 국장 담화 15%(믿음 +8, 해명 2분치) / 탭 광풍 5%(클릭 ×20, 13초).
- 간격 2~5분(첫 등장 45~75초 유지), 체류 9→13초. 비서 Lv3 자동 수령은 80% 효과로 같은 분포.
- 버프는 세이브 `buffs { prodUntil, prodMult, clickUntil, clickMult, boostUntil }`에 저장(정규화 포함).

## 보상 슬롯 (`src/ads/rewardSlot.js`)
- 자리 3개: 골든 키우기(후원금 3배·특보 시간 2배), 생산 2배 4시간 부스트(HUD 칩, 중첩 불가), 오프라인 2배(무료 하루 1회를 쓴 뒤 광고 모드에서만 추가).
- 모드: AdMob 사용 가능(Android + 네이티브 플러그인 + 광고 단위 ID) → "ad", 그 외 → "free"(쿨다운 무료). 무료 쿨다운: 골든 10분, 부스트 하루 1회. 광고 모드 상한: 골든 하루 20회·1분 간격, 부스트 하루 2회, 오프라인 하루 3회.
- 모든 보상은 선택형. 안 봐도 손해 없음. 전면·배너 광고 없음.
- UI: 골든 결과 위 토스트(8초), HUD 오른쪽 "생산 2배" 칩(준비/진행 시간/다음 가능 시간). 전체 시트에서는 숨김.

## AdMob 어댑터 (`src/ads/admob.js`, `src/ads/adsConfig.js`)
- npm 패키지 없이 `registerPlugin("AdMob")`로 네이티브 플러그인(@capacitor-community/admob)을 호출. 플러그인 미설치 또는 `ADS.rewardedId=null`이면 비활성 → 무료 모드.
- 현재 프로덕션 빌드는 AdMob SDK를 포함하지 않는다(광고 ID 신고 없이 AD_ID 권한이 들어가는 것을 막기 위해).
- 실 광고 적용 절차:
  1. AdMob에서 앱(kr.gaepyo.counting) 등록 → 앱 ID, 보상형 광고 단위 ID 발급.
  2. `npm i @capacitor-community/admob` → `npx cap sync android`.
  3. `android/app/src/main/AndroidManifest.xml` `<application>`에 `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="앱 ID"/>`.
  4. `src/ads/adsConfig.js`의 `rewardedId`에 광고 단위 ID.
  5. Play Console 앱 콘텐츠 → 광고 ID 사용 신고 + 데이터 보안(광고 ID 수집) 갱신, 광고 포함 표시.
  6. `https://gaepyo-tycoon.web.app/app-ads.txt`에 AdMob 게시자 줄 추가.
  7. 개인정보처리방침(public/privacy.html)에 광고 SDK·광고 ID 항목 추가.
- 테스트: 개발 빌드에서 localStorage `gp-ads-test=1`이면 구글 공식 테스트 광고 단위를 쓴다.

## 계측
- `golden_tap {kind}`, `reward_claim {kind, mode}` 분석 이벤트 추가.

## 검증
- `npm test` 189/189(골든 분포·증폭·부스트 중첩·버프 정규화 4건 추가), `npm run build`, a11y errors 0.
- Playwright: 골든 스폰 → 후원금 +300,342 → 토스트 "3배로 받기" → +600,684, 쿨다운 중 재제안 없음, 특보 77초, 부스트 칩 4:00:00.

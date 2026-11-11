# 광고 제거 — 2026-11-11

## 결정
- 사용자 결정: 광고를 넣지 않고 Play 판매자 상태를 "비판매자"로 선언한다.
- 이유: 광고 수익이 있으면 Play 판매자로 선언해야 하고, 개인 계정은 실명·결제 프로필 주소·전화·이메일이 전 세계에 공개된다. 결제 프로필 주소는 인증 잠김이라 증빙서류 없이 바꿀 수 없다.

## 코드
- `@capacitor-community/admob` 제거, `src/ads/admob.js`·`adsConfig.js` 삭제.
- `src/ads/rewardSlot.js`: 무료 쿨다운 전용(골든 3배 10분, 생산 2배 하루 1회). 예전 광고 모드 기록(`lastAt`)도 쿨다운 기준으로 읽는다.
- 오프라인 보상의 "광고 보고 2배", 설정의 "광고 개인정보 설정", 광고 실패 안내 제거.
- AndroidManifest: AdMob APPLICATION_ID 삭제, `AD_ID` 권한을 `tools:node="remove"`로 차단.
- `public/app-ads.txt` 삭제, 개인정보처리방침에서 광고 ID·AdMob 항목 삭제.

## 검증
- vitest 205건 통과(보상 슬롯 4건으로 교체).
- 릴리스 병합 매니페스트에 AD_ID·gms.ads 0건, AAB에 광고 SDK 0건, 크기 6,483,457 bytes(1.7.0 수준).
- 웹 스모크(Playwright, 390×844): 생산 2배 칩 "4시간 받기" → 클릭 후 240분 적용, 설정에 광고 줄 없음, 콘솔 오류 0.

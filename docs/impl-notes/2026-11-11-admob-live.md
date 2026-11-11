# AdMob 실 적용 — 2026-11-11

## 계정·콘솔 상태
- AdMob 앱 `ca-app-pub-8097341368838823~5169505466`, 보상형 단위 `ca-app-pub-8097341368838823/4566870237`.
- `public/app-ads.txt` 배포(`google.com, pub-8097341368838823, DIRECT, f08c47fec0942fa0`). AdMob 앱 검토는 app-ads.txt 확인 대기.
- Play Console: 광고 포함=예, 광고 ID=예(광고·마케팅), 데이터 보안 양식 갱신(기기 ID·대략적 위치·앱 상호작용·진단 = 수집·공유, 사용자 ID = 수집만), 삭제 URL `privacy.html#delete`. 검토 제출.
- 개인정보처리방침 2026-11-11 개정(광고 ID, AdMob 처리자, 거부 방법, 삭제 요청 절차).
- AdMob 유럽 규정 메시지 게시(2026-11-11): 앱 '믿어주세요 개표국', 기본 언어 영어, 개인정보처리방침 URL `https://gaepyo-tycoon.web.app/privacy.html`, 동의·옵션 관리 사용, '동의하지 않음' 버튼은 기본값(미설정). 게시 후 앱의 UMP 요청에서 "no form(s) configured" 오류가 사라지고 CMP ID 300이 기록됨.
- Play 스토어 등록정보 연락처에 웹사이트 `https://gaepyo-tycoon.web.app` 추가(즉시 게시). AdMob 앱 인증은 이 도메인 루트의 app-ads.txt를 읽는다. 추가 전에는 "세부정보가 일치하지 않음"으로 인증 실패.
- 판매자 상태 선언(계정 단위, 기한 2027-02-01): 미제출. 판매자로 선언하면 개인 계정의 법적 이름·주소가 EU 이용자에게 공개되므로 계정 소유자 결정 필요.

## 코드
- `src/ads/admob.js`: 초기화 직후 UMP `requestConsentInfo` → `REQUIRED`이고 양식이 있으면 `showConsentForm`. `showRewarded()`는 `"rewarded" | "dismissed" | "failed"`를 돌려준다.
- `src/ads/rewardSlot.js`: 중도 종료는 보상 없음. 로드·표시 실패(광고 없음·계정 미승인·지역 제한·네트워크)는 무료 쿨다운이 찼을 때 무료로 대신 지급(`freeAt` 별도 기록, 광고 횟수 미차감). 쿨다운 중이면 "광고를 불러오지 못했습니다" 안내.
- 설정: UMP가 `privacyOptionsRequirementStatus=REQUIRED`일 때만 '광고 개인정보 설정' 줄 노출.
- `main.js`: 시작 시 `warmUpAds()`.
- 병합 매니페스트에 `com.google.android.gms.permission.AD_ID` 포함 확인.

## 검증(에뮬레이터, 1.8.0 디버그 APK)
- 실 단위: 요청 전송 확인, 응답 `Account not approved yet`(code 3) → 무료 대체 지급으로 생산 2배 240분 적용, 광고 횟수 0.
- 테스트 단위(`gp-ads-test=1`): Loaded → Showed → Impression → Reward, 닫은 뒤 부스트 240분·횟수 1. 캡처 `evidence/2026-11-11-admob-live-test-ad.png`.
- UMP: 동의 메시지 미게시 오류를 잡고 계속 진행.
- vitest 206건 통과(`src/ads/rewardSlot.test.js` 5건 추가).

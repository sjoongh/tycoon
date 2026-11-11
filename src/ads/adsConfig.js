// 광고 설정 — 실제 AdMob 앱/광고 단위 ID 를 받기 전까지 rewardedId 는 null 이고, 보상 슬롯은 '무료 쿨다운' 모드로 동작한다.
// 실 ID 적용 절차는 docs/impl-notes/2026-11-11-golden-and-reward-slot.md 참고.
export const ADS = {
  rewardedId: null, // 예: "ca-app-pub-XXXXXXXX/YYYYYYYY"
};

// 구글 공식 테스트 ID(실 광고 아님). 개발 중 localStorage "gp-ads-test"="1" 이면 이 값을 쓴다.
export const ADMOB_TEST = {
  appId: "ca-app-pub-3940256099942544~3347511713",
  rewardedId: "ca-app-pub-3940256099942544/5224354917",
};

export function adsTestMode() {
  try { return localStorage.getItem("gp-ads-test") === "1"; } catch { return false; }
}

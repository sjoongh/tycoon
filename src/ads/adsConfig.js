// 광고 설정 — AdMob 실 계정(게시자 pub-8097341368838823). 앱 ID 는 AndroidManifest.xml meta-data 에 있다.
// 앱 ID: ca-app-pub-8097341368838823~5169505466 / 보상형 단위 "reward_slot"
export const ADS = {
  rewardedId: "ca-app-pub-8097341368838823/4566870237",
};

// 구글 공식 테스트 ID(실 광고 아님). 개발 중 localStorage "gp-ads-test"="1" 이면 이 값을 쓴다.
export const ADMOB_TEST = {
  appId: "ca-app-pub-3940256099942544~3347511713",
  rewardedId: "ca-app-pub-3940256099942544/5224354917",
};

export function adsTestMode() {
  try { return localStorage.getItem("gp-ads-test") === "1"; } catch { return false; }
}

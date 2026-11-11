// AdMob 보상형 광고 어댑터(Android 네이티브 전용).
// npm 패키지 없이 registerPlugin 으로 네이티브 플러그인(@capacitor-community/admob)을 부른다 — 네이티브 쪽에 플러그인이
// 설치되지 않았거나 광고 단위 ID 가 없으면 available()=false 이고 보상 슬롯은 무료 쿨다운으로 동작한다.
import { Capacitor, registerPlugin } from "@capacitor/core";
import { ADS, ADMOB_TEST, adsTestMode } from "./adsConfig.js";

const AdMob = registerPlugin("AdMob");
let initPromise = null;

function rewardedId() {
  return adsTestMode() ? ADMOB_TEST.rewardedId : ADS.rewardedId;
}

export function admobAvailable() {
  try {
    return !!(Capacitor.isNativePlatform?.() && Capacitor.isPluginAvailable?.("AdMob") && rewardedId());
  } catch { return false; }
}

async function init() {
  if (!initPromise) initPromise = AdMob.initialize({ initializeForTesting: adsTestMode() }).catch((e) => { initPromise = null; throw e; });
  return initPromise;
}

// 보상형 광고를 보여 주고, 끝까지 봐서 보상 조건을 채웠으면 true. 실패·중도 이탈은 false.
export async function showRewarded() {
  if (!admobAvailable()) return false;
  try {
    await init();
    await AdMob.prepareRewardVideoAd({ adId: rewardedId(), isTesting: adsTestMode() });
  } catch { return false; }
  return new Promise((resolve) => {
    let rewarded = false;
    let settled = false;
    const handles = [];
    const done = (v) => { if (settled) return; settled = true; handles.forEach((h) => { try { h.remove(); } catch {} }); resolve(v); };
    Promise.all([
      AdMob.addListener("onRewardedVideoAdReward", () => { rewarded = true; }),
      AdMob.addListener("onRewardedVideoAdDismissed", () => done(rewarded)),
      AdMob.addListener("onRewardedVideoAdFailedToShow", () => done(false)),
    ]).then((hs) => {
      handles.push(...hs);
      AdMob.showRewardVideoAd().then((item) => { if (item) rewarded = true; }).catch(() => done(false));
    }).catch(() => done(false));
    setTimeout(() => done(rewarded), 120000); // 안전 타임아웃
  });
}

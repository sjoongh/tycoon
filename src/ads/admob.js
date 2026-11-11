// AdMob 보상형 광고 어댑터(Android 네이티브 전용).
// registerPlugin 으로 네이티브 플러그인(@capacitor-community/admob)을 부른다 — 웹이거나 플러그인·광고 ID 가 없으면 available()=false.
// 유럽(EEA·영국·스위스) 동의: 초기화 직후 UMP 동의 정보를 요청하고, 필요하면 동의 양식을 띄운다(AdMob '유럽 규정' 메시지가 게시돼 있어야 양식이 나온다).
import { Capacitor, registerPlugin } from "@capacitor/core";
import { ADS, ADMOB_TEST, adsTestMode } from "./adsConfig.js";

const AdMob = registerPlugin("AdMob");
let initPromise = null;
let consentInfo = null;

function rewardedId() {
  return adsTestMode() ? ADMOB_TEST.rewardedId : ADS.rewardedId;
}

export function admobAvailable() {
  try {
    return !!(Capacitor.isNativePlatform?.() && Capacitor.isPluginAvailable?.("AdMob") && rewardedId());
  } catch { return false; }
}

async function gatherConsent() {
  try {
    consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo?.isConsentFormAvailable && consentInfo?.status === "REQUIRED") {
      consentInfo = await AdMob.showConsentForm();
    }
  } catch { /* 동의 메시지 미게시·네트워크 오류: 광고 요청은 SDK 가 지역 규정에 맞게 제한 */ }
  return consentInfo;
}

async function init() {
  if (!initPromise) {
    initPromise = (async () => {
      await AdMob.initialize({ initializeForTesting: adsTestMode() });
      await gatherConsent();
    })().catch((e) => { initPromise = null; throw e; });
  }
  return initPromise;
}

// 앱 시작 시 미리 초기화(동의 양식은 첫 실행에 한 번 뜬다)
export function warmUpAds() {
  if (!admobAvailable()) return;
  init().catch(() => {});
}

// 설정 화면의 '광고 개인정보 설정' 노출 여부(유럽 등 규정 지역에서만 required)
export async function privacyOptionsRequired() {
  if (!admobAvailable()) return false;
  try { await init(); } catch { return false; }
  return consentInfo?.privacyOptionsRequirementStatus === "REQUIRED";
}

export async function showPrivacyOptions() {
  if (!admobAvailable()) return false;
  try { await init(); await AdMob.showPrivacyOptionsForm(); return true; } catch { return false; }
}

// 보상형 광고: "rewarded"(끝까지 시청) / "dismissed"(중도 종료) / "failed"(로드·표시 실패: 광고 없음·지역 제한·네트워크)
export async function showRewarded() {
  if (!admobAvailable()) return "failed";
  try {
    await init();
    await AdMob.prepareRewardVideoAd({ adId: rewardedId(), isTesting: adsTestMode() });
  } catch { return "failed"; }
  return new Promise((resolve) => {
    let rewarded = false;
    let settled = false;
    const handles = [];
    const done = (v) => { if (settled) return; settled = true; handles.forEach((h) => { try { h.remove(); } catch {} }); resolve(v); };
    Promise.all([
      AdMob.addListener("onRewardedVideoAdReward", () => { rewarded = true; }),
      AdMob.addListener("onRewardedVideoAdDismissed", () => done(rewarded ? "rewarded" : "dismissed")),
      AdMob.addListener("onRewardedVideoAdFailedToShow", () => done("failed")),
    ]).then((hs) => {
      handles.push(...hs);
      AdMob.showRewardVideoAd().then((item) => { if (item) rewarded = true; }).catch(() => done("failed"));
    }).catch(() => done("failed"));
    setTimeout(() => done(rewarded ? "rewarded" : "failed"), 120000);
  });
}

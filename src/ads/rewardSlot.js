// 보상 슬롯 — "보면 더 준다" 자리를 하나로 추상화(레퍼런스 로드맵 중기 #8).
// 모드: AdMob 사용 가능(Android + 플러그인 + 광고 ID) → "ad", 그 외(웹·광고 미설정) → "free"(쿨다운 무료 보상).
// 안 봐도 손해가 없도록 모든 보상은 선택형이고, 광고 모드에도 하루 상한이 있다.
import { admobAvailable, showRewarded } from "./admob.js";

const KEY = "gp-reward-v1";
const DAY = 86400000;

export const REWARD_KINDS = {
  golden3x: { label: "3배로 받기", freeCooldownMs: 10 * 60000, adCooldownMs: 60000, adDailyCap: 20 },
  boost: { label: "생산 2배 4시간", freeCooldownMs: DAY, adCooldownMs: 0, adDailyCap: 2 },
  offline2x: { label: "2배로 받기", freeCooldownMs: Infinity, adCooldownMs: 0, adDailyCap: 3 }, // 무료 2배는 기존 하루 1회 로직이 담당
};

function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; } }
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
function today(now) { return Math.floor(now / DAY); }

export function rewardMode() { return admobAvailable() ? "ad" : "free"; }

export function rewardStatus(kind, now = Date.now()) {
  const def = REWARD_KINDS[kind];
  if (!def) return { ready: false, waitMs: Infinity, mode: "free" };
  const mode = rewardMode();
  const st = load()[kind] || {};
  if (mode === "ad") {
    const count = st.day === today(now) ? (st.count || 0) : 0;
    if (count >= def.adDailyCap) return { ready: false, waitMs: (today(now) + 1) * DAY - now, mode, capped: true };
    const wait = Math.max(0, (st.lastAt || 0) + def.adCooldownMs - now);
    return { ready: wait <= 0, waitMs: wait, mode, left: def.adDailyCap - count };
  }
  if (!Number.isFinite(def.freeCooldownMs)) return { ready: false, waitMs: Infinity, mode };
  const wait = Math.max(0, (st.lastAt || 0) + def.freeCooldownMs - now);
  return { ready: wait <= 0, waitMs: wait, mode };
}

export function rewardLabel(kind) {
  const def = REWARD_KINDS[kind];
  return rewardMode() === "ad" ? `▶ 광고 보고 ${def.label}` : def.label;
}

// 보상 조건 충족 시 true. 광고 모드면 광고를 끝까지 봐야 true, 무료 모드면 쿨다운이 지났을 때 true.
export async function claimReward(kind, now = Date.now()) {
  const s = rewardStatus(kind, now);
  if (!s.ready) return false;
  if (s.mode === "ad") {
    const ok = await showRewarded();
    if (!ok) return false;
  }
  const all = load();
  const st = all[kind] || {};
  const d = today(Date.now());
  all[kind] = { lastAt: Date.now(), day: d, count: (st.day === d ? (st.count || 0) : 0) + 1 };
  save(all);
  try { document.dispatchEvent(new CustomEvent("gp:reward-claimed", { detail: { kind, mode: s.mode } })); } catch {}
  return true;
}

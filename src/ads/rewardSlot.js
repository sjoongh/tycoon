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

function freeStatus(def, st, now) {
  if (!Number.isFinite(def.freeCooldownMs)) return { ready: false, waitMs: Infinity };
  const wait = Math.max(0, (st.freeAt || st.lastAt || 0) + def.freeCooldownMs - now);
  return { ready: wait <= 0, waitMs: wait };
}

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
  const fs = freeStatus(def, st, now);
  return { ...fs, mode };
}

export function rewardLabel(kind) {
  const def = REWARD_KINDS[kind];
  return rewardMode() === "ad" ? `▶ 광고 보고 ${def.label}` : def.label;
}

// 보상 조건 충족 시 true. 광고 모드면 광고를 끝까지 봐야 true, 무료 모드면 쿨다운이 지났을 때 true.
export async function claimReward(kind, now = Date.now()) {
  const s = rewardStatus(kind, now);
  if (!s.ready) return false;
  let via = s.mode;
  if (s.mode === "ad") {
    const r = await showRewarded();
    if (r === "dismissed") return false; // 중도 종료는 보상 없음
    if (r === "failed") {
      // 광고를 못 불러온 경우(광고 없음·지역 제한·네트워크): 무료 쿨다운이 찼으면 무료로 대신 지급
      const fs = freeStatus(REWARD_KINDS[kind], load()[kind] || {}, Date.now());
      if (!fs.ready) { try { document.dispatchEvent(new CustomEvent("gp:reward-failed", { detail: { kind } })); } catch {} return false; }
      via = "free-fallback";
    }
  }
  const all = load();
  const st = all[kind] || {};
  const d = today(Date.now());
  const now2 = Date.now();
  all[kind] = { ...st, lastAt: now2, day: d, count: (st.day === d ? (st.count || 0) : 0) + (via === "ad" ? 1 : 0), ...(via !== "ad" ? { freeAt: now2 } : {}) };
  save(all);
  try { document.dispatchEvent(new CustomEvent("gp:reward-claimed", { detail: { kind, mode: via } })); } catch {}
  return true;
}

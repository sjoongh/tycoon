// 보상 슬롯 — "보면 더 준다" 자리를 하나로 추상화(레퍼런스 로드맵 중기 #8).
// 광고는 넣지 않는다(2026-11-11 결정): 모든 보상은 무료 쿨다운으로만 지급한다.
// 안 받아도 손해가 없도록 모든 보상은 선택형이다.

const KEY = "gp-reward-v1";
const DAY = 86400000;

export const REWARD_KINDS = {
  golden3x: { label: "3배로 받기", freeCooldownMs: 10 * 60000 },
  boost: { label: "생산 2배 4시간", freeCooldownMs: DAY },
};

function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; } }
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

export function rewardStatus(kind, now = Date.now()) {
  const def = REWARD_KINDS[kind];
  if (!def) return { ready: false, waitMs: Infinity };
  const st = load()[kind] || {};
  const wait = Math.max(0, (st.freeAt || st.lastAt || 0) + def.freeCooldownMs - now);
  return { ready: wait <= 0, waitMs: wait };
}

export function rewardLabel(kind) { return REWARD_KINDS[kind].label; }

// 쿨다운이 지났으면 지급 기록을 남기고 true.
export async function claimReward(kind, now = Date.now()) {
  if (!rewardStatus(kind, now).ready) return false;
  const all = load();
  all[kind] = { freeAt: now };
  save(all);
  try { document.dispatchEvent(new CustomEvent("gp:reward-claimed", { detail: { kind } })); } catch {}
  return true;
}

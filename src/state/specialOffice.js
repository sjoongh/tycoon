// 특별 개표소 상태 로직 — GameState 와 분리된 순수 함수(세이브 data.special 을 다룬다).
import { SPECIAL_THEMES, SPECIAL_STATIONS, SPECIAL_COST_GROWTH, SPECIAL_TIERS, SPECIAL_OPEN_DAYS, SPECIAL_OFFLINE_RATE, SPECIAL_OFFLINE_CAP_H } from "../data/specialOffice.js";

export const SPECIAL_FALLBACK = { week: -1, votes: 0, total: 0, stations: [0, 0, 0], tiers: {}, taps: 0 };

export function normalizeSpecial(raw, historyRaw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
  const stations = Array.isArray(s.stations) ? SPECIAL_STATIONS.map((_, i) => Math.floor(num(s.stations[i]))) : [0, 0, 0];
  const tiers = s.tiers && typeof s.tiers === "object" ? Object.fromEntries(SPECIAL_TIERS.filter((t) => s.tiers[t.id]).map((t) => [t.id, 1])) : {};
  const special = { week: Number.isFinite(Number(s.week)) ? Math.floor(Number(s.week)) : -1, votes: num(s.votes), total: num(s.total), stations, tiers, taps: Math.floor(num(s.taps)) };
  const history = Array.isArray(historyRaw) ? historyRaw.filter((h) => h && h.theme && h.tier).slice(-8) : [];
  return { special, history };
}

export function specialSchedule(dayIndex) {
  const week = Math.floor(dayIndex / 7);
  const day = dayIndex - week * 7;
  const open = day < SPECIAL_OPEN_DAYS;
  const theme = SPECIAL_THEMES[((week % SPECIAL_THEMES.length) + SPECIAL_THEMES.length) % SPECIAL_THEMES.length];
  return { week, day, open, theme, daysLeft: open ? SPECIAL_OPEN_DAYS - day : 0, daysUntilOpen: open ? 0 : 7 - day };
}

export function stationCost(i, lv) {
  return Math.ceil(SPECIAL_STATIONS[i].cost * Math.pow(SPECIAL_COST_GROWTH, lv));
}

export function stationUnlocked(sp, i) {
  const need = SPECIAL_STATIONS[i].needPrev;
  return !need || (sp.stations[i - 1] || 0) >= need;
}

export function specialPerSecond(sp) {
  return SPECIAL_STATIONS.reduce((sum, st, i) => sum + st.base * (sp.stations[i] || 0), 0);
}

export function specialTapValue(sp) {
  return 1 + Math.floor(specialPerSecond(sp) * 0.08);
}

// 주가 바뀌었으면 지난 기록을 남기고 초기화. 기록 항목: { week, theme, tier, total }
export function rolloverSpecial(sp, history, week, themeOfWeek) {
  if (sp.week === week) return { sp, history, archived: null };
  let archived = null;
  if (sp.week >= 0 && sp.total > 0) {
    const best = [...SPECIAL_TIERS].reverse().find((t) => sp.tiers[t.id]);
    if (best) {
      archived = { week: sp.week, theme: themeOfWeek(sp.week).name, tier: best.id, total: Math.floor(sp.total) };
      history = [...history, archived].slice(-8);
    }
  }
  return { sp: { ...SPECIAL_FALLBACK, stations: [0, 0, 0], tiers: {}, week }, history, archived };
}

// 등급 달성 판정: 새로 넘은 등급 목록을 돌려주고 sp.tiers 에 표시한다
export function claimNewTiers(sp) {
  const fresh = SPECIAL_TIERS.filter((t) => !sp.tiers[t.id] && sp.total >= t.need);
  fresh.forEach((t) => { sp.tiers[t.id] = 1; });
  return fresh;
}

export function addSpecialVotes(sp, amount) {
  const v = Math.max(0, amount);
  sp.votes += v;
  sp.total += v;
  return v;
}

export function specialOfflineGain(sp, elapsedMs) {
  const sec = Math.min(elapsedMs, SPECIAL_OFFLINE_CAP_H * 3600000) / 1000;
  return specialPerSecond(sp) * sec * SPECIAL_OFFLINE_RATE;
}

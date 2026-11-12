// 소리·진동 설정 — 배경음/효과음 각각 켜기·음량, 진동. 구버전 단일 음소거(gp-muted)를 이어받는다.
export const PREFS_KEY = "gp-audio";
const LEGACY_MUTE_KEY = "gp-muted";

export const DEFAULT_PREFS = Object.freeze({ bgm: true, bgmVol: 0.7, sfx: true, sfxVol: 0.8, vibrate: true });

const clampVol = (v, d) => (Number.isFinite(+v) ? Math.min(1, Math.max(0, +v)) : d);

export function normalizePrefs(raw) {
  const p = raw && typeof raw === "object" ? raw : {};
  return {
    bgm: p.bgm !== undefined ? !!p.bgm : DEFAULT_PREFS.bgm,
    bgmVol: clampVol(p.bgmVol, DEFAULT_PREFS.bgmVol),
    sfx: p.sfx !== undefined ? !!p.sfx : DEFAULT_PREFS.sfx,
    sfxVol: clampVol(p.sfxVol, DEFAULT_PREFS.sfxVol),
    vibrate: p.vibrate !== undefined ? !!p.vibrate : DEFAULT_PREFS.vibrate,
  };
}

export function loadPrefs(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(PREFS_KEY);
    if (raw) return normalizePrefs(JSON.parse(raw));
    // 예전 '소리 끔'은 배경음·효과음·진동을 모두 끈 상태였다
    if (storage?.getItem(LEGACY_MUTE_KEY) === "1") return normalizePrefs({ bgm: false, sfx: false, vibrate: false });
  } catch { /* 손상된 값은 기본값 */ }
  return normalizePrefs(null);
}

export function savePrefs(prefs, storage = globalThis.localStorage) {
  const p = normalizePrefs(prefs);
  try { storage?.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* 저장 불가 무시 */ }
  return p;
}

// 음량 슬라이더(0~1)를 귀에 고르게 들리는 게인으로(제곱 곡선)
export const volToGain = (v) => clampVol(v, 0) ** 2;

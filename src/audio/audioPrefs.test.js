import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, PREFS_KEY, loadPrefs, normalizePrefs, savePrefs, volToGain } from "./audioPrefs.js";

const mem = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
};

describe("소리 설정", () => {
  it("저장값이 없으면 기본값", () => {
    expect(loadPrefs(mem())).toEqual({ ...DEFAULT_PREFS });
  });

  it("구버전 음소거를 이어받는다", () => {
    expect(loadPrefs(mem({ "gp-muted": "1" }))).toMatchObject({ bgm: false, sfx: false, vibrate: false });
    expect(loadPrefs(mem({ "gp-muted": "0" }))).toEqual({ ...DEFAULT_PREFS });
  });

  it("저장 후 다시 읽으면 같고, 새 키가 구버전보다 우선", () => {
    const st = mem({ "gp-muted": "1" });
    savePrefs({ ...DEFAULT_PREFS, bgmVol: 0.3 }, st);
    expect(JSON.parse(st.map.get(PREFS_KEY)).bgmVol).toBe(0.3);
    expect(loadPrefs(st)).toMatchObject({ bgm: true, bgmVol: 0.3 });
  });

  it("범위를 벗어나거나 손상된 값은 바로잡는다", () => {
    expect(normalizePrefs({ bgmVol: 4, sfxVol: -1, bgm: 0 })).toMatchObject({ bgmVol: 1, sfxVol: 0, bgm: false });
    expect(normalizePrefs({ bgmVol: "x" }).bgmVol).toBe(DEFAULT_PREFS.bgmVol);
    expect(loadPrefs(mem({ [PREFS_KEY]: "{bad" }))).toEqual({ ...DEFAULT_PREFS });
  });

  it("음량 곡선은 0→0, 1→1, 단조 증가", () => {
    expect(volToGain(0)).toBe(0);
    expect(volToGain(1)).toBe(1);
    expect(volToGain(0.5)).toBeLessThan(0.5);
  });
});

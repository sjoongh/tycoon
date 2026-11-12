import { describe, expect, it } from "vitest";
import { SONGS, ERA_KEYS, arrange, sectionMelody, COMP, BASS, DRUMS } from "./songs.js";
import { eraTheme } from "../data/regions.js";

describe("배경음 곡 데이터", () => {
  it("모든 시대에 곡이 있다", () => {
    for (let a = 1; a <= 20; a += 1) expect(SONGS[eraTheme(a).key]).toBeTruthy();
    expect(ERA_KEYS).toHaveLength(6);
  });

  it("곡마다 패턴 이름이 실제 정의와 연결된다", () => {
    for (const s of Object.values(SONGS)) {
      if (!["arp", "pad", "harp"].includes(s.comp)) expect(COMP[s.comp]).toBeTruthy();
      expect(BASS[s.bass]).toBeTruthy();
      expect(DRUMS[s.drums]).toBeTruthy();
      expect(["marimba", "bell", "flute", "synth"]).toContain(s.lead);
      s.form.forEach((name) => expect(s.sections[name]).toHaveLength(4));
    }
  });

  it("선율은 음역 안, 마디 안에서 겹치지 않고 같은 시드면 같은 곡", () => {
    for (const s of Object.values(SONGS)) {
      for (const name of Object.keys(s.sections)) {
        const mel = sectionMelody(s, name);
        expect(mel).toEqual(sectionMelody(s, name));
        expect(mel.length).toBeGreaterThanOrEqual(s.sparse ? 4 : 10);
        mel.forEach((n) => {
          expect(n.midi).toBeGreaterThanOrEqual(s.range[0]);
          expect(n.midi).toBeLessThanOrEqual(s.range[1]);
          expect(n.step + n.len).toBeLessThanOrEqual(16);
        });
        for (let b = 0; b < 4; b += 1) {
          const bar = mel.filter((n) => n.bar === b);
          for (let i = 1; i < bar.length; i += 1) expect(bar[i].step).toBeGreaterThanOrEqual(bar[i - 1].step + bar[i - 1].len);
        }
      }
    }
  });

  it("프레이즈는 화음음(근음·3음 계열)으로 끝난다", () => {
    for (const s of Object.values(SONGS)) {
      if (s.sparse) continue;
      for (const name of Object.keys(s.sections)) {
        const mel = sectionMelody(s, name);
        const last = mel[mel.length - 1];
        const chord = s.sections[name][3];
        const pcs = [chord.bass, chord.v[0]].map((m) => m % 12);
        expect(pcs).toContain(last.midi % 12);
      }
    }
  });

  it("편곡은 형식대로 마디를 이어 붙인다", () => {
    const s = SONGS.force;
    const bars = arrange(s);
    expect(bars).toHaveLength(s.form.length * 4);
    expect(bars[0].section).toBe("A");
    expect(bars[8].section).toBe("B");
    expect(bars[0].melody).toEqual(bars[4].melody);
  });
});

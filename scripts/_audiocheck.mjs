// 배경음 오프라인 렌더(시대별 레벨·클리핑) + 실제 앱에서 화면 이탈 시 정지 확인
import { writeFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.QA_BASE_URL || "http://localhost:5179";
await mkdir(".tmp/audio", { recursive: true });
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__sfx);

const stats = await page.evaluate(async () => {
  const { Bgm } = await import("/src/audio/bgm.js");
  const { SONGS } = await import("/src/audio/songs.js");
  const out = {};
  const wavs = {};
  for (const era of Object.keys(SONGS)) {
    const bars = 8;
    const stepDur = 60 / SONGS[era].bpm / 4;
    const sec = bars * 16 * stepDur + 2;
    const ctx = new OfflineAudioContext(2, Math.ceil(44100 * sec), 44100);
    const master = ctx.createGain();
    master.gain.value = 0.49; // 기본 배경음 음량(0.7²)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    const b = new Bgm(ctx, master);
    b._load(era);
    b.fade.gain.value = 1;
    b.loops = 1; // 드럼 포함
    let t = 0.05;
    for (let i = 0; i < bars * 16; i += 1) {
      const step = i % 16;
      b.bar = Math.floor(i / 16) % b.bars.length;
      const swing = step % 2 === 1 ? b.song.swing * stepDur : 0;
      b._playStep(b.bars[b.bar], step, t + swing);
      t += stepDur;
    }
    const buf = await ctx.startRendering();
    const d = buf.getChannelData(0);
    let peak = 0; let sum = 0;
    for (let i = 0; i < d.length; i += 1) { const v = Math.abs(d[i]); if (v > peak) peak = v; sum += d[i] * d[i]; }
    out[era] = { sec: +sec.toFixed(1), peak: +peak.toFixed(3), rmsDb: +(10 * Math.log10(sum / d.length)).toFixed(1) };
    // 16bit WAV(사람이 들어볼 수 있게)
    const n = d.length; const r = buf.getChannelData(1);
    const ab = new ArrayBuffer(44 + n * 4); const v = new DataView(ab);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF"); v.setUint32(4, 36 + n * 4, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 44100 * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i += 1) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, d[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, r[i])) * 32767, true); }
    let bin = ""; const u8 = new Uint8Array(ab);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    wavs[era] = btoa(bin);
  }
  return { out, wavs };
});
for (const [era, b64] of Object.entries(stats.wavs)) await writeFile(`.tmp/audio/bgm-${era}.wav`, Buffer.from(b64, "base64"));

// 실제 앱: 첫 터치 → 배경음 재생 → 화면 숨김 → 컨텍스트 정지 → 복귀
await page.mouse.click(195, 300);
await page.waitForTimeout(600);
const live = {};
live.afterTap = await page.evaluate(() => ({ state: window.__sfx.ctx?.state, playing: window.__sfx.bgm?.playing, era: window.__sfx.bgm?.era }));
await page.evaluate(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
  document.dispatchEvent(new Event("visibilitychange"));
});
await page.waitForTimeout(300);
live.hidden = await page.evaluate(() => ({ state: window.__sfx.ctx?.state, playing: window.__sfx.bgm?.playing }));
await page.evaluate(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  document.dispatchEvent(new Event("visibilitychange"));
});
await page.waitForTimeout(400);
live.visible = await page.evaluate(() => ({ state: window.__sfx.ctx?.state, playing: window.__sfx.bgm?.playing }));
await page.evaluate(() => document.dispatchEvent(new CustomEvent("gp:app-pause")));
await page.waitForTimeout(200);
live.appPause = await page.evaluate(() => ({ state: window.__sfx.ctx?.state, playing: window.__sfx.bgm?.playing }));
await page.evaluate(() => document.dispatchEvent(new CustomEvent("gp:app-resume")));
await page.waitForTimeout(300);
live.appResume = await page.evaluate(() => ({ state: window.__sfx.ctx?.state, playing: window.__sfx.bgm?.playing }));
await page.evaluate(() => document.dispatchEvent(new CustomEvent("gp:audio-set", { detail: { bgm: false } })));
await page.waitForTimeout(400);
live.bgmOff = await page.evaluate(() => ({ playing: window.__sfx.bgm?.playing, saved: localStorage.getItem("gp-audio") }));
await browser.close();
console.log(JSON.stringify({ offline: stats.out, live, errors }, null, 2));

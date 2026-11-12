// 외부 파일 없이 Web Audio로 효과음·배경음을 합성한다(라이선스/로딩 부담 0). 첫 사용자 제스처에 컨텍스트 resume.
// 신호 흐름: 효과음 → sfx 버스 ┐
//            배경음 → bgm 버스 ┴→ 압축기 → 출력
// 화면에서 사라지면(탭 전환·홈 버튼·화면 꺼짐) 컨텍스트를 멈춰 소리를 완전히 끈다.
import { eraTheme } from "../data/regions.js";
import { Bgm } from "./bgm.js";
import { loadPrefs, savePrefs, volToGain } from "./audioPrefs.js";

export class Sfx {
  constructor(gameState) {
    this.gameState = gameState;
    this.ctx = null;
    this.prefs = loadPrefs();
    this.hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    this._prevArea = gameState.data.stage.area;
  }

  // 구버전 호환: 효과음·배경음이 모두 꺼져 있으면 음소거로 본다
  get muted() { return !this.prefs.bgm && !this.prefs.sfx; }

  _ensureCtx() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    this.ctx = ctx;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.ratio.value = 3;
    this.comp.connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.bgmBus = ctx.createGain();
    this.sfxBus.connect(this.comp);
    this.bgmBus.connect(this.comp);
    this._applyGains(true);
    this.bgm = new Bgm(ctx, this.bgmBus);
    return ctx;
  }

  _applyGains(instant = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const set = (node, v) => {
      node.gain.cancelScheduledValues(t);
      if (instant) node.gain.setValueAtTime(v, t);
      else { node.gain.setValueAtTime(node.gain.value, t); node.gain.linearRampToValueAtTime(v, t + 0.12); }
    };
    set(this.sfxBus, this.prefs.sfx ? volToGain(this.prefs.sfxVol) : 0);
    set(this.bgmBus, this.prefs.bgm ? volToGain(this.prefs.bgmVol) : 0);
  }

  mount() {
    const unlock = () => {
      const ctx = this._ensureCtx();
      if (!ctx || this.hidden) return;
      if (ctx.state === "suspended") ctx.resume().then(() => this._syncBgm()).catch(() => {});
      if (ctx.state === "running") {
        document.removeEventListener("pointerdown", unlock);
        this._syncBgm();
      }
    };
    document.addEventListener("pointerdown", unlock);

    // ── 화면 밖이면 무음 ──
    const onHidden = () => this._setHidden(true);
    const onVisible = () => this._setHidden(false);
    document.addEventListener("visibilitychange", () => (document.visibilityState === "hidden" ? onHidden() : onVisible()));
    window.addEventListener("pagehide", onHidden);
    window.addEventListener("pageshow", () => { if (document.visibilityState !== "hidden") onVisible(); });
    window.addEventListener("blur", () => { if (document.visibilityState === "hidden") onHidden(); });
    // Android 앱 pause/resume(native.js) — 웹뷰 visibilitychange 가 늦거나 빠지는 기기 대비
    document.addEventListener("gp:app-pause", onHidden);
    document.addEventListener("gp:app-resume", onVisible);

    this.gameState.on("ballots", () => this.play("tap"));
    this.gameState.on("upgraded", () => this.play("upgrade"));
    // 업적/콤보 마일스톤/특별 보상 등 축하 이벤트 → 팡파레
    this.gameState.on("celebrate", () => this.play("achieve"));
    this.gameState.on("dex-milestone", () => this.play("powerup")); // 도감 수집 보상 해금음
    this.gameState.on("changed", () => {
      const a = this.gameState.data.stage.area;
      if (a > this._prevArea) { this._prevArea = a; this.play("stage"); this._syncBgm(); }
      else if (a < this._prevArea) { this._prevArea = a; this._syncBgm(); }
    });
    document.addEventListener("gp:event-resolved", () => this.play("event"));
    // 범용 SFX 채널 — 어디서든 gp:sfx 디스패치로 사운드 트리거(골든/아이템/부스트 등)
    document.addEventListener("gp:sfx", (e) => this.play(e.detail));
    // 믿음 위기 진입 시 경고음(상태 전이 감지)
    this._prevTs = this.gameState.trustState ? this.gameState.trustState() : "normal";
    this.gameState.on("changed", () => {
      const ts = this.gameState.trustState ? this.gameState.trustState() : "normal";
      if (ts === "crisis" && this._prevTs !== "crisis") this.play("crisis");
      else if (ts === "bonus" && this._prevTs !== "bonus") this.play("bonus");
      this._prevTs = ts;
    });
    // 설정 화면: gp:audio-set { bgm?, bgmVol?, sfx?, sfxVol?, vibrate? }
    document.addEventListener("gp:audio-set", (e) => {
      this.setPrefs(e.detail || {});
      if (e.detail?.sfxVol !== undefined) this.play("upgrade"); // 음량 확인용 미리듣기
    });
    this._emitPrefs();
  }

  setPrefs(patch) {
    this.prefs = savePrefs({ ...this.prefs, ...patch });
    this._applyGains();
    this._syncBgm();
    this._emitPrefs();
  }

  _emitPrefs() {
    document.dispatchEvent(new CustomEvent("gp:audio-changed", { detail: { ...this.prefs } }));
  }

  _setHidden(h) {
    if (this.hidden === h) return;
    this.hidden = h;
    if (!this.ctx) return;
    if (h) {
      this.bgm?.stop(0.05);
      this.ctx.suspend().catch(() => {});
    } else {
      this.ctx.resume().then(() => this._syncBgm()).catch(() => {});
    }
  }

  _syncBgm() {
    if (!this.bgm) return;
    if (!this.prefs.bgm || this.hidden || this.ctx.state !== "running") { this.bgm.stop(); return; }
    this.bgm.play(eraTheme(this.gameState.data.stage.area || 1).key);
  }

  // 부드러운 단음: 사인/삼각파 기본, 약한 배음으로 또렷하게
  _tone(freq, start, dur, type = "triangle", peak = 0.18, glide = 0) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(freq * glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // 종소리 계열(기음 + 배음) — 보상·성공음
  _chime(freq, start, dur, peak) {
    this._tone(freq, start, dur, "sine", peak);
    this._tone(freq * 2, start, dur * 0.5, "sine", peak * 0.3);
    this._tone(freq * 3.01, start, dur * 0.25, "sine", peak * 0.12);
  }

  // 모바일 햅틱 — 설정의 '진동'과 연동
  _vibrate(name) {
    if (!this.prefs.vibrate || this.hidden || typeof navigator === "undefined" || !navigator.vibrate) return;
    const P = { achieve: [0, 25, 15, 25], stage: 40, crisis: [0, 50, 30, 50], coin: 20, powerup: 30, bonus: 25 };
    if (P[name] != null) { try { navigator.vibrate(P[name]); } catch { /* 미지원/거부 무시 */ } }
  }

  play(name) {
    this._vibrate(name);
    if (!this.prefs.sfx || this.hidden || !this.ctx || this.ctx.state !== "running") return;
    if (name === "tap") {
      // 짧은 '톡' — 콤보가 쌓일수록 음정이 올라간다(펜타토닉 계단)
      const c = this.gameState.clickCombo ? this.gameState.clickCombo() : 0;
      const steps = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      const f = 587 * 2 ** (steps[Math.min(steps.length - 1, Math.floor(c / 3))] / 12);
      this._tone(f, 0, 0.09, "sine", 0.13, 0.94);
      this._tone(f * 2, 0, 0.03, "triangle", 0.03);
    } else if (name === "coin") {
      // 골든 투표함/아이템 획득 — 밝은 띠링
      this._chime(1319, 0, 0.22, 0.1);
      this._chime(1760, 0.07, 0.34, 0.1);
    } else if (name === "crisis") {
      // 믿음 위기 — 낮게 내려가는 두 음(거슬리지 않게 삼각파)
      this._tone(330, 0, 0.26, "triangle", 0.14, 0.9);
      this._tone(262, 0.16, 0.36, "triangle", 0.13, 0.88);
    } else if (name === "powerup") {
      // 긴급 개표/브리핑 발동 — 상승 아르페지오
      [523, 659, 784, 1047].forEach((f, i) => this._chime(f, i * 0.055, 0.22, 0.08));
    } else if (name === "achieve") {
      // 업적/마일스톤 달성 — 밝은 상승 팡파레
      [784, 988, 1175].forEach((f, i) => this._chime(f, i * 0.08, 0.3, 0.09));
      this._chime(1568, 0.26, 0.5, 0.08);
    } else if (name === "bonus") {
      // 믿음 신뢰 보너스 진입 — 따뜻한 상승 화음
      this._chime(523, 0, 0.4, 0.1);
      this._chime(784, 0.1, 0.5, 0.09);
    } else if (name === "upgrade") {
      this._chime(880, 0, 0.16, 0.09);
      this._chime(1319, 0.06, 0.24, 0.08);
    } else if (name === "stage") {
      [523, 659, 784].forEach((f, i) => this._chime(f, i * 0.1, 0.32, 0.11));
      this._chime(1047, 0.3, 0.7, 0.11);
    } else if (name === "event") {
      this._tone(440, 0, 0.18, "triangle", 0.12);
      this._tone(587, 0.09, 0.26, "triangle", 0.11);
    }
  }
}

// 외부 파일 없이 Web Audio로 SFX를 합성한다(라이선스/로딩 부담 0). 첫 사용자 제스처에 컨텍스트 resume.
const MUTE_KEY = "gp-muted";

export class Sfx {
  constructor(gameState) {
    this.gameState = gameState;
    this.ctx = null;
    this.muted = localStorage.getItem(MUTE_KEY) === "1";
    this._prevArea = gameState.data.stage.area;
  }

  mount() {
    const resume = () => {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      // 컨텍스트가 실행되면 더 이상 필요 없으므로 리스너 자진 제거(누수 방지)
      if (this.ctx && this.ctx.state === "running") document.removeEventListener("pointerdown", resume);
    };
    document.addEventListener("pointerdown", resume);

    this.gameState.on("ballots", () => this.play("tap"));
    this.gameState.on("upgraded", () => this.play("upgrade"));
    this.gameState.on("changed", () => {
      const a = this.gameState.data.stage.area;
      if (a > this._prevArea) { this._prevArea = a; this.play("stage"); }
      else if (a < this._prevArea) this._prevArea = a;
    });
    document.addEventListener("gp:event-resolved", () => this.play("event"));
    // 범용 SFX 채널 — 어디서든 gp:sfx 디스패치로 사운드 트리거(골든/아이템/부스트 등)
    document.addEventListener("gp:sfx", (e) => this.play(e.detail));
    // 믿음 위기 진입 시 경고음(상태 전이 감지)
    this._prevTs = this.gameState.trustState ? this.gameState.trustState() : "normal";
    this.gameState.on("changed", () => {
      const ts = this.gameState.trustState ? this.gameState.trustState() : "normal";
      if (ts === "crisis" && this._prevTs !== "crisis") this.play("crisis");
      this._prevTs = ts;
    });
    document.addEventListener("gp:toggle-mute", () => {
      const m = this.toggleMuted();
      document.dispatchEvent(new CustomEvent("gp:mute-changed", { detail: m }));
    });
    document.dispatchEvent(new CustomEvent("gp:mute-changed", { detail: this.muted }));
  }

  setMuted(m) {
    this.muted = m;
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  }
  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  _tone(freq, start, dur, type = "triangle", peak = 0.18) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  play(name) {
    if (this.muted || !this.ctx || this.ctx.state !== "running") return;
    if (name === "tap") {
      // 클릭 콤보가 쌓일수록 음정이 올라가 손맛이 난다
      const c = this.gameState.clickCombo ? this.gameState.clickCombo() : 0;
      const bump = Math.min(10, Math.floor(c / 3)) * 42;
      this._tone(540 + bump + Math.random() * 60, 0, 0.07, "square", 0.08);
    } else if (name === "coin") {
      // 골든 투표함/아이템 획득 — 밝은 띠링
      this._tone(784, 0, 0.07, "square", 0.14);
      this._tone(1047, 0.06, 0.12, "square", 0.13);
    } else if (name === "crisis") {
      // 믿음 위기 — 낮고 불안한 경고음
      this._tone(196, 0, 0.18, "sawtooth", 0.14);
      this._tone(165, 0.1, 0.22, "sawtooth", 0.12);
    } else if (name === "powerup") {
      // 긴급 개표/브리핑 발동 — 상승 부스트
      this._tone(440, 0, 0.08, "square", 0.14);
      this._tone(659, 0.07, 0.1, "square", 0.14);
      this._tone(880, 0.15, 0.14, "square", 0.14);
    } else if (name === "upgrade") {
      this._tone(523, 0, 0.1, "triangle", 0.16);
      this._tone(784, 0.06, 0.14, "triangle", 0.16);
    } else if (name === "stage") {
      this._tone(523, 0, 0.12, "triangle", 0.2);
      this._tone(659, 0.1, 0.12, "triangle", 0.2);
      this._tone(988, 0.2, 0.22, "triangle", 0.22);
    } else if (name === "event") {
      this._tone(330, 0, 0.16, "sawtooth", 0.12);
      this._tone(247, 0.08, 0.18, "sawtooth", 0.1);
    }
  }
}

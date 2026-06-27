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
      // 컨텍스트가 실행되면 더 이상 필요 없으므로 리스너 자진 제거(누수 방지) + BGM 시작
      if (this.ctx && this.ctx.state === "running") {
        document.removeEventListener("pointerdown", resume);
        this.startBgm();
      }
    };
    document.addEventListener("pointerdown", resume);

    this.gameState.on("ballots", () => this.play("tap"));
    this.gameState.on("upgraded", () => this.play("upgrade"));
    // 업적/콤보 마일스톤/특별 보상 등 축하 이벤트 → 팡파레
    this.gameState.on("celebrate", () => this.play("achieve"));
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
      else if (ts === "bonus" && this._prevTs !== "bonus") this.play("bonus");
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
    if (m) this.stopBgm();
    else this.startBgm();
  }

  // 은은한 8비트 칩튠 루프(C 펜타토닉) — 저음량, mute 연동
  startBgm() {
    if (this._bgmTimer || this.muted || !this.ctx) return;
    const mel = [330, 392, 440, 392, 330, 294, 262, 294, 330, 392, 440, 523, 440, 392, 330, 294];
    const bass = [131, 131, 196, 174];
    this._bgmStep = 0;
    this._bgmTimer = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== "running") return;
      const s = this._bgmStep;
      this._tone(mel[s % mel.length], 0, 0.2, "square", 0.03);       // 멜로디(저음량)
      if (s % 4 === 0) this._tone(bass[(s / 4 | 0) % bass.length], 0, 0.42, "triangle", 0.045); // 베이스
      this._bgmStep = (s + 1) % 64;
    }, 300);
  }

  stopBgm() {
    if (this._bgmTimer) { clearInterval(this._bgmTimer); this._bgmTimer = null; }
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
    } else if (name === "achieve") {
      // 업적/마일스톤 달성 — 밝은 상승 팡파레
      this._tone(659, 0, 0.1, "square", 0.13);
      this._tone(880, 0.08, 0.1, "square", 0.13);
      this._tone(1175, 0.16, 0.18, "square", 0.14);
    } else if (name === "bonus") {
      // 믿음 신뢰 보너스 진입 — 따뜻한 상승 화음
      this._tone(523, 0, 0.14, "triangle", 0.16);
      this._tone(784, 0.1, 0.18, "triangle", 0.16);
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

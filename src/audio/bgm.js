// 배경음 연주기 — songs.js 악보를 Web Audio 로 합성한다. 미리보기(lookahead) 스케줄러로 박자가 흔들리지 않고,
// 일렉 피아노·마림바·벨·플루트·하프·패드·베이스·드럼을 부드러운 사인/삼각파 + 저역 통과 + 잔향으로 만든다.
import { SONGS, COMP, BASS, DRUMS, arrange, midiToFreq } from "./songs.js";

const LOOKAHEAD = 0.3; // 초
const TICK_MS = 60;

export class Bgm {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.timer = null;
    this.era = null;
    // 곡 버스: 음원 → 따뜻한 저역 통과 → (드라이 + 잔향) → 페이드 게인 → out
    this.fade = ctx.createGain();
    this.fade.gain.value = 0;
    this.fade.connect(out);
    this.tone = ctx.createBiquadFilter();
    this.tone.type = "lowpass";
    this.tone.frequency.value = 5200;
    this.tone.Q.value = 0.4;
    this.dry = ctx.createGain();
    this.dry.gain.value = 0.82;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.3;
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(2.4);
    this.tone.connect(this.dry).connect(this.fade);
    this.tone.connect(this.verb).connect(this.wet).connect(this.fade);
    this.bus = this.tone;
    this.noise = this._noiseBuffer();
  }

  // ── 재생 제어 ──
  play(era) {
    const key = SONGS[era] ? era : "force";
    if (this.timer && key === this.era) return;
    if (this.timer && key !== this.era) { this._crossTo(key); return; }
    this._load(key);
    this.nextTime = this.ctx.currentTime + 0.12;
    this.step = 0;
    this.bar = 0;
    this.loops = 0;
    this._fadeTo(1, 1.6);
    this.timer = setInterval(() => this._schedule(), TICK_MS);
    this._schedule();
  }

  stop(fade = 0.25) {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this._fadeTo(0, fade);
  }

  get playing() { return !!this.timer; }

  _load(key) {
    this.era = key;
    this.song = SONGS[key];
    this.bars = arrange(this.song);
    this.stepDur = 60 / this.song.bpm / 4;
  }

  _crossTo(key) {
    // 시대가 바뀌면 지금 곡을 줄이고 새 곡 첫 마디부터
    this._fadeTo(0, 1.2);
    clearTimeout(this._crossTimer);
    this._crossTimer = setTimeout(() => {
      if (!this.timer) return;
      this._load(key);
      this.nextTime = this.ctx.currentTime + 0.1;
      this.step = 0;
      this.bar = 0;
      this.loops = 0;
      this._fadeTo(1, 1.6);
    }, 1300);
  }

  _fadeTo(v, sec) {
    const g = this.fade.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(v, t + sec);
  }

  _schedule() {
    const ctx = this.ctx;
    if (ctx.state !== "running") return;
    // 탭이 오래 멈췄다 돌아오면 밀린 음을 몰아 치지 않고 지금부터 이어 간다
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      const swing = this.step % 2 === 1 ? this.song.swing * this.stepDur : 0;
      this._playStep(this.bars[this.bar], this.step, this.nextTime + swing);
      this.nextTime += this.stepDur;
      this.step += 1;
      if (this.step >= 16) {
        this.step = 0;
        this.bar += 1;
        if (this.bar >= this.bars.length) { this.bar = 0; this.loops += 1; }
      }
    }
  }

  _playStep(bar, step, t) {
    const s = this.song;
    const sd = this.stepDur;
    const { chord } = bar;
    const intro = this.loops === 0 && this.bar < 2;
    // 반주
    if (s.comp === "pad") {
      if (step === 0) this.pad(chord.v, t, sd * 16);
    } else if (s.comp === "arp") {
      const v = chord.v;
      const order = [0, 1, 2, 3, 2, 1];
      const m = v[order[step % order.length]] + 12;
      this.pluck(midiToFreq(m), t, sd * 1.6, step % 4 === 0 ? 0.5 : 0.32);
      if (step === 0) this.pad(chord.v, t, sd * 16, 0.45);
    } else if (s.comp === "harp") {
      if (step % 2 === 0) {
        // 화음을 한 옥타브 올라갔다 내려오는 아르페지오
        const seq = [...chord.v, ...chord.v.map((m) => m + 12)];
        const m = seq[[0, 1, 2, 3, 4, 3, 2, 1][step / 2]];
        this.harp(midiToFreq(m), t, step === 0 ? 0.5 : 0.36);
      }
    } else {
      (COMP[s.comp] || COMP.lofi).forEach(([st, len, vel]) => {
        if (st === step) chord.v.forEach((m, i) => this.epiano(midiToFreq(m), t + i * 0.008, sd * len, vel * 0.9));
      });
    }
    // 베이스
    (BASS[s.bass] || BASS.lofi).forEach(([st, len, iv]) => {
      if (st === step) this.bass(midiToFreq(chord.bass + iv), t, sd * len);
    });
    // 드럼(첫 두 마디는 비워 부드럽게 들어간다)
    const d = DRUMS[s.drums];
    if (d && !intro) {
      if (d.kick.includes(step)) this.kick(t);
      if (d.rim.includes(step)) this.rim(t);
      if (d.hat.includes(step)) this.hat(t, d.hatVel * (step % 4 === 2 ? 1 : 0.6));
    }
    // 선율
    bar.melody.forEach((n) => {
      if (n.step !== step) return;
      const f = midiToFreq(n.midi);
      const dur = sd * n.len;
      if (s.lead === "marimba") this.marimba(f, t, 0.5);
      else if (s.lead === "bell") this.bell(f, t, 0.42);
      else if (s.lead === "flute") this.flute(f, t, dur);
      else this.synthLead(f, t, dur);
    });
  }

  // ── 악기 ──
  _env(g, t, peak, attack, dur, release = 0.12) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.35), t + Math.max(attack + 0.01, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  }

  _osc(type, freq, t, end, dest, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (detune) o.detune.setValueAtTime(detune, t);
    o.connect(dest);
    o.start(t);
    o.stop(end);
    return o;
  }

  // 일렉 피아노: 사인 기음 + 2배음, 짧은 금속성 티네
  epiano(f, t, dur, vel = 0.7) {
    const g = this.ctx.createGain();
    g.connect(this.bus);
    const peak = 0.05 * vel;
    this._env(g, t, peak, 0.006, Math.min(dur, 1.2), 0.25);
    this._osc("sine", f, t, t + dur + 0.4, g);
    const g2 = this.ctx.createGain();
    g2.connect(this.bus);
    this._env(g2, t, peak * 0.32, 0.004, 0.18, 0.1);
    this._osc("sine", f * 2, t, t + 0.4, g2);
    const g3 = this.ctx.createGain();
    g3.connect(this.bus);
    g3.gain.setValueAtTime(peak * 0.12, t);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    this._osc("sine", f * 7.1, t, t + 0.08, g3);
  }

  marimba(f, t, vel = 0.5) {
    const g = this.ctx.createGain();
    g.connect(this.bus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    this._osc("sine", f, t, t + 0.6, g);
    const h = this.ctx.createGain();
    h.connect(this.bus);
    h.gain.setValueAtTime(0.045 * vel, t);
    h.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    this._osc("sine", f * 3.93, t, t + 0.1, h);
  }

  bell(f, t, vel = 0.42) {
    const g = this.ctx.createGain();
    g.connect(this.bus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.08 * vel, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    this._osc("sine", f, t, t + 1.5, g);
    const h = this.ctx.createGain();
    h.connect(this.bus);
    h.gain.setValueAtTime(0.03 * vel, t);
    h.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    this._osc("sine", f * 2.76, t, t + 0.55, h);
  }

  flute(f, t, dur) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = f * 3;
    lp.connect(this.bus);
    g.connect(lp);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.06);
    g.gain.setValueAtTime(0.045, t + Math.max(0.07, dur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.18);
    const o = this._osc("triangle", f, t, t + dur + 0.2, g);
    // 살짝 늦게 들어오는 비브라토
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(f * 0.006, t + 0.25);
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.2);
  }

  synthLead(f, t, dur) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(f * 6, t);
    lp.frequency.exponentialRampToValueAtTime(f * 2, t + 0.3);
    lp.connect(this.bus);
    g.connect(lp);
    this._env(g, t, 0.028, 0.01, dur, 0.15);
    this._osc("sawtooth", f, t, t + dur + 0.2, g, -6);
    this._osc("sawtooth", f, t, t + dur + 0.2, g, 6);
  }

  pluck(f, t, dur, vel = 0.4) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3200, t);
    lp.frequency.exponentialRampToValueAtTime(700, t + 0.15);
    lp.connect(this.bus);
    g.connect(lp);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.04 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    this._osc("square", f, t, t + dur + 0.02, g);
  }

  harp(f, t, vel = 0.4) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(f * 5, t);
    lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.4);
    lp.connect(this.bus);
    g.connect(lp);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09 * vel, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    this._osc("triangle", f, t, t + 1.7, g);
  }

  pad(notes, t, dur, vel = 1) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.connect(this.bus);
    g.connect(lp);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.018 * vel, t + Math.min(0.8, dur * 0.3));
    g.gain.setValueAtTime(0.018 * vel, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    notes.forEach((m) => {
      const f = midiToFreq(m);
      this._osc("sawtooth", f, t, t + dur + 0.7, g, -7);
      this._osc("sawtooth", f, t, t + dur + 0.7, g, 7);
    });
  }

  bass(f, t, dur) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(320, t + 0.2);
    lp.connect(this.bus);
    g.connect(lp);
    this._env(g, t, 0.13, 0.008, Math.min(dur, 0.9), 0.08);
    this._osc("triangle", f, t, t + dur + 0.1, g);
    this._osc("sine", f, t, t + dur + 0.1, g);
  }

  kick(t) {
    const g = this.ctx.createGain();
    g.connect(this.bus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    const o = this._osc("sine", 120, t, t + 0.3, g);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
  }

  rim(t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1900;
    bp.Q.value = 1.4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(bp).connect(g).connect(this.bus);
    src.start(t, Math.random() * 0.5, 0.09);
  }

  hat(t, vel = 0.5) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.026 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    src.connect(hp).connect(g).connect(this.bus);
    src.start(t, Math.random() * 0.5, 0.06);
  }

  _noiseBuffer() {
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _impulse(sec) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * sec);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch += 1) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    return buf;
  }
}

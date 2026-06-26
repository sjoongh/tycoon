import { WorldEffects } from "./WorldEffects.js";
import { govTextureKey, govStageFor } from "./dotChar.js";
import { staffDefinitions } from "../data/staff.js";
import { shortNumber } from "../utils/format.js";

// 거지키우기식 심플 월드: 미니멀 픽셀 배경 + 중앙 도트 국장 + 큰 숫자 + 바닥.
// (구 버전의 이소 오피스 다이어그램·화분·시계·창문·워커·시설 스테이션은 전부 제거)
const GAME_W = 390;
const GROUND_Y = 492;   // 국장 발이 닿는 바닥선
const GOV_SCALE = 6;    // 16px 도트 → 96px 표시
const GOV_BOB_MS = 900;
const PROP_SCALE = 4;   // 16px 소품 → 64px
// 채용된 직원이 서는 바닥 슬롯(좌우로 고루 분산)
const WORKER_SLOTS = [44, 96, 148, 244, 296, 344];
const WORKER_SCALE = 4;

// 어두운 직원 색이 다크 배경에 묻히지 않도록 밝게 보정(amt 0~1)
function lightenColor(hex, amt) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const lr = Math.round(r + (255 - r) * amt);
  const lg = Math.round(g + (255 - g) * amt);
  const lb = Math.round(b + (255 - b) * amt);
  return (lr << 16) | (lg << 8) | lb;
}

export class WorldView {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;

    this._buildBackground();
    this._buildTitle();
    this._buildProps();

    // 중앙 도트 국장
    this.gov = scene.add
      .image(GAME_W / 2, GROUND_Y, govTextureKey(gameState.data))
      .setOrigin(0.5, 1)
      .setScale(GOV_SCALE)
      .setDepth(100);
    this._govStage = govStageFor(gameState.data);
    this._startBob();

    // 중앙 큰 숫자(개표수) — 한글 단위 지원 위해 Galmuri14
    this.bigNum = scene.add
      .text(GAME_W / 2, 312, "0", { fontFamily: '"Galmuri14", monospace', fontSize: "30px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(120);
    this.bigNum.setShadow(3, 3, "#b13e53", 0, true, true);
    this.bigSub = scene.add
      .text(GAME_W / 2, 346, "표", { fontFamily: '"Galmuri11", monospace', fontSize: "12px", color: "#ffcd75" })
      .setOrigin(0.5)
      .setDepth(120);
    this.cpsText = scene.add
      .text(GAME_W / 2, GROUND_Y + 22, "", {
        fontFamily: '"Galmuri9", monospace', fontSize: "11px", color: "#bcd0e0",
        backgroundColor: "rgba(20,18,28,0.72)", padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(120);

    // 클릭 콤보 카운터(연타 시 등장)
    this.comboText = scene.add
      .text(GAME_W / 2, 286, "", { fontFamily: '"Galmuri14", monospace', fontSize: "15px", color: "#ffcd75" })
      .setOrigin(0.5)
      .setDepth(121)
      .setVisible(false);
    this.comboText.setShadow(2, 2, "#000", 0, true, true);
    this._comboN = 0;
    this._comboLast = 0;

    this.effects = new WorldEffects(scene);
    this._workers = {}; // 채용된 직원 도트(staffId → sprite)
    this._workerShadows = {};

    this._onChanged = () => this._refresh();
    this._onFloat = (p) => this.effects.float(p);
    this._onBallots = (p) => this.effects.ballots(p);
    this._onUpgraded = () => this._squishGov();
    gameState.on("changed", this._onChanged);
    gameState.on("float", this._onFloat);
    gameState.on("ballots", this._onBallots);
    gameState.on("upgraded", this._onUpgraded);

    // 캔버스에 도달한 빈 공간 탭만 득표로 처리(하단 DOM 패널은 자체 처리)
    this._onPointer = (pointer, currentlyOver) => {
      if (currentlyOver && currentlyOver.length) return;
      gameState.processClick(pointer.x, pointer.y);
      this._squishGov();
      this._punchNum();
      this._bumpCombo();
      this.effects.deskPop(GAME_W / 2, GROUND_Y - 30);
    };
    scene.input.on("pointerdown", this._onPointer);

    // 패시브 수입 가시화: 국장 위로 주기적 +표 플로팅
    this._incomeTimer = scene.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        const inc = this.gameState.cps ? this.gameState.cps() : 0;
        if (inc > 0) {
          const x = GAME_W / 2 + (Math.random() * 120 - 60);
          this.effects.float({ text: `+${shortNumber(inc)}`, x, y: GROUND_Y - 76, color: "#7fb98a" });
          // 패시브 투표용지 흩날림(생동감)
          if (Math.random() < 0.6) this.effects.ballots({ x: GAME_W / 2 + (Math.random() * 170 - 85), y: 360, count: 2 });
        }
      },
    });

    this._refresh();
    this._scheduleGolden(45000 + Math.random() * 30000);
    // 웹폰트(Galmuri) 로드 완료 후 캔버스 텍스트 재렌더(첫 프레임 폰트 미적용 방지)
    document.fonts?.ready?.then(() => this._refresh());
  }

  _buildBackground() {
    const g = this.scene.add.graphics().setDepth(0);
    // 하늘(상단 어두운 밴드)
    g.fillStyle(0x1a1c2c, 1);
    g.fillRect(0, 0, GAME_W, GROUND_Y);
    // 별 도트(정적)
    const stars = [[40, 150], [92, 206], [150, 138], [300, 168], [342, 224], [212, 184], [70, 262], [330, 300], [120, 308], [262, 250]];
    g.fillStyle(0x2a2f55, 1);
    stars.forEach(([x, y]) => g.fillRect(x, y, 3, 3));
    g.fillStyle(0x3a4a8a, 1);
    g.fillRect(60, 182, 2, 2);
    g.fillRect(280, 140, 2, 2);
    g.fillRect(180, 230, 2, 2);
    // 바닥
    g.fillStyle(0x20243f, 1);
    g.fillRect(0, GROUND_Y, GAME_W, 844 - GROUND_Y);
    g.fillStyle(0x000000, 1);
    g.fillRect(0, GROUND_Y, GAME_W, 3);
    g.fillStyle(0x333c57, 1);
    g.fillRect(0, GROUND_Y + 3, GAME_W, 2);
    // 바닥 원근 라인
    g.fillStyle(0x2a3050, 1);
    for (let i = 1; i <= 4; i++) {
      const y = GROUND_Y + 12 + i * i * 6;
      g.fillRect(0, y, GAME_W, 1);
    }
    // 국장 발밑 그림자
    g.fillStyle(0x0a0a12, 0.5);
    g.fillRect(GAME_W / 2 - 30, GROUND_Y - 4, 60, 6);
    this.bg = g;
  }

  // 상단 간판: "믿어주세요 / 개표국"
  _buildTitle() {
    const cx = GAME_W / 2;
    const w = 300, h = 46, top = 214, x = cx - w / 2;
    const g = this.scene.add.graphics().setDepth(110);
    // 현수막 끈
    g.fillStyle(0x14121c, 1);
    g.fillRect(x + 18, top - 12, 3, 14);
    g.fillRect(x + w - 21, top - 12, 3, 14);
    // 외곽 + 본체
    g.fillStyle(0x000000, 1);
    g.fillRect(x - 3, top - 3, w + 6, h + 6);
    g.fillStyle(0x29366f, 1);
    g.fillRect(x, top, w, h);
    g.fillStyle(0x3b5dc9, 1);
    g.fillRect(x, top, w, 4);
    g.fillStyle(0x1f2750, 1);
    g.fillRect(x, top + h - 5, w, 5);
    // 모서리 못(금색)
    g.fillStyle(0xffcd75, 1);
    g.fillRect(x + 5, top + 5, 4, 4);
    g.fillRect(x + w - 9, top + 5, 4, 4);
    g.fillRect(x + 5, top + h - 9, 4, 4);
    g.fillRect(x + w - 9, top + h - 9, 4, 4);
    this.titleBg = g;
    this.titleTop = this.scene.add
      .text(cx, top + 14, "믿어주세요", { fontFamily: '"Galmuri11", monospace', fontSize: "11px", color: "#94b0c2" })
      .setOrigin(0.5)
      .setDepth(111);
    this.titleMain = this.scene.add
      .text(cx, top + 31, "개 표 국", { fontFamily: '"Galmuri14", monospace', fontSize: "19px", color: "#ffe3a8" })
      .setOrigin(0.5)
      .setDepth(111);
  }

  // 국장 주변 개표소 소품(투표함/서류더미/깃발)
  _buildProps() {
    this.props = [];
    const place = (key, px, depth) => {
      const s = this.scene.add.image(px, GROUND_Y, key).setOrigin(0.5, 1).setScale(PROP_SCALE).setDepth(depth);
      this.props.push(s);
      return s;
    };
    place("prop-flag", 250, 90);        // 캐릭터 뒤(우측) 깃발
    place("prop-ballotbox", 84, 95);    // 좌측 투표함
    place("prop-papers", 306, 96);      // 우측 서류더미
  }

  _startBob() {
    this.gov.y = GROUND_Y;
    this._govBob = this.scene.tweens.add({
      targets: this.gov,
      y: GROUND_Y - 4,
      yoyo: true,
      repeat: -1,
      duration: GOV_BOB_MS,
      ease: "Sine.easeInOut",
    });
  }

  _punchNum() {
    this.scene.tweens.killTweensOf(this.bigNum);
    this.bigNum.setScale(1);
    this.scene.tweens.add({ targets: this.bigNum, scale: 1.22, yoyo: true, duration: 90, ease: "Quad.easeOut" });
  }

  _bumpCombo() {
    const now = this.scene.time.now;
    if (now - this._comboLast < 500) this._comboN += 1;
    else this._comboN = 1;
    this._comboLast = now;
    if (this._comboN >= 3) {
      this.comboText.setText(`${this._comboN} 콤보!`).setVisible(true).setScale(1);
      this.scene.tweens.killTweensOf(this.comboText);
      this.scene.tweens.add({ targets: this.comboText, scale: 1.3, yoyo: true, duration: 100, ease: "Quad.easeOut" });
      this._comboTimer?.remove();
      this._comboTimer = this.scene.time.delayedCall(800, () => { this.comboText.setVisible(false); this._comboN = 0; });
    }
  }

  _squishGov() {
    this.scene.tweens.killTweensOf(this.gov);
    this.gov.setScale(GOV_SCALE);
    this.gov.y = GROUND_Y;
    this.scene.tweens.add({
      targets: this.gov,
      scaleX: GOV_SCALE * 1.08,
      scaleY: GOV_SCALE * 0.92,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => { if (this.gov && this.gov.active) this._startBob(); },
    });
  }

  // ---- 필드 황금 투표함(액티브 손맛) — 유지 ----
  _scheduleGolden(delay) {
    this._goldenTimer?.remove();
    this._goldenTimer = this.scene.time.delayedCall(delay, () => this._spawnGolden());
  }

  _spawnGolden() {
    if (this._golden) return;
    const x = 70 + Math.random() * 250;
    const y = 180 + Math.random() * 200;
    const key = "decor/ballotbox";
    const halo = this.scene.add.image(x, y, key).setDepth(4999).setTint(0xffe9a8).setAlpha(0.3).setScale(1.5);
    this._goldenHalo = halo;
    this._goldenHaloPulse = this.scene.tweens.add({ targets: halo, scale: 1.9, alpha: 0.1, yoyo: true, repeat: -1, duration: 850, ease: "Sine.easeInOut" });

    const disc = this.scene.add.image(x, y, key).setDepth(5000).setTint(0xffd000).setInteractive({ useHandCursor: true });
    this._golden = disc;
    disc.setScale(0.3).setAlpha(0);
    this.scene.tweens.add({ targets: disc, scale: 0.95, alpha: 1, duration: 280, ease: "Back.easeOut" });
    this._goldenPulse = this.scene.tweens.add({ targets: disc, scale: 1.08, yoyo: true, repeat: -1, duration: 560, ease: "Sine.easeInOut", delay: 290 });
    disc.on("pointerdown", () => {
      if (!this._golden) return;
      const reward = this.gameState.collectGoldenBallot();
      this.effects.float({ text: `+${shortNumber(reward)}`, x, y: y - 28, color: "#ffd34d" });
      this.effects.deskPop(x, y);
      this._despawnGolden();
      this._scheduleGolden(60000 + Math.random() * 60000);
    });
    this._goldenLife = this.scene.time.delayedCall(9000, () => {
      this._despawnGolden();
      this._scheduleGolden(60000 + Math.random() * 60000);
    });
  }

  _despawnGolden() {
    if (this._goldenPulse) { this._goldenPulse.stop(); this._goldenPulse = null; }
    if (this._goldenHaloPulse) { this._goldenHaloPulse.stop(); this._goldenHaloPulse = null; }
    if (this._goldenLife) { this._goldenLife.remove(); this._goldenLife = null; }
    for (const k of ["_golden", "_goldenHalo"]) {
      if (this[k]) { this.scene.tweens.killTweensOf(this[k]); this[k].destroy(); this[k] = null; }
    }
  }

  // 채용된 직원을 바닥에 도트 일꾼으로 등장시킨다(직원별 색, 등장 팝 + bob).
  _syncWorkers() {
    staffDefinitions.forEach((s, i) => {
      if (i >= WORKER_SLOTS.length) return;
      const lv = this.gameState.staffLevel ? this.gameState.staffLevel(s.id) : 0;
      if (lv > 0 && !this._workers[s.id]) {
        const sx = WORKER_SLOTS[i];
        const sh = this.scene.add.rectangle(sx, GROUND_Y + 1, 34, 8, 0x000000, 0.4).setDepth(98);
        this._workerShadows[s.id] = sh;
        const w = this.scene.add.image(sx, GROUND_Y, "worker-mini")
          .setOrigin(0.5, 1).setScale(0).setDepth(99).setTint(lightenColor(s.color || 0xffffff, 0.35));
        this._workers[s.id] = w;
        this.scene.tweens.add({ targets: w, scaleX: WORKER_SCALE, scaleY: WORKER_SCALE, duration: 280, ease: "Back.easeOut" });
        this.scene.tweens.add({ targets: w, y: GROUND_Y - 3, yoyo: true, repeat: -1, duration: 640 + i * 70, ease: "Sine.easeInOut", delay: 120 + i * 90 });
        this.effects.deskPop(sx, GROUND_Y - 14);
      }
    });
  }

  _refresh() {
    const d = this.gameState.data;
    const st = govStageFor(d);
    if (st !== this._govStage) {
      this._govStage = st;
      this.gov.setTexture(`gov-${st}`);
    }
    this.bigNum.setText(shortNumber(d.votes));
    const cps = this.gameState.cps ? this.gameState.cps() : 0;
    this.cpsText.setText(`▶ 초당 ${cps < 10000 ? cps.toFixed(0) : shortNumber(cps)}표`);
    this._syncWorkers();
  }

  update() {
    // bob/연출은 트윈으로 처리 — 프레임 루프 작업 없음
  }

  destroy() {
    this.gameState.off("changed", this._onChanged);
    this.gameState.off("float", this._onFloat);
    this.gameState.off("ballots", this._onBallots);
    this.gameState.off("upgraded", this._onUpgraded);
    this.scene.input.off("pointerdown", this._onPointer);
    this._incomeTimer?.remove();
    this._goldenTimer?.remove();
    this._comboTimer?.remove();
    this._despawnGolden();
    this.scene.tweens.killTweensOf(this.gov);
    this.gov?.destroy();
    this.bigNum?.destroy();
    this.bigSub?.destroy();
    this.cpsText?.destroy();
    this.comboText?.destroy();
    this.bg?.destroy();
    this.titleBg?.destroy();
    this.titleTop?.destroy();
    this.titleMain?.destroy();
    (this.props || []).forEach((p) => p.destroy());
    Object.values(this._workers || {}).forEach((w) => { this.scene.tweens.killTweensOf(w); w.destroy(); });
    Object.values(this._workerShadows || {}).forEach((s) => s.destroy());
    this.effects.destroy();
  }
}

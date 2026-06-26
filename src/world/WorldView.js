import { WorldEffects } from "./WorldEffects.js";
import { govTextureKey, govStageFor } from "./dotChar.js";
import { staffDefinitions } from "../data/staff.js";
import { eraTheme } from "../data/regions.js";
import { pickRandomItem } from "../data/items.js";
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
const SORTER_SCALE = 2.8; // 국장 앞 개표대(분류기) — 국장 가리지 않게 작게
// 국장 풍자 대사(선관위 이슈 위트, 정치 중립)
const GOV_LINES = [
  "한 표만 믿어주세요!", "분류기는 정상입니다.", "소쿠리는 이제 그만…",
  "수검표 환영합니다.", "CCTV 다 공개할게요.", "야근 수당은 대체…",
  "재검표… 또요?", "비둘기 좀 내보내!", "이번엔 깔끔하게.",
  "보안점검 받겠습니다.", "아빠 찬스 아닙니다.", "통계는 통계일 뿐!",
];

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
    this._onUpgraded = (facility) => { this._squishGov(); this._pulseProp(facility); };
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
        // 일꾼이 일하는 반짝임(랜덤 1명 머리 위)
        const wk = Object.values(this._workers);
        if (wk.length) { const r = wk[(Math.random() * wk.length) | 0]; this.effects.deskPop(r.x, r.y - 28); }
      },
    });

    // 국장 idle 제스처(가끔 점프하며 표 던지기) — 정적이지 않게
    this._govIdleTimer = scene.time.addEvent({
      delay: 4500, loop: true,
      callback: () => { if (this.gov?.active && Math.random() < 0.5) this._govGesture(); },
    });
    // 국장 풍자 대사(가끔)
    this._speakTimer = scene.time.addEvent({
      delay: 9000, loop: true,
      callback: () => { if (this.gov?.active && Math.random() < 0.5) this._govSpeak(); },
    });

    this._refresh();
    this._scheduleGolden(45000 + Math.random() * 30000);
    this._scheduleItem(25000 + Math.random() * 20000);
    // 웹폰트(Galmuri) 로드 완료 후 캔버스 텍스트 재렌더(첫 프레임 폰트 미적용 방지)
    document.fonts?.ready?.then(() => this._refresh());
  }

  // 체제 시대별 색 팔레트 — 무력(군부 카키) → 적색(공산 적색) → 민주(청명) → 미래(우주)
  _eraColors(area) {
    const k = eraTheme(area).key;
    if (k === "force") return { sky: 0x262216, floor: 0x302a1a, star: 0x6a5a2a, line: 0x3a3420, accent: 0xb13e53 };
    if (k === "red") return { sky: 0x3a1418, floor: 0x3e1a1e, star: 0xd14a5e, line: 0x4a1e24, accent: 0xff4d4d };
    if (k === "demo") return { sky: 0x14283a, floor: 0x1c3348, star: 0x6ad0e0, line: 0x244055, accent: 0x73eff7 };
    return { sky: 0x0a0a16, floor: 0x12122a, star: 0x5a5aaa, line: 0x1a1a3a, accent: 0xffd34d }; // future
  }

  _buildBackground() {
    this.bg = this.scene.add.graphics().setDepth(0);
    this._eraArea = this.gameState.data.stage.area;
    this._drawBackground(this._eraArea);
  }

  _drawBackground(area) {
    const c = this._eraColors(area);
    const key = eraTheme(area).key;
    const g = this.bg;
    g.clear();
    // 하늘
    g.fillStyle(c.sky, 1);
    g.fillRect(0, 0, GAME_W, GROUND_Y);
    // 별
    const stars = [[40, 150], [92, 206], [150, 138], [300, 168], [342, 224], [212, 184], [70, 262], [330, 300], [120, 308], [262, 250]];
    g.fillStyle(c.star, 1);
    stars.forEach(([x, y]) => g.fillRect(x, y, 3, 3));

    // ── 체제 상징물 ──
    if (key === "force") {
      // 서치라이트 빔 + 상단 경계선
      g.fillStyle(0xfff4cf, 0.05);
      g.fillTriangle(70, 0, 30, GROUND_Y, 150, GROUND_Y);
      g.fillTriangle(322, 0, 250, GROUND_Y, 388, GROUND_Y);
      g.fillStyle(0x000000, 0.3);
      g.fillRect(0, 44, GAME_W, 3);
    } else if (key === "red") {
      // 공산 별(빨강 원 + 금테) + 작은 별점
      g.fillStyle(0xffcd75, 0.5); g.fillCircle(62, 112, 18);
      g.fillStyle(0xff2d2d, 0.9); g.fillCircle(62, 112, 13);
      g.fillStyle(0xffcd75, 0.55);
      [[200, 92], [302, 140], [150, 206], [256, 196]].forEach(([x, y]) => g.fillRect(x, y, 4, 4));
    } else if (key === "demo") {
      // 떠 있는 풍선(투표 축제)
      [[80, 132, 0x73eff7], [300, 110, 0xffcd75], [212, 168, 0xef7d57]].forEach(([x, y, col]) => {
        g.fillStyle(col, 0.4); g.fillCircle(x, y, 9);
        g.fillStyle(col, 0.55); g.fillRect(x, y + 9, 1, 14);
      });
    } else {
      // 미래/우주: 추가 별 + 행성
      g.fillStyle(0xffffff, 1);
      [[60, 120], [200, 100], [320, 130], [100, 180], [280, 210], [160, 250]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
      g.fillStyle(0xef7d57, 1); g.fillRect(306, 142, 12, 12);
      g.fillStyle(0xffcd75, 1); g.fillRect(308, 142, 4, 12);
    }

    // 바닥
    g.fillStyle(c.floor, 1);
    g.fillRect(0, GROUND_Y, GAME_W, 844 - GROUND_Y);
    g.fillStyle(0x000000, 1);
    g.fillRect(0, GROUND_Y, GAME_W, 3);
    g.fillStyle(0x333c57, 1);
    g.fillRect(0, GROUND_Y + 3, GAME_W, 2);
    g.fillStyle(c.line, 1);
    for (let i = 1; i <= 4; i++) {
      const y = GROUND_Y + 12 + i * i * 6;
      g.fillRect(0, y, GAME_W, 1);
    }
    // 국장 발밑 그림자
    g.fillStyle(0x0a0a12, 0.5);
    g.fillRect(GAME_W / 2 - 30, GROUND_Y - 4, 60, 6);
  }

  // 구역이 바뀌면 배경/깃발 전환 + 화면 플래시
  _applyEra(area) {
    if (area === this._eraArea) return;
    const prevKey = eraTheme(this._eraArea).key;
    this._eraArea = area;
    this._drawBackground(area);
    const f = this.scene.add.rectangle(GAME_W / 2, 422, GAME_W, 844, 0xffffff, 0.5).setDepth(200);
    this.scene.tweens.add({ targets: f, alpha: 0, duration: 420, ease: "Quad.easeOut", onComplete: () => f.destroy() });
    // 체제가 바뀌는 순간엔 배너 토스트
    if (eraTheme(area).key !== prevKey) {
      const t = eraTheme(area);
      this.effects.float({ text: `${t.icon} ${t.name} 돌입`, x: GAME_W / 2, y: 150, color: "#ffe3a8" });
    }
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
    // 간판 아래 "지도" 힌트 + 클릭 영역(탭하면 전국 지도 모달)
    this.titleHint = this.scene.add
      .text(cx, top + h + 9, "🗺 전국 지도", { fontFamily: '"Galmuri9", monospace', fontSize: "10px", color: "#9fb8d0" })
      .setOrigin(0.5)
      .setDepth(111);
    this.scene.tweens.add({ targets: this.titleHint, alpha: 0.5, yoyo: true, repeat: -1, duration: 900, ease: "Sine.easeInOut" });
    this.titleZone = this.scene.add
      .zone(cx, top + (h + 22) / 2, w, h + 26)
      .setInteractive({ useHandCursor: true });
    this.titleZone.on("pointerup", () => document.dispatchEvent(new CustomEvent("gp:open-map")));
  }

  // 국장 주변 개표소 소품(투표함/서류더미/깃발)
  _buildProps() {
    this.props = [];
    const place = (key, px, depth) => {
      const s = this.scene.add.image(px, GROUND_Y, key).setOrigin(0.5, 1).setScale(PROP_SCALE).setDepth(depth);
      this.props.push(s);
      return s;
    };
    // 의미있는 선관위 장비로: 접수 투표함 · 기록 서류더미 · 개표 상황판(전광판)
    this.board = place("prop-board", 250, 90);      // 캐릭터 뒤 개표 상황판
    this._boardBlink = this.scene.tweens.add({ targets: this.board, alpha: 0.78, yoyo: true, repeat: -1, duration: 700, ease: "Sine.easeInOut" });
    this.ballotbox = place("prop-ballotbox", 84, 95); // 좌측 접수 투표함
    this.papers = place("prop-papers", 306, 96);    // 우측 기록 서류더미
    // 국장 앞 개표대(투표지 분류기) — 분류반 시설
    this.sorter = this.scene.add.image(GAME_W / 2, GROUND_Y, "prop-sorter").setOrigin(0.5, 1).setScale(SORTER_SCALE).setDepth(101);
    this.props.push(this.sorter);
  }

  // 각 장비를 대응 시설 레벨에 맞춰 키운다(시설 업그레이드가 화면에 보이게)
  //  투표함←접수(desk) · 서류더미←기록(archive) · 상황판←전산(server)
  _syncProps() {
    const lvl = (id) => (this.gameState.level ? this.gameState.level(id) : 0);
    const grow = (l) => PROP_SCALE * (1 + Math.min(0.6, l / 40));
    this._tweenScale(this.ballotbox, grow(lvl("desk")));
    this._tweenScale(this.papers, grow(lvl("archive")));
    this._tweenScale(this.board, grow(lvl("server")));
    this._tweenScale(this.sorter, SORTER_SCALE * (1 + Math.min(0.45, lvl("sorter") / 40)));
  }

  _tweenScale(obj, sc) {
    if (obj && Math.abs(obj.scaleX - sc) > 0.01) {
      this.scene.tweens.add({ targets: obj, scaleX: sc, scaleY: sc, duration: 200, ease: "Quad.easeOut" });
    }
  }

  // 시설 업그레이드 시 대응 장비가 반짝 커지는 연출
  _pulseProp(facility) {
    const map = { desk: this.ballotbox, archive: this.papers, server: this.board, sorter: this.sorter };
    const obj = map[facility && facility.id];
    if (!obj) return;
    const s = obj.scaleX;
    this.scene.tweens.add({ targets: obj, scaleX: s * 1.22, scaleY: s * 1.22, yoyo: true, duration: 150, ease: "Quad.easeOut" });
    this.effects.deskPop(obj.x, obj.y - 40);
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
    // 콤보는 GameState가 관리(실보너스와 일치) — 여기선 표시만
    const n = this.gameState.clickCombo ? this.gameState.clickCombo() : 0;
    if (n >= 3) {
      const mult = 1 + Math.min(4, Math.floor(n / 5)) * 0.5;
      this.comboText.setText(mult > 1 ? `${n} 콤보! ×${mult}` : `${n} 콤보!`).setVisible(true).setScale(1);
      this.comboText.setColor(mult > 1 ? "#ffd34d" : "#ffcd75");
      this.scene.tweens.killTweensOf(this.comboText);
      this.scene.tweens.add({ targets: this.comboText, scale: 1.3, yoyo: true, duration: 100, ease: "Quad.easeOut" });
      this._comboTimer?.remove();
      this._comboTimer = this.scene.time.delayedCall(800, () => { this.comboText.setVisible(false); });
    }
  }

  _govSpeak() {
    const txt = GOV_LINES[(Math.random() * GOV_LINES.length) | 0];
    this.effects.float({ text: `"${txt}"`, x: GAME_W / 2, y: 372, color: "#ffe9c0" });
  }

  // idle 제스처: 살짝 점프하며 가끔 표를 던진다
  _govGesture() {
    this.scene.tweens.killTweensOf(this.gov);
    this.gov.setScale(GOV_SCALE);
    this.gov.y = GROUND_Y;
    this.scene.tweens.add({
      targets: this.gov, y: GROUND_Y - 14, yoyo: true, duration: 200, ease: "Quad.easeOut",
      onComplete: () => { if (this.gov && this.gov.active) this._startBob(); },
    });
    if (Math.random() < 0.6) this.effects.ballots({ x: GAME_W / 2 + (Math.random() * 40 - 20), y: GROUND_Y - 96, count: 2 });
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
        // 좌우로 살짝 꼼지락(걸어다니는 느낌)
        this.scene.tweens.add({ targets: w, x: sx + (i % 2 ? 9 : -9), yoyo: true, repeat: -1, duration: 1600 + i * 180, ease: "Sine.easeInOut", delay: 200 + i * 120 });
        this.effects.deskPop(sx, GROUND_Y - 14);
      }
    });
  }

  // ── 랜덤 아이템(가끔 등장 → 탭하면 종류별 보상) ──
  _scheduleItem(delay) {
    this._itemTimer?.remove();
    this._itemTimer = this.scene.time.delayedCall(delay, () => this._spawnItem());
  }

  _spawnItem() {
    if (this._item) return;
    const def = pickRandomItem();
    const x = 70 + Math.random() * 250;
    const y = 170 + Math.random() * 160;
    const halo = this.scene.add.circle(x, y, 22, 0xffe9a8, 0.18).setDepth(4998);
    this._itemHalo = halo;
    this._itemHaloT = this.scene.tweens.add({ targets: halo, scale: 1.4, alpha: 0.05, yoyo: true, repeat: -1, duration: 700, ease: "Sine.easeInOut" });
    const txt = this.scene.add.text(x, y, def.icon, { fontSize: "30px" }).setOrigin(0.5).setDepth(5001).setInteractive({ useHandCursor: true });
    this._item = txt;
    txt.setScale(0);
    this.scene.tweens.add({ targets: txt, scale: 1, duration: 260, ease: "Back.easeOut" });
    this._itemBob = this.scene.tweens.add({ targets: txt, y: y - 10, yoyo: true, repeat: -1, duration: 900, ease: "Sine.easeInOut", delay: 270 });
    txt.on("pointerdown", () => {
      if (!this._item) return;
      const res = this.gameState.applyRandomItem(def.id);
      this.effects.float({ text: res.text, x, y: y - 30, color: "#ffe3a8" });
      this.effects.deskPop(x, y);
      this._despawnItem();
      this._scheduleItem(35000 + Math.random() * 30000);
    });
    this._itemLife = this.scene.time.delayedCall(8500, () => {
      this._despawnItem();
      this._scheduleItem(35000 + Math.random() * 30000);
    });
  }

  _despawnItem() {
    this._itemHaloT?.stop(); this._itemHaloT = null;
    this._itemLife?.remove(); this._itemLife = null;
    if (this._item) { this.scene.tweens.killTweensOf(this._item); this._item.destroy(); this._item = null; }
    if (this._itemHalo) { this.scene.tweens.killTweensOf(this._itemHalo); this._itemHalo.destroy(); this._itemHalo = null; }
  }

  _refresh() {
    const d = this.gameState.data;
    this._applyEra(d.stage.area);
    const st = govStageFor(d);
    if (st !== this._govStage) {
      this._govStage = st;
      this.gov.setTexture(`gov-${st}`);
    }
    this.bigNum.setText(shortNumber(d.votes));
    const cps = this.gameState.cps ? this.gameState.cps() : 0;
    this.cpsText.setText(`▶ 초당 ${cps < 10000 ? cps.toFixed(0) : shortNumber(cps)}표`);
    this._syncWorkers();
    this._syncProps();
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
    this._itemTimer?.remove();
    this._comboTimer?.remove();
    this._govIdleTimer?.remove();
    this._speakTimer?.remove();
    this._despawnGolden();
    this._despawnItem();
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
    this.titleHint?.destroy();
    this.titleZone?.destroy();
    (this.props || []).forEach((p) => p.destroy());
    Object.values(this._workers || {}).forEach((w) => { this.scene.tweens.killTweensOf(w); w.destroy(); });
    Object.values(this._workerShadows || {}).forEach((s) => s.destroy());
    this.effects.destroy();
  }
}

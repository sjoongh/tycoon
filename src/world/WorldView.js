import Phaser from "phaser";
import { iconRef } from "../assets/iconTextures.js";
import { motionReduced } from "../ui/a11y.js";
import { WorldEffects } from "./WorldEffects.js";
import { govTextureKey, govStageFor } from "./dotChar.js";
import { facilities } from "../data/facilities.js";
import { facilitySpriteKey, govSpriteKey, workerSpriteKey, WORLD_ATLAS } from "./worldAtlas.js";
import { stationDepth, workerDepth } from "./depth.js";
import { WORLD_SCALE, ROOM_X, ROOM_Y, ROOM_BOTTOM, FACILITY_SLOTS, GOV_TILE, BIG_NUM_TILE, tileCenter, facilityPos, workerPos, randomFloorPoint, facilitySpriteMeta } from "./iso.js";
import { staffDefinitions } from "../data/staff.js";
import { staffRankForLevel } from "../data/staffDeployment.js";
import { tierForLevel } from "./facilityTiers.js";
import { eraTheme, regionFor } from "../data/regions.js";
import { pickRandomItem } from "../data/items.js";
import { pickPress } from "../data/worldPress.js";
import { RARITY_COLOR } from "../data/titles.js";
import { shortNumber } from "../utils/format.js";

// 거지키우기식 심플 월드: 미니멀 픽셀 배경 + 중앙 도트 국장 + 큰 숫자 + 바닥.
// (구 버전의 이소 오피스 다이어그램·화분·시계·창문·워커·시설 스테이션은 전부 제거)
const GAME_W = 390;
const GOV_POS = tileCenter(GOV_TILE.i, GOV_TILE.j);
const GROUND_Y = GOV_POS.y;     // 국장 발이 닿는 타일 중앙
const GOV_SCALE = WORLD_SCALE;  // 16px 도트 → 48px (월드 전역 3x)
const GOV_BOB_MS = 900;
const WORKER_SCALE = WORLD_SCALE;
const BIG_NUM_POS = tileCenter(BIG_NUM_TILE.i, BIG_NUM_TILE.j);
const BIG_NUM_Y = BIG_NUM_POS.y;  // 국장 앞 바닥에 큰 숫자

const GOV_LINES = [
  "한 표만 믿어주세요!", "분류기는 정상입니다.", "소쿠리는 이제 그만…",
  "수검표 환영합니다.", "CCTV 다 공개할게요.", "야근 수당은 대체…",
  "재검표… 또요?", "비둘기 좀 내보내!", "이번엔 깔끔하게.",
  "보안점검 받겠습니다.", "아빠 찬스 아닙니다.", "통계는 통계일 뿐!",
  "QR 아니고 바코드요.", "도장은 칸 안에 콕!", "유령 유권자 없습니다.",
  "봉인지 안 뜯었어요.", "출구조사는 참고만…", "전산망 안 뚫렸어요.",
  "직인 어디 갔지…", "용지 다 셌습니다!", "참관인님 진정하세요.",
  "새벽 개표 죄송…", "정전엔 수개표로!", "밈 박제는 그만…",
  "기표용구 쓰세요~", "재외국민 표도 소중!",
  "사칭 문자 조심하세요!", "링크는 안 보냅니다.", "깜깜이 기간이라…",
  "보조용구 다 챙겼어요.",
];

// 불신 위기(믿음<20%) 때 국장이 흘리는 불안한 대사 — 위기 상태를 중앙 캐릭터가 체감시킨다.
const GOV_LINES_CRISIS = [
  "믿음이… 바닥이에요", "오해를 풀어야 하는데…", "여론이 싸늘합니다…",
  "해명이 시급해요!", "이러다 큰일 나요…", "제발 믿어주세요…", "식은땀이 나네요",
];

// 사이다! 정의구현 순간 국장의 통쾌한 반격 대사 — 속 시원한 한 방.
const GOV_CLAPBACK = [
  "봤지? 이게 원칙이다!", "떳떳하면 다 보여준다!", "의혹? 여기 증거 있소!",
  "투명함이 곧 정답이지!", "거봐요, 깨끗하잖아요!", "이래도 못 믿겠어요?",
  "정면돌파, 이게 개표국!", "뒤가 없으니 당당하다!", "속 시원하죠?",
];

// 큰 성취(업적/콤보/구역 진입 등 celebrate) 순간 국장이 외치는 반응 대사 — 중앙 캐릭터에 감정선 부여.
const GOV_REACT_LINES = [
  "해냈다!", "이게 바로 개표국!", "믿어주셔서 감사합니다!",
  "역시 우리 팀!", "한 표 한 표가 빛난다!", "오늘도 정정당당!",
  "국민 여러분 보셨죠?", "이 맛에 개표합니다!", "기록 갱신!",
];

// 국장 성장 단계별 전용 대사 — 넝마(불안)→말단(적응)→정장(원칙)→명예(관록). 공통 GOV_LINES와 섞어 출력.
const GOV_LINES_BY_STAGE = {
  1: ["처음이라 떨리네요…", "이 일 잘할 수 있을까…", "한 표가 이렇게 무겁다니", "오늘도 야근인가…", "선배님 어디 계세요…", "라면값이라도 벌어야…"],
  2: ["조금씩 손에 익어요", "이제 좀 알겠어요!", "실수는 안 하렵니다", "분류기랑 친해졌어요", "민원 전화도 이젠 척척"],
  3: ["절차대로 갑니다.", "이의 있으면 말씀을.", "원칙이 우선입니다.", "한 표도 안 놓쳐요.", "참관인 환영합니다.", "규정집은 제 친구죠."],
  4: ["전국이 지켜봅니다.", "역사에 남길 개표죠.", "한 치 오차 없이!", "관록이 다릅니다.", "이 정도는 기본이죠.", "후배들 보고 배웁니다.", "투명함이 곧 권위죠."],
  5: ["전설은 멈추지 않죠.", "한 표의 무게, 평생 압니다.", "개표의 神이라 부르더군요.", "이름이 곧 신뢰입니다.", "후대가 기억할 개표죠.", "왕관은 무겁습니다.", "믿음, 그 자체가 됐어요."],
};

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
      .image(GOV_POS.x, GROUND_Y, govSpriteKey(govStageFor(gameState.data)))
      .setOrigin(0.5, 1)
      .setScale(GOV_SCALE)
      .setDepth(workerDepth(GROUND_Y));
    this._govStage = govStageFor(gameState.data);
    this._cosSprites = {}; // 꾸미기 오버레이 슬롯별 스프라이트(국장에 글루)
    this._startBob();

    // 중앙 큰 숫자(개표수) — 한글 단위 지원 위해 Galmuri14
    this.bigNum = scene.add
      .text(BIG_NUM_POS.x, BIG_NUM_Y, "0", { fontFamily: '"Jua", "DoHyeon", sans-serif', fontSize: "30px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(2500);
    this.bigNum.setShadow(3, 3, "#b13e53", 0, true, true);
    this.bigSub = scene.add
      .text(BIG_NUM_POS.x, BIG_NUM_Y + 26, "표", { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "12px", color: "#ffcd75" })
      .setOrigin(0.5)
      .setDepth(2500);
    this.cpsText = scene.add
      .text(GAME_W / 2, ROOM_BOTTOM + 12, "", {
        fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "11px", color: "#bcd0e0",
        backgroundColor: "rgba(20,18,28,0.72)", padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(2500);

    // 국장 대표 칭호 명패(인사 발령 뽑기 결과 — 머리 위에 직급 표시, 꾸미기)
    this.titlePlate = scene.add
      .text(GOV_POS.x, GROUND_Y - 70, "", {
        fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "10px", color: "#ffd479",
        backgroundColor: "rgba(20,18,28,0.78)", padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(2500)
      .setVisible(false);
    this._titleId = null;

    // 클릭 콤보 카운터(연타 시 등장)
    this.comboText = scene.add
      .text(10, ROOM_Y + 100, "", {
        fontFamily: '"Jua", "DoHyeon", sans-serif', fontSize: "13px", color: "#ffcd75",
        backgroundColor: "rgba(20,18,28,0.78)", padding: { x: 4, y: 3 },
      })
      .setOrigin(0, 0.5)
      .setDepth(2500)
      .setVisible(false);
    this.comboText.setShadow(2, 2, "#000", 0, true, true);
    this._comboN = 0;
    this._comboLast = 0;

    this.effects = new WorldEffects(scene);
    this._workers = {}; // 현장 배치 직원 도트(staffId → container)
    this._workerShadows = {};
    this._propTier = {}; // 시설별 시각 티어(승급 색 진화 추적)
    this._propIdle = {}; // 시설별 가동 모션 트윈(승급 펀치와 충돌하지 않게 멈췄다 재시작)

    this._onChanged = () => this._refresh();
    this._onFloat = (p) => this.effects.float(p);
    this._onBallots = (p) => this.effects.ballots(p);
    this._onUpgraded = (facility) => { this._squishGov(); this._pulseProp(facility); };
    // 마일스톤(생산 ×2) 축하 — 피드백 위계 3단: 탭 < 구매 < 마일스톤. 시설 크게 펀치 + 투표지 분출 + 국장 환호.
    this._onMilestone = (p) => {
      const obj = this.propByFacility?.[p?.facility?.id];
      if (obj && obj.active) {
        this._stopPropIdle(p.facility.id);
        this.scene.tweens.add({ targets: obj, scaleX: WORLD_SCALE * 1.4, scaleY: WORLD_SCALE * 1.4, angle: -6, yoyo: true, duration: 220, ease: "Back.easeOut", onComplete: () => this._startPropIdle(p.facility.id, obj) });
        if (!motionReduced()) this.effects.ballots({ x: obj.x, y: obj.y - obj.displayHeight * 0.5, count: 12 });
        this.effects.float({ text: `★ Lv.${p.level} 생산 ×2!`, x: obj.x, y: obj.y - obj.displayHeight - 14, color: "#ffd34d" });
      }
      this._govReact();
    };
    // 큰 성취 순간 국장이 기뻐서 폴짝 + 반응 대사(같은 프레임 대량 연쇄 시 쿨다운으로 1회만)
    this._onCelebrate = () => {
      const now = this.scene.time.now;
      if (now - (this._lastReactAt || 0) < 1500) return;
      this._lastReactAt = now;
      this._govReact();
    };
    gameState.on("changed", this._onChanged);
    gameState.on("float", this._onFloat);
    gameState.on("ballots", this._onBallots);
    gameState.on("upgraded", this._onUpgraded);
    gameState.on("milestone", this._onMilestone);
    gameState.on("celebrate", this._onCelebrate);
    // 사이다! 정의구현 순간 — 통쾌한 연출
    this._onCider = (p) => this._ciderMoment(p);
    gameState.on("cider", this._onCider);
    this._onCentralVisual = (event) => {
      this._centralVisualActive = !!event.detail?.active;
      const visible = !this._centralVisualActive && !this._signHiddenByScroll;
      [this.titleBg, this.titleTop, this.titleMain, this.titleHint].forEach((item) => item?.setVisible(visible));
      if (this.titleZone?.input) this.titleZone.input.enabled = visible;
    };
    document.addEventListener("gp:central-visual", this._onCentralVisual);

    // 하단 패널 높이에 맞춰 카메라를 위로 스크롤 — 국장·시설·초당표가 패널에 절대 안 잘리게(BUG2).
    // WORLD_BOTTOM = cps 라벨 하단(GROUND_Y+34). 패널 top이 그보다 위면 그 차이만큼 카메라를 올린다.
    this._onSheetTop = (e) => {
      // 시트가 반펼침이면 방 바닥 전체 대신 국장·접수창구·큰 숫자(GROUND_Y+78)까지만 보장해 덜 밀어 올린다.
      const WORLD_BOTTOM = GROUND_Y + 78;
      // 전체 시트는 월드를 덮으므로 밀어 올리지 않는다(HUD 뒤로 방이 삐져나오는 것 방지)
      const full = e.detail.state === "full";
      const target = full ? 0 : Math.max(0, WORLD_BOTTOM - e.detail.topGame + 6);
      if (Math.abs((this._camTarget ?? -1) - target) < 1) return;
      this._camTarget = target;
      const baseY = scene.renderBase?.baseScrollY || 0;
      scene.tweens.add({ targets: scene.cameras.main, scrollY: baseY + target, duration: 220, ease: "Quad.easeOut" });
      // 밀려 올라가 HUD와 겹치는 간판은 숨긴다
      const signVisible = target < 40;
      this._signHiddenByScroll = !signVisible;
      [this.titleBg, this.titleTop, this.titleMain, this.titleHint].forEach((item) => item?.setVisible(signVisible && !this._centralVisualActive));
      if (this.titleZone?.input) this.titleZone.input.enabled = signVisible && !this._centralVisualActive;
    };
    document.addEventListener("gp:sheet-top", this._onSheetTop);
    // 패널이 먼저 브로드캐스트한 초기값을 즉시 반영(초기 이벤트 유실 방지) + 재브로드캐스트 요청
    if (typeof gameState.uiSheetTopGame === "number") this._onSheetTop({ detail: { topGame: gameState.uiSheetTopGame, state: gameState.uiSheetState } });
    document.dispatchEvent(new CustomEvent("gp:world-ready"));

    // 실화 모티프 사건 해결 시 월드에 "📺 속보" 배너 연출
    this._onEventResolved = (e) => {
      if (!e.detail) return;
      if (e.detail.real) this._newsFlash(e.detail.title);
      if (e.detail.firstSeen) this.gameState.emit("float", { text: "도감 수집!", x: 195, y: 500, color: "#ffd479" });
    };
    document.addEventListener("gp:event-resolved", this._onEventResolved);

    // 캔버스에 도달한 빈 공간 탭만 득표로 처리(하단 DOM 패널은 자체 처리)
    this._onPointer = (pointer, currentlyOver) => {
      if (currentlyOver && currentlyOver.length) return;
      if (this._camDragging) return;
      gameState.processClick(pointer.worldX, pointer.worldY);
      this._squishGov();
      this._punchNum();
      this._bumpCombo();
      this.effects.deskPop(this.gov.x, GROUND_Y - 30);
      if (!motionReduced()) this.effects.ballots({ x: this.gov.x, y: GROUND_Y - 56, count: 2 });
      this._flyBallotToBox(); // 처리한 표가 투표함으로 날아가 모인다(의미 + 손맛)
    };
    scene.input.on("pointerdown", this._onPointer);
    this._setupCameraGestures();

    // 패시브 수입 가시화: 국장 위로 주기적 +표 플로팅
    this._incomeTimer = scene.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        const inc = this.gameState.cps ? this.gameState.cps() : 0;
        if (inc > 0) {
          const x = this.gov.x + (Math.random() * 80 - 40);
          this.effects.float({ text: `+${shortNumber(inc)}`, x, y: GROUND_Y - 70, color: "#7fb98a" });
          // 패시브 생산도 표가 투표함으로 모인다
          this._flyBallotToBox();
        }
        // 일꾼이 일하는 반짝임(랜덤 1명 머리 위)
        const wk = Object.values(this._workers);
        if (wk.length) { const r = wk[(Math.random() * wk.length) | 0]; this.effects.deskPop(r.body.x, r.body.y - 52); }
      },
    });

    // 국장 idle 제스처(가끔 점프하며 표 던지기) — 정적이지 않게
    this._govIdleTimer = scene.time.addEvent({
      delay: 4500, loop: true,
      callback: () => { if (this.gov?.active && Math.random() < 0.5) this._govGesture(); },
    });
    // 직원 심부름: 가끔 한 명이 표 뭉치를 들고 접수창구까지 걸어갔다 돌아온다 — 방이 살아 보이게
    this._courierTimer = scene.time.addEvent({
      delay: 6500, loop: true,
      callback: () => { if (Math.random() < 0.75) this._courierRun(); },
    });
    // 창구 앞 표 뭉치: 수입이 쌓이면 뭉치가 늘고, 탭하면 보너스와 함께 수금(Idle Supermarket의 현금 더미)
    this._pileTimer = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this._accruePile() });
    // 유권자 방문: 문으로 들어와 창구 앞에 줄 섰다가 나간다(수입이 클수록 자주)
    this._visitorTimer = scene.time.addEvent({ delay: 2500, loop: true, callback: () => this._maybeSpawnVisitor() });
    // 브리핑룸 카메라 플래시
    this._studioTimer = scene.time.addEvent({
      delay: 3800, loop: true,
      callback: () => this._studioFlash(),
    });
    // 국장 풍자 대사(가끔)
    this._speakTimer = scene.time.addEvent({
      delay: 9000, loop: true,
      callback: () => { if (this.gov?.active && Math.random() < 0.5) this._govSpeak(); },
    });
    // 외신 반응 — 주기적으로 믿음 상태에 맞는 가상 외신 헤드라인(사이다/블랙코미디)
    this._pressTimer = scene.time.addEvent({
      delay: 32000, loop: true,
      callback: () => { if (Math.random() < 0.7) this._pressFlash(); },
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
    if (k === "future") return { sky: 0x0a0a16, floor: 0x12122a, star: 0x5a5aaa, line: 0x1a1a3a, accent: 0xffd34d };
    if (k === "space") return { sky: 0x140a2a, floor: 0x1a1030, star: 0xb18cff, line: 0x281a44, accent: 0xb18cff };
    if (k === "myth") return { sky: 0x1a1206, floor: 0x241a0a, star: 0xffd479, line: 0x3a2a12, accent: 0xffd479 };
    return { sky: 0x0a0a16, floor: 0x12122a, star: 0x5a5aaa, line: 0x1a1a3a, accent: 0xffd34d }; // fallback
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
    // 배경: 시대 색 → 바닥색 세로 그라데이션(카툰 스킨, 별·픽셀 점 없음)
    g.fillGradientStyle(c.sky, c.sky, c.floor, c.floor, 1);
    g.fillRect(0, 0, GAME_W, ROOM_BOTTOM - 70);
    g.fillStyle(0xffffff, 0.06);
    g.fillEllipse(GAME_W / 2, 120, 420, 180);

    // ── 체제 상징물 — 카툰 스킨에서는 그리지 않는다(배경은 시대 색 그라데이션만) ──
    const DRAW_ERA_SYMBOLS = false;
    if (!DRAW_ERA_SYMBOLS) {
      // skip
    } else if (key === "force") {
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
    } else if (key === "future") {
      // 미래: 추가 별 + 행성
      g.fillStyle(0xffffff, 1);
      [[60, 120], [200, 100], [320, 130], [100, 180], [280, 210], [160, 250]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
      g.fillStyle(0xef7d57, 1); g.fillRect(306, 142, 12, 12);
      g.fillStyle(0xffcd75, 1); g.fillRect(308, 142, 4, 12);
    } else if (key === "space") {
      // 우주: 성운(보라 글로우) + 고리 행성 + 촘촘한 별
      g.fillStyle(0xb18cff, 0.12); g.fillCircle(110, 160, 60);
      g.fillStyle(0x73eff7, 0.10); g.fillCircle(280, 200, 48);
      g.fillStyle(0xffffff, 1);
      [[50, 110], [150, 90], [240, 130], [330, 110], [90, 200], [200, 230], [300, 260], [130, 280], [260, 90]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
      // 고리 행성
      g.fillStyle(0xc8a0ff, 1); g.fillCircle(300, 150, 14);
      g.fillStyle(0xfff4cf, 0.5); g.fillRect(276, 149, 48, 2);
    } else {
      // 신화: 금빛 후광 + 별자리(선으로 이은 점) + 빛나는 구슬
      g.fillStyle(0xffd479, 0.10); g.fillCircle(GAME_W / 2, 120, 80);
      g.fillStyle(0xffe9a8, 0.5);
      const cons = [[70, 110], [110, 150], [160, 120], [210, 160], [250, 120]];
      for (let i = 0; i < cons.length - 1; i++) {
        const [x1, y1] = cons[i], [x2, y2] = cons[i + 1];
        for (let t = 0; t <= 1; t += 0.1) g.fillRect(Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), 1, 1);
      }
      g.fillStyle(0xffd479, 1); cons.forEach(([x, y]) => g.fillRect(x - 1, y - 1, 3, 3));
      g.fillStyle(0xffcd75, 0.9); [[300, 130], [320, 220], [60, 250]].forEach(([x, y]) => g.fillCircle(x, y, 5));
    }

    // 방 아래 바닥(방 밖 여백) — 방 이미지(depth 5)가 위에 얹힌다
    g.fillStyle(c.floor, 1);
    g.fillRect(0, ROOM_BOTTOM - 70, GAME_W, 844 - ROOM_BOTTOM + 70);
  }

  // 구역이 바뀌면 배경/깃발 전환 + 화면 플래시
  _applyEra(area) {
    if (area === this._eraArea) return;
    const prevKey = eraTheme(this._eraArea).key;
    this._eraArea = area;
    this._drawBackground(area);
    // 구역 전환 플래시 — 픽셀답게 짧고 옅게(스텝 페이드), 잔상 최소화
    const f = this.scene.add.rectangle(GAME_W / 2, 422, GAME_W, 844, 0xffe9a8, 0.32).setDepth(200);
    this.scene.tweens.add({ targets: f, alpha: 0, duration: 240, ease: "Quad.easeOut", onComplete: () => f.destroy() });
    // 체제가 바뀌는 순간엔 배너 토스트
    if (eraTheme(area).key !== prevKey) {
      const t = eraTheme(area);
      this.effects.float({ text: `${t.name} 돌입`, x: GAME_W / 2, y: 150, color: "#ffe3a8" });
    }
  }

  // 상단 간판: "믿어주세요 / 개표국"
  _buildTitle() {
    const cx = GAME_W / 2;
    const w = 300, h = 40, top = 175, x = cx - w / 2;
    const g = this.scene.add.graphics().setDepth(110);
    // 현수막 끈
    g.fillStyle(0x14121c, 1);
    g.fillRect(x + 18, top - 12, 3, 14);
    g.fillRect(x + w - 21, top - 12, 3, 14);
    // 둥근 카툰 간판(남색 보드 + 금테)
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(x - 2, top + 3, w + 4, h + 4, 14);
    g.fillStyle(0xffc53d, 1);
    g.fillRoundedRect(x - 3, top - 3, w + 6, h + 6, 14);
    g.fillStyle(0x2d3a70, 1);
    g.fillRoundedRect(x, top, w, h, 12);
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(x + 3, top + 3, w - 6, h / 2, 10);
    this.titleBg = g;
    this.titleTop = this.scene.add
      .text(cx, top + 12, regionFor(this.gameState.data.stage?.area || 1).name, { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "10px", color: "#94b0c2" })
      .setOrigin(0.5)
      .setDepth(111);
    this.titleMain = this.scene.add
      .text(cx, top + 27, "개 표 국", { fontFamily: '"Jua", "DoHyeon", sans-serif', fontSize: "17px", color: "#ffe3a8" })
      .setOrigin(0.5)
      .setDepth(111);
    // 간판 아래 "지도" 힌트 + 클릭 영역(탭하면 전국 지도 모달)
    this.titleHint = this.scene.add
      .text(cx, top + h + 9, "전국 지도", { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "10px", color: "#9fb8d0" })
      .setOrigin(0.5)
      .setDepth(111);
    this.scene.tweens.add({ targets: this.titleHint, alpha: 0.5, yoyo: true, repeat: -1, duration: 900, ease: "Sine.easeInOut" });
    this.titleZone = this.scene.add
      .zone(cx, top + (h + 22) / 2, w, h + 26)
      .setInteractive({ useHandCursor: true });
    this.titleZone.on("pointerup", () => document.dispatchEvent(new CustomEvent("gp:open-map")));
  }

  // 아이소 개표소 — 방(벽+바닥) 위에 시설 6종을 고정 슬롯(iso.js)에 놓는다. 티어 스프라이트는 build_world.py 산출물.
  _buildProps() {
    this.props = [];
    this.propByFacility = {};
    this.propLabels = {};
    this.room = this.scene.add.image(ROOM_X, ROOM_Y, "world/room").setOrigin(0, 0).setScale(WORLD_SCALE).setDepth(5);
    for (const f of facilities) {
      const pos = facilityPos(f.id);
      const meta = facilitySpriteMeta(f.id, 1);
      const s = this.scene.add.image(pos.x, pos.y, facilitySpriteKey(f.id, 1))
        .setOrigin(meta.ax / meta.w, meta.ay / meta.h)
        .setScale(WORLD_SCALE)
        .setDepth(stationDepth(pos.y));
      s.setInteractive({ useHandCursor: true });
      s.on("pointerdown", (pointer) => this._onFacilityTap(f.id, pointer));
      this.props.push(s);
      this.propByFacility[f.id] = s;
      this.propLabels[f.id] = this.scene.add
        .text(pos.x, pos.y + 6, "", {
          fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "8px", color: "#c0cbdc",
          backgroundColor: "rgba(20,18,28,0.72)", padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5, 0)
        .setDepth(stationDepth(pos.y) + 1);
    }
    this.ballotbox = this.propByFacility.desk;
    this.board = this.propByFacility.server;
    // 적체(미처리 표) 더미 — 접수창구 앞 타일에 쌓인다. 개수는 적체/분당용량 비율.
    const pile = workerPos("desk");
    this._backlogPile = Array.from({ length: 6 }, (_, k) => this.scene.add
      .image(pile.x - 26 + (k % 3) * 10, pile.y - 6 - Math.floor(k / 3) * 7, "world/ballot")
      .setScale(0.5)
      .setAngle(-12 + (k * 37) % 24)
      .setDepth(stationDepth(pile.y) - 2)
      .setVisible(false));
    this._backlogBadge = this.scene.add
      .text(pile.x, pile.y - 30, "!", { fontFamily: '"Jua", sans-serif', fontSize: "14px", color: "#ffffff", backgroundColor: "#e43b44", padding: { x: 6, y: 2 } })
      .setOrigin(0.5)
      .setDepth(stationDepth(pile.y) + 50)
      .setVisible(false);
    // 서버실 위 LED 개표 현황
    this.boardText = this.scene.add
      .text(this.board.x - 46, this.board.y - 58, "", { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "8px", color: "#2ce8f5", align: "center", backgroundColor: "rgba(20,18,28,0.6)", padding: { x: 3, y: 2 } })
      .setOrigin(0.5)
      .setDepth(stationDepth(this.board.y) + 2);
  }

  // 시설 레벨 → 티어 스프라이트 교체(t1~t5) + 레벨 라벨. 승급 시 번쩍 + 알림.
  _syncProps() {
    const lvl = (id) => (this.gameState.level ? this.gameState.level(id) : 0);
    const TIER_NAME = { 2: "증설", 3: "정예", 4: "특급", 5: "전설" };
    Object.entries(this.propByFacility).forEach(([id, obj]) => {
      if (!obj) return;
      const l = lvl(id);
      const label = this.propLabels[id];
      if (label) { label.setText(l > 0 ? `Lv.${l}` : ""); label.setVisible(l > 0); }
      obj.setVisible(l > 0);
      const t = tierForLevel(l);
      const tierN = t === "locked" ? 1 : Number(String(t).replace("t", "")) || 1;
      const key = facilitySpriteKey(id, tierN);
      if (obj.texture.key !== key) {
        const meta = facilitySpriteMeta(id, tierN);
        const prev = this._propTier[id];
        obj.setTexture(key).setOrigin(meta.ax / meta.w, meta.ay / meta.h);
        if (prev !== undefined && tierN > prev && l > 0) {
          this._stopPropIdle(id);
          this.scene.tweens.add({
            targets: obj, scaleX: WORLD_SCALE * 1.25, scaleY: WORLD_SCALE * 1.25, angle: 4, yoyo: true, duration: 180, ease: "Back.easeOut",
            onComplete: () => this._startPropIdle(id, obj),
          });
          this.effects.float({ text: `★ ${TIER_NAME[tierN] || "기본"} 시설 승급!`, x: obj.x, y: obj.y - obj.displayHeight - 10, color: "#ffd34d" });
          this.effects.ballots({ x: obj.x, y: obj.y - obj.displayHeight * 0.5, count: 6 });
        }
      }
      this._propTier[id] = tierN;
      // 가동 모션: 보이는 시설만, 아직 안 돌고 있으면 시작
      if (l > 0 && !this._propIdle[id]) this._startPropIdle(id, obj);
      else if (l <= 0 && this._propIdle[id]) this._stopPropIdle(id);
    });

    if (this._backlogPile) {
      const d = this.gameState.data;
      const backlog = Math.max(0, d.backlog || 0);
      const perMin = this.gameState.capacityFor ? this.gameState.capacityFor(d) * 60 + 1 : 1;
      const n = backlog < 1 ? 0 : Math.max(1, Math.min(6, Math.ceil((backlog / perMin) * 6)));
      this._backlogPile.forEach((b, k) => b.setVisible(k < n));
      const danger = n >= 3;
      if (danger !== this._backlogDanger) {
        this._backlogDanger = danger;
        this._backlogBadge.setVisible(danger);
        this.scene.tweens.killTweensOf(this._backlogBadge);
        if (danger) this.scene.tweens.add({ targets: this._backlogBadge, y: this._backlogBadge.y - 4, yoyo: true, repeat: -1, duration: 420, ease: "Sine.easeInOut" });
      }
    }

    if (this.boardText) {
      const d = this.gameState.data;
      const pct = Math.min(100, Math.round((d.stage.progress / d.stage.target) * 100));
      this.boardText.setText(`${d.stage.area}구역\n개표 ${pct}%`);
      this.boardText.setVisible(lvl("server") > 0);
    }
  }

  _tweenScale(obj, sc) {
    if (obj && Math.abs(obj.scaleX - sc) > 0.01) {
      this.scene.tweens.add({ targets: obj, scaleX: sc, scaleY: sc, duration: 200, ease: "Quad.easeOut" });
    }
  }

  // 시설 업그레이드 시 대응 장비가 반짝 커지는 연출
  _pulseProp(facility) {
    const id = facility && facility.id;
    const obj = this.propByFacility?.[id];
    if (!obj) return;
    this._stopPropIdle(id);
    this.scene.tweens.add({
      targets: obj, scaleX: WORLD_SCALE * 1.22, scaleY: WORLD_SCALE * 1.22, yoyo: true, duration: 150, ease: "Quad.easeOut",
      onComplete: () => this._startPropIdle(id, obj),
    });
    this.effects.deskPop(obj.x, obj.y - 40);
  }

  // ── 시설 가동 모션 — 종류별로 "돌아가고 있다"가 보이는 아주 작은 루프(움직임 줄이기면 생략) ──
  _startPropIdle(id, obj) {
    this._stopPropIdle(id);
    if (!obj || !obj.active) return;
    obj.setScale(WORLD_SCALE).setAngle(0);
    if (motionReduced() || !obj.visible) return;
    const S = WORLD_SCALE;
    const cfg = {
      sorter:  { angle: 1.6, duration: 900 },                      // 분류기: 좌우로 달그락
      server:  { scaleY: S * 1.012, duration: 700 },                // 서버: 팬 진동처럼 미세하게
      notice:  { scaleX: S * 1.025, duration: 1100 },               // 게시판: 종이 펄럭임
      archive: { scaleY: S * 1.008, duration: 1600 },               // 보관소: 느린 숨
      studio:  { scaleY: S * 1.015, duration: 800 },                // 브리핑룸: 조명 맥동
      desk:    { scaleY: S * 1.01, duration: 1300 },                // 접수창구: 숨
    }[id];
    if (!cfg) return;
    const { duration, ...props } = cfg;
    this._propIdle[id] = this.scene.tweens.add({ targets: obj, ...props, yoyo: true, repeat: -1, duration, ease: "Sine.easeInOut", delay: Math.random() * 600 });
  }

  _stopPropIdle(id) {
    const t = this._propIdle[id];
    if (t) { t.stop(); t.remove?.(); }
    this._propIdle[id] = null;
    const obj = this.propByFacility?.[id];
    if (obj && obj.active) obj.setScale(WORLD_SCALE).setAngle(0);
  }

  // 브리핑룸 카메라 플래시(보일 때만) — 작은 흰 원이 번쩍 커지며 사라진다
  _studioFlash() {
    const obj = this.propByFacility?.studio;
    if (!obj || !obj.visible || !obj.active || motionReduced()) return;
    if (!this._flashDot) this._flashDot = this.scene.add.circle(0, 0, 7, 0xffffff, 0.95).setDepth(stationDepth(obj.y) + 5).setVisible(false);
    const dot = this._flashDot;
    dot.setPosition(obj.x + obj.displayWidth * 0.28, obj.y - obj.displayHeight * 0.72).setScale(0.4).setAlpha(0.95).setVisible(true);
    this.scene.tweens.killTweensOf(dot);
    this.scene.tweens.add({ targets: dot, scale: 2.4, alpha: 0, duration: 340, ease: "Quad.easeOut", onComplete: () => dot.setVisible(false) });
    this.effects.deskPop(obj.x - obj.displayWidth * 0.2, obj.y - obj.displayHeight * 0.5);
  }

  // 처리한 표 한 장이 국장 → 좌측 투표함으로 포물선을 그리며 날아가 모인다
  // 비행 표는 매 탭·매 수입 틱마다 생기므로 생성/파괴 대신 작은 풀을 돌려쓴다(로드맵 #18). 움직임 줄이기 설정이면 장식 효과라 생략한다.
  _acquireFlyBallot(x, y) {
    if (!this._flyPool) this._flyPool = [];
    const b = this._flyPool.pop() || this.scene.add.image(0, 0, "world/ballot").setDepth(2400);
    b.setPosition(x, y).setScale(0).setAngle(0).setAlpha(1).setVisible(true).setActive(true);
    return b;
  }

  _releaseFlyBallot(b) {
    this.scene.tweens.killTweensOf(b); // 동시 x/scale 트윈이 반납된 오브젝트를 만지지 않게(BUG-08)
    b.setVisible(false).setActive(false);
    if (this._flyPool && this._flyPool.length < 8) this._flyPool.push(b);
    else b.destroy();
  }

  _flyBallotToBox() {
    if (!this.ballotbox || this._flying > 6 || motionReduced()) return; // 동시 비행 표 상한(성능)
    this._flying = (this._flying || 0) + 1;
    const sx = this.gov.x + (Math.random() * 30 - 15);
    const sy = GROUND_Y - 44;
    const tx = this.ballotbox.x + (Math.random() * 10 - 5);
    const ty = this.ballotbox.y - this.ballotbox.displayHeight * 0.6;
    const b = this._acquireFlyBallot(sx, sy);
    this.scene.tweens.add({ targets: b, scale: 0.4, duration: 110, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: b, x: tx, angle: -160, duration: 440, ease: "Sine.easeIn" });
    this.scene.tweens.add({
      targets: b, y: ty - 34, duration: 220, yoyo: true, ease: "Sine.easeOut",
      onComplete: () => {
        this._flying = Math.max(0, (this._flying || 1) - 1);
        this._releaseFlyBallot(b);
        // 투표함이 표를 받아 살짝 들썩
        if (this.ballotbox && this.ballotbox.active) {
          const s = this.ballotbox.scaleX;
          this.scene.tweens.add({ targets: this.ballotbox, scaleY: s * 0.92, yoyo: true, duration: 90, ease: "Quad.easeOut" });
        }
      },
    });
  }

  _startBob() {
    this.gov.y = GROUND_Y;
    this.gov.setScale(GOV_SCALE);
    this._govBob = this.scene.tweens.add({
      targets: this.gov,
      y: GROUND_Y - 4,
      yoyo: true,
      repeat: -1,
      duration: GOV_BOB_MS,
      ease: "Sine.easeInOut",
    });
    if (motionReduced()) return;
    // 숨쉬기(세로로 살짝 늘었다 줄었다) — 꾸미기 오버레이는 update()에서 스케일을 따라간다
    this._govBreath = this.scene.tweens.add({
      targets: this.gov,
      scaleY: GOV_SCALE * 1.025,
      scaleX: GOV_SCALE * 0.99,
      yoyo: true,
      repeat: -1,
      duration: 1400,
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

  // 실화 사건 해결 속보 배너 — 상단에서 붉은 띠가 펼쳐지며 사건명을 흘린다
  _newsFlash(title) {
    const y = 150;
    const bar = this.scene.add.rectangle(GAME_W / 2, y, GAME_W, 28, 0xb13e53, 0.96).setDepth(200).setScale(1, 0).setScrollFactor(0);
    const live = this.scene.add.rectangle(40, y, 52, 28, 0x14121c, 1).setDepth(201).setScale(1, 0).setScrollFactor(0);
    const liveTx = this.scene.add.text(40, y, "● 속보", { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "11px", color: "#ff6a7c" }).setOrigin(0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
    const tx = this.scene.add.text(96, y, `${title || "개표국 사건"}`, { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "12px", color: "#ffffff" }).setOrigin(0, 0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
    this.scene.tweens.add({ targets: [bar, live], scaleY: 1, duration: 150, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: [tx, liveTx], alpha: 1, duration: 200, delay: 90 });
    this._govGesture();
    this.scene.time.delayedCall(2300, () => {
      this.scene.tweens.add({
        targets: [bar, live, tx, liveTx], alpha: 0, duration: 320, ease: "Quad.easeIn",
        onComplete: () => { bar.destroy(); live.destroy(); liveTx.destroy(); tx.destroy(); },
      });
    });
  }

  // 사이다! 정의구현 순간 — 큰 "사이다!" + 국장 반격 대사 + 외신 극찬 + 축포 + 점프.
  _ciderMoment(p) {
    const cx = GAME_W / 2;
    // 큰 사이다 텍스트(금색, 팝)
    const big = this.scene.add.text(cx, 262, "사이다!", { fontFamily: '"Jua", "DoHyeon", sans-serif', fontSize: "26px", color: "#ffd34d" }).setOrigin(0.5).setDepth(210).setScale(0.4).setScrollFactor(0);
    big.setShadow(3, 3, "#b13e53", 0, true, true);
    this.scene.tweens.add({ targets: big, scale: 1, duration: 300, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: big, alpha: 0, y: 232, duration: 500, delay: 900, onComplete: () => big.destroy() });
    // 보너스 표시
    if (p?.bonus) this.effects.float({ text: `+${shortNumber(p.bonus)}표`, x: cx, y: 340, color: "#8df0b0" });
    // 국장 반격 대사 + 점프
    const line = GOV_CLAPBACK[(Math.random() * GOV_CLAPBACK.length) | 0];
    this.effects.float({ text: `"${line}"`, x: cx, y: 372, color: "#ffe9c0" });
    this._govGesture();
    // 축포 + 외신 극찬(사이다니까 강제 praise)
    this.effects.ballots({ x: cx, y: 360, count: 10 });
    this._pressFlash({ outlet: "글로벌 데일리", text: "'통쾌한 정면돌파' 세계가 박수", tone: "praise" });
    document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "achieve" }));
    // 화면 골드 플래시(짧게)
    const fl = this.scene.add.rectangle(cx, 422, GAME_W, 844, 0xffe9a8, 0.22).setDepth(205).setScrollFactor(0);
    this.scene.tweens.add({ targets: fl, alpha: 0, duration: 260, ease: "Quad.easeOut", onComplete: () => fl.destroy() });
  }

  // 외신 반응 배너 — 믿음 상태에 따라 톤이 바뀜(극찬=사이다 / 조롱=블랙코미디). 전부 가상 매체.
  _pressFlash(forced) {
    // 겹침 방지 — 이미 뜬 외신 배너가 있으면 즉시 제거하고 새 배너로 교체(강제 트리거 우선)
    if (this._pressEls) {
      this._pressEls.forEach((el) => el.destroy());
      this._pressEls = null;
    }
    const state = this.gameState.trustState ? this.gameState.trustState() : "normal";
    const comm = this.gameState.commGaugePct ? this.gameState.commGaugePct() : 0;
    const item = forced || pickPress(state, comm);
    const y = 176;
    const col = item.tone === "praise" ? 0x1f9e49 : item.tone === "mock" ? 0x8a2836 : 0x244055;
    const accent = item.tone === "praise" ? "#8df0b0" : item.tone === "mock" ? "#ff9a8e" : "#9fd0e0";
    // 2줄 레이아웃 — 위: 📰 외신 · 매체명 / 아래: 헤드라인. 가독성↑
    const bar = this.scene.add.rectangle(GAME_W / 2, y, GAME_W, 42, col, 0.95).setDepth(200).setScale(1, 0).setScrollFactor(0);
    const top = this.scene.add.text(12, y - 10, `외신 · ${item.outlet}`, { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "11px", color: accent }).setOrigin(0, 0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
    const head = this.scene.add.text(12, y + 8, item.text, { fontFamily: '"DoHyeon", "Jua", sans-serif', fontSize: "12px", color: "#ffffff", wordWrap: { width: GAME_W - 24 } }).setOrigin(0, 0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
    this._pressEls = [bar, top, head];
    this.scene.tweens.add({ targets: bar, scaleY: 1, duration: 140, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: [top, head], alpha: 1, duration: 200, delay: 80 });
    this.scene.time.delayedCall(3400, () => {
      if (this._pressEls && this._pressEls[0] === bar) this._pressEls = null;
      this.scene.tweens.add({
        targets: [bar, top, head], alpha: 0, duration: 300, ease: "Quad.easeIn",
        onComplete: () => { bar.destroy(); top.destroy(); head.destroy(); },
      });
    });
  }

  _govSpeak() {
    // 불신 위기(trust<20)면 절반은 위기 대사 — 중앙 캐릭터가 게임 상태(믿음)에 반응하게.
    if (this.gameState.trustState && this.gameState.trustState() === "crisis" && Math.random() < 0.5) {
      const txt = GOV_LINES_CRISIS[(Math.random() * GOV_LINES_CRISIS.length) | 0];
      this.effects.float({ text: `"${txt}"`, x: this.gov.x, y: GROUND_Y - 64, color: "#ff9a8e" }); // 불안한 붉은톤
      return;
    }
    // 45% 확률로 현재 성장 단계 전용 대사, 아니면 공통 풀에서 — 캐릭터 성장이 말에도 드러나게
    const stageLines = GOV_LINES_BY_STAGE[this._govStage] || [];
    const pool = (stageLines.length && Math.random() < 0.45) ? stageLines : GOV_LINES;
    const txt = pool[(Math.random() * pool.length) | 0];
    this.effects.float({ text: `"${txt}"`, x: this.gov.x, y: GROUND_Y - 64, color: "#ffe9c0" });
  }

  // 큰 성취 반응 — 기쁜 점프 + 환호 대사(밝은 금색으로 평소 대사와 구분)
  _govReact() {
    if (!this.gov || !this.gov.active) return;
    const txt = GOV_REACT_LINES[(Math.random() * GOV_REACT_LINES.length) | 0];
    this.effects.float({ text: `"${txt}"`, x: this.gov.x, y: GROUND_Y - 72, color: "#ffd479" });
    this._govGesture();
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
    if (Math.random() < 0.6) this.effects.ballots({ x: this.gov.x + (Math.random() * 40 - 20), y: GROUND_Y - 50, count: 2 });
  }

  _squishGov() {
    this.scene.tweens.killTweensOf(this.gov);
    this.gov.setScale(GOV_SCALE);
    this.gov.y = GROUND_Y;
    this.scene.tweens.add({
      targets: this.gov,
      scaleX: GOV_SCALE * 1.12,
      scaleY: GOV_SCALE * 0.88,
      duration: 70,
      yoyo: true,
      ease: "Back.easeOut",
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
    const { x, y } = randomFloorPoint(1.5);
    const key = "decor/ballotbox";
    const halo = this.scene.add.circle(x, y, 26, 0xffe9a8, 0.3).setDepth(4999).setScale(1.5);
    this._goldenHalo = halo;
    this._goldenHaloPulse = this.scene.tweens.add({ targets: halo, scale: 1.9, alpha: 0.1, yoyo: true, repeat: -1, duration: 850, ease: "Sine.easeInOut" });

    const disc = this.scene.add.image(x, y, ...iconRef("res-votes")).setDepth(5000).setInteractive({ useHandCursor: true });
    this._golden = disc;
    disc.setScale(0.2).setAlpha(0);
    this.scene.tweens.add({ targets: disc, scale: 0.6, alpha: 1, duration: 280, ease: "Back.easeOut" });
    this._goldenPulse = this.scene.tweens.add({ targets: disc, scale: 0.68, yoyo: true, repeat: -1, duration: 560, ease: "Sine.easeInOut", delay: 290 });
    disc.on("pointerdown", () => {
      if (!this._golden) return;
      const reward = this.gameState.collectGoldenBallot();
      this.effects.float({ text: `+${shortNumber(reward)}`, x, y: y - 28, color: "#ffd34d" });
      this.effects.deskPop(x, y);
      document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "coin" }));
      this._despawnGolden();
      this._scheduleGolden(60000 + Math.random() * 60000);
    });
    // 비서 Lv3 — 잠시 후 자동 수령(80%). 직접 탭하면 100%라 수동이 여전히 이득.
    if (this.gameState.autoAideLevel && this.gameState.autoAideLevel() >= 3) {
      this.scene.time.delayedCall(2600, () => {
        if (!this._golden || this._golden !== disc) return;
        const reward = this.gameState.collectGoldenBallot(0.8, { fever: false });
        this.effects.float({ text: `비서 +${shortNumber(reward)}`, x, y: y - 28, color: "#ffd34d" });
        this._despawnGolden();
        this._scheduleGolden(60000 + Math.random() * 60000);
      });
    }
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

  // 현판: 지역명 갱신(승격 시 위로 톡 튀며 교체)
  _syncSign(area, promoted) {
    if (!this.titleTop) return;
    const name = regionFor(area).name;
    if (!promoted || motionReduced()) { this.titleTop.setText(name); return; }
    this.scene.tweens.add({ targets: [this.titleTop, this.titleMain], y: "-=6", alpha: 0.2, duration: 140, yoyo: true, ease: "Quad.easeOut" });
    this.scene.time.delayedCall(140, () => { if (this.titleTop?.active) this.titleTop.setText(name); });
  }

  // 벽 뱃지: 주간 랭킹 등급(브론즈~엘리트)을 왼쪽 벽 액자로 전시(최근 4개)
  _syncBadges() {
    const list = this.gameState.latestBadges ? this.gameState.latestBadges(4) : [];
    const sig = list.map((b) => `${b.week}:${b.tier}`).join("|");
    if (sig === this._badgeSig) return;
    this._badgeSig = sig;
    (this._badgeObjs || []).forEach((o) => o.destroy());
    this._badgeObjs = [];
    const COLOR = { elite: 0xb18cff, gold: 0xffc53d, silver: 0xc9d3e0, bronze: 0xc98a4b };
    list.forEach((b, i) => {
      const t = tileCenter(0, 4.3 + i * 0.62);
      const x = t.x + 10, y = t.y - 60 - i * 5;
      const frame = this.scene.add.rectangle(x, y, 16, 20, 0x5a3a22).setStrokeStyle(2, 0x3a2414).setDepth(6);
      const medal = this.scene.add.circle(x, y - 1, 5, COLOR[b.tier] || 0xffffff).setStrokeStyle(1, 0x3a2414).setDepth(7);
      const ribbon = this.scene.add.rectangle(x, y + 6, 6, 5, 0xb13e53).setDepth(7);
      this._badgeObjs.push(frame, medal, ribbon);
    });
  }

  // ── 월드 상호작용(레퍼런스: Idle Miner 갱도 탭, 고양이와 스프 고양이 탭, Idle Supermarket 현금 더미) ──
  _onFacilityTap(id, pointer) {
    const gs = this.gameState;
    const obj = this.propByFacility[id];
    if (!obj || !obj.visible) return;
    if (this._camDragging) return;
    gs.select(id);
    document.dispatchEvent(new CustomEvent("gp:sheet-open", { detail: { tab: "facilities" } }));
    this._stopPropIdle(id);
    this.scene.tweens.add({ targets: obj, scaleX: WORLD_SCALE * 1.12, scaleY: WORLD_SCALE * 0.92, yoyo: true, duration: 90, ease: "Quad.easeOut", onComplete: () => this._startPropIdle(id, obj) });
    this.effects.deskPop(obj.x, obj.y - obj.displayHeight * 0.6);
    const f = gs.facility(id);
    this.effects.float({ text: `${f?.name || id} Lv.${gs.level(id)}`, x: obj.x, y: obj.y - obj.displayHeight - 8, color: "#ffe9c0" });
  }

  _onWorkerTap(staffId) {
    const w = this._workers[staffId];
    if (!w || !w.body?.active || this._camDragging) return;
    const gs = this.gameState;
    const now = this.scene.time.now;
    const LINES = ["열심히 하고 있습니다!", "커피 한 잔만요…", "이 표는 제가 책임집니다", "국장님, 믿어 주세요", "오늘도 야근각", "정확하게, 빠르게!"];
    const line = LINES[(Math.random() * LINES.length) | 0];
    this.effects.float({ text: `"${line}"`, x: w.body.x, y: w.body.y - 62, color: "#cfe9ff" });
    if (!w.busy) {
      this.scene.tweens.killTweensOf(w.body);
      this.scene.tweens.add({ targets: w.body, scaleX: WORKER_SCALE * 1.15, scaleY: WORKER_SCALE * 0.85, yoyo: true, duration: 90, ease: "Quad.easeOut", onComplete: () => this._startWorkLoop(w) });
    }
    // 격려 보너스: 직원당 45초 쿨다운, 초당 생산 8초치
    if (now - (w.lastCheerAt || 0) > 45000) {
      w.lastCheerAt = now;
      const bonus = Math.max(1, Math.round((gs.cps ? gs.cps() : 0) * 8));
      gs.grantReward({ votes: bonus });
      gs.emit("changed", { economy: true });
      this.effects.float({ text: `격려 +${shortNumber(bonus)}표`, x: w.body.x, y: w.body.y - 80, color: "#8df0b0" });
      this.effects.deskPop(w.body.x, w.body.y - 50);
    }
  }

  // 표 뭉치: 1초마다 초당 생산을 적립. 뭉치 1개 = 20초치, 최대 6개. 탭하면 적립분의 12%를 보너스로 수금(최대 5분치).
  _accruePile() {
    const gs = this.gameState;
    const cps = gs.cps ? gs.cps() : 0;
    if (cps <= 0) return;
    this._pileVotes = Math.min((this._pileVotes || 0) + cps, cps * 300);
    const n = Math.min(6, Math.floor(this._pileVotes / (cps * 20)));
    this._syncPile(n);
  }

  _syncPile(n) {
    if (!this._pileSprites) {
      this._pileSprites = [];
      const p = tileCenter(4.6, 4.6);
      this._pilePos = p;
      this._pileZone = this.scene.add.zone(p.x, p.y - 10, 44, 36).setInteractive({ useHandCursor: true }).setDepth(stationDepth(p.y) + 60);
      this._pileZone.on("pointerdown", () => this._collectPile());
      for (let k = 0; k < 6; k += 1) {
        const b = this.scene.add.image(p.x - 10 + (k % 2) * 12, p.y - 2 - Math.floor(k / 2) * 6, "world/ballot")
          .setScale(0.6).setAngle(-10 + (k * 23) % 20).setDepth(stationDepth(p.y) + 1 + k).setVisible(false);
        this._pileSprites.push(b);
      }
    }
    const prev = this._pileCount || 0;
    this._pileCount = n;
    this._pileSprites.forEach((b, k) => {
      const show = k < n;
      if (show && !b.visible && !motionReduced()) {
        b.setVisible(true).setScale(0.1);
        this.scene.tweens.add({ targets: b, scale: 0.6, duration: 220, ease: "Back.easeOut" });
      } else b.setVisible(show);
    });
    if (this._pileZone) this._pileZone.input.enabled = n > 0;
    if (n >= 3 && prev < 3 && !motionReduced()) {
      // 쌓이면 살짝 흔들려 "수금해 달라"고 신호
      this.scene.tweens.add({ targets: this._pileSprites.slice(0, n), angle: "+=4", yoyo: true, repeat: 3, duration: 120 });
    }
  }

  _collectPile() {
    if (this._camDragging) return;
    const gs = this.gameState;
    const n = this._pileCount || 0;
    if (n <= 0) return;
    const bonus = Math.max(1, Math.round((this._pileVotes || 0) * 0.12));
    gs.grantReward({ votes: bonus });
    gs.emit("changed", { economy: true });
    const p = this._pilePos;
    this.effects.float({ text: `수금 +${shortNumber(bonus)}표`, x: p.x, y: p.y - 40, color: "#ffd34d" });
    if (!motionReduced()) this.effects.ballots({ x: p.x, y: p.y - 10, count: Math.min(12, 2 + n * 2) });
    for (let i = 0; i < Math.min(n, 4); i += 1) this.scene.time.delayedCall(i * 60, () => this._flyBallotToBox());
    this._pileVotes = 0;
    this._syncPile(0);
    this._squishGov();
  }

  // 유권자 NPC: 문(왼쪽 벽) → 창구 앞 대기 → 다시 문으로. 동시에 최대 3명, 수입이 클수록 자주.
  _maybeSpawnVisitor() {
    if (motionReduced()) return;
    this._visitors = (this._visitors || []).filter((v) => v.body.active);
    if (this._visitors.length >= 3) return;
    const cps = this.gameState.cps ? this.gameState.cps() : 0;
    const chance = cps <= 0 ? 0.15 : Math.min(0.75, 0.25 + Math.log10(1 + cps) * 0.1);
    if (Math.random() > chance) return;
    const nVis = WORLD_ATLAS.visitors?.variants || 0;
    const v = (Math.random() * (nVis || WORLD_ATLAS.workers.variants)) | 0;
    const texKey = nVis ? `world/visitor-${v}` : workerSpriteKey(v, 0);
    const door = tileCenter(0.3, 2.6);
    // 대기열: 문과 접수창구 사이(뒤쪽 왼벽 앞)로 한 줄 — 창구 앞 표 뭉치·국장과 겹치지 않게
    const qi = this._visitors.length;
    const spot = tileCenter(2.3 - qi * 0.7 + Math.random() * 0.15, 2.5 - qi * 0.12);
    const body = this.scene.add.sprite(door.x, door.y, texKey).setOrigin(0.5, 1).setScale(WORKER_SCALE * 0.92).setDepth(workerDepth(door.y)).setAlpha(0);
    body.setInteractive({ useHandCursor: true });
    const visitor = { body, thanked: false };
    body.on("pointerdown", () => this._onVisitorTap(visitor));
    this._visitors.push(visitor);
    const walk = (tx, ty, done) => {
      const dist = Math.hypot(tx - body.x, ty - body.y);
      body.setFlipX(tx < body.x);
      const hop = this.scene.tweens.add({ targets: body, scaleY: WORKER_SCALE * 0.98, scaleX: WORKER_SCALE * 0.86, yoyo: true, repeat: -1, duration: 130 });
      this.scene.tweens.add({ targets: body, x: tx, y: ty, duration: Math.max(400, (dist / 50) * 1000), ease: "Sine.easeInOut",
        onUpdate: () => body.setDepth(workerDepth(body.y)),
        onComplete: () => { hop.stop(); if (body.active) { body.setScale(WORKER_SCALE * 0.92); done(); } } });
    };
    this.scene.tweens.add({ targets: body, alpha: 1, duration: 200 });
    walk(spot.x, spot.y, () => {
      // 창구 앞에서 잠깐 기다리며 표를 낸다
      this.scene.time.delayedCall(1800 + Math.random() * 1500, () => {
        if (!body.active) return;
        this._flyBallotToBox();
        this.effects.deskPop(body.x, body.y - 48);
        walk(door.x, door.y, () => {
          this.scene.tweens.add({ targets: body, alpha: 0, duration: 200, onComplete: () => body.destroy() });
        });
      });
    });
  }

  _onVisitorTap(visitor) {
    const { body } = visitor;
    if (!body.active || this._camDragging) return;
    const LINES = ["투표하러 왔어요", "줄이 기네요…", "믿고 맡깁니다", "빨리 끝내 주세요", "개표 잘 보고 있어요"];
    this.effects.float({ text: `"${LINES[(Math.random() * LINES.length) | 0]}"`, x: body.x, y: body.y - 58, color: "#ffe9c0" });
    this.scene.tweens.add({ targets: body, scaleX: WORKER_SCALE * 1.05, scaleY: WORKER_SCALE * 0.8, yoyo: true, duration: 90 });
    if (!visitor.thanked) {
      visitor.thanked = true;
      this.gameState.data.trust = Math.min(100, (this.gameState.data.trust || 0) + 0.3);
      this.effects.float({ text: "믿음 +0.3", x: body.x, y: body.y - 76, color: "#ff9ac0" });
    }
  }

  // 카메라: 핀치로 1.0~1.6배 확대, 확대 상태에서 드래그로 이동. 탭은 pointerdown에서 이미 처리되므로 드래그 임계(12px)로 구분한다.
  _setupCameraGestures() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    if (scene.input.pointer2 === undefined || !scene.input.pointer2) scene.input.addPointer(1);
    this._camZoom = 1;
    this._camDragging = false;
    let dragStart = null;
    let pinchStart = null;
    const baseZoom = () => scene.renderBase?.zoom || 1;
    const clampScroll = () => {
      const z = this._camZoom;
      const maxX = (GAME_W * (1 - 1 / z)) / 2 * 1.0;
      const maxY = (844 * (1 - 1 / z)) / 2;
      const bx = scene.renderBase?.baseScrollX || 0, by = (scene.renderBase?.baseScrollY || 0) + (this._camTarget || 0);
      cam.scrollX = Phaser.Math.Clamp(cam.scrollX, bx - maxX, bx + maxX);
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY, by - maxY, by + maxY);
    };
    this._onCamMove = (pointer) => {
      const p1 = scene.input.pointer1, p2 = scene.input.pointer2;
      if (p1?.isDown && p2?.isDown) {
        const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (!pinchStart) pinchStart = { d, zoom: this._camZoom };
        else {
          this._camZoom = Phaser.Math.Clamp(pinchStart.zoom * (d / pinchStart.d), 1, 1.6);
          cam.setZoom(baseZoom() * this._camZoom);
          clampScroll();
          this._camDragging = true;
        }
        return;
      }
      pinchStart = null;
      if (!pointer.isDown || this._camZoom <= 1.001) return;
      if (!dragStart) { dragStart = { x: pointer.x, y: pointer.y, sx: cam.scrollX, sy: cam.scrollY }; return; }
      const dx = pointer.x - dragStart.x, dy = pointer.y - dragStart.y;
      if (!this._camDragging && Math.hypot(dx, dy) < 12) return;
      this._camDragging = true;
      cam.scrollX = dragStart.sx - dx / cam.zoom;
      cam.scrollY = dragStart.sy - dy / cam.zoom;
      clampScroll();
    };
    this._onCamUp = () => {
      dragStart = null;
      if (!scene.input.pointer1?.isDown && !scene.input.pointer2?.isDown) pinchStart = null;
      // 드래그 직후의 pointerup이 탭으로 오인되지 않게 한 프레임 뒤 해제
      if (this._camDragging) scene.time.delayedCall(60, () => { this._camDragging = false; });
      if (this._camZoom <= 1.001) { this._camZoom = 1; cam.setZoom(baseZoom()); cam.scrollX = scene.renderBase?.baseScrollX || 0; }
    };
    scene.input.on("pointermove", this._onCamMove);
    scene.input.on("pointerup", this._onCamUp);
    // 더블탭: 줌 리셋
    let lastTap = 0;
    scene.input.on("pointerdown", (pointer, over) => {
      const now = scene.time.now;
      if (now - lastTap < 280 && this._camZoom > 1.001 && !(over && over.length)) {
        this._camZoom = 1; cam.setZoom(baseZoom()); cam.scrollX = scene.renderBase?.baseScrollX || 0; cam.scrollY = (scene.renderBase?.baseScrollY || 0) + (this._camTarget || 0);
      }
      lastTap = now;
    });
  }

  // ── 직원 모션 ──
  // 작업 루프: 제자리에서 타이핑하듯 몸이 납작해졌다 펴지는 squash·stretch(프레임 교체와 겹쳐 리듬이 생긴다)
  _startWorkLoop(worker) {
    const { body, badge } = worker;
    if (!body || !body.active) return;
    this.scene.tweens.killTweensOf([body, badge]);
    body.setScale(WORKER_SCALE).setPosition(worker.home.x, worker.home.y).setDepth(workerDepth(worker.home.y));
    body.setFlipX(worker.facing === "left");
    if (body.anims) body.anims.timeScale = 1;
    badge.setScale(1).setPosition(worker.home.x + 14, worker.home.y - 54).setDepth(workerDepth(worker.home.y) + 1);
    worker.shadow.setPosition(worker.home.x, worker.home.y + 1);
    worker.busy = false;
    if (motionReduced()) return;
    const delay = Math.random() * 500;
    this.scene.tweens.add({ targets: body, scaleY: WORKER_SCALE * 0.962, scaleX: WORKER_SCALE * 1.035, yoyo: true, repeat: -1, duration: 400, delay, ease: "Sine.easeInOut" });
    this.scene.tweens.add({ targets: badge, y: badge.y - 2, yoyo: true, repeat: -1, duration: 800, delay, ease: "Sine.easeInOut" });
  }

  // 걷기: 목표 지점까지 총총(짧은 바운스) 이동. 깊이·배지·그림자가 따라간다.
  _walkWorker(worker, tx, ty, done) {
    const { body, badge } = worker;
    if (!body || !body.active) return;
    worker.busy = true;
    this.scene.tweens.killTweensOf([body, badge]);
    body.setScale(WORKER_SCALE).setFlipX(tx < body.x);
    if (body.anims) body.anims.timeScale = 1.8;
    const dist = Math.hypot(tx - body.x, ty - body.y);
    const duration = Math.max(320, (dist / 58) * 1000);
    const hop = this.scene.tweens.add({ targets: body, scaleY: WORKER_SCALE * 1.06, scaleX: WORKER_SCALE * 0.95, yoyo: true, repeat: -1, duration: 125, ease: "Sine.easeInOut" });
    this.scene.tweens.add({
      targets: body, x: tx, y: ty, duration, ease: "Sine.easeInOut",
      onUpdate: () => {
        body.setDepth(workerDepth(body.y));
        badge.setPosition(body.x + 14, body.y - 54).setDepth(workerDepth(body.y) + 1);
        worker.shadow.setPosition(body.x, body.y + 1);
      },
      onComplete: () => {
        hop.stop();
        if (!body.active) return;
        body.setScale(WORKER_SCALE);
        if (body.anims) body.anims.timeScale = 1;
        done();
      },
    });
  }

  // 심부름: 접수창구 밖 직원 한 명이 표 뭉치를 창구 앞 더미까지 가져다 놓고 돌아온다
  _courierRun() {
    if (motionReduced()) return;
    const pool = Object.values(this._workers).filter((w) => !w.busy && w.facId !== "desk" && w.body?.active);
    if (!pool.length) return;
    const worker = pool[(Math.random() * pool.length) | 0];
    const pile = workerPos("desk");
    const tx = pile.x + (Math.random() * 20 - 10) + 18;
    const ty = pile.y + 14;
    this._walkWorker(worker, tx, ty, () => {
      this.effects.ballots({ x: tx, y: ty - 34, count: 3 });
      this._flyBallotToBox();
      this.scene.time.delayedCall(420, () => {
        if (!worker.body?.active) return;
        this._walkWorker(worker, worker.home.x, worker.home.y, () => this._startWorkLoop(worker));
      });
    });
  }

  // 현장 배치 직원 — 담당(시너지) 시설 앞 타일에서 타이핑 루프. 직급 배지는 머리 위 오버레이.
  _syncWorkers() {
    const deployed = this.gameState.staffSlots ? this.gameState.staffSlots() : [];
    const variants = WORLD_ATLAS.workers.variants;
    Object.entries(this._workers).forEach(([id, worker]) => {
      if (deployed.includes(id)) return;
      this.scene.tweens.killTweensOf([worker.body, worker.badge]);
      worker.body.destroy();
      worker.badge.destroy();
      worker.shadow.destroy();
      delete this._workers[id];
    });
    deployed.forEach((id) => {
      const staffIndex = staffDefinitions.findIndex((item) => item.id === id);
      const staff = staffDefinitions[staffIndex];
      if (!staff) return;
      const rank = staffRankForLevel(this.gameState.staffLevel(id));
      const facId = FACILITY_SLOTS[staff.synergy?.facility] ? staff.synergy.facility : "desk";
      const slot = FACILITY_SLOTS[facId];
      const pos = workerPos(facId);
      const variant = staffIndex % variants;
      let worker = this._workers[id];
      if (!worker) {
        const shadow = this.scene.add.rectangle(pos.x, pos.y + 1, 1, 1, 0x000000, 0).setDepth(workerDepth(pos.y) - 1); // 그림자는 스프라이트에 포함
        const body = this.scene.add.sprite(pos.x, pos.y, workerSpriteKey(variant, 0)).setOrigin(0.5, 1).setScale(0).setDepth(workerDepth(pos.y));
        body.setFlipX(slot.facing === "left");
        body.play(`worker-type-${variant}`);
        body.setInteractive({ useHandCursor: true });
        body.on("pointerdown", () => this._onWorkerTap(id));
        const badge = this.scene.add.text(pos.x + 14, pos.y - 54, rank.tier ? String(rank.tier) : "", { fontFamily: '"Jua", sans-serif', fontSize: "11px", color: "#4a2600", backgroundColor: "#ffc53d", padding: { x: 4, y: 1 } }).setOrigin(0.5, 1).setScale(0).setDepth(workerDepth(pos.y) + 1);
        worker = { facId, rank: rank.tier, body, badge, shadow, home: { x: pos.x, y: pos.y }, facing: slot.facing, busy: false };
        this._workers[id] = worker;
        this.scene.tweens.add({ targets: body, scaleX: WORKER_SCALE, scaleY: WORKER_SCALE, duration: 280, ease: "Back.easeOut", onComplete: () => this._startWorkLoop(worker) });
        this.scene.tweens.add({ targets: badge, scaleX: 1, scaleY: 1, duration: 280, ease: "Back.easeOut" });
        this.effects.deskPop(pos.x, pos.y - 30);
      } else if (worker.rank !== rank.tier) {
        worker.rank = rank.tier;
        worker.badge.setText(String(rank.tier));
        if (!worker.busy) {
          this.scene.tweens.killTweensOf([worker.body, worker.badge]);
          worker.body.setScale(WORKER_SCALE);
          this.scene.tweens.add({ targets: worker.body, scaleX: WORKER_SCALE * 1.2, scaleY: WORKER_SCALE * 1.2, yoyo: true, duration: 180, ease: "Back.easeOut", onComplete: () => this._startWorkLoop(worker) });
        }
        this.effects.float({ text: `★ ${rank.name} 승급!`, x: worker.body.x, y: worker.body.y - 56, color: "#ffd34d" });
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
    const { x, y } = randomFloorPoint(1.5);
    const halo = this.scene.add.circle(x, y, 22, 0xffe9a8, 0.18).setDepth(4998);
    this._itemHalo = halo;
    this._itemHaloT = this.scene.tweens.add({ targets: halo, scale: 1.4, alpha: 0.05, yoyo: true, repeat: -1, duration: 700, ease: "Sine.easeInOut" });
    const txt = this.scene.add.image(x, y, ...iconRef(def.icon)).setOrigin(0.5).setDepth(5001).setInteractive({ useHandCursor: true });
    this._item = txt;
    txt.setScale(0);
    this.scene.tweens.add({ targets: txt, scale: 0.5, duration: 260, ease: "Back.easeOut" });
    this._itemBob = this.scene.tweens.add({ targets: txt, y: y - 10, yoyo: true, repeat: -1, duration: 900, ease: "Sine.easeInOut", delay: 270 });
    // 비서 Lv2 — 필드 아이템 자동 줍기
    if (this.gameState.autoAideLevel && this.gameState.autoAideLevel() >= 2) {
      this.scene.time.delayedCall(2200, () => {
        if (!this._item || this._item !== txt) return;
        const res = this.gameState.applyRandomItem(def.id, { fever: false });
        this.effects.float({ text: `비서 · ${res.text}`, x, y: y - 30, color: "#ffe3a8" });
        this._despawnItem();
        this._scheduleItem(25000 + Math.random() * 20000);
      });
    }
    txt.on("pointerdown", () => {
      if (!this._item) return;
      const res = this.gameState.applyRandomItem(def.id);
      this.effects.float({ text: res.text, x, y: y - 30, color: "#ffe3a8" });
      this.effects.deskPop(x, y);
      document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "coin" }));
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
    // 구역 돌파 시 외신 극찬 반응(진입 배너 뒤에 이어서) — 성취를 외신이 확인
    if (this._prevArea != null && d.stage.area > this._prevArea) {
      this.scene.time.delayedCall(1900, () => {
        if (this.gov?.active) this._pressFlash({ outlet: "월드 프레스", text: `'${d.stage.area}구역 개표국' 승승장구 — 세계가 주목`, tone: "praise" });
      });
    }
    if (this._prevArea !== d.stage.area) this._syncSign(d.stage.area, this._prevArea != null && d.stage.area > this._prevArea);
    this._prevArea = d.stage.area;
    this._applyEra(d.stage.area);
    this._syncBadges();
    const st = govStageFor(d);
    if (st !== this._govStage) {
      this._govStage = st;
      this.gov.setTexture(govSpriteKey(st));
    }
    this.bigNum.setText(shortNumber(d.votes));
    const cps = this.gameState.cps ? this.gameState.cps() : 0;
    const fever = this.gameState.feverActive ? this.gameState.feverActive() : false;
    const feverProfile = fever && this.gameState.feverProfile ? this.gameState.feverProfile() : null;
    const finisher = fever && this.gameState.feverFinisherUsed ? this.gameState.feverFinisherUsed() : false;
    this.bigNum.setColor(fever ? "#ffd34d" : "#ffffff");
    this.bigNum.setShadow(3, 3, fever ? "#ef7d57" : "#b13e53", 0, true, true);
    this.cpsText
      .setText(`${fever ? `${finisher ? "막판 총력" : feverProfile.name}` : "▶"} · 초당 ${cps < 10000 ? cps.toFixed(0) : shortNumber(cps)}표`)
      .setColor(fever ? "#ffe3a8" : "#bcd0e0");
    if (fever && !this._feverWasActive) {
      this.scene.tweens.killTweensOf(this.bigNum);
      this.bigNum.setScale(1.25);
      this.scene.tweens.add({ targets: this.bigNum, scale: 1, duration: 240, ease: "Back.easeOut" });
    }
    this._feverWasActive = fever;
    this._syncTitlePlate(d);
    this._syncCosmetics(d);
    this._syncWorkers();
    this._syncProps();
  }

  // 장착한 꾸미기 + 선택 캐릭터 시그니처를 국장 위 오버레이로 표시. 위치/스케일은 update에서 국장에 글루.
  _syncCosmetics(d) {
    // 꾸미기·시그니처 오버레이 — 국장과 같은 캔버스·앵커로 만든 벡터 PNG(world/cos-*, world/sig-*)를 국장 위에 글루
    const slots = ["hat", "face", "sig"];
    for (const slot of slots) {
      const id = slot === "sig"
        ? (this.gameState.currentCharacter ? this.gameState.currentCharacter().sig : null)
        : (this.gameState.equippedCosmetic ? this.gameState.equippedCosmetic(slot) : null);
      let spr = this._cosSprites[slot];
      if (!id) { if (spr) spr.setVisible(false); continue; }
      const key = `world/${id}`;
      if (!this.scene.textures.exists(key)) { if (spr) spr.setVisible(false); continue; }
      if (!spr) {
        spr = this.scene.add.image(this.gov.x, this.gov.y, key).setOrigin(0.5, 1).setScale(GOV_SCALE).setDepth(workerDepth(GROUND_Y) + 1);
        this._cosSprites[slot] = spr;
      }
      if (spr.texture.key !== key) spr.setTexture(key);
      spr.setVisible(true);
    }
  }

  // 대표 칭호 명패 갱신 — 바뀌면 톡 튀는 연출(새 발령/승진이 캐릭터에 보이게)
  _syncTitlePlate(d) {
    if (!this.titlePlate) return;
    const td = this.gameState.equippedTitleDef ? this.gameState.equippedTitleDef() : null;
    if (!td) { this.titlePlate.setVisible(false); this._titleId = null; return; }
    const lv = (d.titles && d.titles[td.id]) || 0;
    this.titlePlate.setText(`${td.name}${lv > 1 ? ` Lv.${lv}` : ""}`);
    this.titlePlate.setColor(RARITY_COLOR[td.rarity] || "#ffd479");
    this.titlePlate.setVisible(true);
    if (this._titleId !== td.id) {
      this._titleId = td.id;
      this.scene.tweens.killTweensOf(this.titlePlate);
      this.titlePlate.setScale(0.4);
      this.scene.tweens.add({ targets: this.titlePlate, scale: 1, duration: 320, ease: "Back.easeOut" });
    }
  }

  update() {
    // 꾸미기 오버레이를 국장에 글루(bob/제스처/스쿼시 트윈 따라가게)
    if (this.gov && this._cosSprites) {
      for (const slot of ["hat", "face", "sig"]) {
        const spr = this._cosSprites[slot];
        if (!spr || !spr.visible) continue;
        spr.x = this.gov.x; spr.y = this.gov.y;
        spr.scaleX = this.gov.scaleX; spr.scaleY = this.gov.scaleY;
        spr.flipX = this.gov.flipX;
      }
    }
  }

  destroy() {
    this.gameState.off("changed", this._onChanged);
    this.gameState.off("float", this._onFloat);
    this.gameState.off("ballots", this._onBallots);
    this.gameState.off("upgraded", this._onUpgraded);
    this.gameState.off("milestone", this._onMilestone);
    this.gameState.off("celebrate", this._onCelebrate);
    this.gameState.off("cider", this._onCider);
    document.removeEventListener("gp:sheet-top", this._onSheetTop);
    this.scene.input.off("pointerdown", this._onPointer);
    document.removeEventListener("gp:event-resolved", this._onEventResolved);
    document.removeEventListener("gp:central-visual", this._onCentralVisual);
    this._incomeTimer?.remove();
    this._speakTimer?.remove();
    this._pressTimer?.remove();
    this._courierTimer?.remove();
    this._studioTimer?.remove();
    this._pileTimer?.remove();
    this._visitorTimer?.remove();
    (this._pileSprites || []).forEach((o) => o.destroy());
    this._pileZone?.destroy();
    (this._visitors || []).forEach((v) => { this.scene.tweens.killTweensOf(v.body); v.body.destroy(); });
    this.scene.input.off("pointermove", this._onCamMove);
    this.scene.input.off("pointerup", this._onCamUp);
    Object.keys(this._propIdle || {}).forEach((id) => { const t = this._propIdle[id]; if (t) { t.stop(); t.remove?.(); } });
    if (this._flashDot) { this.scene.tweens.killTweensOf(this._flashDot); this._flashDot.destroy(); this._flashDot = null; }
    this._goldenTimer?.remove();
    this._itemTimer?.remove();
    this._comboTimer?.remove();
    this._govIdleTimer?.remove();
    this._speakTimer?.remove();
    this._despawnGolden();
    this._despawnItem();
    // 무한 반복 트윈 정리 — 파괴된 오브젝트를 계속 갱신하지 않게(BUG-04)
    if (this.titleHint) this.scene.tweens.killTweensOf(this.titleHint);
    if (this.board) this.scene.tweens.killTweensOf(this.board);
    this.scene.tweens.killTweensOf(this.gov);
    this.gov?.destroy();
    this.bigNum?.destroy();
    this.bigSub?.destroy();
    this.cpsText?.destroy();
    this.comboText?.destroy();
    this.bg?.destroy();
    this.room?.destroy();
    this.titleBg?.destroy();
    this.titleTop?.destroy();
    this.titleMain?.destroy();
    this.titleHint?.destroy();
    this.titleZone?.destroy();
    this.boardText?.destroy();
    Object.values(this.propLabels || {}).forEach((t) => t.destroy());
    (this._backlogPile || []).forEach((b) => b.destroy());
    if (this._backlogBadge) { this.scene.tweens.killTweensOf(this._backlogBadge); this._backlogBadge.destroy(); }
    (this.props || []).forEach((p) => p.destroy());
    Object.values(this._workers || {}).forEach((worker) => {
      this.scene.tweens.killTweensOf([worker.body, worker.badge]);
      worker.body.destroy();
      worker.badge.destroy();
      worker.shadow.destroy();
    });
    Object.values(this._workerShadows || {}).forEach((s) => s.destroy());
    this.effects.destroy();
  }
}

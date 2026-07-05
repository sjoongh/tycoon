import { WorldEffects } from "./WorldEffects.js";
import { govTextureKey, govStageFor } from "./dotChar.js";
import { staffDefinitions } from "../data/staff.js";
import { eraTheme } from "../data/regions.js";
import { pickRandomItem } from "../data/items.js";
import { pickPress } from "../data/worldPress.js";
import { RARITY_COLOR } from "../data/titles.js";
import { shortNumber } from "../utils/format.js";

// 거지키우기식 심플 월드: 미니멀 픽셀 배경 + 중앙 도트 국장 + 큰 숫자 + 바닥.
// (구 버전의 이소 오피스 다이어그램·화분·시계·창문·워커·시설 스테이션은 전부 제거)
const GAME_W = 390;
const GROUND_Y = 492;   // 국장 발이 닿는 바닥선
const GOV_SCALE = 6;    // 16px 도트 → 96px 표시
const GOV_BOB_MS = 900;
const PROP_SCALE = 4;   // 16px 소품 → 64px
const BACK_SCALE = PROP_SCALE * 0.74; // 뒤쪽 선반(원근감 위해 작게)
const SHELF_Y = GROUND_Y - 12;        // 뒤쪽 선반(카운터) 라인 — 국장보다 뒤
const BACK_DEPTH = 88;                // 국장(100)보다 뒤 → 캐릭터를 절대 안 가림
// 채용된 직원이 서는 바닥 슬롯 — 설비(선반 x: 46/122/268/344)·국장(195) 사이 빈 곳에 작게
const WORKER_SLOTS = [84, 160, 230, 306, 40, 350];
const WORKER_SCALE = 3;
const WORKER_Y = GROUND_Y + 4; // 바닥선(설비 선반보다 앞·아래)
const SORTER_SCALE = BACK_SCALE; // 분류기도 뒷줄 동일 스케일
// 국장 풍자 대사(개표국 이슈 위트, 정치 중립)
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
      .image(GAME_W / 2, GROUND_Y, govTextureKey(gameState.data))
      .setOrigin(0.5, 1)
      .setScale(GOV_SCALE)
      .setDepth(100);
    this._govStage = govStageFor(gameState.data);
    this._cosSprites = {}; // 꾸미기 오버레이 슬롯별 스프라이트(국장에 글루)
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

    // 국장 대표 칭호 명패(인사 발령 뽑기 결과 — 머리 위에 직급 표시, 꾸미기)
    this.titlePlate = scene.add
      .text(GAME_W / 2, 380, "", {
        fontFamily: '"Galmuri9", monospace', fontSize: "10px", color: "#ffd479",
        backgroundColor: "rgba(20,18,28,0.78)", padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(121)
      .setVisible(false);
    this._titleId = null;

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
    this._propTier = {}; // 시설별 시각 티어(승급 색 진화 추적)

    this._onChanged = () => this._refresh();
    this._onFloat = (p) => this.effects.float(p);
    this._onBallots = (p) => this.effects.ballots(p);
    this._onUpgraded = (facility) => { this._squishGov(); this._pulseProp(facility); };
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
    gameState.on("celebrate", this._onCelebrate);
    // 사이다! 정의구현 순간 — 통쾌한 연출
    this._onCider = (p) => this._ciderMoment(p);
    gameState.on("cider", this._onCider);

    // 하단 패널 높이에 맞춰 카메라를 위로 스크롤 — 국장·시설·초당표가 패널에 절대 안 잘리게(BUG2).
    // WORLD_BOTTOM = cps 라벨 하단(GROUND_Y+34). 패널 top이 그보다 위면 그 차이만큼 카메라를 올린다.
    this._onSheetTop = (e) => {
      const WORLD_BOTTOM = GROUND_Y + 34;
      const target = Math.max(0, WORLD_BOTTOM - e.detail.topGame + 6);
      if (Math.abs((this._camTarget ?? -1) - target) < 1) return;
      this._camTarget = target;
      scene.tweens.add({ targets: scene.cameras.main, scrollY: target, duration: 180, ease: "Quad.easeOut" });
    };
    document.addEventListener("gp:sheet-top", this._onSheetTop);
    // 패널이 먼저 브로드캐스트한 초기값을 즉시 반영(초기 이벤트 유실 방지) + 재브로드캐스트 요청
    if (typeof gameState.uiSheetTopGame === "number") this._onSheetTop({ detail: { topGame: gameState.uiSheetTopGame } });
    document.dispatchEvent(new CustomEvent("gp:world-ready"));

    // 실화 모티프 사건 해결 시 월드에 "📺 속보" 배너 연출
    this._onEventResolved = (e) => {
      if (!e.detail) return;
      if (e.detail.real) this._newsFlash(e.detail.title);
      if (e.detail.firstSeen) this.gameState.emit("float", { text: "📖 도감 수집!", x: 195, y: 500, color: "#ffd479" });
    };
    document.addEventListener("gp:event-resolved", this._onEventResolved);

    // 캔버스에 도달한 빈 공간 탭만 득표로 처리(하단 DOM 패널은 자체 처리)
    this._onPointer = (pointer, currentlyOver) => {
      if (currentlyOver && currentlyOver.length) return;
      gameState.processClick(pointer.x, pointer.y);
      this._squishGov();
      this._punchNum();
      this._bumpCombo();
      this.effects.deskPop(GAME_W / 2, GROUND_Y - 30);
      this._flyBallotToBox(); // 처리한 표가 투표함으로 날아가 모인다(의미 + 손맛)
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
          // 패시브 생산도 표가 투표함으로 모인다
          this._flyBallotToBox();
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
    // 구역 전환 플래시 — 픽셀답게 짧고 옅게(스텝 페이드), 잔상 최소화
    const f = this.scene.add.rectangle(GAME_W / 2, 422, GAME_W, 844, 0xffe9a8, 0.32).setDepth(200);
    this.scene.tweens.add({ targets: f, alpha: 0, duration: 240, ease: "Quad.easeOut", onComplete: () => f.destroy() });
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

  // 개표소 설비 — 국장 뒤쪽 '선반' 한 줄에 균등 배치(국장은 앞 중앙 단독, 안 가림).
  _buildProps() {
    this.props = [];
    // 뒤쪽 선반(카운터) 바 — 설비들이 놓인 받침. 캐릭터보다 뒤 depth.
    this._shelf = this.scene.add.graphics().setDepth(86);
    this._shelf.fillStyle(0x000000, 0.35); this._shelf.fillRect(0, SHELF_Y - 1, GAME_W, 4); // 그림자
    this._shelf.fillStyle(0x1f2750, 1); this._shelf.fillRect(0, SHELF_Y, GAME_W, 6);          // 선반 상판
    this._shelf.fillStyle(0x333c57, 1); this._shelf.fillRect(0, SHELF_Y + 6, GAME_W, 2);      // 하이라이트

    const place = (key, px, scale = BACK_SCALE) => {
      const s = this.scene.add.image(px, SHELF_Y, key).setOrigin(0.5, 1).setScale(scale).setDepth(BACK_DEPTH);
      this.props.push(s);
      return s;
    };
    // 한 줄 균등 배치 — 가운데(국장 자리)는 비우고 좌2·우2가 또렷이 보이게
    this.ballotbox = place("prop-ballotbox", 46);  // 접수 투표함(desk)
    this.sorter    = place("prop-sorter", 122);    // 투표지 분류기(sorter)
    this.papers    = place("prop-papers", 268);    // 기록 서류더미(archive)
    this.board     = place("prop-board", 344);     // 개표 상황판(server)
    this._boardBlink = this.scene.tweens.add({ targets: this.board, alpha: 0.8, yoyo: true, repeat: -1, duration: 700, ease: "Sine.easeInOut" });

    // 상황판 LED 실시간 개표 현황
    this.boardText = this.scene.add
      .text(344, SHELF_Y - 42, "", { fontFamily: '"Galmuri9", monospace', fontSize: "8px", color: "#73eff7", align: "center" })
      .setOrigin(0.5)
      .setDepth(89);

    // 시설 레벨 뱃지(설비 아래) — 업그레이드가 화면에 숫자로 보이게
    this.propLabels = {};
    const mkLabel = (obj, id) => {
      const t = this.scene.add
        .text(obj.x, SHELF_Y + 9, "", { fontFamily: '"Galmuri9", monospace', fontSize: "8px", color: "#9fb8d0" })
        .setOrigin(0.5, 0)
        .setDepth(90);
      this.propLabels[id] = t;
    };
    mkLabel(this.ballotbox, "desk");
    mkLabel(this.sorter, "sorter");
    mkLabel(this.papers, "archive");
    mkLabel(this.board, "server");
  }

  // 시설 시각 티어(0~3): 레벨 10/25/40에서 승급 — 색이 기본→은→금으로 진화
  _propTierFor(l) { return l >= 40 ? 3 : l >= 25 ? 2 : l >= 10 ? 1 : 0; }
  _tierTint(t) { return t >= 3 ? 0xffe9a8 : t >= 2 ? 0xd8e0ff : 0xffffff; }

  // 각 장비를 대응 시설 레벨에 맞춰 키운다(시설 업그레이드가 화면에 보이게)
  //  투표함←접수(desk) · 서류더미←기록(archive) · 상황판←전산(server)
  _syncProps() {
    const lvl = (id) => (this.gameState.level ? this.gameState.level(id) : 0);
    // 뒷줄 선반 기준(BACK_SCALE)에서 레벨에 따라 완만히 성장 — 너무 커져 옆을 침범하지 않게 +0.4 상한
    const grow = (l) => BACK_SCALE * (1 + Math.min(0.4, l / 50));
    this._tweenScale(this.ballotbox, grow(lvl("desk")));
    this._tweenScale(this.papers, grow(lvl("archive")));
    this._tweenScale(this.board, grow(lvl("server")));
    this._tweenScale(this.sorter, grow(lvl("sorter")));

    // 시설 레벨 뱃지 + 티어 색 진화(승급 시 번쩍 + 알림)
    const PROP_OF = { desk: this.ballotbox, archive: this.papers, server: this.board, sorter: this.sorter };
    const TIER_NAME = ["", "은장", "금장", "명품"];
    Object.entries(PROP_OF).forEach(([id, obj]) => {
      if (!obj) return;
      const l = lvl(id);
      const label = this.propLabels[id];
      if (label) label.setText(l > 0 ? `Lv.${l}` : "");
      const t = this._propTierFor(l);
      if (this._propTier[id] === undefined) {
        this._propTier[id] = t;
        obj.setTint(this._tierTint(t));
      } else if (t !== this._propTier[id]) {
        const up = t > this._propTier[id];
        this._propTier[id] = t;
        obj.setTint(this._tierTint(t));
        if (up && t > 0) {
          const s = obj.scaleX;
          this.scene.tweens.add({ targets: obj, scaleX: s * 1.3, scaleY: s * 1.3, yoyo: true, duration: 180, ease: "Back.easeOut" });
          this.effects.float({ text: `★ ${TIER_NAME[t]} 승급!`, x: obj.x, y: obj.y - 56, color: "#ffd34d" });
        }
      }
    });

    // 상황판 실시간 개표 현황(구역 진행률)
    if (this.boardText) {
      const d = this.gameState.data;
      const pct = Math.min(100, Math.round((d.stage.progress / d.stage.target) * 100));
      this.boardText.setText(`${d.stage.area}구역\n개표 ${pct}%`);
    }
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

  // 처리한 표 한 장이 국장 → 좌측 투표함으로 포물선을 그리며 날아가 모인다
  _flyBallotToBox() {
    if (!this.ballotbox || this._flying > 6) return; // 동시 비행 표 상한(성능)
    this._flying = (this._flying || 0) + 1;
    const sx = GAME_W / 2 + (Math.random() * 30 - 15);
    const sy = GROUND_Y - 86;
    const tx = this.ballotbox.x + (Math.random() * 10 - 5);
    const ty = this.ballotbox.y - this.ballotbox.displayHeight * 0.6;
    const b = this.scene.add.image(sx, sy, "ballot").setDepth(150).setScale(0);
    this.scene.tweens.add({ targets: b, scale: 0.42, duration: 110, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: b, x: tx, angle: -160, duration: 440, ease: "Sine.easeIn" });
    this.scene.tweens.add({
      targets: b, y: ty - 34, duration: 220, yoyo: true, ease: "Sine.easeOut",
      onComplete: () => {
        this._flying = Math.max(0, (this._flying || 1) - 1);
        this.scene.tweens.killTweensOf(b); // 동시 x/scale 트윈이 파괴된 오브젝트를 만지지 않게(BUG-08)
        b.destroy();
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

  // 실화 사건 해결 속보 배너 — 상단에서 붉은 띠가 펼쳐지며 사건명을 흘린다
  _newsFlash(title) {
    const y = 150;
    const bar = this.scene.add.rectangle(GAME_W / 2, y, GAME_W, 28, 0xb13e53, 0.96).setDepth(200).setScale(1, 0).setScrollFactor(0);
    const live = this.scene.add.rectangle(40, y, 52, 28, 0x14121c, 1).setDepth(201).setScale(1, 0).setScrollFactor(0);
    const liveTx = this.scene.add.text(40, y, "● 속보", { fontFamily: '"Galmuri9", monospace', fontSize: "9px", color: "#ff6a7c" }).setOrigin(0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
    const tx = this.scene.add.text(96, y, `${title || "개표국 사건"}`, { fontFamily: '"Galmuri9", monospace', fontSize: "10px", color: "#ffffff" }).setOrigin(0, 0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
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

  // 사이다! 정의구현 순간 — 큰 "🔥 사이다!" + 국장 반격 대사 + 외신 극찬 + 축포 + 점프.
  _ciderMoment(p) {
    const cx = GAME_W / 2;
    // 큰 사이다 텍스트(금색, 팝)
    const big = this.scene.add.text(cx, 262, "🔥 사이다!", { fontFamily: '"Galmuri14", monospace', fontSize: "26px", color: "#ffd34d" }).setOrigin(0.5).setDepth(210).setScale(0.4).setScrollFactor(0);
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
    const top = this.scene.add.text(12, y - 10, `📰 외신 · ${item.outlet}`, { fontFamily: '"Galmuri9", monospace', fontSize: "9px", color: accent }).setOrigin(0, 0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
    const head = this.scene.add.text(12, y + 8, item.text, { fontFamily: '"Galmuri9", monospace', fontSize: "10px", color: "#ffffff", wordWrap: { width: GAME_W - 24 } }).setOrigin(0, 0.5).setDepth(202).setAlpha(0).setScrollFactor(0);
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
      this.effects.float({ text: `"${txt}"`, x: GAME_W / 2, y: 372, color: "#ff9a8e" }); // 불안한 붉은톤
      return;
    }
    // 45% 확률로 현재 성장 단계 전용 대사, 아니면 공통 풀에서 — 캐릭터 성장이 말에도 드러나게
    const stageLines = GOV_LINES_BY_STAGE[this._govStage] || [];
    const pool = (stageLines.length && Math.random() < 0.45) ? stageLines : GOV_LINES;
    const txt = pool[(Math.random() * pool.length) | 0];
    this.effects.float({ text: `"${txt}"`, x: GAME_W / 2, y: 372, color: "#ffe9c0" });
  }

  // 큰 성취 반응 — 기쁜 점프 + 환호 대사(밝은 금색으로 평소 대사와 구분)
  _govReact() {
    if (!this.gov || !this.gov.active) return;
    const txt = GOV_REACT_LINES[(Math.random() * GOV_REACT_LINES.length) | 0];
    this.effects.float({ text: `"${txt}"`, x: GAME_W / 2, y: 360, color: "#ffd479" });
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
    const y = 180 + Math.random() * 200 + (this._camTarget || 0); // 카메라 스크롤 보정 — 화면 안 스폰 보장
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
      document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "coin" }));
      this._despawnGolden();
      this._scheduleGolden(60000 + Math.random() * 60000);
    });
    // 비서 Lv3 — 잠시 후 자동 수령(80%). 직접 탭하면 100%라 수동이 여전히 이득.
    if (this.gameState.autoAideLevel && this.gameState.autoAideLevel() >= 3) {
      this.scene.time.delayedCall(2600, () => {
        if (!this._golden || this._golden !== disc) return;
        const reward = this.gameState.collectGoldenBallot(0.8);
        this.effects.float({ text: `🤖 +${shortNumber(reward)}`, x, y: y - 28, color: "#ffd34d" });
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

  // 채용된 직원을 바닥에 도트 일꾼으로 등장시킨다(직원별 색, 등장 팝 + bob).
  _syncWorkers() {
    staffDefinitions.forEach((s, i) => {
      if (i >= WORKER_SLOTS.length) return;
      const lv = this.gameState.staffLevel ? this.gameState.staffLevel(s.id) : 0;
      if (lv > 0 && !this._workers[s.id]) {
        const sx = WORKER_SLOTS[i];
        const sh = this.scene.add.rectangle(sx, WORKER_Y + 1, 26, 7, 0x000000, 0.4).setDepth(110);
        this._workerShadows[s.id] = sh;
        const w = this.scene.add.image(sx, WORKER_Y, "worker-mini")
          .setOrigin(0.5, 1).setScale(0).setDepth(111).setTint(lightenColor(s.color || 0xffffff, 0.35));
        this._workers[s.id] = w;
        this.scene.tweens.add({ targets: w, scaleX: WORKER_SCALE, scaleY: WORKER_SCALE, duration: 280, ease: "Back.easeOut" });
        this.scene.tweens.add({ targets: w, y: WORKER_Y - 3, yoyo: true, repeat: -1, duration: 640 + i * 70, ease: "Sine.easeInOut", delay: 120 + i * 90 });
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
    const y = 170 + Math.random() * 160 + (this._camTarget || 0); // 카메라 스크롤 보정
    const halo = this.scene.add.circle(x, y, 22, 0xffe9a8, 0.18).setDepth(4998);
    this._itemHalo = halo;
    this._itemHaloT = this.scene.tweens.add({ targets: halo, scale: 1.4, alpha: 0.05, yoyo: true, repeat: -1, duration: 700, ease: "Sine.easeInOut" });
    const txt = this.scene.add.text(x, y, def.icon, { fontSize: "30px" }).setOrigin(0.5).setDepth(5001).setInteractive({ useHandCursor: true });
    this._item = txt;
    txt.setScale(0);
    this.scene.tweens.add({ targets: txt, scale: 1, duration: 260, ease: "Back.easeOut" });
    this._itemBob = this.scene.tweens.add({ targets: txt, y: y - 10, yoyo: true, repeat: -1, duration: 900, ease: "Sine.easeInOut", delay: 270 });
    // 비서 Lv2 — 필드 아이템 자동 줍기
    if (this.gameState.autoAideLevel && this.gameState.autoAideLevel() >= 2) {
      this.scene.time.delayedCall(2200, () => {
        if (!this._item || this._item !== txt) return;
        const res = this.gameState.applyRandomItem(def.id);
        this.effects.float({ text: `🤖 ${res.text}`, x, y: y - 30, color: "#ffe3a8" });
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
    this._prevArea = d.stage.area;
    this._applyEra(d.stage.area);
    const st = govStageFor(d);
    if (st !== this._govStage) {
      this._govStage = st;
      this.gov.setTexture(`gov-${st}`);
    }
    this.bigNum.setText(shortNumber(d.votes));
    const cps = this.gameState.cps ? this.gameState.cps() : 0;
    this.cpsText.setText(`▶ 초당 ${cps < 10000 ? cps.toFixed(0) : shortNumber(cps)}표`);
    this._syncTitlePlate(d);
    this._syncCosmetics(d);
    this._syncWorkers();
    this._syncProps();
  }

  // 장착한 꾸미기 + 선택 캐릭터 시그니처를 국장 위 오버레이로 표시. 위치/스케일은 update에서 국장에 글루.
  _syncCosmetics(d) {
    const slots = ["hat", "face", "sig"];
    for (const slot of slots) {
      const id = slot === "sig"
        ? (this.gameState.currentCharacter ? this.gameState.currentCharacter().sig : null)
        : (this.gameState.equippedCosmetic ? this.gameState.equippedCosmetic(slot) : null);
      let spr = this._cosSprites[slot];
      if (!id) { if (spr) spr.setVisible(false); continue; }
      const key = id; // 텍스처 키 = cosmetic id(cos-*)
      if (!spr) {
        spr = this.scene.add.image(this.gov.x, this.gov.y, key).setOrigin(0.5, 1).setScale(GOV_SCALE).setDepth(102);
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
    this.titlePlate.setText(`${td.emoji} ${td.name}${lv > 1 ? ` Lv.${lv}` : ""}`);
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
    this.gameState.off("celebrate", this._onCelebrate);
    this.gameState.off("cider", this._onCider);
    document.removeEventListener("gp:sheet-top", this._onSheetTop);
    this.scene.input.off("pointerdown", this._onPointer);
    document.removeEventListener("gp:event-resolved", this._onEventResolved);
    this._incomeTimer?.remove();
    this._speakTimer?.remove();
    this._pressTimer?.remove();
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
    this.titleBg?.destroy();
    this.titleTop?.destroy();
    this.titleMain?.destroy();
    this.titleHint?.destroy();
    this.titleZone?.destroy();
    this.boardText?.destroy();
    Object.values(this.propLabels || {}).forEach((t) => t.destroy());
    (this.props || []).forEach((p) => p.destroy());
    Object.values(this._workers || {}).forEach((w) => { this.scene.tweens.killTweensOf(w); w.destroy(); });
    Object.values(this._workerShadows || {}).forEach((s) => s.destroy());
    this.effects.destroy();
  }
}

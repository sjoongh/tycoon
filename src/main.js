import Phaser from "phaser";
import "./style.css";
import "./ui/dom-ui.css";
import { GAME_HEIGHT, GAME_WIDTH } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { PreloadScene } from "./scenes/PreloadScene.js";
import { DOMHud } from "./ui/DOMHud.js";
import { DOMBottomPanel } from "./ui/DOMBottomPanel.js";
import { DOMModalLayer } from "./ui/DOMModalLayer.js";
import { DOMMapModal } from "./ui/DOMMapModal.js";
import { DOMSettings } from "./ui/DOMSettings.js";
import { GameState } from "./state/GameState.js";
import { Sfx } from "./audio/sfx.js";
import { Notifications } from "./notifications.js";
import { initNative } from "./native.js";
import { initCloud, openLeaderboard, saveCloud, submitScore, logEvt } from "./cloud.js";

const gameState = new GameState();
const sfx = new Sfx(gameState);
const notifications = new Notifications(gameState);
let cloudInitPromise = null;
let cloudStartTimer = null;
const startCloud = () => {
  if (cloudInitPromise) return cloudInitPromise;
  clearTimeout(cloudStartTimer);
  window.removeEventListener("pointerdown", startCloud, true);
  window.removeEventListener("keydown", startCloud, true);
  cloudInitPromise = initCloud(gameState);
  return cloudInitPromise;
};
// Firebase는 첫 화면·폰트와 네트워크를 다투지 않게 첫 사용자 의도에서 시작한다.
// 사용자가 가만히 있어도 5초 뒤에는 동기화를 시작해 멀티기기 세이브를 계속 보장한다.
window.addEventListener("pointerdown", startCloud, { once: true, capture: true, passive: true });
window.addEventListener("keydown", startCloud, { once: true, capture: true });
cloudStartTimer = setTimeout(startCloud, 5000);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// 앱이 백그라운드/종료될 때 재방문 알림 예약(권한·Triggers 지원 시에만, 아니면 안전 무동작)
const scheduleReengage = () => { notifications.schedule().catch(() => {}); };
window.addEventListener("pagehide", scheduleReengage);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") scheduleReengage(); });
// 웹에서도 클라우드 저장이 실제로 올라가도록 — 화면 이탈 시 + 5분 주기(스로틀)
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { try { saveCloud(); } catch {} } });
window.addEventListener("pagehide", () => { try { saveCloud(); } catch {} });
setInterval(() => { try { saveCloud(); } catch {} }, 5 * 60 * 1000);

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#14121c",
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, GameScene],
  callbacks: {
    preBoot: (g) => g.registry.set("gameState", gameState),
  },
};

const game = new Phaser.Game(config);
if (import.meta.env.DEV) window.__game = game;

const uiLayer = document.createElement("div");
uiLayer.className = "gp-ui";
document.getElementById("game").appendChild(uiLayer);

// 안드로이드 앱 백그라운드 전환 시 세이브 보장용 훅(로컬 + 클라우드)
window.__gpSave = () => { try { gameState.save(false); saveCloud(); } catch {} };

// 랭킹은 클라우드 준비 후 연다. 첫 입력 전이라도 이 경로가 초기화를 보장한다.
document.addEventListener("gp:open-leaderboard", () => {
  openLeaderboard(startCloud());
});

// gameState는 preBoot에서 registry에 동기 주입되므로 폴링 없이 바로 마운트
game.events.once("ready", () => {
  new DOMHud(gameState, notifications).mount(uiLayer);
  new DOMBottomPanel(gameState).mount(uiLayer);
  new DOMModalLayer(gameState, notifications).mount(uiLayer);
  new DOMMapModal(gameState).mount(uiLayer);
  new DOMSettings(gameState, notifications).mount(uiLayer);
  sfx.mount();
  // 네이티브(안드로이드) 통합 — 웹에서는 no-op
  initNative();
  // 구역이 오를 때 랭킹 점수 갱신 + 분석
  let _prevArea = gameState.data.stage.area;
  gameState.on("changed", () => {
    if (gameState.data.stage.area > _prevArea) {
      _prevArea = gameState.data.stage.area;
      submitScore();
      logEvt("area_up", { area: _prevArea });
    }
  });
  // 주요 게임 이벤트 분석 로깅
  gameState.on("comm-collapse", () => logEvt("communist_collapse", {}));
  gameState.on("dex-milestone", (p) => logEvt("dex_milestone", { n: p?.n }));
});

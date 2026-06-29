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
import { GameState } from "./state/GameState.js";
import { Sfx } from "./audio/sfx.js";
import { Notifications } from "./notifications.js";
import { initNative } from "./native.js";

const gameState = new GameState();
const sfx = new Sfx(gameState);
const notifications = new Notifications(gameState);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// 앱이 백그라운드/종료될 때 재방문 알림 예약(권한·Triggers 지원 시에만, 아니면 안전 무동작)
const scheduleReengage = () => { notifications.schedule().catch(() => {}); };
window.addEventListener("pagehide", scheduleReengage);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") scheduleReengage(); });

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

// 안드로이드 앱 백그라운드 전환 시 세이브 보장용 훅
window.__gpSave = () => { try { gameState.save(false); } catch {} };

// gameState는 preBoot에서 registry에 동기 주입되므로 폴링 없이 바로 마운트
game.events.once("ready", () => {
  new DOMHud(gameState, notifications).mount(uiLayer);
  new DOMBottomPanel(gameState).mount(uiLayer);
  new DOMModalLayer(gameState, notifications).mount(uiLayer);
  new DOMMapModal(gameState).mount(uiLayer);
  sfx.mount();
  // 네이티브(안드로이드) 통합 — 웹에서는 no-op
  initNative();
});

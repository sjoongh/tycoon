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
import { GameState } from "./state/GameState.js";

const gameState = new GameState();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#241a2e",
  pixelArt: false,
  roundPixels: true,
  antialias: true,
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

// gameState는 preBoot에서 registry에 동기 주입되므로 폴링 없이 바로 마운트
game.events.once("ready", () => {
  new DOMHud(gameState).mount(uiLayer);
  new DOMBottomPanel(gameState).mount(uiLayer);
  new DOMModalLayer(gameState).mount(uiLayer);
});

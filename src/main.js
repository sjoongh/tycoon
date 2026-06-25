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
  backgroundColor: "#f6ead0",
  pixelArt: false,
  roundPixels: true,
  antialias: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, GameScene],
};

const game = new Phaser.Game(config);
if (import.meta.env.DEV) window.__game = game;

const uiLayer = document.createElement("div");
uiLayer.className = "gp-ui";
document.getElementById("game").appendChild(uiLayer);

game.events.once("ready", () => {
  const tryMount = () => {
    const gameState = game.registry.get("gameState");
    if (!gameState) return setTimeout(tryMount, 50);
    new DOMHud(gameState).mount(uiLayer);
    new DOMBottomPanel(gameState).mount(uiLayer);
    new DOMModalLayer(gameState).mount(uiLayer);
  };
  tryMount();
});

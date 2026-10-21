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
import { DOMUpdatePrompt } from "./ui/DOMUpdatePrompt.js";
import { GameState } from "./state/GameState.js";
import { ServiceWorkerUpdateController } from "./pwa/ServiceWorkerUpdateController.js";
import { Sfx } from "./audio/sfx.js";
import { Notifications } from "./notifications.js";
import { initNative } from "./native.js";
import { initCloud, openLeaderboard, saveCloud, submitScore, logEvt } from "./cloud.js";
import { mirrorNativeSave, restoreNativeSave, seedLocalStorageFromDurableSave } from "./state/persistence.js";
import { createDebounced } from "./state/saveWinner.js";

// Android 동기 슬롯이 더 최신이면 GameState가 localStorage를 읽기 전에 복구한다.
seedLocalStorageFromDurableSave();
const gameState = new GameState();
// Android: localStorage 유실 대비 동기 SharedPreferences 이중 기록 + 구버전 비동기 미러 복원
gameState.persistMirror = mirrorNativeSave;
restoreNativeSave(gameState);
const sfx = new Sfx(gameState);
const notifications = new Notifications(gameState);
const pwaUpdates = new ServiceWorkerUpdateController({ save: () => gameState.save(false) });
const CLOUD_START_DEADLINE_MS = 5000;
const CLOUD_INPUT_SETTLE_MS = 750;
const CLOUD_IDLE_TIMEOUT_MS = 500;
let cloudInitPromise = null;
let cloudDeadlineTimer = null;
let cloudSettleTimer = null;
let cloudIdleHandle = null;
const cancelCloudSchedule = () => {
  clearTimeout(cloudDeadlineTimer);
  clearTimeout(cloudSettleTimer);
  cloudDeadlineTimer = null;
  cloudSettleTimer = null;
  if (cloudIdleHandle !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(cloudIdleHandle);
  cloudIdleHandle = null;
};
const startCloud = () => {
  if (cloudInitPromise) return cloudInitPromise;
  cancelCloudSchedule();
  window.removeEventListener("pointerdown", scheduleCloudStart, true);
  window.removeEventListener("keydown", scheduleCloudStart, true);
  cloudInitPromise = initCloud(gameState);
  return cloudInitPromise;
};
// 첫 조작은 게임 프레임에 양보한다. 입력이 잠잠해진 뒤 브라우저 idle에서 시작하되,
// 사용자가 계속 연타해도 페이지 진입 5초에는 반드시 클라우드 동기화를 시작한다.
function scheduleCloudStart() {
  if (cloudInitPromise) return;
  clearTimeout(cloudSettleTimer);
  if (cloudIdleHandle !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(cloudIdleHandle);
  cloudIdleHandle = null;
  cloudSettleTimer = setTimeout(() => {
    cloudSettleTimer = null;
    if ("requestIdleCallback" in window) {
      cloudIdleHandle = window.requestIdleCallback(() => {
        cloudIdleHandle = null;
        startCloud();
      }, { timeout: CLOUD_IDLE_TIMEOUT_MS });
    } else {
      startCloud();
    }
  }, CLOUD_INPUT_SETTLE_MS);
}
window.addEventListener("pointerdown", scheduleCloudStart, { capture: true, passive: true });
window.addEventListener("keydown", scheduleCloudStart, { capture: true });
cloudDeadlineTimer = setTimeout(startCloud, CLOUD_START_DEADLINE_MS);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    pwaUpdates.register("/sw.js").catch(() => {});
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") pwaUpdates.check().catch(() => {});
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
// 구매·감사·구역 완료 등 즉시 저장(persist)이 일어나면 10초 디바운스로 클라우드에도 올린다
const cloudSync = createDebounced(() => { try { saveCloud(); } catch {} }, 10_000);
gameState.on("persist", () => cloudSync.request());
window.addEventListener("pagehide", () => cloudSync.flush());

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#141a33",
  pixelArt: false,
  roundPixels: false,
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
if (import.meta.env.DEV) {
  window.__game = game;
  window.__phaserBuild = __GAEPYO_PHASER_BUILD__;
}

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
  new DOMUpdatePrompt(gameState, pwaUpdates).mount(uiLayer);
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
  gameState.on("event-chain-ending", (p) => logEvt("event_chain_ending", {
    chain: p?.chainId,
    ending: p?.id,
    route: p?.route,
    first: !!p?.firstDiscovery,
  }));
  gameState.on("staff-deployment", (p) => logEvt("staff_deployment", {
    staff: p?.id,
    action: p?.action,
    auto: !!p?.auto,
    count: p?.slots?.length || 0,
  }));
});

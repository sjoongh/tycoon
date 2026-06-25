import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
await p.waitForTimeout(3500);
const r = await p.evaluate(() => {
  const g = window.__game;
  const scenes = g.scene.scenes.map(s => ({
    key: s.scene.key,
    active: s.scene.isActive(),
    visible: s.scene.isVisible(),
    status: s.sys.settings.status,
    ptr: s.input ? s.input.listenerCount("pointerdown") : "noinput",
  }));
  // simulate a real DOM pointer event on canvas
  const cv = document.querySelector("canvas");
  let fired = "n/a";
  const gs = g.registry.get("gameState");
  const tc0 = gs.data.stats.totalClicks;
  const rect = cv.getBoundingClientRect();
  ["pointerdown","mousedown"].forEach(type => {
    cv.dispatchEvent(new MouseEvent(type, { clientX: rect.left+195, clientY: rect.top+380, bubbles: true }));
  });
  fired = gs.data.stats.totalClicks > tc0 ? "yes" : "no";
  return { scenes, domEventFiredClick: fired };
});
console.log(JSON.stringify(r));
await b.close();

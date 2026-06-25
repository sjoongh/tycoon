import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
await p.waitForTimeout(3500);
const r = await p.evaluate(() => {
  const g = window.__game;
  if (!g) return { err: "no __game" };
  const gs = g.registry.get("gameState");
  const sc = g.scene.getScene("GameScene");
  const out = {
    hasGS: !!gs,
    clickPower: gs ? gs.clickPower() : null,
    votesBefore: gs ? gs.data.votes : null,
    sceneActive: sc ? sc.scene.isActive() : null,
    inputEnabled: sc ? sc.input.enabled : null,
    pointerListeners: sc && sc.input ? sc.input.listenerCount("pointerdown") : null,
  };
  // call processClick directly
  if (gs) { gs.processClick(195, 380); out.votesAfterDirectClick = gs.data.votes; out.totalClicks = gs.data.stats.totalClicks; }
  return out;
});
console.log(JSON.stringify(r));
await b.close();

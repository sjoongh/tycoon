import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
const check = async (t) => {
  await p.waitForTimeout(t);
  return p.evaluate(() => {
    const g=window.__game; const gs=g.registry.get("gameState");
    const gsc=g.scene.getScene("GameScene");
    return { ms: performance.now()|0, gameSceneActive: gsc.scene.isActive(), ptr: gsc.input.listenerCount("pointerdown"), totalClicks: gs.data.stats.totalClicks };
  });
};
console.log("at2s", JSON.stringify(await check(2000)));
console.log("at5s", JSON.stringify(await check(3000)));
console.log("at8s", JSON.stringify(await check(3000)));
// now tap 10x
for (let i=0;i<10;i++) await p.mouse.click(195, 400);
await p.waitForTimeout(300);
const after = await p.evaluate(() => window.__game.registry.get("gameState").data.stats.totalClicks);
console.log("totalClicksAfter10Taps", after);
await b.close();

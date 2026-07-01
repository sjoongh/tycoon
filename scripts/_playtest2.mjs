import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded"});
// wait until GameScene active
for (let i=0;i<30;i++){ const ok=await p.evaluate(()=>{const g=window.__game;const s=g&&g.scene.getScene("GameScene");return s&&s.scene.isActive();}); if(ok)break; await p.waitForTimeout(300); }
const st = () => p.evaluate(()=>{const d=window.__game.registry.get("gameState").data;return {votes:Math.round(d.votes),explain:Math.round(d.explain),trust:Math.round(d.trust),area:d.stage.area,prog:Math.round(d.stage.progress),target:d.stage.target,desk:d.facilities.desk,clicks:d.stats.totalClicks};});
console.log("start", JSON.stringify(await st()));
for(let i=0;i<30;i++) await p.mouse.click(195,400);
await p.waitForTimeout(200);
console.log("after30taps", JSON.stringify(await st()));
await p.waitForTimeout(20000); // 20s passive
console.log("after20s", JSON.stringify(await st()));
// upgrade desk repeatedly
for(let i=0;i<8;i++){ await p.click('[data-action="upgradeFac"]').catch(()=>{}); await p.waitForTimeout(150); }
console.log("after8upgrades", JSON.stringify(await st()));
// advance stage if possible
await p.click('[data-action="advanceStage"]').catch(()=>{});
await p.waitForTimeout(300);
console.log("afterAdvance", JSON.stringify(await st()));
await b.close();

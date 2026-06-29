import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for(const [w,h,name] of [[393,873,"pixel"],[800,1280,"tablet"]]){
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1500);
  for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(120);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(120);}else break;}
  await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.facilities={desk:20,sorter:15,archive:15,server:20};gs.data.staff={clerk:2,auditor:1};gs.data.stats.totalClicks=10;gs.emit("changed");const wv=window.__game.scene.keys.GameScene.world;if(wv._refresh)wv._refresh();});
  await p.waitForTimeout(500);
  await p.screenshot({ path:`/tmp/gp-and-${name}.png` });
  await p.close();
}
await b.close();
console.log("done");

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(160);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(160);}else break;}
// 온보딩 끝까지 — 남은 모달 닫기
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState"); if(gs.data.tutorial) gs.data.tutorial.done=true;});
async function era(a,file){await p.evaluate((ar)=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=ar;gs.data.votes=1e7;gs.emit("changed");},a);await p.waitForTimeout(700);await p.screenshot({path:file});}
await era(2,"/tmp/gp-t-force.png");
await era(5,"/tmp/gp-t-red.png");
await era(8,"/tmp/gp-t-demo.png");
console.log("errs:",errs.length);
await b.close();

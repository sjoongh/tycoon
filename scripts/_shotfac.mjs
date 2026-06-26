import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(160);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(160);}else break;}
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState"); if(gs.data.tutorial)gs.data.tutorial.done=true; gs.data.facilities.desk=22; gs.data.facilities.archive=18; gs.data.facilities.server=20; gs.emit("changed");});
await p.waitForTimeout(4500); // 배너 사라질 때까지
// 남은 모달 닫기
for(let i=0;i<4;i++){const x=await p.$(".gp-modal .gp-btn, .gp-skip");if(x){await x.click().catch(()=>{});await p.waitForTimeout(200);}}
await p.waitForTimeout(500);
await p.screenshot({path:"/tmp/gp-fac.png"});
console.log("errs:",errs.length);
await b.close();

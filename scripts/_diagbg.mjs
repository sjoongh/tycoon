import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:900,height:860},deviceScaleFactor:1});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(1800);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(120);}if(!(await p.$(".gp-modal-ov")))break;}
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=5;gs.emit("changed");});
await p.waitForTimeout(2800); // 전환 플래시 완전 소멸
await p.screenshot({path:"/tmp/gp-diagbg.png"});
console.log("done");
await b.close();

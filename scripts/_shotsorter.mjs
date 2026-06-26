import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState"); if(gs.data.tutorial)gs.data.tutorial.done=true; gs.emit("changed");});
await p.waitForTimeout(4500);
for(let i=0;i<4;i++){const x=await p.$(".gp-modal .gp-btn, .gp-skip");if(x){await x.click().catch(()=>{});await p.waitForTimeout(200);}}
await p.waitForTimeout(500);
await p.screenshot({path:"/tmp/gp-sorter.png"});
console.log("errs:",errs.length);
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1600);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(120);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(120);}
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=9.87e16;gs.emit("changed");});
await p.waitForTimeout(700);
await p.screenshot({path:"/tmp/gp-bignum.png"});
console.log("errs:",errs.length);
await b.close();

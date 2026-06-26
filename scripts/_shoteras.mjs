import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(180);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(180);}else break;}
async function era(a,file){await p.evaluate((ar)=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=ar;gs.data.votes=1e7;gs.emit("changed");},a);await p.waitForTimeout(900);await p.screenshot({path:file});}
await era(4,"/tmp/gp-era4.png");
await era(12,"/tmp/gp-era12.png");
console.log("errs:",errs.length);
await b.close();

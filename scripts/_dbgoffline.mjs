import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1500);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(100);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(100);}
const key=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e9;gs.data.explain=1e8;return Object.keys(localStorage).find(k=>k.includes("trust")||k.includes("office"));});
console.log("saveKey:",key);
const before=await p.evaluate((k)=>{const gs=window.__game.registry.get("gameState");gs.save(false);const d=JSON.parse(localStorage.getItem(k));const cps=gs.cps?gs.cps():0;d.lastSeenAt=Date.now()-3*3600000;localStorage.setItem(k,JSON.stringify(d));return {cps,lastSeen:d.lastSeenAt,now:Date.now()};},key);
console.log("before reload:",JSON.stringify(before));
await p.reload({waitUntil:"networkidle"}); await p.waitForTimeout(2200);
const after=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");return {offlineReward:gs.offlineReward?{elapsed:gs.offlineReward.elapsed,votes:Math.round(gs.offlineReward.votes)}:null, modals:document.querySelectorAll(".gp-modal-ov").length};});
console.log("after reload:",JSON.stringify(after));
console.log("errs:",errs.length); errs.slice(0,4).forEach(e=>console.log(" ",e));
await b.close();

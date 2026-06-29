import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(200);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(200);}else break;}
await p.evaluate(async ()=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=6;const mod=await import("/src/data/events.js");mod.officeEvents.slice(0,20).forEach(e=>gs.markEventSeen(e.id));gs.data.eventReadyAt=Date.now()+30000;gs.emit("changed");});
await p.waitForTimeout(200);
const tab = await p.$('.gp-tab[data-tab="events"]'); if(tab){await tab.click();await p.waitForTimeout(400);}
await p.screenshot({ path:"/tmp/gp-evtab.png" });
const line = await p.evaluate(()=>{const e=document.querySelector(".gp-dexline");return e?e.textContent:null;});
console.log("errs:",errs.length,"dexline:",JSON.stringify(line));
await b.close();

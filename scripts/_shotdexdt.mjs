import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(200);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(200);}else break;}
await p.evaluate(async ()=>{
  const gs=window.__game.registry.get("gameState"); gs.data.stage.area=8; gs.data.votes=5e7;
  const mod=await import("/src/data/events.js");
  mod.officeEvents.forEach((ev,i)=>{if(i%2===0)gs.markEventSeen(ev.id);});
  gs.markEventSeen("phishing-text"); gs.emit("changed");
});
await p.waitForTimeout(300);
await p.evaluate(()=>document.dispatchEvent(new CustomEvent("gp:open-map")));
await p.waitForTimeout(500);
// 사칭문자 셀 클릭
const clicked = await p.evaluate(()=>{ const c=document.querySelector('.gp-dex__cell[data-dexid="phishing-text"]'); if(c){c.click();return true;} return false; });
await p.waitForTimeout(400);
await p.screenshot({ path:"/tmp/gp-dexdt.png" });
const info = await p.evaluate(()=>({ clicked: !!document.querySelector('.gp-dex__cell[data-dexid="phishing-text"]'), detail: !!document.querySelector(".gp-dexdt"), body: (document.querySelector(".gp-dexdt__body")||{}).textContent }));
console.log("errs:",errs.length,"clicked:",clicked,JSON.stringify(info));
// 닫기 테스트
await p.evaluate(()=>{ const x=document.querySelector(".gp-dexdt__x"); if(x)x.click(); });
await p.waitForTimeout(200);
const closed = await p.evaluate(()=>!document.querySelector(".gp-dexdt") && !document.querySelector(".gp-map-ov").hidden);
console.log("closedDetailMapStillOpen:", closed);
await b.close();

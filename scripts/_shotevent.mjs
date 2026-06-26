import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(200);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(200);}
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=6;gs.data.votes=1e7;gs.data.explain=1e6;gs.data.eventReadyAt=0;gs.emit("changed");});
// 사건 탭
for(const t of await p.$$(".gp-tab")){if((await t.innerText()).includes("사건")){await t.click();break;}}
await p.waitForTimeout(500);
let real=false;
for(let i=0;i<20 && !real;i++){
  await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.eventReadyAt=0;});
  const g=await p.$("[data-action=getEvent]"); if(g){await g.click().catch(()=>{});await p.waitForTimeout(350);}
  if(await p.$(".gp-event__real")){real=true;break;}
  // 실화 아니면 좌측 선택으로 닫기
  const c=await p.$("[data-action=eventChoice]"); if(c){await c.click().catch(()=>{});await p.waitForTimeout(300);}
}
await p.waitForTimeout(400);
await p.screenshot({path:"/tmp/gp-event.png"});
console.log("real배지:",real,"errs:",errs.length); errs.slice(0,5).forEach(e=>console.log("  "+e));
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(1800);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(150);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(150);}
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=6;gs.data.votes=1e10;gs.data.explain=1e9;gs.data.eventReadyAt=0;gs.emit("changed");});
for(const t of await p.$$(".gp-tab")){if((await t.innerText()).includes("사건")){await t.click();break;}}
await p.waitForTimeout(400);
let real=false;
for(let i=0;i<20 && !real;i++){
  await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.eventReadyAt=0;gs.data.votes=1e10;gs.data.explain=1e9;});
  const g=await p.$("[data-action=getEvent]"); if(g){await g.click().catch(()=>{});await p.waitForTimeout(250);}
  if(await p.$(".gp-event__real")){real=true;break;}
  const c=await p.$("[data-action=eventChoice]"); if(c){await c.click().catch(()=>{});await p.waitForTimeout(250);}
}
// 실화 이벤트 좌측 선택 → 속보 배너 발동
const c=await p.$("[data-action=eventChoice]"); if(c)await c.click().catch(()=>{});
await p.waitForTimeout(600);
await p.screenshot({path:"/tmp/gp-news.png"});
console.log("real:",real,"errs:",errs.length); errs.slice(0,5).forEach(e=>console.log("  "+e));
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push("PAGEERR:"+e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("CONSOLE:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:30000});
await p.waitForTimeout(1800);
const log=[];
const gv=(fn)=>p.evaluate(fn);
// 온보딩 스킵
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(150);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(150);}
const clickByText=async(txt)=>{for(const btn of await p.$$("button")){const t=(await btn.innerText().catch(()=>""));if(t.includes(txt)){await btn.click().catch(()=>{});return true;}}return false;};
const tab=async(name)=>{for(const t of await p.$$(".gp-tab")){if((await t.innerText()).includes(name)){await t.click();await p.waitForTimeout(250);return;}}};

// 1) 자원 주입 + 전 구역/시설 성장 시뮬
await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e12;gs.data.explain=1e10;gs.emit("changed");});
await tab("시설"); await clickByText("MAX");
for(const fac of ["접수","분류","홍보","전산","기록","브리핑"]){
  // 시설 카드 선택 후 업그레이드
  for(const f of await p.$$(".gp-fac")){if((await f.innerText()).includes(fac)){await f.click().catch(()=>{});break;}}
  await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e12;gs.data.explain=1e10;});
  await clickByText("업그레이드"); await p.waitForTimeout(180);
}
log.push("시설 업그레이드 OK");

// 2) 직원 채용
await tab("직원");
await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e12;gs.data.explain=1e10;gs.emit("changed");});
for(let i=0;i<6;i++){const hired=await clickByText("표");await p.waitForTimeout(120);await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e12;gs.data.explain=1e10;});}
log.push("직원 채용 OK");

// 3) 구역 강제 돌파 + 프레스티지
await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=8;gs.data.stage.progress=gs.data.stage.target;gs.emit("changed");});
await tab("감사"); await p.waitForTimeout(300);
const beforeSeals=await gv(()=>window.__game.registry.get("gameState").data.prestige.seals);
await clickByText("초기화")||await clickByText("승급")||await clickByText("프레스티지");
await p.waitForTimeout(300);
// 확인 모달 있으면 확정
await clickByText("확인")||await clickByText("초기화");
await p.waitForTimeout(400);
const afterSeals=await gv(()=>window.__game.registry.get("gameState").data.prestige.seals);
log.push(`프레스티지: seals ${beforeSeals}→${afterSeals}`);

// 4) 사건 연쇄 해결(실화 포함)
await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=7;gs.data.votes=1e10;gs.data.explain=1e9;gs.data.eventReadyAt=0;gs.emit("changed");});
await tab("사건");
let solved=0;
for(let i=0;i<12;i++){
  await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.eventReadyAt=0;gs.data.votes=1e10;gs.data.explain=1e9;});
  const g=await p.$("[data-action=getEvent]"); if(g){await g.click().catch(()=>{});await p.waitForTimeout(220);}
  const c=await p.$("[data-action=eventChoice]"); if(c){await c.click().catch(()=>{});solved++;await p.waitForTimeout(200);}
}
log.push(`사건 해결 ${solved}건`);

// 5) 목표 탭 + 지도 모달
await tab("목표"); await p.waitForTimeout(250);
await gv(()=>document.dispatchEvent(new CustomEvent("gp:open-map"))); await p.waitForTimeout(300);
await p.keyboard.press("Escape").catch(()=>{});
const modal=await p.$(".gp-modal-ov"); if(modal){const x=await p.$(".gp-modal .gp-btn");if(x)await x.click().catch(()=>{});}
log.push("목표/지도 OK");

await p.waitForTimeout(500);
console.log("=== PLAYTHROUGH ==="); log.forEach(l=>console.log("  "+l));
console.log("ERRORS:",errs.length); errs.slice(0,15).forEach(e=>console.log("  "+e));
await b.close();

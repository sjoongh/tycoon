import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(220);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(220);}
// 자원 주입
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=8e7;gs.data.explain=8e6;gs.emit("changed");});
await p.waitForTimeout(300);
// 구매 배수 MAX 선택 후 접수창구 업그레이드 연타 → 레벨 급상승(티어 승급)
const max=(await p.$$(".gp-btn")).find(async()=>false);
// 'MAX' 텍스트 버튼 클릭
for(const btn of await p.$$("button")){const t=(await btn.innerText().catch(()=>"")); if(t.trim()==="MAX"){await btn.click().catch(()=>{});break;}}
await p.waitForTimeout(200);
for(let i=0;i<8;i++){
  let done=false;
  for(const btn of await p.$$("button")){const t=(await btn.innerText().catch(()=>"")); if(t.includes("업그레이드")){await btn.click().catch(()=>{}); done=true; break;}}
  await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=8e7;gs.data.explain=8e6;});
  await p.waitForTimeout(250);
  if(!done)break;
}
await p.waitForTimeout(600);
await p.screenshot({path:"/tmp/gp-fac.png"});
console.log("errs:",errs.length); errs.slice(0,6).forEach(e=>console.log("  "+e));
await b.close();

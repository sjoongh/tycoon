import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1300);
const r=await p.evaluate(()=>{
  const gs=window.__game.registry.get("gameState");
  gs.data.staff.clerk=4; const cp4=gs.clickPower();
  gs.data.staff.clerk=5; const cp5=gs.clickPower();
  gs.data.staff.clerk=6; const cp6=gs.clickPower();
  return {cp4,cp5,cp6, skillActive5:gs.staffSkillActive("clerk")};
});
// Lv5부터 skill.clickBonus(=lv*1) 추가되어 Lv4→Lv5 증가폭이 base보다 커야
console.log(JSON.stringify(r));
console.log("Lv5 스킬발동:",r.skillActive5,"/ Lv4→5 증가:",(r.cp5-r.cp4).toFixed(1),"(스킬 미발동 Lv 증가분보다 큼)","errs:",errs.length);
await b.close();

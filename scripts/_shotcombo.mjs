import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
const r=await p.evaluate(()=>{
  const gs=window.__game.registry.get("gameState");
  const cp=gs.clickPower(); const before=gs.data.votes;
  for(let i=0;i<20;i++) gs.processClick(195,400);
  return {combo:gs.clickCombo(), clickPower:cp, gained:gs.data.votes-before, expectedNoBonus:cp*20};
});
console.log("errs:",errs.length,"combo:",r.combo,"gained:",r.gained,"vs no-bonus:",r.expectedNoBonus,"→ bonus working:",r.gained>r.expectedNoBonus);
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errs=[];
async function shot(w,h,file,setup){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
  p.on("pageerror",e=>errs.push(file+":"+e.message)); p.on("console",m=>{if(m.type()==="error")errs.push(file+":C:"+m.text());});
  await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1800);
  for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(140);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(140);}
  await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e9;gs.data.explain=1e8;gs.data.stage.area=5;gs.emit("changed");});
  if(setup)await setup(p);
  await p.waitForTimeout(600); await p.screenshot({path:file}); await p.close();
}
const tabClick=name=>async p=>{for(const t of await p.$$(".gp-tab")){if((await t.innerText()).includes(name)){await t.click();await p.waitForTimeout(500);break;}}};
await shot(390,844,"/tmp/gp-r-crew.png",tabClick("직원"));
await shot(390,844,"/tmp/gp-r-prestige.png",tabClick("감사"));
await shot(900,860,"/tmp/gp-r-desktop.png",null);
console.log("errs:",errs.length); errs.slice(0,8).forEach(e=>console.log("  "+e));
await b.close();

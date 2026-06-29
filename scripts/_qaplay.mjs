import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(1500);
const res=await p.evaluate(()=>{
  const gs=window.__game.registry.get("gameState");
  const issues=[]; const facIds=Object.keys(gs.data.facilities); const staffIds=Object.keys(gs.data.staff);
  let prestiges=0, items=0;
  for(let loop=0; loop<3000; loop++){
    gs.tick();
    for(let c=0;c<3;c++) gs.processClick(195,400);
    if(loop%3===0) facIds.forEach(id=>{ if(gs.isUnlocked(id)) gs.bulkUpgrade(id,"max"); });
    if(loop%4===0) staffIds.forEach(id=>gs.bulkHire(id,"max"));
    if(loop%6===0){ const it=["parcel","doc","balloon","votes","donation"][loop%5]; gs.applyRandomItem(it); items++; }
    if(gs.data.stage.progress>=gs.data.stage.target) gs.advanceStage();
    if(loop%50===0 && gs.canPrestige && gs.canPrestige()){ if(gs.prestigeReset){ gs.prestigeReset(); prestiges++; } }
    // 무결성 체크
    const d=gs.data;
    if(!isFinite(d.votes)) issues.push(`votes !finite @${loop}`);
    if(!isFinite(d.explain)) issues.push(`explain !finite @${loop}`);
    if(d.trust<0||d.trust>100||!isFinite(d.trust)) issues.push(`trust=${d.trust} @${loop}`);
    if(!isFinite(gs.cps())) issues.push(`cps !finite @${loop}`);
    if(issues.length>6) break;
  }
  return {area:gs.data.stage.area, votes:gs.data.votes, cps:gs.cps(), trust:Math.round(gs.data.trust), prestiges, items, totalUpg:gs.data.stats.totalUpgrades, issues:[...new Set(issues)]};
});
console.log("pageErrs:",errs.length, errs.slice(0,4).join(" | "));
console.log("RESULT:",JSON.stringify(res));
await b.close();

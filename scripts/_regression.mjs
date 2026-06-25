import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5e5,explain:8000,trust:78,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,engineer:1,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:8,runs:1,bestArea:5,totalSeals:8,upgrades:{procedure:3,audit:2,vault:3,staffing:1,reputation:2}},
  stats:{totalVotes:1.5e6,totalClicks:200,totalUpgrades:20,totalEvents:12,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push("PE:"+e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("CE:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(600);
// core loop
const c0=await p.evaluate(()=>window.__game.registry.get("gameState").data.stats.totalClicks);
for(let i=0;i<10;i++) await p.mouse.click(195,300);
await p.waitForTimeout(150);
const c1=await p.evaluate(()=>window.__game.registry.get("gameState").data.stats.totalClicks);
// visit every tab, render-check (no throw)
const tabResults={};
for(const tab of ["facilities","crew","events","goals","prestige"]){
  await p.evaluate((t)=>window.__game.registry.get("gameState").setTab(t), tab);
  await p.waitForTimeout(200);
  tabResults[tab]=await p.evaluate(()=>document.querySelector(".gp-panel")?.children.length||0);
}
// upgrade + advance stage paths
const okFns=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");try{
  gs.upgrade("desk"); gs.hireStaff("clerk"); gs.checkProgression();
  const nq=gs.nextQuest(); const ds=gs.dailyStatus(); const ts=gs.trustState();
  return {upgraded:true, nextQuestOk:!!nq, dailyOk:typeof ds.available==="boolean", trustState:ts, cps:Math.round(gs.cps())};
}catch(e){return {err:e.message}}});
console.log("CLICKS", c1-c0);
console.log("TABS", JSON.stringify(tabResults));
console.log("SYSTEMS", JSON.stringify(okFns));
console.log(errs.length?"ERRORS:\n"+errs.slice(0,12).join("\n"):"NO CONSOLE ERRORS");
await b.close();

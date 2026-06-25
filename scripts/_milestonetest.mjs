import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e9,explain:1e6,trust:50,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:24,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:0,runs:0,bestArea:5,totalSeals:0,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:now+9e8,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const f=(l)=>gs.facilityMilestoneFactor(l);
  // desk at 24 (factor1) vs 25 (factor2) vs 50 (factor4): cps should jump at thresholds only
  gs.data.facilities.desk=24; const cps24=gs.cps();
  gs.data.facilities.desk=25; const cps25=gs.cps();
  gs.data.facilities.desk=49; const cps49=gs.cps();
  gs.data.facilities.desk=50; const cps50=gs.cps();
  return {f24:f(24),f25:f(25),f50:f(50),f100:f(100),next24:gs.nextFacilityMilestone(24),next25:gs.nextFacilityMilestone(25),next60:gs.nextFacilityMilestone(60),
    cps24:Math.round(cps24),cps25:Math.round(cps25),cps49:Math.round(cps49),cps50:Math.round(cps50)};
});
console.log("MILESTONE", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

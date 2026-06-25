import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5e5,explain:50000,trust:30,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:now+9e8,briefReadyAt:0,briefEndsAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const cost=gs.briefCost();
  const e0=Math.round(gs.data.explain), t0=Math.round(gs.data.trust), cps0=Math.round(gs.cps());
  const ok=gs.activateBrief();
  const e1=Math.round(gs.data.explain), t1=Math.round(gs.data.trust), cps1=Math.round(gs.cps());
  const offline=Math.round(gs.cpsFor(gs.data)); // no buff
  const active=gs.briefActive(), ready=gs.briefReady();
  const ok2=gs.activateBrief(); // cooldown
  return {cost, explainSpent:e0-e1, trustGain:t1-t0, cpsRatio:+(cps1/cps0).toFixed(2), offlineCps:offline, activated:ok, active, readyAfter:ready, secondActivate:ok2};
});
console.log("BRIEF", JSON.stringify(r));
const btn=await p.evaluate(()=>document.querySelector(".gp-brief")?.className);
console.log("BTN",btn);
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

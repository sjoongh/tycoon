import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5e5,explain:8000,trust:50,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:now+9e8,rushReadyAt:0,rushEndsAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const cpsBefore=gs.cps();
  const readyBtnHtml=document.querySelector(".gp-rush")?.className;
  const ok=gs.activateRush();
  const cpsAfter=gs.cps();
  const offlineCps=gs.cpsFor(gs.data); // offline path — should NOT include rush
  const active=gs.rushActive(), ready=gs.rushReady(), cd=Math.round(gs.rushCooldownRemainingMs()/1000);
  // second activate should fail (on cooldown)
  const ok2=gs.activateRush();
  return {cpsBefore:Math.round(cpsBefore),cpsAfter:Math.round(cpsAfter),ratio:+(cpsAfter/cpsBefore).toFixed(2),offlineCps:Math.round(offlineCps),activated:ok,active,readyAfter:ready,cdSec:cd,secondActivate:ok2,readyBtnClassBefore:readyBtnHtml};
});
console.log("RUSH", JSON.stringify(r));
await p.waitForTimeout(300);
const btnAfter=await p.evaluate(()=>document.querySelector(".gp-rush")?.className);
console.log("BTN_AFTER",btnAfter);
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

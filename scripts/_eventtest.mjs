import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5e5,explain:8000,trust:78,days:18,paused:false,selected:"desk",activeTab:"events",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,engineer:1,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:2,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const scale=gs.eventRewardScale();
  const readyBefore=gs.eventReady();
  // apply a +votes event reward and check scaling + cooldown
  const v0=Math.round(gs.data.votes);
  gs.applyEffect({votes:170, trust:-5}); // right of inbox-rush
  const v1=Math.round(gs.data.votes);
  const readyAfter=gs.eventReady();
  const cdSec=Math.ceil(gs.eventCooldownRemainingMs()/1000);
  return {scale:+scale.toFixed(2), readyBefore, votesGain:v1-v0, expectedScaled:Math.round(170*scale), readyAfter, cdSec};
});
console.log("EVENT", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

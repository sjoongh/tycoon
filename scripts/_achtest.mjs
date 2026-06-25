import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5000,explain:100,trust:91,days:10,paused:false,selected:"desk",activeTab:"goals",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:10,sorter:6,notice:4,server:3,archive:2,studio:1},staff:{clerk:2,auditor:1,engineer:1,speaker:0},
  stage:{area:6,progress:200,target:99999,completed:5},
  prestige:{seals:0,runs:1,bestArea:6,totalSeals:0,upgrades:{}},
  stats:{totalVotes:200000,totalClicks:50,totalUpgrades:10,totalEvents:30,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},log:["개표국 개국"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");const e0=gs.data.explain,s0=gs.data.prestige.seals;gs.checkProgression();return {granted:Object.keys(gs.data.achievements).filter(k=>gs.data.achievements[k]),explainDelta:Math.round(gs.data.explain-e0),sealDelta:gs.data.prestige.seals-s0};});
console.log("ACH", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

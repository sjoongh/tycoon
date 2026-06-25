import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1000,explain:200,trust:70,days:3,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:3,sorter:1,notice:0,server:0,archive:0,studio:0},staff:{clerk:1},
  stage:{area:1,progress:300,target:1100,completed:0},
  prestige:{seals:0,runs:0,bestArea:1,totalSeals:0,upgrades:{}},
  stats:{totalVotes:400,totalClicks:50,totalUpgrades:2,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
// push totalVotes past 500 to complete first-500 quest + v100/v1000 achievements
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.stats.totalVotes=1200;gs.checkProgression();});
await p.waitForTimeout(300);
const toasts=await p.evaluate(()=>Array.from(document.querySelectorAll(".gp-toast")).map(t=>t.textContent));
console.log("TOASTS", JSON.stringify(toasts));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

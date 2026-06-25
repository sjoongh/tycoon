import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
// 오프닝은 totalClicks>0이면 안 뜸. tutorial.done=false로 코치 활성.
const seed={version:3,votes:1000,explain:200,trust:70,days:3,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:1,done:false},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:1,sorter:0,notice:0,server:0,archive:0,studio:0},staff:{clerk:0,auditor:0,engineer:0,speaker:0},
  stage:{area:1,progress:50,target:1100,completed:0},
  prestige:{seals:0,runs:0,bestArea:1,totalSeals:0,upgrades:{}},
  stats:{totalVotes:50,totalClicks:6,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(600);
const hintText=()=>p.evaluate(()=>{const h=document.querySelector(".gp-hint__txt");return h?h.textContent:"(none)";});
const setStat=(patch)=>p.evaluate((pp)=>{const gs=window.__game.registry.get("gameState");Object.assign(gs.data.stats,pp.stats||{});if(pp.staff)Object.assign(gs.data.staff,pp.staff);if(pp.tutorial)Object.assign(gs.data.tutorial,pp.tutorial);gs.emit("changed");},patch);
const out={};
out.stage_upgrade=await hintText();
await setStat({stats:{totalUpgrades:1}}); await p.waitForTimeout(150); out.stage_staff=await hintText();
await setStat({staff:{clerk:1}}); await p.waitForTimeout(150); out.stage_event=await hintText();
await setStat({stats:{totalEvents:1}}); await p.waitForTimeout(150); out.stage_none=await hintText();
await setStat({tutorial:{done:true}}); await p.waitForTimeout(150); out.done=await hintText();
console.log("COACH", JSON.stringify(out));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

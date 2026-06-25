import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e9,explain:1e6,trust:50,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:5,sorter:2,notice:1,server:1,archive:0,studio:0},staff:{clerk:1},
  stage:{area:2,progress:200,target:99999,completed:1},
  prestige:{seals:0,runs:0,bestArea:2,totalSeals:0,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(900); // let initial refresh set _lastCps
const beforeHasUp=await p.evaluate(()=>document.querySelector('[data-k="stage"]').innerHTML.includes("gp-cps--up"));
// upgrade desk a few times (big cps jump), then check
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.upgrade("desk");});
await p.waitForTimeout(120);
const afterHasUp=await p.evaluate(()=>document.querySelector('[data-k="stage"]').innerHTML.includes("gp-cps--up"));
const hasSpan=await p.evaluate(()=>!!document.querySelector(".gp-cps"));
console.log("CPSJUICE", JSON.stringify({hasSpan, beforeHasUp, afterHasUp}));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

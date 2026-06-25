import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e9,explain:1e6,trust:70,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3},
  stage:{area:5,progress:500,target:1e15,completed:4},
  prestige:{seals:200,runs:2,bestArea:5,totalSeals:200,upgrades:{}},
  stats:{totalVotes:5e5,totalClicks:0,totalUpgrades:5,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},
  endless:5,daily:{day:99999999,streak:1,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},
  weekly:{week:99999999,baseVotes:400000,target:500000,claimed:false},eventReadyAt:now+9e8,offline2xDay:99999999,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  // A) weekly after prestige: give weekly progress, then prestige, progress should NOT go stuck-negative
  gs.data.stats.totalVotes=gs.data.weekly.baseVotes+200000; // mid-week progress 200k (target 500k)
  const progBefore=gs.weeklyProgress(), claimedBefore=gs.data.weekly.claimed, wkBefore=gs.data.weekly.week;
  gs.prestigeReset();
  const progAfter=gs.weeklyProgress(), claimedAfter=gs.data.weekly.claimed, wkAfter=gs.data.weekly.week, baseAfter=gs.data.weekly.baseVotes, tvAfter=Math.round(gs.data.stats.totalVotes);
  return {progBefore, progAfter, weeklyPreserved: wkAfter===wkBefore, claimedPreserved: claimedAfter===claimedBefore, baseRealigned: baseAfter===tvAfter, progNotNegativeStuck: progAfter>=0};
});
console.log("WEEKLY_PRESTIGE", JSON.stringify(r));
// B) big numbers
const fmt=await p.evaluate(()=>{const f=window.__game.registry.get("gameState");return null;});
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

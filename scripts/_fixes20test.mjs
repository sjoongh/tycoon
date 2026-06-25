import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e6,explain:5e4,trust:70,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3},
  stage:{area:5,progress:500,target:1e12,completed:4},
  prestige:{seals:30,runs:1,bestArea:5,totalSeals:30,upgrades:{}},
  stats:{totalVotes:5e5,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},
  endless:5,daily:{day:Math.floor(new Date(now).setHours(0,0,0,0)/86400000)-1,streak:3,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},
  weekly:{week:99999,baseVotes:0,target:99999999,claimed:false},eventReadyAt:now+9e8,offline2xDay:999999999,rushReadyAt:0,rushEndsAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  // #4 offline2xDay clamped to today (was 999999999)
  const o2x=gs.data.offline2xDay, today=gs._todayIndex(), clamped=o2x<=today;
  // #2 dailyReward not buffed by rush
  const rewardNoRush=gs.dailyReward(3).votes;
  gs.activateRush();
  const rewardRush=gs.dailyReward(3).votes;
  const dailyUnbuffed=rewardNoRush===rewardRush;
  // #1 weekly target recompute on prestige (unclaimed). seed target 99999999 (high). after prestige, cps low → target lower & progress reachable
  const tBefore=gs.weeklyTarget();
  gs.prestigeReset();
  const tAfter=gs.weeklyTarget(); const baseAfter=gs.data.weekly.baseVotes, claimedAfter=gs.data.weekly.claimed;
  return {o2x, today, offline2xClamped:clamped, rewardNoRush, rewardRush, dailyUnbuffed, weeklyTargetBefore:tBefore, weeklyTargetAfter:tAfter, weeklyTargetLowered:tAfter<tBefore, weeklyClaimedAfter:claimedAfter};
});
console.log("FIXES", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

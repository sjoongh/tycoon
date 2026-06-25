import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e5,explain:5e4,trust:70,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3},
  stage:{area:5,progress:500,target:1e12,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:1e5,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},
  endless:5,daily:{day:99999999,streak:1,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},weekly:{week:99999999,baseVotes:0,target:1e18,claimed:true},eventReadyAt:now+9e8,offline2xDay:99999999,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");const w=window.__game.scene.getScene("GameScene").world;
  const cps=gs.cps();
  // reward logic
  const v0=Math.round(gs.data.votes); const rew=gs.collectGoldenBallot(); const v1=Math.round(gs.data.votes);
  // force spawn
  w._despawnGolden(); w._spawnGolden();
  const spawned=!!w._golden; const interactive=!!(w._golden && w._golden.input);
  const v2=Math.round(gs.data.votes);
  // simulate tap
  if(w._golden) w._golden.emit("pointerdown");
  const v3=Math.round(gs.data.votes); const despawned=!w._golden;
  return {cps:Math.round(cps), reward:rew, rewardMatches: rew===Math.max(50,Math.round(cps*90)), votesGainFromCollect:v1-v0, spawned, interactive, tapReward: v3-v2, despawnedAfterTap:despawned};
});
await p.screenshot({path:"/tmp/rv-golden-spawn.png"});
console.log("GOLDEN", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

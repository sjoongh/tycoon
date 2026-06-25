import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e6,explain:8000,trust:78,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now-2*3600*1000,lastSeenAt:now-2*3600*1000,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,engineer:1,speaker:1},
  stage:{area:5,progress:500,target:1e12,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:1e6,totalClicks:0,totalUpgrades:0,totalEvents:2,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:now+9e8,offline2xDay:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const rew=gs.offlineReward; // base already applied in load
  const avail1=gs.offline2xAvailable();
  const v0=Math.round(gs.data.votes);
  const bonus=gs.claimOfflineBonus(); // doubles
  const v1=Math.round(gs.data.votes);
  const avail2=gs.offline2xAvailable();
  const bonus2=gs.claimOfflineBonus(); // should be null (used + cleared)
  return {hadReward:!!rew, rewardVotes: rew?Math.round(rew.votes):0, avail1, bonusVotes: bonus?Math.round(bonus.votes):null, votesDelta:v1-v0, avail2, secondBonus:bonus2};
});
console.log("OFFLINE2X", JSON.stringify(r));
// also check the modal has 2x button (fresh load)
const modalBtns=await p.evaluate(()=>Array.from(document.querySelectorAll(".gp-modal-ov .gp-btn")).map(b=>b.textContent.trim()));
console.log("MODALBTNS", JSON.stringify(modalBtns));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

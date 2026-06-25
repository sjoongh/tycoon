import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5e5,explain:8000,trust:78,days:18,paused:false,selected:"desk",activeTab:"goals",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,runner:1,engineer:1,analyst:1,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:99999,totalClicks:0,totalUpgrades:0,totalEvents:7,totalOfflineMs:0},
  achievements:{v100:true,v1000:true},quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},
  endless:5,daily:{day:99999999,streak:1,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},
  weekly:{week:0,baseVotes:0,target:0,claimed:false},eventReadyAt:now+9e8,offline2xDay:99999999,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000}); await p.waitForTimeout(3500);
// add some weekly progress for a nicer bar
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.weeklyTarget();gs.data.stats.totalVotes=gs.data.weekly.baseVotes+Math.round(gs.weeklyTarget()*0.4);gs.emit("changed");});
await p.evaluate(()=>{const l=document.querySelector(".gp-goallist");if(l)l.scrollTop=0;});
await p.waitForTimeout(300);
await p.screenshot({path:"/tmp/rv-weekly.png"});
await b.close(); console.log("done");

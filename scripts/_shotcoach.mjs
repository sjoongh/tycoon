import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
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
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000}); await p.waitForTimeout(3500);
await p.screenshot({path:"/tmp/gp-coach.png"});
await b.close(); console.log("done");

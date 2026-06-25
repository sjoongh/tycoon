import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e8,explain:5e4,trust:80,days:5,paused:false,selected:"desk",activeTab:"prestige",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:20,sorter:12,notice:8,server:6,archive:5,studio:3},staff:{clerk:3,auditor:2,runner:1,engineer:1,analyst:1,speaker:1},
  stage:{area:8,progress:200,target:99999,completed:7},
  prestige:{seals:40,runs:2,bestArea:8,totalSeals:60,upgrades:{procedure:5,audit:4,vault:6,staffing:2,reputation:3,golden:7}},
  stats:{totalVotes:5e8,totalClicks:50,totalUpgrades:30,totalEvents:40,totalOfflineMs:0},
  achievements:{},quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},endless:3,daily:{day:99999999,streak:1,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},eventReadyAt:now+9e8,offline2xDay:99999999,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000}); await p.waitForTimeout(3500);
await p.screenshot({path:"/tmp/rv-golden.png"});
await b.close(); console.log("done");

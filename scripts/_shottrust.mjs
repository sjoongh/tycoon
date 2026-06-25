import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const mk=(trust)=>({version:3,votes:5e5,explain:8000,trust,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,engineer:1,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:2,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},log:["x"]});
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
for(const [trust,name] of [[8,"crisis"],[96,"bonus"]]){
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(mk(trust))]);
  await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
  await p.waitForTimeout(3500);
  await p.screenshot({path:`/tmp/gp-trust-${name}.png`});
  await p.close();
}
await b.close(); console.log("done");

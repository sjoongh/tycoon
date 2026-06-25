import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const base=(o)=>({version:3,votes:5e5,explain:8000,trust:78,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,runner:1,engineer:1,analyst:1,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:8,runs:1,bestArea:5,totalSeals:8,upgrades:{procedure:3,audit:2,vault:3,staffing:1,reputation:2}},
  stats:{totalVotes:99999,totalClicks:0,totalUpgrades:0,totalEvents:7,totalOfflineMs:0},
  achievements:{v100:true,v1000:true,v100k:true,cps20:true,trust90:true,area5:true,prestige1:true,events25:true},
  quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},
  endless:5,daily:{day:99999999,streak:1},eventReadyAt:now+9e8,log:["개표국 개국"],...o});
const shots=[
  ["rv-crisis",{trust:8,activeTab:"facilities"}],
  ["rv-bonus",{trust:96,activeTab:"facilities"}],
  ["rv-prestige8",{activeTab:"prestige"}],
  ["rv-crew6",{activeTab:"crew"}],
  ["rv-eventcd",{activeTab:"events",eventReadyAt:now+38000}],
  ["rv-goals2",{activeTab:"goals",quests:{},achievements:{},stats:{totalVotes:800,totalClicks:50,totalUpgrades:2,totalEvents:1,totalOfflineMs:0},facilities:{desk:3,sorter:1,notice:0,server:0,archive:0,studio:0},stage:{area:1,progress:300,target:1100,completed:0}}],
];
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
for(const [name,o] of shots){
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(base(o))]);
  await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
  await p.waitForTimeout(3500);
  if(o.activeTab==="goals"){await p.evaluate(()=>{const l=document.querySelector(".gp-goallist");if(l)l.scrollTop=0;});}
  await p.screenshot({path:`/tmp/${name}.png`});
  await p.close();
  console.log("shot",name);
}
await b.close();

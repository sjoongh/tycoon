import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const errsAll=[];
// 1) opening (fresh) — dots + skip
let p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
p.on("pageerror",e=>errsAll.push("PE:"+e.message)); p.on("console",m=>{if(m.type()==="error")errsAll.push("CE:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000}); await p.waitForTimeout(3500);
await p.screenshot({path:"/tmp/rv-opening.png"});
const hasDots=await p.evaluate(()=>!!document.querySelector(".gp-dots .gp-dot--on")); const hasSkip=await p.evaluate(()=>!!document.querySelector(".gp-skip"));
await p.close();
// 2) facilities early area (locked facilities present) — teaser
const seed={version:3,votes:5000,explain:200,trust:70,days:6,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:8,sorter:4,notice:2,server:0,archive:0,studio:0},staff:{clerk:1},
  stage:{area:2,progress:300,target:3000,completed:1},
  prestige:{seals:0,runs:0,bestArea:2,totalSeals:0,upgrades:{}},
  stats:{totalVotes:5000,totalClicks:50,totalUpgrades:8,totalEvents:1,totalOfflineMs:0},
  achievements:{},quests:{"first-500":true},endless:0,daily:{day:99999999,streak:1,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},eventReadyAt:now+9e8,offline2xDay:99999999,log:["x"]};
p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000}); await p.waitForTimeout(3500);
const teaser=await p.evaluate(()=>{const t=document.querySelector(".gp-nextunlock");return t?t.textContent.trim():"(none)";});
await p.screenshot({path:"/tmp/rv-teaser.png"});
await p.close();
await b.close();
console.log("OPENING", JSON.stringify({hasDots,hasSkip}));
console.log("TEASER", teaser);
console.log(errsAll.length?"ERR:"+errsAll.join(";"):"no errors");

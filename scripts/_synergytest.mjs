import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e6,explain:5e4,trust:70,days:18,paused:false,selected:"desk",activeTab:"crew",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:0,sorter:0,notice:0,server:0,archive:0,studio:0},staff:{clerk:0,auditor:0,runner:0,engineer:0,analyst:0,speaker:0},
  stage:{area:5,progress:500,target:1e12,completed:4},prestige:{seals:0,runs:0,bestArea:5,totalSeals:0,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{"first-500":true},endless:5,daily:{day:99999999,streak:1,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},weekly:{week:99999999,baseVotes:0,target:1e18,claimed:true},eventReadyAt:now+9e8,offline2xDay:99999999,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  // 시너지: engineer 10 + server 0 → 시너지 0; server 40 → 시너지 = 10*40*0.0004=0.16
  gs.data.staff.engineer=10; gs.data.facilities.server=0;
  const m0=gs.staffMultiplierFor(gs.data); const syn0=gs.staffSynergyValue("engineer");
  gs.data.facilities.server=40;
  const m1=gs.staffMultiplierFor(gs.data); const syn1=gs.staffSynergyValue("engineer");
  // 초반 무손상: 시설~5, 직원~2 → 시너지 미미
  gs.data.staff={clerk:2}; gs.data.facilities={desk:5,sorter:0,notice:0,server:0,archive:0,studio:0};
  const synEarly=gs.staffSynergyValue("clerk"); // 2*5*0.0004=0.004
  return {syn0, syn1: +syn1.toFixed(3), multGainFromServer:+(m1-m0).toFixed(3), expected:+(10*40*0.0004).toFixed(3), synEarly:+synEarly.toFixed(4), earlyNegligible: synEarly<0.01};
});
console.log("SYNERGY", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

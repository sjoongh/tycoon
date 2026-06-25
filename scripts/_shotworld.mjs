import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5e5,explain:8000,trust:78,days:18,paused:false,selected:"sorter",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,runner:1,engineer:1,analyst:1,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:99999,totalClicks:0,totalUpgrades:0,totalEvents:7,totalOfflineMs:0},
  achievements:{v100:true,v1000:true,v100k:true,cps20:true,trust90:true,area5:true,prestige1:true,events25:true},
  quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},
  endless:5,daily:{day:99999999,streak:1},eventReadyAt:now+999999,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000}); await p.waitForTimeout(4000);
// check Phaser textures actually loaded (not placeholder) for key sprites
const tex=await p.evaluate(()=>{const g=window.__game;const t=g.scene.getScene("GameScene").textures;const keys=["room/back","floor/pastel","worker/clerk","facility/desk/t5/idle","decor/ballotbox","decor/plant","wall/clock"];const r={};keys.forEach(k=>{const src=t.exists(k)&&t.get(k).getSourceImage();r[k]=src?`${src.width}x${src.height}`:"MISSING";});return r;});
console.log("TEXTURES", JSON.stringify(tex));
await p.screenshot({path:"/tmp/gp10-world.png"});
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

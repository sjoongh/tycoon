import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const allDone={"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true};
const seed={version:3,votes:200000,explain:5000,trust:80,days:10,paused:false,selected:"desk",activeTab:"goals",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,engineer:1,speaker:1},
  stage:{area:5,progress:200,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:130000,totalClicks:50,totalUpgrades:10,totalEvents:3,totalOfflineMs:0},
  achievements:{},quests:allDone,endless:0,log:["개표국 개국"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
for(let i=0;i<30;i++){const ok=await p.evaluate(()=>{const g=window.__game;const s=g&&g.scene.getScene("GameScene");return s&&s.scene.isActive();});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(1500); // let a tick run checkQuests
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");const nq=gs.nextQuest();return {endless:gs.data.endless, nextId:nq&&nq.id, nextGenerated:!!(nq&&nq.generated), nextTarget:nq&&nq.target, totalVotes:Math.round(gs.data.stats.totalVotes)};});
console.log("RESULT", JSON.stringify(r));
await p.screenshot({path:"/tmp/gp-endless.png"});
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

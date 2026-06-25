import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1000,explain:200,trust:70,days:3,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:3,sorter:1,notice:0,server:0,archive:0,studio:0},staff:{clerk:1},
  stage:{area:1,progress:300,target:1100,completed:0},
  prestige:{seals:0,runs:0,bestArea:1,totalSeals:0,upgrades:{}},
  stats:{totalVotes:300,totalClicks:50,totalUpgrades:2,totalEvents:1,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,log:["개표국 개국"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844}});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
for(let i=0;i<30;i++){const ok=await p.evaluate(()=>{const g=window.__game;const s=g&&g.scene.getScene("GameScene");return s&&s.scene.isActive();});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(400);
const c=()=>p.evaluate(()=>window.__game.registry.get("gameState").data.stats.totalClicks);
const v=()=>p.evaluate(()=>Math.round(window.__game.registry.get("gameState").data.votes));
const c0=await c(),v0=await v();
for(let i=0;i<10;i++) await p.mouse.click(195,300);
await p.waitForTimeout(150);
console.log("dClicks="+(await c()-c0)+" dVotes="+(await v()-v0)+" "+(errs.length?"ERR:"+errs.join(";"):"noerr"));
await b.close();

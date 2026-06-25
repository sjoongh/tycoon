import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e6,explain:5e4,trust:70,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3},
  stage:{area:5,progress:500,target:1e12,completed:4},
  prestige:{seals:30,runs:1,bestArea:5,totalSeals:30,upgrades:{}},
  stats:{totalVotes:1e6,totalClicks:0,totalUpgrades:0,totalEvents:0,totalOfflineMs:0},
  achievements:{},quests:{"first-500":true,"desk-5":true,"trust-80":true,"cps-25":true,"stage-2":true,"facility-total-30":true},
  endless:5,daily:{day:99999999,streak:1,qday:0,clicks:0,events:0,upgrades:0,claimed:{}},eventReadyAt:now+9e8,offline2xDay:99999999,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
// mock Notification.permission='default' + safe requestPermission BEFORE app loads
await p.addInitScript(()=>{
  try { Object.defineProperty(window.Notification, "permission", { get:()=>"default", configurable:true }); } catch(e){}
  if (window.Notification) window.Notification.requestPermission = ()=>Promise.resolve("default");
});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(600);
await p.evaluate(()=>window.__game.registry.get("gameState").emit("changed"));
await p.waitForTimeout(300);
const txt=await p.evaluate(()=>{const m=document.querySelector(".gp-modal-ov .gp-modal");return m?m.textContent.replace(/\s+/g," ").trim():"(none)";});
console.log("PROMPT", txt.slice(0,80));
await p.screenshot({path:"/tmp/rv-notif.png"});
// click 알림 켜기 → requestPermission (mocked safe)
const clicked=await p.evaluate(()=>{const btn=[...document.querySelectorAll(".gp-modal [data-confirm]")].find(b=>/알림 켜기/.test(b.textContent));if(btn){btn.click();return true;}return false;});
await p.waitForTimeout(200);
const asked=await p.evaluate(()=>localStorage.getItem("gp-notif-asked"));
console.log("CLICK", JSON.stringify({clicked, askedFlag:asked}));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
// 감사 업그레이드 보유 상태로 효과 검증: audit Lv5(sealPct+0.4), vault Lv4(+4h), staffing Lv3(desk start 4), reputation Lv5(+10 trust)
const seed={version:3,votes:1e9,explain:1e6,trust:80,days:5,paused:false,selected:"desk",activeTab:"prestige",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:20,sorter:12,notice:8,server:6,archive:5,studio:3},staff:{clerk:3,auditor:2,engineer:1,speaker:1},
  stage:{area:8,progress:200,target:99999,completed:7},
  prestige:{seals:50,runs:2,bestArea:8,totalSeals:60,upgrades:{audit:5,vault:4,staffing:3,reputation:5}},
  stats:{totalVotes:5e8,totalClicks:50,totalUpgrades:30,totalEvents:40,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const capH=gs.offlineCapMsFor(gs.data)/3600000;
  const sealPct=gs.permanentEffectFor(gs.data,"sealPct");
  const preview=gs.prestigePreview();
  const sealEls=document.querySelectorAll(".gp-sealgrid .gp-seal").length;
  // 감사 실행 후 시작 상태
  gs.prestigeReset();
  return {capHours:capH, sealPct, preview, sealButtons:sealEls, afterDesk:gs.data.facilities.desk, afterTrust:Math.round(gs.data.trust), afterRuns:gs.data.prestige.runs};
});
console.log("RESULT", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:5e5,explain:8000,trust:78,days:18,paused:false,selected:"desk",activeTab:"facilities",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},staff:{clerk:3,auditor:2,engineer:1,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:8,runs:1,bestArea:5,totalSeals:8,upgrades:{procedure:3,audit:2,vault:3,staffing:1,reputation:2,taskforce:5}},
  stats:{totalVotes:1.5e6,totalClicks:200,totalUpgrades:20,totalEvents:12,totalOfflineMs:0},
  // 도감 25종 수집 시드(+7% 마일스톤 검증용) — 키 개수만 중요
  seenEvents:Object.fromEntries(Array.from({length:25},(_,i)=>["ev"+i,1])),
  // 국장 칭호 시드: 주무관(cpsPct 0.02) Lv5 = +10% 생산
  titles:{clerk9:5}, titleDraws:5, equippedTitle:"clerk9",
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push("PE:"+e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("CE:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(600);
// core loop
const c0=await p.evaluate(()=>window.__game.registry.get("gameState").data.stats.totalClicks);
for(let i=0;i<10;i++) await p.mouse.click(195,300);
await p.waitForTimeout(150);
const c1=await p.evaluate(()=>window.__game.registry.get("gameState").data.stats.totalClicks);
// visit every tab, render-check (no throw)
const tabResults={};
for(const tab of ["facilities","crew","events","goals","prestige"]){
  await p.evaluate((t)=>window.__game.registry.get("gameState").setTab(t), tab);
  await p.waitForTimeout(200);
  tabResults[tab]=await p.evaluate(()=>document.querySelector(".gp-panel")?.children.length||0);
}
// upgrade + advance stage paths
const okFns=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");try{
  gs.upgrade("desk"); gs.hireStaff("clerk"); gs.checkProgression();
  const nq=gs.nextQuest(); const ds=gs.dailyStatus(); const ts=gs.trustState();
  return {upgraded:true, nextQuestOk:!!nq, dailyOk:typeof ds.available==="boolean", trustState:ts, cps:Math.round(gs.cps())};
}catch(e){return {err:e.message}}});
// 이번 세션 추가 배율(도감 보너스·이벤트 보상 프레스티지) 회귀 가드
const mult=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");const d=gs.data;
  const dexCount=gs.seenEventCount();
  const dexPct=gs.dexBonusPct();
  // cps가 도감 보너스를 실제로 곱하는지: 보너스 제거 후 비교
  const cpsWith=gs.cpsFor(d);
  const saved=d.seenEvents; d.seenEvents={};
  const cpsNo=gs.cpsFor(d); d.seenEvents=saved;
  const dexInCps=Math.abs(cpsWith/cpsNo-(1+dexPct))<1e-6;
  // 이벤트 보상 스케일이 특별대응반(taskforce Lv5=+50%)을 반영하는가
  const scaleWith=gs.eventRewardScale();
  const tf=d.prestige.upgrades.taskforce; d.prestige.upgrades.taskforce=0;
  const scaleNo=gs.eventRewardScale(); d.prestige.upgrades.taskforce=tf;
  const eventBonus=+(scaleWith/scaleNo).toFixed(2);
  // 국장 칭호 능력이 cps에 반영되는가(주무관 Lv5 = +10%). cpsPct 버킷엔 감사 기여도 있어
  // 공유분(base)을 고려해 기대 비율 계산.
  const titlePct=gs.titleEffectFor(d,"cpsPct");
  const base=gs.permanentEffectFor(d,"cpsPct");
  const cpsT=gs.cpsFor(d); const st=d.titles; d.titles={};
  const cpsNoT=gs.cpsFor(d); d.titles=st;
  const titleInCps=Math.abs(cpsT/cpsNoT-((1+base+titlePct)/(1+base)))<1e-6;
  return {dexCount,dexPct,dexInCps,eventBonus,titlePct:+titlePct.toFixed(2),titleInCps,owned:gs.ownedTitleCount(),best:gs.bestTitleId()};
});
// 검증 — 기대값 어긋나면 errs에 적재(ERRORS로 출력되어 0에러 가드에 걸림)
if(mult.dexCount!==25) errs.push("MULT: dexCount "+mult.dexCount+" != 25");
if(Math.abs(mult.dexPct-0.07)>1e-9) errs.push("MULT: dexPct "+mult.dexPct+" != 0.07(25종)");
if(!mult.dexInCps) errs.push("MULT: cpsFor가 도감 보너스를 반영하지 않음");
if(Math.abs(mult.eventBonus-1.5)>0.01) errs.push("MULT: eventRewardScale 특별대응반 반영 "+mult.eventBonus+" != 1.5");
if(Math.abs(mult.titlePct-0.10)>1e-9) errs.push("MULT: titleEffectFor cpsPct "+mult.titlePct+" != 0.10(주무관Lv5)");
if(!mult.titleInCps) errs.push("MULT: cpsFor가 국장 칭호 능력을 반영하지 않음");
console.log("MULTIPLIERS", JSON.stringify(mult));
console.log("CLICKS", c1-c0);
console.log("TABS", JSON.stringify(tabResults));
console.log("SYSTEMS", JSON.stringify(okFns));
console.log(errs.length?"ERRORS:\n"+errs.slice(0,12).join("\n"):"NO CONSOLE ERRORS");
await b.close();

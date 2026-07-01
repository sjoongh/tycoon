// 밸런스/페이싱 시뮬 — 신규 플레이어(도감보너스0)가 그리디 전략으로 진행할 때
// 각 구역 도달까지 걸리는 시뮬 시간을 측정한다. 누적 배율이 곡선을 망가뜨렸는지 점검.
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:30000});
await p.evaluate(()=>localStorage.clear());
await p.reload({waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(150);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(150);}else break;}
const out = await p.evaluate(async ()=>{
  const gs=window.__game.registry.get("gameState");
  const facImport=await import("/src/data/facilities.js");
  const facs=facImport.facilities.map(f=>f.id);
  const reached={}; let t=0; const MAX=60*60*6; // 최대 6시간 시뮬
  const tapsPerSec=3; // 가벼운 액티브 탭 가정
  while(t<MAX && gs.data.stage.area<11){
    // 1초치 생산
    const cps=gs.cps();
    gs.addVotes(cps);
    // 탭 수동 생산
    for(let k=0;k<tapsPerSec;k++) gs.addVotes(gs.clickValue?gs.clickValue():1);
    // 구역 돌파
    if(gs.data.stage.progress>=gs.data.stage.target){ gs.advanceStage(); if(!reached[gs.data.stage.area]) reached[gs.data.stage.area]=t; }
    // 그리디 구매: 가장 싼 시설 1레벨씩, 표의 60%까지만 소비
    for(let tries=0;tries<6;tries++){
      let best=null,bestCost=Infinity;
      for(const id of facs){ const plan=gs.facilityBulkPlan(id,1); if(plan.levels>=1 && plan.voteCost<bestCost){best=id;bestCost=plan.voteCost;} }
      if(best && bestCost<=gs.data.votes*0.6){ gs.data.selected=best; gs.bulkUpgrade(best,1); } else break;
    }
    t++;
  }
  return { reached, finalArea:gs.data.stage.area, finalCps:Math.round(gs.cps()), simSec:t };
});
const fmt=s=> s==null?"—": s<60?`${s}s`: s<3600?`${(s/60).toFixed(1)}m`:`${(s/3600).toFixed(2)}h`;
console.log("errs:",errs.length,"finalArea:",out.finalArea,"finalCps:",out.finalCps,"simSec:",out.simSec);
for(let a=2;a<=out.finalArea;a++) console.log(`  구역 ${a} 도달:`, fmt(out.reached[a]));
await b.close();

// 새너티 바운드 — 컴파운딩 배율이 곡선을 망가뜨리면 잡아낸다(절대 임계 아님, 명백한 붕괴 감지용).
const a4=out.reached[4], a10=out.reached[10];
const fails=[];
if(errs.length) fails.push(`콘솔 에러 ${errs.length}건`);
if(a4==null) fails.push("그리디봇이 4구역(첫 감사)에 도달 못함 — 진행 막힘 의심");
else if(a4<20) fails.push(`4구역 ${a4}s — 너무 빠름(초반 트리비얼화 의심)`);
else if(a4>1800) fails.push(`4구역 ${fmt(a4)} — 너무 느림(초반 벽 의심)`);
if(a10!=null && a10<120) fails.push(`10구역 ${a10}s — 후반까지 2분 미만(배율 폭주 의심)`);
if(fails.length){ console.log("BALANCE: FAIL"); fails.forEach(f=>console.log("  ✗ "+f)); process.exit(1); }
console.log("BALANCE OK — 그리디봇 페이싱 정상 범위(첫 감사 "+fmt(a4)+")");

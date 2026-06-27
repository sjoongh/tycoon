import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1600);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(120);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(120);}
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.stats.totalVotes=18700000;gs.data.stats.totalClicks=842;gs.data.stats.totalUpgrades=63;gs.data.stats.totalEvents=29;gs.data.stats.totalItems=14;gs.data.stats.totalOfflineMs=12600000;gs.data.prestige.runs=3;gs.data.prestige.totalMedals=2;gs.data.stage.area=5;gs.emit("changed");document.dispatchEvent(new CustomEvent("gp:open-map"));});
await p.waitForTimeout(800);
// 지도 모달 하단(통계)로 스크롤
await p.evaluate(()=>{const l=document.querySelector(".gp-map__list");if(l)l.scrollTop=l.scrollHeight;});
await p.waitForTimeout(400);
await p.screenshot({path:"/tmp/gp-stats.png"});
console.log("mapOpen:",!!(await p.$(".gp-map")),"errs:",errs.length); errs.slice(0,5).forEach(e=>console.log("  "+e));
await b.close();

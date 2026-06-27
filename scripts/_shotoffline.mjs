import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1600);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(120);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(120);}
// cps 확보: 자원 주입 + 접수창구 업글 다수
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e10;gs.data.explain=1e9;gs.emit("changed");});
for(const t of await p.$$(".gp-tab")){if((await t.innerText()).includes("시설")){await t.click();break;}}
for(const btn of await p.$$("button")){if((await btn.innerText().catch(()=>"")).trim()==="MAX"){await btn.click().catch(()=>{});break;}}
for(let i=0;i<6;i++){for(const btn of await p.$$("button")){if((await btn.innerText().catch(()=>"")).includes("업그레이드")){await btn.click().catch(()=>{});break;}}await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.data.votes=1e10;gs.data.explain=1e9;});await p.waitForTimeout(150);}
// 저장 후 lastSeenAt 8.5시간 과거로 조작
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.save(false);const k="trust-office-phaser-v2";const d=JSON.parse(localStorage.getItem(k));d.lastSeenAt=Date.now()-8.5*3600000;localStorage.setItem(k,JSON.stringify(d));});
await p.reload({waitUntil:"networkidle"}); await p.waitForTimeout(2600);
const has=!!(await p.$(".gp-modal-ov"));
await p.screenshot({path:"/tmp/gp-offline.png"});
console.log("offlineModal:",has,"errs:",errs.length); errs.slice(0,5).forEach(e=>console.log("  "+e));
await b.close();

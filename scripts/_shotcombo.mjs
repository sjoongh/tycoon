import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(1800);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(150);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(150);}
// 빠른 연타 26회(중앙 빈공간)
for(let i=0;i<26;i++){ await p.mouse.click(195,300); await p.waitForTimeout(45); }
const combo=await p.evaluate(()=>window.__game.registry.get("gameState").clickCombo());
await p.waitForTimeout(150);
await p.screenshot({path:"/tmp/gp-combo.png"});
console.log("combo:",combo,"errs:",errs.length); errs.slice(0,5).forEach(e=>console.log("  "+e));
await b.close();

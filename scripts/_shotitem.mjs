import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(160);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(160);}else break;}
const ok=await p.evaluate(()=>{const sc=window.__game.scene.getScene("GameScene"); if(sc&&sc.world){sc.world._spawnItem(); return true;} return false;});
await p.waitForTimeout(700);
await p.screenshot({path:"/tmp/gp-item.png"});
// 탭해서 보상 확인
const got=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState"); const before=gs.data.votes; const r=gs.applyRandomItem("donation"); return {text:r.text, gained: gs.data.votes-before};});
console.log("errs:",errs.length,"spawned:",ok,"reward:",JSON.stringify(got));
await b.close();

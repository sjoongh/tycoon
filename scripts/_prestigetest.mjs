import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(1500);
for(let i=0;i<8;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(120);}if(!(await p.$(".gp-modal-ov")))break;const bb=await p.$(".gp-modal .gp-btn");if(bb)await bb.click().catch(()=>{});await p.waitForTimeout(120);}
const gv=(fn)=>p.evaluate(fn);
const clickByText=async(txt)=>{for(const btn of await p.$$("button")){const t=(await btn.innerText().catch(()=>""));if(t.trim()===txt||t.includes(txt)){await btn.click().catch(()=>{});return true;}}return false;};
// 구역 8까지 + 자원
await gv(()=>{const gs=window.__game.registry.get("gameState");gs.data.stage.area=8;gs.data.votes=1e10;gs.data.explain=1e9;gs.emit("changed");});
for(const t of await p.$$(".gp-tab")){if((await t.innerText()).includes("감사")){await t.click();break;}}
await p.waitForTimeout(300);
const before=await gv(()=>{const g=window.__game.registry.get("gameState");return {seals:g.data.prestige.seals,runs:g.data.prestige.runs,preview:g.prestigePreview()};});
await clickByText("감사실행"); await p.waitForTimeout(350);
const hasModal=!!(await p.$(".gp-modal-ov"));
// 모달 확정 버튼(위험/실행 계열) 클릭
await clickByText("감사 실행")||await clickByText("실행")||await clickByText("초기화")||await clickByText("확인");
await p.waitForTimeout(500);
const after=await gv(()=>{const g=window.__game.registry.get("gameState");return {seals:g.data.prestige.seals,runs:g.data.prestige.runs,votes:g.data.votes,area:g.data.stage.area};});
console.log("modal:",hasModal,"before:",JSON.stringify(before),"after:",JSON.stringify(after));
console.log("errs:",errs.length); errs.slice(0,6).forEach(e=>console.log("  "+e));
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.addInitScript(()=>{window.__vibes=[];navigator.vibrate=(pat)=>{window.__vibes.push(JSON.stringify(pat));return true;};});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1200);
await p.mouse.click(195,300); await p.waitForTimeout(200); // ctx 활성
await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");gs.emit("celebrate",{text:"x"});document.dispatchEvent(new CustomEvent("gp:sfx",{detail:"coin"}));document.dispatchEvent(new CustomEvent("gp:sfx",{detail:"powerup"}));});
await p.waitForTimeout(300);
const vibes=await p.evaluate(()=>window.__vibes);
console.log("vibrate 호출:",JSON.stringify(vibes),"errs:",errs.length); errs.slice(0,4).forEach(e=>console.log("  "+e));
await b.close();

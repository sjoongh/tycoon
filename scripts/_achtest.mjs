import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1500);
const res=await p.evaluate(()=>{
  const gs=window.__game.registry.get("gameState");
  const ms=["totalClicks","totalItems","medals","totalVotes","cps","area"];
  return ms.map(m=>m+":"+gs.achievementProgress(m));
});
console.log(res.join("  "));
console.log("errs:",errs.length);
await b.close();

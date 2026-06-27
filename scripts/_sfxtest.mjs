import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1200);
await p.mouse.click(195,300); await p.waitForTimeout(200); // 첫 제스처로 오디오 컨텍스트 활성
const r=await p.evaluate(()=>{
  // celebrate(achieve)/bonus 트리거 시 콘솔 에러 없는지
  const gs=window.__game.registry.get("gameState");
  gs.emit("celebrate",{text:"테스트"});
  document.dispatchEvent(new CustomEvent("gp:sfx",{detail:"bonus"}));
  document.dispatchEvent(new CustomEvent("gp:sfx",{detail:"achieve"}));
  return "triggered";
});
await p.waitForTimeout(400);
console.log(r,"errs:",errs.length); errs.slice(0,5).forEach(e=>console.log("  "+e));
await b.close();

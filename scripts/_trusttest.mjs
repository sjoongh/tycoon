import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{const s=window.__game&&window.__game.scene.getScene("GameScene");return !!(s&&s.scene.isActive());}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const m=(t)=>gs.trustModifier(t);
  const st=(t)=>{gs.data.trust=t;return gs.trustState();};
  return {mod0:m(0).toFixed(3),mod10:m(10).toFixed(3),mod20:m(20).toFixed(3),mod50:m(50).toFixed(3),mod90:m(90).toFixed(3),mod100:m(100).toFixed(3),state10:st(10),state50:st(50),state95:st(95)};
});
console.log("TRUST", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

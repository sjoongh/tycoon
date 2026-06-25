import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const old=(s,r)=>1+s*0.025+r*0.05;
  const cur=(s,r)=>gs.prestigeMultiplierRaw(s,r);
  const pts=[[0,0],[8,1],[60,2],[200,10],[600,40]];
  return pts.map(([s,rr])=>({s,r:rr,old:+old(s,rr).toFixed(2),new:+cur(s,rr).toFixed(2)}));
});
console.log("CURVE", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{
  const gs=window.__game.registry.get("gameState");
  const out={};
  for(const hrs of [0.004, 3, 12]){ // 14초(무시), 3시간, 12시간(8h cap)
    const data=JSON.parse(JSON.stringify(gs.data));
    data.lastSeenAt=Date.now()-hrs*3600000;
    const before=data.votes;
    const reward=gs.applyOfflineProgress(data, Date.now());
    out[hrs+"h"]= reward?{elapsedH:+(reward.elapsed/3600000).toFixed(2), votes:Math.round(reward.votes), gain:Math.round(data.votes-before)}:"null(무시)";
  }
  out.capH=gs.offlineCapMsFor(gs.data)/3600000;
  out.rate=gs.offlineRateFor(gs.data);
  return out;
});
console.log(JSON.stringify(r,null,1));
console.log("errs:",errs.length);
await b.close();

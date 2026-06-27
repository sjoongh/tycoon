import { chromium } from "playwright";
const KEY="trust-office-phaser-v2";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await b.newContext({viewport:{width:390,height:844}});
const cases={
  "빈세이브": "null",
  "깨진JSON": "{bad json,,,",
  "구버전(votes만)": JSON.stringify({votes:5000}),
  "손상값": JSON.stringify({votes:"abc",trust:999,explain:-50,days:-3,stage:{area:-5,progress:"x"},stats:"broken",daily:{items:"xx",clicks:null},prestige:null,facilities:"nope",staff:42}),
  "미래값변조": JSON.stringify({votes:1e9,offline2xDay:99999999,trust:5,stage:{area:7}}),
};
let allOk=true;
for(const [name,raw] of Object.entries(cases)){
  const p=await ctx.newPage();
  const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
  await p.addInitScript(([k,v])=>{try{localStorage.setItem(k,v);}catch(e){}}, [KEY,raw]);
  await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
  await p.waitForTimeout(1800);
  const d=await p.evaluate(()=>{const g=window.__game?.registry.get("gameState")?.data; if(!g)return null; return {votes:g.votes,trust:g.trust,area:g.stage.area,prog:g.stage.progress,items:g.daily.items,ti:g.stats.totalItems,days:g.days};});
  const ok = d && d.votes>=0 && d.trust>=0 && d.trust<=100 && d.area>=1 && Number.isFinite(d.votes) && Number.isFinite(d.ti) && errs.length===0;
  if(!ok)allOk=false;
  console.log((ok?"✓":"✗")+" "+name+" → "+JSON.stringify(d)+(errs.length?" ERR:"+errs[0]:""));
  await p.close();
}
console.log(allOk?"\nALL SAVE CASES OK":"\nFAIL");
await b.close();

import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
for(let i=0;i<25;i++){const ok=await p.evaluate(()=>{const g=window.__game;const s=g&&g.scene.getScene("GameScene");return s&&s.scene.isActive();});if(ok)break;await p.waitForTimeout(300);}
const st=()=>p.evaluate(()=>{const d=window.__game.registry.get("gameState").data;const gs=window.__game.registry.get("gameState");return{t:Math.round(performance.now()/1000),votes:Math.round(d.votes),area:d.stage.area,prog:Math.round(d.stage.progress),target:d.stage.target,desk:d.facilities.desk,fac:gs.facilityTotal(),cps:+gs.cps().toFixed(1)};});
const start=Date.now();
let n=0;
while(Date.now()-start < 60000){
  await p.mouse.click(195,400);
  n++;
  if(n%12===0){ // try upgrade selected + advance + sample
    await p.click('[data-action="upgradeFac"]').catch(()=>{});
    await p.click('[data-action="advanceStage"]').catch(()=>{});
  }
  if(n%40===0) console.log(JSON.stringify(await st()));
}
console.log("FINAL", JSON.stringify(await st()));
await b.close();

import { chromium } from "playwright";
const SAVE_KEY="trust-office-phaser-v2"; const now=Date.now();
const seed={version:3,votes:1e8,explain:1e5,trust:78,days:18,paused:false,selected:"desk",activeTab:"crew",
  tutorial:{step:5,done:true},lastSavedAt:now,lastSeenAt:now,
  facilities:{desk:16,sorter:9,notice:6,server:5,archive:4,studio:2},
  staff:{clerk:3,auditor:2,runner:0,engineer:1,analyst:0,speaker:1},
  stage:{area:5,progress:500,target:99999,completed:4},
  prestige:{seals:3,runs:1,bestArea:5,totalSeals:5,upgrades:{}},
  stats:{totalVotes:0,totalClicks:0,totalUpgrades:0,totalEvents:2,totalOfflineMs:0},
  achievements:{},quests:{},endless:0,daily:{day:99999999,streak:1},eventReadyAt:0,log:["x"]};
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.addInitScript(([k,v])=>localStorage.setItem(k,v),[SAVE_KEY,JSON.stringify(seed)]);
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"domcontentloaded",timeout:20000});
for(let i=0;i<40;i++){const ok=await p.evaluate(()=>{try{return window.__game.scene.getScene("GameScene").scene.isActive()}catch{return false}});if(ok)break;await p.waitForTimeout(300);}
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const gs=window.__game.registry.get("gameState");
  const cards=document.querySelectorAll(".gp-staff").length;
  const cpsBase=gs.cps();
  // runner skill clickBonus: level 5 should add skill clickBonus; test click power before/after runner skill
  gs.data.staff.runner=4; const clk4=gs.clickPower();
  gs.data.staff.runner=5; const clk5=gs.clickPower(); // skill activates at 5
  gs.data.staff.analyst=4; const cps4=gs.cps();
  gs.data.staff.analyst=5; const cps5=gs.cps(); // skill activates at 5
  return {staffCards:cards, clk4, clk5, clkSkillAdds:clk5>clk4+ (5*2)-(4*2), cps4:Math.round(cps4), cps5:Math.round(cps5), cpsSkillAdds:cps5>cps4};
});
console.log("STAFF", JSON.stringify(r));
console.log(errs.length?"ERR:"+errs.join(";"):"no errors");
await b.close();

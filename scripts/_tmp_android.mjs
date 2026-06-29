import { chromium } from "playwright";
// 실제 안드로이드 대표 해상도(CSS px)
const devices=[
  [360,800,"갤럭시(20:9)"],[412,915,"픽셀7Pro"],[393,873,"픽셀7"],
  [360,740,"보급형19.5:9"],[412,732,"가로짧음(접힘)"],[800,1280,"태블릿"],[360,640,"구형16:9"]
];
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for(const [w,h,name] of devices){
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000}); await p.waitForTimeout(1500);
  for(let i=0;i<6;i++){const s=await p.$(".gp-skip");if(s){await s.click().catch(()=>{});await p.waitForTimeout(120);}if(await p.$(".gp-modal-ov")){const b2=await p.$(".gp-modal .gp-btn");if(b2)await b2.click().catch(()=>{});await p.waitForTimeout(120);}else break;}
  const m=await p.evaluate(()=>{
    const g=document.getElementById("game").getBoundingClientRect();
    const tabs=document.querySelector(".gp-tabs, .gp-tabbar");
    const tabsR=tabs?tabs.getBoundingClientRect():null;
    const panel=document.querySelector(".gp-bottom");
    const pr=panel?panel.getBoundingClientRect():null;
    return {
      overflowX: document.documentElement.scrollWidth>window.innerWidth,
      overflowY: document.documentElement.scrollHeight>window.innerHeight,
      gameW:Math.round(g.width), gameH:Math.round(g.height),
      letterboxX:Math.round(window.innerWidth-g.width), letterboxY:Math.round(window.innerHeight-g.height),
      tabsBottom: tabsR?Math.round(tabsR.bottom):null, winH:window.innerHeight,
      tabsCut: tabsR? tabsR.bottom>window.innerHeight+1 : null,
      panelInside: pr? (pr.bottom<=g.bottom+1 && pr.left>=g.left-1) : null,
    };
  });
  console.log(`${name} (${w}x${h}) overflowX:${m.overflowX} 탭짤림:${m.tabsCut} 레터박스 좌우/상하:${m.letterboxX}/${m.letterboxY} 게임:${m.gameW}x${m.gameH} err:${errs.length}`);
  await p.close();
}
await b.close();

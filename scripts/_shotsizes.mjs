import { chromium } from "playwright";
const sizes=[
  {n:"iphone-se",w:375,h:667},
  {n:"galaxy",w:360,h:740},
  {n:"iphone14-chrome",w:390,h:740}, // 주소창 보일 때 가시영역
  {n:"pixel7",w:412,h:732},
];
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
for(const s of sizes){
  const p=await b.newPage({viewport:{width:s.w,height:s.h},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
  await p.waitForTimeout(2500);
  // 인트로 모달 닫기(건너뛰기) 시도
  try{ await p.click("text=건너뛰기",{timeout:1200}); await p.waitForTimeout(600);}catch{}
  await p.screenshot({path:`/tmp/gp-${s.n}.png`});
  const m=await p.evaluate(()=>{
    const g=document.getElementById("game").getBoundingClientRect();
    const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return{t:Math.round(r.top),b:Math.round(r.bottom),h:Math.round(r.height)};};
    return{win:{w:innerWidth,h:innerHeight},game:{w:Math.round(g.width),h:Math.round(g.height),t:Math.round(g.top),b:Math.round(g.bottom)},
      hud:q(".gp-hud"),bottom:q(".gp-bottom"),rush:q(".gp-rush"),brief:q(".gp-brief")};
  });
  // 하단패널이 game 프레임 아래로 넘치는지
  const clip = m.bottom && m.game ? (m.bottom.b > m.game.h ? "BOTTOM CLIPPED by "+(m.bottom.b-m.game.h)+"px" : "ok") : "n/a";
  console.log(s.n, JSON.stringify(m), "=>", clip);
  await p.close();
}
await b.close();

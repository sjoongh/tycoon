import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(2000);
// 온보딩 모달 건너뛰기 반복 클릭(여러 단계 대비)
for(let i=0;i<6;i++){
  const skip=await p.$(".gp-skip");
  if(skip){await skip.click().catch(()=>{}); await p.waitForTimeout(300);}
  const ov=await p.$(".gp-modal-ov");
  if(!ov)break;
  // 다음 버튼이라도 눌러 진행
  const btn=await p.$(".gp-modal .gp-btn");
  if(btn){await btn.click().catch(()=>{}); await p.waitForTimeout(300);}
}
await p.waitForTimeout(1500);
// 탭 몇번 눌러 득표(국장 반응) 후 캡쳐
await p.mouse.click(195,360); await p.waitForTimeout(200);
await p.mouse.click(195,360); await p.waitForTimeout(600);
await p.screenshot({path:"/tmp/gp-game2.png"});
console.log("errs:",errs.length); errs.slice(0,8).forEach(e=>console.log("  "+e));
await b.close();

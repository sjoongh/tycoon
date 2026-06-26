import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push("C:"+m.text());});
await p.goto("http://localhost:5180/",{waitUntil:"domcontentloaded",timeout:20000});
await p.waitForTimeout(4000);
await p.screenshot({path:"/tmp/gp-livecheck.png"});
console.log(errs.length?"ERR:"+errs.join(";"):"렌더 정상, 0 콘솔에러");
await b.close();

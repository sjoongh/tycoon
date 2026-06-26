import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1080,height:760},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://localhost:5178/concept6.html",{waitUntil:"networkidle",timeout:25000});
await p.waitForTimeout(2500);
await p.screenshot({path:"/tmp/gp-c6.png",fullPage:true});
console.log(errs.length?"ERR:"+errs.join(";"):"렌더 ok");
await b.close();

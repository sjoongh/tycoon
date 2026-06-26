import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1000,height:900},deviceScaleFactor:2});
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://localhost:5178/char.html",{waitUntil:"networkidle",timeout:25000});
await p.waitForTimeout(2000);
await p.screenshot({path:"/tmp/gp-char.png",fullPage:true});
console.log(errs.length?"ERR:"+errs.join(";"):"렌더 ok");
await b.close();

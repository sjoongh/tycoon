import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1200,height:1500},deviceScaleFactor:1});
const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://localhost:5178/concepts.html",{waitUntil:"networkidle",timeout:20000});
await p.waitForTimeout(1500);
await p.screenshot({path:"/tmp/gp-concepts.png",fullPage:true});
console.log(errs.length?"ERR:"+errs.join(";"):"렌더 ok");
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:256,height:256},deviceScaleFactor:2});
await p.goto("http://localhost:5178/icon.svg",{waitUntil:"networkidle",timeout:15000});
await p.waitForTimeout(500);
await p.screenshot({path:"/tmp/gp-icon.png"});
console.log("icon 렌더 ok");
await b.close();

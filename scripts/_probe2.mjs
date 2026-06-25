import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
await p.waitForTimeout(3500);
for (let i=0;i<15;i++) await p.mouse.click(195, 380);
await p.waitForTimeout(11000); // let autosave fire
const save = await p.evaluate(() => localStorage.getItem("trust-office-phaser-v2"));
const d = JSON.parse(save);
console.log("votes:", d.votes, "totalClicks:", d.stats?.totalClicks, "deskLv:", d.facilities?.desk);
await b.close();

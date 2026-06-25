import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto("http://localhost:5178/",{waitUntil:"networkidle"});
await p.waitForTimeout(3500);
const r = await p.evaluate(() => {
  const at = (x,y)=>{const e=document.elementFromPoint(x,y);return e? (e.tagName+"."+(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className||"")) : "none";};
  // find phaser game on window/canvas
  const cv = document.querySelector("canvas");
  return {
    at_195_360: at(195,360),
    at_195_300: at(195,300),
    at_195_450: at(195,450),
    canvasRect: cv ? {w:cv.width,h:cv.height,cw:Math.round(cv.getBoundingClientRect().width),ch:Math.round(cv.getBoundingClientRect().height)} : null,
    uiPE: getComputedStyle(document.querySelector(".gp-ui")).pointerEvents,
    hintExists: !!document.querySelector(".gp-hint"),
    hintPE: document.querySelector(".gp-hint")? getComputedStyle(document.querySelector(".gp-hint")).pointerEvents : "n/a",
  };
});
console.log(JSON.stringify(r));
await b.close();

import { chromium } from "playwright";
const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[],logs=[];
p.on("pageerror",e=>errs.push("PAGEERR:"+e.message));
p.on("console",m=>{if(m.type()==="error")logs.push("CONSOLE:"+m.text());});
await p.goto("http://localhost:5178/",{waitUntil:"networkidle",timeout:30000});
await p.waitForTimeout(3500);
await p.screenshot({path:"/tmp/gp-mobile.png",fullPage:false});
// also dump key layout metrics
const m=await p.evaluate(()=>{
  const r={inner:{w:innerWidth,h:innerHeight},scroll:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}};
  const cv=document.querySelector("canvas");
  if(cv){const c=cv.getBoundingClientRect();r.canvas={w:c.width,h:c.height,x:c.x,y:c.y};}
  return r;
});
console.log(JSON.stringify(m,null,2));
console.log("errs:",errs.length,"consoleErr:",logs.length);
[...errs,...logs].slice(0,12).forEach(e=>console.log("  "+e));
await b.close();

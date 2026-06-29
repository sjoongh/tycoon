import { chromium } from "playwright";
import { readFileSync } from "fs";
const raw = readFileSync("public/icon.svg","utf8");
// 캐릭터 픽셀만 추출: 맨 앞 배경 rect(둥근 사각) 제거
const inner = raw
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replace(/<rect width="512" height="512"[^>]*\/>/, ""); // 배경 rect 제거
// 전경(캐릭터만, 투명, 안전영역 ~64% 중앙)
const fg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" shape-rendering="crispEdges"><g transform="translate(186,196) scale(1.27)">${inner}</g></svg>`;
// 배경(단색)
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#1a1c2c"/></svg>`;
// 전체 아이콘(둥근 사각 + 캐릭터) — 레거시/웹용
const full = raw.replace('viewBox="0 0 512 512"','width="1024" height="1024" viewBox="0 0 512 512"');

const b = await chromium.launch();
async function shot(svg, path, transparent){
  const p = await b.newPage({ viewport:{width:1024,height:1024} });
  await p.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`);
  await p.waitForTimeout(120);
  await p.screenshot({ path, omitBackground: !!transparent, clip:{x:0,y:0,width:1024,height:1024} });
  await p.close();
}
await shot(fg, "assets/icon-foreground.png", true);
await shot(bg, "assets/icon-background.png", false);
await shot(full, "assets/icon-only.png", false);
await b.close();
console.log("아이콘 소스 3종 생성: foreground/background/icon-only");

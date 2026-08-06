import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "fs";
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
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" shape-rendering="crispEdges"><rect width="1024" height="1024" fill="#1a1c2c"/><g transform="translate(186,196) scale(1.27)">${inner}</g></svg>`;
// 전체 아이콘(둥근 사각 + 캐릭터) — 레거시/웹용
const full = raw.replace('viewBox="0 0 512 512"','width="1024" height="1024" viewBox="0 0 512 512"');

mkdirSync("assets", { recursive: true });
mkdirSync("public/icons", { recursive: true });

const b = await chromium.launch();
async function shot(svg, path, transparent, size = 1024){
  const rendered = svg.replace('width="1024" height="1024"', `width="${size}" height="${size}"`);
  const p = await b.newPage({ viewport:{width:size,height:size} });
  await p.setContent(`<!doctype html><html><body style="margin:0">${rendered}</body></html>`);
  await p.waitForTimeout(120);
  await p.screenshot({ path, omitBackground: !!transparent, clip:{x:0,y:0,width:size,height:size} });
  await p.close();
}
await shot(fg, "assets/icon-foreground.png", true);
await shot(bg, "assets/icon-background.png", false);
await shot(full, "assets/icon-only.png", false);
await shot(full, "public/icons/icon-192.png", false, 192);
await shot(full, "public/icons/icon-512.png", false, 512);
await shot(maskable, "public/icons/icon-maskable-512.png", false, 512);
await b.close();
console.log("아이콘 생성: 앱 소스 3종 + PWA 192/512/maskable");

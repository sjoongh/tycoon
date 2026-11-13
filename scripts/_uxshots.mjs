// UI/UX 점검용 캡처(로컬 dev 전용): 주요 화면 상태를 한 번에 찍는다. OUT=디렉터리, AREA=구역, W/H=뷰포트
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5179";
if (!["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname)) throw new Error("local only");
const out = process.env.OUT || "/tmp/uiux/shots";
const area = Number(process.env.AREA || 5);
const W = Number(process.env.W || 390), H = Number(process.env.H || 844);
const only = (process.env.ONLY || "").split(",").filter(Boolean);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const errors = [];
const newPage = async () => {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: Number(process.env.DSF || 2), hasTouch: true });
  page.on("pageerror", (e) => errors.push(`PAGEERR ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  return page;
};
const want = (n) => !only.length || only.includes(n);
const shot = async (page, name) => { await page.screenshot({ path: `${out}/${name}.png` }); };
const closeModals = async (page) => {
  for (let k = 0; k < 8; k += 1) {
    let hit = false;
    for (const sel of [".gp-modal [data-next]", ".gp-modal [data-close]", ".gp-modal [data-confirm]"]) {
      const l = page.locator(sel);
      if (await l.count()) { await l.first().click().catch(() => {}); hit = true; break; }
    }
    await page.waitForTimeout(120);
    if (!hit) break;
  }
};

// 1) 첫 실행
if (want("fresh")) {
  const page = await newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(2500);
  await shot(page, "fresh-0");
  await closeModals(page);
  await page.waitForTimeout(800);
  await shot(page, "fresh-1");
  await page.close();
}

// 2) 중반 세이브
const page = await newPage();
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
await page.evaluate((area) => {
  const gs = window.__game.registry.get("gameState");
  const d = gs.data;
  d.tutorial = { step: 5, done: true, openingSeen: true };
  d.stage.area = area; d.stage.target = gs.stageTarget(area); d.stage.progress = Math.round(d.stage.target * 0.4);
  d.votes = 1e7 * area; d.explain = 5e4;
  const lv = Math.min(60, 8 + area * 4);
  Object.keys(d.facilities).forEach((id) => { d.facilities[id] = lv; });
  Object.keys(d.staff).forEach((id) => { d.staff[id] = Math.min(10, area); });
  if (d.prestige) { d.prestige.seals = 6; d.prestige.runs = 2; d.prestige.totalSeals = 9; }
  gs.save(false);
}, area);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
await page.waitForTimeout(1800);
if (want("modal0")) await shot(page, "mid-modal0");
await closeModals(page);
await page.waitForTimeout(900);
const sheet = (state) => page.evaluate((state) => {
  const b = document.querySelector(".gp-bottom");
  const cur = ["peek", "half", "full"].find((s) => b.classList.contains(`gp-bottom--${s}`));
  return cur === state;
}, state);
const setSheet = async (state) => {
  for (let k = 0; k < 4 && !(await sheet(state)); k += 1) { await page.locator(".gp-handle__chev").click({ force: true }); await page.waitForTimeout(350); }
};
for (const tab of ["facilities", "crew", "events", "goals", "prestige"]) {
  if (!want(tab)) continue;
  await page.evaluate((t) => window.__game.registry.get("gameState").setTab(t), tab);
  await page.waitForTimeout(300);
  await setSheet("peek");
  await page.locator(`.gp-tab[data-tab="${tab}"]`).click(); await page.waitForTimeout(500); // 메뉴 탭 → 전체 화면
  await shot(page, `tab-${tab}-full`);
  // 스크롤 끝
  await page.evaluate(() => { const p = document.querySelector(".gp-panel"); p.scrollTop = p.scrollHeight; });
  await page.waitForTimeout(250);
  await shot(page, `tab-${tab}-full-end`);
  await page.evaluate(() => { document.querySelector(".gp-panel").scrollTop = 0; });
}
if (want("peek")) {
  await page.evaluate(() => window.__game.registry.get("gameState").setTab("facilities"));
  await setSheet("peek"); await page.waitForTimeout(600);
  await shot(page, "peek");
}
if (process.env.CLICK) {
  for (const [i, sel] of process.env.CLICK.split("|").entries()) {
    await page.locator(sel).first().click({ force: true }).catch((e) => errors.push(`CLICK ${sel} ${e.message.slice(0, 80)}`));
    await page.waitForTimeout(700);
    await shot(page, `click-${i}`);
  }
}
if (process.env.EVAL) {
  for (const [i, js] of process.env.EVAL.split("|||").entries()) {
    await page.evaluate(js).catch((e) => errors.push(`EVAL ${e.message.slice(0, 120)}`));
    await page.waitForTimeout(800);
    if (process.env.HIDEBANNER) await page.addStyleTag({ content: ".gp-banner{display:none!important}" });
    await shot(page, `eval-${i}`);
  }
}
if (process.env.DUMP) {
  const info = await page.evaluate(() => [...document.querySelectorAll(".gp-ui button, .gp-ui [role=button]")].filter((b) => b.offsetParent).map((b) => {
    const r = b.getBoundingClientRect();
    return `${b.className}|${(b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 16)}|${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  }));
  console.log(info.join("\n"));
}
console.log(JSON.stringify({ out, errors: errors.slice(0, 10) }));
await browser.close();

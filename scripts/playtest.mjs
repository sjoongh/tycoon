// Actually PLAY the game (fresh) and dump real state transitions to judge if the loop works.
import { chromium } from "playwright";
const SC = process.argv[2] || "/tmp";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE " + m.text()); });
await p.goto("http://localhost:5178/", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);

const hud = async () => p.evaluate(() => ({
  votes: document.querySelector('[data-k="votes"]')?.textContent,
  explain: document.querySelector('[data-k="explain"]')?.textContent,
  trust: document.querySelector('[data-k="trust"]')?.textContent,
  stage: document.querySelector('[data-k="stage"]')?.textContent,
  card: document.querySelector('.gp-card__title')?.textContent,
  upgradeBtn: document.querySelector('[data-action="upgradeFac"]')?.textContent,
  upgradeDisabled: document.querySelector('[data-action="upgradeFac"]')?.classList.contains("gp-btn--disabled"),
}));
const tapWorld = async (n) => { for (let i=0;i<n;i++){ await p.mouse.click(195, 360); } };
const log = (label, o) => console.log(label, JSON.stringify(o));

log("0 start", await hud());
// 1) tap 30 times — does votes go up? does it feel responsive?
await tapWorld(30);
await p.waitForTimeout(300);
log("1 after 30 taps", await hud());
// 2) try upgrade desk
const before = await hud();
await p.click('[data-action="upgradeFac"]').catch(()=>{});
await p.waitForTimeout(300);
log("2 after upgrade click", await hud());
// 3) passive: wait 15s, see if votes/progress accrue
await p.waitForTimeout(15000);
log("3 after 15s idle", await hud());
// 4) tap 50 more, upgrade a few times
await tapWorld(50);
for (let i=0;i<5;i++){ await p.click('[data-action="upgradeFac"]').catch(()=>{}); await p.waitForTimeout(150); }
log("4 after 50 taps + 5 upgrades", await hud());
// 5) try advance stage
await p.click('[data-action="advanceStage"]').catch(()=>{});
await p.waitForTimeout(300);
log("5 after advanceStage", await hud());
// 6) hire staff (crew tab)
await p.click('.gp-tab[data-tab="crew"]').catch(()=>{});
await p.waitForTimeout(300);
await p.click('[data-action="hire"]').catch(()=>{});
await p.waitForTimeout(300);
log("6 after crew hire attempt", await hud());
await p.screenshot({ path: SC + "/playtest-end.png" });
console.log("ERRORS:", errs.length ? errs.slice(0,10).join(" | ") : "none");
await b.close();

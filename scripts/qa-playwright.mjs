// QA Playwright test for gaepyo-master
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const URL = "http://localhost:5178/";
const SAVE_KEY = "trust-office-phaser-v2";
const SCRATCHPAD = "/private/tmp/claude-502/-Users-manager-aidp-gaepyo-master/8f1a0586-32e4-459d-b6ee-43322453c204/scratchpad";

const now = Date.now();
const seed = {
  version: 3,
  votes: 5_000_000,
  explain: 8000,
  trust: 78,
  days: 18,
  paused: false,
  selected: "desk",
  activeTab: "facilities",
  tutorial: { step: 5, done: true },
  lastSavedAt: now,
  lastSeenAt: now,
  facilities: { desk: 16, sorter: 9, notice: 6, server: 5, archive: 4, studio: 2 },
  staff: { clerk: 3, auditor: 2, engineer: 1, speaker: 1 },
  stage: { area: 5, progress: 500, target: 99999, completed: 4 },
  prestige: { seals: 3, runs: 1, bestArea: 5, totalSeals: 5, upgrades: { procedure: 1, manual: 0, briefing: 0, night: 0 } },
  stats: { totalVotes: 0, totalClicks: 0, totalUpgrades: 0, totalEvents: 2, totalOfflineMs: 0 },
  achievements: {},
  quests: {},
  log: ["개표국 개국", "2구역 개표 완료"],
};

// Seeded state where stage is DONE so 지역완료 button should be active
const seedStageDone = {
  ...seed,
  stage: { area: 5, progress: 99999, target: 99999, completed: 4 },
};

// Fresh start state
const freshSeed = {
  version: 3,
  votes: 0,
  explain: 80,
  trust: 72,
  days: 30,
  paused: false,
  selected: "desk",
  activeTab: "facilities",
  tutorial: { step: 0, done: false },
  lastSavedAt: now,
  lastSeenAt: now,
  facilities: { desk: 1, sorter: 0, notice: 0, server: 0, archive: 0, studio: 0 },
  staff: { clerk: 0, auditor: 0, engineer: 0, speaker: 0 },
  stage: { area: 1, progress: 0, target: 2200, completed: 0 },
  prestige: { seals: 0, runs: 0, bestArea: 1, totalSeals: 0, upgrades: { procedure: 0, manual: 0, briefing: 0, night: 0 } },
  stats: { totalVotes: 0, totalClicks: 0, totalUpgrades: 0, totalEvents: 0, totalOfflineMs: 0 },
  achievements: {},
  quests: {},
  log: ["개표국 개국"],
};

const findings = [];
const allErrors = [];

function log(msg) { console.log(msg); }
function bug(severity, title, detail) {
  findings.push({ severity, title, detail });
  log(`[${severity}] ${title}: ${detail}`);
}

async function makePage(browser, saveData) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") { errors.push(m.text()); allErrors.push(m.text()); } });
  page.on("pageerror", (e) => { errors.push("PAGEERR: " + e.message); allErrors.push("PAGEERR: " + e.message); });
  if (saveData) {
    await page.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, [SAVE_KEY, JSON.stringify(saveData)]);
  }
  return { page, errors };
}

async function launch(browser, saveData) {
  const { page, errors } = await makePage(browser, saveData);
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  return { page, errors };
}

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});

// ============================================================
// TEST 1: Seeded state — facilities tab
// ============================================================
log("\n=== TEST 1: Seeded facilities tab ===");
{
  const { page, errors } = await launch(browser, seed);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t1-facilities.png` });

  // Check upgrade button exists and is enabled (5M votes, should be able to upgrade desk lv16)
  const upgradeBtn = page.locator('button[data-action="upgradeFac"]');
  const upgradeBtnText = await upgradeBtn.textContent();
  const upgradeBtnDisabled = await upgradeBtn.evaluate(el => el.classList.contains('gp-btn--disabled'));
  log(`  Upgrade button text: "${upgradeBtnText}", disabled: ${upgradeBtnDisabled}`);
  if (upgradeBtnDisabled) bug("P1", "Upgrade button disabled despite sufficient resources", `votes=5M, desk lv16 cost should be affordable. Button shows disabled class.`);

  // Check all 6 facility selector buttons exist
  const facBtns = await page.locator('.gp-fac').count();
  log(`  Facility selector buttons: ${facBtns}`);
  if (facBtns !== 6) bug("P1", "Wrong number of facility selector buttons", `Expected 6, got ${facBtns}`);

  // Check locked/unlocked state — area=5, so desk(1),sorter(1),notice(2),server(3),archive(4),studio(5) all unlocked
  const lockedBtns = await page.locator('.gp-fac--locked').count();
  log(`  Locked facility buttons: ${lockedBtns}`);
  if (lockedBtns > 0) bug("P1", "Facility buttons showing locked in area 5 where all should be unlocked", `Found ${lockedBtns} locked buttons, expected 0`);

  // Check 지역완료 button — progress=500, target=99999 — should be disabled
  const regionBtn = page.locator('button[data-action="advanceStage"]');
  const regionDisabled = await regionBtn.evaluate(el => el.classList.contains('gp-btn--disabled'));
  log(`  지역완료 button disabled: ${regionDisabled}`);
  if (!regionDisabled) bug("P1", "지역완료 button not disabled when progress < target", `progress=500, target=99999, button should be disabled`);

  // Click upgrade button
  await upgradeBtn.click();
  await page.waitForTimeout(500);
  const titleAfter = await page.locator('.gp-card__title').textContent();
  log(`  After upgrade click, title: "${titleAfter}"`);
  // Should now show Lv.17
  if (!titleAfter.includes('Lv.17')) bug("P1", "Upgrade button click did not increment level", `Expected 'Lv.17' in title after upgrade, got: "${titleAfter}"`);

  await page.screenshot({ path: `${SCRATCHPAD}/qa-t1-after-upgrade.png` });

  // Click sorter facility
  const sorterBtn = page.locator('.gp-fac[data-id="sorter"]');
  await sorterBtn.click();
  await page.waitForTimeout(300);
  const cardTitle = await page.locator('.gp-card__title').textContent();
  log(`  After selecting sorter, card title: "${cardTitle}"`);
  if (!cardTitle.includes('투명분류함')) bug("P1", "Selecting sorter facility does not update card title", `Expected '투명분류함', got "${cardTitle}"`);

  if (errors.length) {
    bug("P0", "Console errors on facilities tab", errors.join('; '));
  }
  await page.close();
}

// ============================================================
// TEST 2: Stage done — 지역완료 button active
// ============================================================
log("\n=== TEST 2: Stage done — 지역완료 active ===");
{
  const { page, errors } = await launch(browser, seedStageDone);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t2-stagedone-before.png` });

  const regionBtn = page.locator('button[data-action="advanceStage"]');
  const regionDisabled = await regionBtn.evaluate(el => el.classList.contains('gp-btn--disabled'));
  log(`  지역완료 disabled when progress=target: ${regionDisabled}`);
  if (regionDisabled) bug("P1", "지역완료 button disabled even when progress >= target", `progress=99999, target=99999, should be enabled`);

  // Click 지역완료
  await regionBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t2-stagedone-after.png` });
  const stageText = await page.locator('.gp-region span').textContent();
  log(`  Region text after advance: "${stageText}"`);
  if (!stageText.includes('6구역') && !stageText.includes('6')) {
    bug("P1", "지역완료 click did not advance to area 6", `Region text: "${stageText}"`);
  }

  if (errors.length) bug("P0", "Console errors on stage done test", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 3: Crew tab interactions
// ============================================================
log("\n=== TEST 3: Crew tab ===");
{
  const { page, errors } = await launch(browser, seed);
  await page.locator('.gp-tab[data-tab="crew"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t3-crew.png` });

  const staffCards = await page.locator('.gp-staff').count();
  log(`  Staff cards: ${staffCards}`);
  if (staffCards !== 4) bug("P1", "Wrong number of staff cards in crew tab", `Expected 4, got ${staffCards}`);

  // Check multiplier shown
  const panelTitle = await page.locator('.gp-paneltitle').textContent();
  log(`  Panel title: "${panelTitle}"`);
  if (!panelTitle.includes('생산')) bug("P1", "Crew panel title missing production multiplier", `Got: "${panelTitle}"`);

  // Try hiring first staff (침착한 접수원)
  const hireBtn = page.locator('button[data-action="hire"][data-id="clerk"]');
  const hireBtnText = await hireBtn.textContent();
  log(`  Hire clerk button text: "${hireBtnText}"`);
  await hireBtn.click();
  await page.waitForTimeout(300);
  // Staff level should increase
  const staffSubText = await page.locator('.gp-staff').first().locator('.gp-staff__sub').textContent();
  log(`  After hire, first staff sub: "${staffSubText}"`);
  // Clerk should now be Lv.4 (was 3 in seed)
  if (!staffSubText.includes('Lv.4')) bug("P1", "Hiring staff did not increment level", `Expected Lv.4, got "${staffSubText}"`);

  await page.screenshot({ path: `${SCRATCHPAD}/qa-t3-crew-after-hire.png` });

  if (errors.length) bug("P0", "Console errors on crew tab", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 4: Events tab — 사건 받기 → choice
// ============================================================
log("\n=== TEST 4: Events tab ===");
{
  const { page, errors } = await launch(browser, seed);
  await page.locator('.gp-tab[data-tab="events"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t4-events-before.png` });

  // Check 사건 받기 button
  const getEventBtn = page.locator('button[data-action="getEvent"]');
  const getEventExists = await getEventBtn.count();
  log(`  사건 받기 button count: ${getEventExists}`);
  if (!getEventExists) bug("P1", "사건 받기 button not found on events tab", "Expected button with data-action=getEvent");

  await getEventBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t4-events-choice.png` });

  // Should now show event choices
  const eventTitle = await page.locator('.gp-event__title').count();
  log(`  Event title visible after 사건 받기: ${eventTitle > 0}`);
  if (!eventTitle) bug("P1", "No event displayed after clicking 사건 받기", "Expected .gp-event__title to appear");

  const choiceBtns = await page.locator('button[data-action="eventChoice"]').count();
  log(`  Event choice buttons: ${choiceBtns}`);
  if (choiceBtns !== 2) bug("P1", "Wrong number of event choice buttons", `Expected 2, got ${choiceBtns}`);

  // Click left choice
  const leftChoice = page.locator('button[data-action="eventChoice"][data-side="left"]');
  const leftText = await leftChoice.textContent();
  log(`  Left choice text: "${leftText}"`);
  await leftChoice.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t4-events-after-choice.png` });

  // Should return to 사건 받기 view
  const backToGetEvent = await page.locator('button[data-action="getEvent"]').count();
  log(`  Back to 사건 받기 after choice: ${backToGetEvent > 0}`);
  if (!backToGetEvent) bug("P1", "After event choice, did not return to 사건 받기 view", "Expected getEvent button to reappear");

  if (errors.length) bug("P0", "Console errors on events tab", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 5: Goals tab
// ============================================================
log("\n=== TEST 5: Goals tab ===");
{
  const { page, errors } = await launch(browser, seed);
  await page.locator('.gp-tab[data-tab="goals"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t5-goals.png` });

  const panelContent = await page.locator('.gp-panel').textContent();
  log(`  Goals panel content: "${panelContent.substring(0, 100)}"`);
  // Seeded state: all quests unfinished (quests:{}) so should show first quest
  if (panelContent.includes('현재 목표를 모두 완료했습니다')) {
    // This is suspicious - seeded has quests:{} so there should be pending quests
    bug("P1", "Goals tab shows 'all complete' but seeded state has no completed quests", `quests:{} in seed, but panel says all done. Likely questProgress always returns >= target.`);
  }

  // Check progress bar exists if a quest is shown
  const progressBar = await page.locator('.gp-progress').count();
  log(`  Progress bars visible: ${progressBar}`);

  if (errors.length) bug("P0", "Console errors on goals tab", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 6: Prestige tab
// ============================================================
log("\n=== TEST 6: Prestige tab ===");
{
  const { page, errors } = await launch(browser, seed);
  await page.locator('.gp-tab[data-tab="prestige"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t6-prestige.png` });

  const panelTitle = await page.locator('.gp-paneltitle').textContent();
  log(`  Prestige panel title: "${panelTitle}"`);
  if (!panelTitle.includes('감사')) bug("P1", "Prestige panel title missing expected content", `Got: "${panelTitle}"`);

  // Check upgrade buttons
  const prestigeUpgradeBtns = await page.locator('button[data-action="buyPrestige"]').count();
  log(`  Prestige upgrade buttons: ${prestigeUpgradeBtns}`);
  if (prestigeUpgradeBtns !== 4) bug("P1", "Wrong number of prestige upgrade buttons", `Expected 4, got ${prestigeUpgradeBtns}`);

  // Check 감사실행 button
  const prestigeResetBtn = page.locator('button[data-action="prestigeReset"]');
  const resetText = await prestigeResetBtn.textContent();
  log(`  감사실행 button text: "${resetText}"`);

  // canPrestige: area>=4 || facilityTotal>=55 || completed>=3
  // seed: area=5(>=4) → can prestige. So button should be enabled.
  const resetDisabled = await prestigeResetBtn.evaluate(el => el.classList.contains('gp-btn--disabled'));
  log(`  감사실행 disabled: ${resetDisabled}`);
  if (resetDisabled) bug("P1", "감사실행 (prestige reset) button disabled when player qualifies", `area=5 (>=4), should be enabled`);

  // Try buying a prestige upgrade (절차서)
  const procBtn = page.locator('button[data-action="buyPrestige"][data-id="procedure"]');
  const procDisabled = await procBtn.evaluate(el => el.classList.contains('gp-fac--locked'));
  log(`  절차서 locked: ${procDisabled}`);
  // cost for lv1 → baseCost*1.55^1 = 2*1.55 = 3.1 → floor = 3, seals=3 → should be affordable
  if (procDisabled) bug("P1", "절차서 upgrade locked despite having 3 seals (cost=3)", `seed has 3 seals, 절차서 lv1 cost is 3`);

  await page.screenshot({ path: `${SCRATCHPAD}/qa-t6-prestige-before-buy.png` });
  await procBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t6-prestige-after-buy.png` });

  if (errors.length) bug("P0", "Console errors on prestige tab", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 7: Fresh state — locked facilities, level 0 handling
// ============================================================
log("\n=== TEST 7: Fresh state ===");
{
  const { page, errors } = await launch(browser, freshSeed);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t7-fresh.png` });

  // Check locked facility buttons (unlock: 2+ should be locked in area 1)
  const lockedFacs = await page.locator('.gp-fac--locked').count();
  log(`  Locked facility buttons in area 1: ${lockedFacs}`);
  // notice(2), server(3), archive(4), studio(5) should be locked → 4
  if (lockedFacs !== 4) bug("P1", "Wrong number of locked facility buttons in fresh area-1 state", `Expected 4 locked (notice,server,archive,studio), got ${lockedFacs}`);

  // Check card shows locked state
  // Click a locked facility (notice)
  const noticeBtn = page.locator('.gp-fac[data-id="notice"]');
  await noticeBtn.click();
  await page.waitForTimeout(300);
  // select() in GameState returns early if !isUnlocked → tab stays on facilities but card doesn't change
  const cardTitle = await page.locator('.gp-card__title').textContent();
  log(`  After clicking locked notice, card title: "${cardTitle}"`);
  // Should still show desk (original selection), not notice
  if (cardTitle.includes('안심공지판')) bug("P1", "Clicking locked facility changes selected facility", `Selected facility should not change when clicking locked item`);

  // Check sorter at level 0 — unlocked (area>=1) but level=0 → sprite should be hidden
  // We test this visually in the screenshot
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t7-fresh-locked-click.png` });

  // Check upgrade button on desk lv1 — no votes, should be disabled
  const upBtn = await page.locator('button[data-action="upgradeFac"]').evaluate(el => el.classList.contains('gp-btn--disabled'));
  log(`  Upgrade button disabled with 0 votes: ${upBtn}`);
  if (!upBtn) bug("P1", "Upgrade button not disabled when player has 0 votes (fresh state)", "Should be disabled");

  if (errors.length) bug("P0", "Console errors on fresh state", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 8: Tab switching — does active state persist correctly
// ============================================================
log("\n=== TEST 8: Tab switching ===");
{
  const { page, errors } = await launch(browser, seed);

  const tabs = ["facilities", "crew", "events", "goals", "prestige"];
  for (const tab of tabs) {
    await page.locator(`.gp-tab[data-tab="${tab}"]`).click();
    await page.waitForTimeout(200);
    const activeTab = await page.locator('.gp-tab--active').getAttribute('data-tab');
    log(`  Clicked ${tab}, active tab shows: ${activeTab}`);
    if (activeTab !== tab) bug("P1", `Tab active state wrong after clicking ${tab}`, `Expected active=${tab}, got ${activeTab}`);
  }

  if (errors.length) bug("P0", "Console errors during tab switching", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 9: HUD values display
// ============================================================
log("\n=== TEST 9: HUD values ===");
{
  const { page, errors } = await launch(browser, seed);

  const votesText = await page.locator('.gp-chip__val[data-k="votes"]').textContent();
  const explainText = await page.locator('.gp-chip__val[data-k="explain"]').textContent();
  const trustText = await page.locator('.gp-chip__val[data-k="trust"]').textContent();
  log(`  HUD votes: "${votesText}", explain: "${explainText}", trust: "${trustText}"`);

  if (!votesText || votesText === '0') bug("P1", "HUD votes showing 0 despite seeded 5M", `Got: "${votesText}"`);
  if (!trustText.includes('%')) bug("P1", "HUD trust missing % sign", `Got: "${trustText}"`);

  // Stage display in HUD
  const stageText = await page.locator('.gp-stage[data-k="stage"]').textContent();
  log(`  HUD stage: "${stageText}"`);
  if (!stageText.includes('5구역')) bug("P1", "HUD stage text doesn't show area 5", `Got: "${stageText}"`);
  if (!stageText.includes('인장')) bug("P2", "HUD stage text doesn't show seal count", `Got: "${stageText}"`);

  if (errors.length) bug("P0", "Console errors on HUD test", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 10: Prestige upgrade cost calculation edge case
// ============================================================
log("\n=== TEST 10: Prestige upgrade cost check ===");
{
  // Test with procedure already at lv1 (baseCost=2, 1.55^1 = 3.1 → floor 3)
  // and seals=3: can buy lv2 cost = floor(2*1.55^1) = 3, so 3 seals = exactly enough
  const seedWithProc1 = {
    ...seed,
    prestige: { seals: 3, runs: 1, bestArea: 5, totalSeals: 5, upgrades: { procedure: 1, manual: 0, briefing: 0, night: 0 } }
  };
  const { page, errors } = await launch(browser, seedWithProc1);
  await page.locator('.gp-tab[data-tab="prestige"]').click();
  await page.waitForTimeout(300);

  // procedure lv1, cost for lv2 = floor(2 * 1.55^1) = floor(3.1) = 3
  // seals=3, so should be able to buy
  const procBtn = page.locator('button[data-action="buyPrestige"][data-id="procedure"]');
  const lvText = await procBtn.locator('.gp-fac__lv').textContent();
  log(`  절차서 level/cost text: "${lvText}"`);
  // Format is "Lv.X · Y"
  if (!lvText.includes('Lv.1')) bug("P2", "절차서 not showing Lv.1 when upgrades.procedure=1", `Got: "${lvText}"`);

  if (errors.length) bug("P0", "Console errors prestige cost test", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 11: Offline reward on load
// ============================================================
log("\n=== TEST 11: Offline reward (30s+ elapsed) ===");
{
  const oldSeed = {
    ...seed,
    lastSeenAt: now - 120_000, // 2 minutes ago → should trigger offline reward
  };
  const { page, errors } = await launch(browser, oldSeed);
  await page.screenshot({ path: `${SCRATCHPAD}/qa-t11-offline-reward.png` });
  // No crash is the main check; visual float text "오프라인" may appear
  log(`  Loaded with 2min offline, no crash: true`);

  if (errors.length) bug("P0", "Console errors on offline reward load", errors.join('; '));
  await page.close();
}

// ============================================================
// TEST 12: Canvas click — does processClick fire
// ============================================================
log("\n=== TEST 12: Canvas click ===");
{
  const { page, errors } = await launch(browser, seed);
  // Get initial votes
  const votesBefore = await page.locator('.gp-chip__val[data-k="votes"]').textContent();
  // Click in center of canvas (Phaser canvas)
  await page.mouse.click(195, 500);
  await page.waitForTimeout(500);
  const votesAfter = await page.locator('.gp-chip__val[data-k="votes"]').textContent();
  log(`  Votes before click: "${votesBefore}", after: "${votesAfter}"`);
  // Votes should change (increase) — but they're in shortNumber form and may look the same at 5M
  // So check totalClicks via localStorage
  const totalClicks = await page.evaluate((key) => {
    const d = JSON.parse(localStorage.getItem(key) || '{}');
    return d?.stats?.totalClicks;
  }, SAVE_KEY);
  log(`  totalClicks after canvas click: ${totalClicks}`);
  // Note: autosave is every 10s, so localStorage may not be updated yet - this is informational

  if (errors.length) bug("P0", "Console errors on canvas click test", errors.join('; '));
  await page.close();
}

await browser.close();

// ============================================================
// SUMMARY
// ============================================================
log("\n\n=== BUG SUMMARY ===");
findings.forEach((f, i) => log(`${i+1}. [${f.severity}] ${f.title}\n   ${f.detail}`));
log(`\nTotal console errors collected: ${allErrors.length}`);
if (allErrors.length) log("Errors:\n" + [...new Set(allErrors)].join('\n'));

// Write JSON findings
writeFileSync(`${SCRATCHPAD}/qa-findings.json`, JSON.stringify({ findings, allErrors }, null, 2));
log(`\nFindings written to ${SCRATCHPAD}/qa-findings.json`);

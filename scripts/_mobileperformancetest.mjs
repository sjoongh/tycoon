import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run performance E2E against non-local host: ${parsedUrl.hostname}`);
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
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(5000);
await page.route("**/*", async (route) => {
  const hostname = new URL(route.request().url()).hostname;
  if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
  else await route.abort("blockedbyclient");
});

try {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  const startupNetwork = await page.evaluate(() => {
    const resources = performance.getEntriesByType("resource");
    const firebase = resources.filter((entry) => new URL(entry.name).pathname.toLowerCase().includes("firebase"));
    return {
      firebaseRequests: firebase.map((entry) => new URL(entry.name).pathname),
      firebaseTransferBytes: firebase.reduce((sum, entry) => sum + entry.transferSize, 0),
    };
  });

  for (let index = 0; index < 4; index += 1) {
    const next = page.locator(".gp-modal [data-next]");
    if (await next.count()) await next.click();
    await page.waitForTimeout(60);
  }

  const result = await page.evaluate(async () => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.paused = true;
    gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
    gameState.data.votes = Math.max(gameState.data.votes, 500_000);
    gameState.data.explain = Math.max(gameState.data.explain, 50_000);

    const tabs = ["facilities", "crew", "goals", "prestige"];
    const measurements = {};
    for (const tab of tabs) {
      gameState.data.activeTab = tab;
      gameState.emit("changed");
      await new Promise((resolve) => setTimeout(resolve, 180));

      const panel = document.querySelector(".gp-panel");
      const scrollList = panel.querySelector(".gp-stafflist");
      const scrollBefore = scrollList && scrollList.scrollHeight > scrollList.clientHeight
        ? Math.round((scrollList.scrollTop = Math.max(1, (scrollList.scrollHeight - scrollList.clientHeight) / 2)))
        : null;
      let childListMutations = 0;
      let addedNodes = 0;
      let removedNodes = 0;
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type !== "childList") continue;
          childListMutations += 1;
          addedNodes += record.addedNodes.length;
          removedNodes += record.removedNodes.length;
        }
      });
      observer.observe(panel, { childList: true, subtree: true });

      const frameGaps = [];
      let previousFrame = performance.now();
      let frameHandle = 0;
      const onFrame = (now) => {
        frameGaps.push(now - previousFrame);
        previousFrame = now;
        frameHandle = requestAnimationFrame(onFrame);
      };
      frameHandle = requestAnimationFrame(onFrame);

      const emitDurations = [];
      for (let index = 0; index < 60; index += 1) {
        gameState.data.votes += 1;
        gameState.data.stage.progress = Math.min(gameState.data.stage.target, gameState.data.stage.progress + 1);
        const startedAt = performance.now();
        gameState.emit("changed");
        emitDurations.push(performance.now() - startedAt);
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
      await new Promise((resolve) => setTimeout(resolve, 220));
      cancelAnimationFrame(frameHandle);
      observer.disconnect();

      const sortedEmits = [...emitDurations].sort((a, b) => a - b);
      const sortedFrames = frameGaps.slice(1).sort((a, b) => a - b);
      const percentile = (values, ratio) => values[Math.min(values.length - 1, Math.floor(values.length * ratio))] || 0;
      measurements[tab] = {
        panelNodes: panel.querySelectorAll("*").length,
        childListMutations,
        addedNodes,
        removedNodes,
        emitP95Ms: Number(percentile(sortedEmits, 0.95).toFixed(2)),
        emitMaxMs: Number(Math.max(...emitDurations).toFixed(2)),
        frameP95Ms: Number(percentile(sortedFrames, 0.95).toFixed(2)),
        frameMaxMs: Number(Math.max(...frameGaps).toFixed(2)),
        scrollBefore,
        scrollAfter: scrollBefore === null ? null : Math.round(panel.querySelector(".gp-stafflist")?.scrollTop || 0),
      };
    }

    gameState.data.activeTab = "facilities";
    gameState.emit("changed");
    await new Promise((resolve) => setTimeout(resolve, 160));
    const leadingBefore = document.querySelector(".gp-region__progress")?.textContent;
    gameState.data.stage.progress = Math.min(gameState.data.stage.target, gameState.data.stage.progress + 17);
    gameState.emit("changed");
    const leadingAfter = document.querySelector(".gp-region__progress")?.textContent;

    gameState.data.activeTab = "goals";
    gameState.emit("changed");
    await new Promise((resolve) => setTimeout(resolve, 160));
    const goalsPanel = document.querySelector(".gp-panel");
    const goalsList = goalsPanel.querySelector(".gp-stafflist");
    const structuralScrollBefore = Math.round((goalsList.scrollTop = Math.max(1, (goalsList.scrollHeight - goalsList.clientHeight) / 2)));
    const structuralObserver = new MutationObserver(() => {});
    structuralObserver.observe(goalsPanel, { childList: true });
    const firstQuest = goalsPanel.querySelector('[data-goal-kind="quest"]')?.dataset.goalId;
    if (firstQuest) gameState.data.quests[firstQuest] = true;
    gameState.emit("changed");
    const structuralRecords = structuralObserver.takeRecords();
    structuralObserver.disconnect();
    const structuralScrollAfter = Math.round(goalsPanel.querySelector(".gp-stafflist")?.scrollTop || 0);

    const resources = performance.getEntriesByType("resource").map((entry) => ({
      name: new URL(entry.name).pathname,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
    }));
    const fontResources = resources.filter((entry) => entry.name.includes("/fonts/"));
    const firebaseResources = resources.filter((entry) => entry.name.toLowerCase().includes("firebase"));
    return {
      measurements,
      fontRequests: fontResources.map((entry) => entry.name),
      fontTransferBytes: fontResources.reduce((sum, entry) => sum + entry.transferSize, 0),
      firebaseRequests: firebaseResources.map((entry) => ({ name: entry.name, transferSize: entry.transferSize })),
      firebaseTransferBytes: firebaseResources.reduce((sum, entry) => sum + entry.transferSize, 0),
      leadingRefreshImmediate: leadingBefore !== leadingAfter,
      structuralGoalRefresh: {
        panelReplacements: structuralRecords.filter((record) => record.type === "childList").length,
        scrollBefore: structuralScrollBefore,
        scrollAfter: structuralScrollAfter,
      },
      viewportOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });

  const schedulerBoundaries = await page.evaluate(async () => {
    const { DOMBottomPanel } = await import("/src/ui/DOMBottomPanel.js");
    const makeHarness = () => {
      const panel = Object.create(DOMBottomPanel.prototype);
      panel._lastChangedAt = -Infinity;
      panel._lastRenderAt = -Infinity;
      panel._refreshTimer = null;
      panel._refreshFrame = null;
      panel._refreshPending = false;
      panel.renderCount = 0;
      panel._renderNow = () => {
        panel._lastRenderAt = performance.now();
        panel.renderCount += 1;
      };
      panel._onVisibility = () => {
        if (document.visibilityState === "visible" && panel._refreshPending) panel.refresh();
      };
      return panel;
    };

    const originalVisibility = Object.getOwnPropertyDescriptor(document, "visibilityState");
    let visibility = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    try {
      const hidden = makeHarness();
      hidden._scheduleRefresh();
      hidden._scheduleRefresh();
      visibility = "hidden";
      await new Promise((resolve) => setTimeout(resolve, 130));
      const pendingWhileHidden = hidden._refreshPending;
      visibility = "visible";
      hidden._onVisibility();
      const afterRestore = hidden.renderCount;
      hidden._scheduleRefresh();
      hidden._scheduleRefresh();
      await new Promise((resolve) => setTimeout(resolve, 130));
      const afterSubsequentBurst = hidden.renderCount;
      hidden._cancelScheduledRefresh();

      const forced = makeHarness();
      forced._scheduleRefresh();
      forced._scheduleRefresh();
      forced.refresh();
      const afterForcedRefresh = forced.renderCount;
      await new Promise((resolve) => setTimeout(resolve, 130));
      const afterForcedWait = forced.renderCount;
      forced._cancelScheduledRefresh();

      const destroyed = makeHarness();
      destroyed._scheduleRefresh();
      destroyed._scheduleRefresh();
      destroyed._cancelScheduledRefresh();
      await new Promise((resolve) => setTimeout(resolve, 130));

      return {
        hidden: { pendingWhileHidden, afterRestore, afterSubsequentBurst },
        forced: { afterForcedRefresh, afterForcedWait },
        destroyedRenderCount: destroyed.renderCount,
      };
    } finally {
      if (originalVisibility) Object.defineProperty(document, "visibilityState", originalVisibility);
      else delete document.visibilityState;
    }
  });

  const failures = [];
  for (const [tab, measurement] of Object.entries(result.measurements)) {
    if (measurement.childListMutations > 12) failures.push(`${tab}: panel replacements ${measurement.childListMutations} > 12`);
    if (measurement.frameMaxMs > 33) failures.push(`${tab}: max frame ${measurement.frameMaxMs}ms > 33ms`);
    if (measurement.emitP95Ms > 1.8) failures.push(`${tab}: emit p95 ${measurement.emitP95Ms}ms > 1.8ms`);
    if (measurement.scrollBefore !== null && Math.abs(measurement.scrollAfter - measurement.scrollBefore) > 1) {
      failures.push(`${tab}: scroll moved ${measurement.scrollBefore} -> ${measurement.scrollAfter}`);
    }
  }
  if (startupNetwork.firebaseRequests.some((path) => path.includes("/node_modules/"))) {
    failures.push("Firebase SDK competed with the first 700ms startup window");
  }
  if (result.viewportOverflow) failures.push("390px viewport has horizontal overflow");
  if (!result.leadingRefreshImmediate) failures.push("first changed event after idle was not rendered immediately");
  if (result.structuralGoalRefresh.panelReplacements < 1) failures.push("goal structure change did not rebuild the panel");
  if (Math.abs(result.structuralGoalRefresh.scrollAfter - result.structuralGoalRefresh.scrollBefore) > 1) {
    failures.push("goal structure change did not preserve scroll position");
  }
  if (!schedulerBoundaries.hidden.pendingWhileHidden || schedulerBoundaries.hidden.afterRestore !== 2) {
    failures.push("hidden trailing refresh did not flush exactly once on visibility restore");
  }
  if (schedulerBoundaries.hidden.afterSubsequentBurst !== 4) {
    failures.push("scheduler did not recover after a hidden trailing refresh");
  }
  if (schedulerBoundaries.forced.afterForcedRefresh !== 2 || schedulerBoundaries.forced.afterForcedWait !== 2) {
    failures.push("forced refresh did not cancel its pending trailing refresh");
  }
  if (schedulerBoundaries.destroyedRenderCount !== 1) {
    failures.push("scheduled refresh survived cancellation/destroy boundary");
  }

  const output = { ok: failures.length === 0, target: baseUrl, startupNetwork, ...result, schedulerBoundaries, failures };
  console.log(JSON.stringify(output, null, 2));
  if (failures.length) throw new Error(failures.join(" | "));
} finally {
  await browser.close();
}

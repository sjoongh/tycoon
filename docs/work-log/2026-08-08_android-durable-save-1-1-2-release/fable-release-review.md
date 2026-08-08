# Claude Fable 5 release review

## Provenance

- Provider/model: Anthropic `claude-fable-5` with `claude-haiku-4-5-20251001` support
- Mode/effort: `review` / `high`
- Cost/duration: `$0.772461` / `160641ms`
- Profile/session: `.claude-gmail` / non-persistent
- Verdict: **PASS for commit/PR/merge**; Play upload was outside scope.

## Accepted findings and verification

- Upgrade-in-place evidence was missing. Accepted and executed with exact `1.1.1 (4)` and `1.1.2 (5)` AAB-derived APK sets. A real `1.1.1` facility purchase survived old-version relaunch, data-preserving update, durable migration, immediate force-stop, and `1.1.2` cold relaunch at local/durable `2/2`.
- Reset runtime evidence was missing. Accepted and executed through the actual settings 2-step reset. The prior `Lv.2` save did not resurrect; the fresh state was local/durable `Lv.1/1` after force-stop and cold relaunch.
- Legacy `lastSavedAt` presence required an audit. Accepted and checked across Git history: the initial `0.1.0` GameState and every later release line already contain and normalize `lastSavedAt`.
- WebView bridge exposure was checked. `capacitor.config.json` has no `server.url`; the app serves packaged `dist` content. External privacy content opens in a separate window with `noopener`.
- Root aggregate Android test Kotlin duplicate-class issue remains a non-blocking build-hygiene follow-up; app-scoped instrumentation, release build, and exact-AAB execution all pass.

## Rejected or deferred findings

- Rejected “corrupt durable value is seeded”: `readDurableSave()` already parses and returns `null` for invalid JSON before the seed function; a unit test pins this behavior.
- Rejected “async restore suppression may use seed return”: `restoreNativeSave()` directly checks `readDurableSave()` existence/parseability, independent of the seed boolean; a stale-Preferences suppression test already exists.
- Rejected “equal timestamp behavior untested”: the differing-JSON equal-timestamp durable-wins unit test already exists.
- Rejected “oversized payload untested”: Android instrumentation rejects null, empty, and `MAX_SAVE_LENGTH + 1` payloads.
- Deferred non-blocking telemetry for native write failure and aggregate plugin dependency cleanup; neither changes the verified release behavior.
- Physical-device smoke remains recommended before staged Play rollout, not a commit blocker.

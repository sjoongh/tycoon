# Phaser custom core

`npm run phaser:build` bundles the Phaser 3.90 core and only the extra factories this game uses. Vite automatically ensures the same generated module exists for dev, Vitest, and production builds.

- Generated output: `.cache/phaser/phaser-custom.mjs` (gitignored)
- Preserved: WebGL and Canvas renderers, input, image loader, scenes, scale, time, tweens
- Added to core: Clamp, Rectangle, Arc/Circle, Zone
- Removed: Physics, tilemaps, curves, Phaser Sound, unused game-object families
- Canvas capability policy: advanced blend modes and inverse-alpha support conservatively report `false`; revisit before introducing a custom Phaser blend mode.
- Rollback: run `GAEPYO_STOCK_PHASER=1 npm run build` (or start the dev server with the same variable) to use the stock package. This is a build/start-time switch, so a deployed app requires rebuild and redeploy; it is not a runtime toggle.

During stock rollback, `phaser:prepare` and the Vite config do not import the custom generator, so an absent or corrupt custom cache cannot block the stock build. `npm run test:phaser-stock-rollback` verifies this path with a deliberately poisoned cache.

The generated module preserves the Phaser copyright and MIT license banner. `npm run phaser:check` verifies exact versions, deterministic output, renderer flags, attribution, size ceilings, and current source usage. The check fails when source code introduces an unbundled factory or Math API, or intentionally excluded Sound, plugin, physics, or advanced blend-mode usage.

Before upgrading Phaser or esbuild, update the exact version guard, re-derive `custom-entry.cjs` from the new Phaser source, and rerun the custom/stock WebGL+Canvas matrix, deterministic build, bundle ceilings, full E2E suite, and startup measurement.

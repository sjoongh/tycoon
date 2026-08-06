import { defineConfig } from "vite";

const useStockPhaser = process.env.GAEPYO_STOCK_PHASER === "1";
let customPhaserPath;
if (!useStockPhaser) {
  const { CUSTOM_PHASER_PATH, ensureCustomPhaser } = await import("./tools/phaser/build-custom-phaser.mjs");
  await ensureCustomPhaser();
  customPhaserPath = CUSTOM_PHASER_PATH;
}

export default defineConfig({
  resolve: useStockPhaser ? {} : {
    alias: {
      phaser: customPhaserPath,
    },
  },
  define: {
    __GAEPYO_PHASER_BUILD__: JSON.stringify(useStockPhaser ? "stock" : "custom"),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
  },
});

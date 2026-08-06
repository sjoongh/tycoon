import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const useStockPhaser = process.env.GAEPYO_STOCK_PHASER === "1";
const PWA_VERSION_FILES = [
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "icons/icon-192.png",
  "fonts/fonts.css",
  "fonts/Galmuri9.woff2",
  "fonts/Galmuri11.woff2",
  "fonts/Galmuri14.woff2",
  "fonts/PressStart2P.woff2",
];
let customPhaserPath;
if (!useStockPhaser) {
  const { CUSTOM_PHASER_PATH, ensureCustomPhaser } = await import("./tools/phaser/build-custom-phaser.mjs");
  await ensureCustomPhaser();
  customPhaserPath = CUSTOM_PHASER_PATH;
}

function pwaBuildVersionPlugin() {
  return {
    name: "pwa-build-version",
    apply: "build",
    async closeBundle() {
      const workerPath = resolve("dist/sw.js");
      const [workerSource, ...versionSources] = await Promise.all([
        readFile(workerPath, "utf8"),
        ...PWA_VERSION_FILES.map((file) => readFile(resolve("dist", file))),
      ]);
      if (!workerSource.includes("__BUILD_HASH__")) {
        throw new Error("Service worker build token is missing");
      }
      const versionHash = createHash("sha256");
      versionSources.forEach((source) => versionHash.update(source));
      const buildHash = versionHash.digest("hex").slice(0, 12);
      await writeFile(workerPath, workerSource.replaceAll("__BUILD_HASH__", buildHash));
    },
  };
}

export default defineConfig({
  plugins: [pwaBuildVersionPlugin()],
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

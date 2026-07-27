import { defineConfig } from "vitest/config";

import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // GameState 헤드리스 테스트용 — Phaser 실물 대신 최소 스텁 주입
      phaser: fileURLToPath(new URL("./test/helpers/phaser-stub.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
  },
});

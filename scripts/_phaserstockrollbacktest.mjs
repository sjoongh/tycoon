import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = resolve(repoRoot, ".cache/phaser");
const backupDir = `${cacheDir}.rollback-test-${process.pid}-${randomUUID()}`;
const customPath = resolve(cacheDir, "phaser-custom.mjs");
const metaPath = resolve(cacheDir, "phaser-custom.meta.json");
const poison = "throw new Error('stock rollback imported poisoned custom Phaser');\n";
let hadCache = false;

async function runStockBuild() {
  await new Promise((resolvePromise, reject) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: repoRoot,
      env: { ...process.env, GAEPYO_STOCK_PHASER: "1" },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`stock build failed (${signal || `exit ${code}`})`));
    });
  });
}

try {
  try {
    await rename(cacheDir, backupDir);
    hadCache = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(cacheDir, { recursive: true });
  await writeFile(customPath, poison);
  await writeFile(metaPath, "{ deliberately invalid rollback-test metadata\n");

  await runStockBuild();
  const after = await readFile(customPath, "utf8");
  if (after !== poison) throw new Error("stock build touched the poisoned custom Phaser cache");
  console.log(JSON.stringify({ ok: true, stockBuild: "passed", customCache: "poisoned-and-untouched" }, null, 2));
} finally {
  await rm(cacheDir, { recursive: true, force: true });
  if (hadCache) await rename(backupDir, cacheDir);
}

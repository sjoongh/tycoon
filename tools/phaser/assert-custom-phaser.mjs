import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { CUSTOM_PHASER_PATH, ensureCustomPhaser } from "./build-custom-phaser.mjs";

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = resolve(TOOL_DIR, "../../src");
const SUPPORTED_FACTORIES = new Set(["circle", "graphics", "image", "rectangle", "sprite", "text", "zone"]);
const SUPPORTED_PHASER_MATH = new Set(["Between", "Clamp"]);

async function javaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return javaScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".js") && !entry.name.includes(".test.") ? [path] : [];
  }));
  return nested.flat();
}

async function auditSourceUsage() {
  const factoryUses = new Map();
  const mathUses = new Map();
  const excludedUses = [];
  for (const path of await javaScriptFiles(SOURCE_DIR)) {
    const source = await readFile(path, "utf8");
    for (const match of source.matchAll(/\.(?:add|make)\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!factoryUses.has(match[1])) factoryUses.set(match[1], path);
    }
    for (const match of source.matchAll(/\bPhaser\.Math\.([A-Za-z_$][\w$]*)\b/g)) {
      if (!mathUses.has(match[1])) mathUses.set(match[1], path);
    }
    const excludedPatterns = [
      [/\bPhaser\.BlendModes\b|\.setBlendMode\s*\(/, "advanced blend mode"],
      [/\b(?:this|scene|this\.scene)\.sound\b/, "Phaser Sound"],
      [/\b(?:this|scene|this\.scene)\.plugins\b/, "Phaser plugin manager"],
      [/\b(?:this|scene|this\.scene)\.(?:physics|matter)\b/, "Phaser physics"],
    ];
    for (const [pattern, label] of excludedPatterns) {
      if (pattern.test(source)) excludedUses.push(`${label} in ${path}`);
    }
  }
  return {
    factories: [...factoryUses.keys()].sort(),
    math: [...mathUses.keys()].sort(),
    unsupportedFactories: [...factoryUses].filter(([name]) => !SUPPORTED_FACTORIES.has(name)).map(([name, path]) => `${name} in ${path}`),
    unsupportedMath: [...mathUses].filter(([name]) => !SUPPORTED_PHASER_MATH.has(name)).map(([name, path]) => `${name} in ${path}`),
    excludedUses,
  };
}

const sourceAudit = await auditSourceUsage();
const first = await ensureCustomPhaser({ force: true });
const firstBytes = await readFile(CUSTOM_PHASER_PATH);
const second = await ensureCustomPhaser({ force: true });
const secondBytes = await readFile(CUSTOM_PHASER_PATH);
const text = secondBytes.toString("utf8");
const gzipBytes = gzipSync(secondBytes, { level: 9 }).byteLength;

const failures = [];
if (first.outputSha256 !== second.outputSha256 || !firstBytes.equals(secondBytes)) failures.push("repeated build was not byte-identical");
if (second.phaserVersion !== "3.90.0") failures.push(`expected Phaser 3.90.0, received ${second.phaserVersion}`);
if (second.esbuildVersion !== "0.27.7") failures.push(`expected esbuild 0.27.7, received ${second.esbuildVersion}`);
if (!text.startsWith("/*! Phaser v3.90.0") || !text.includes("MIT License")) failures.push("Phaser MIT license banner is missing");
if (secondBytes.byteLength > 720_000) failures.push(`raw bundle ${secondBytes.byteLength} exceeded 720000 bytes`);
if (gzipBytes > 200_000) failures.push(`gzip bundle ${gzipBytes} exceeded 200000 bytes`);
if (second.featureFlags.FEATURE_SOUND !== false) failures.push("Phaser Sound was not compiled out");
if (second.featureFlags.CANVAS_RENDERER !== true || second.featureFlags.WEBGL_RENDERER !== true) failures.push("Canvas/WebGL renderer flags were not preserved");
if (sourceAudit.unsupportedFactories.length) failures.push(`source uses factories outside the custom core: ${sourceAudit.unsupportedFactories.join(", ")}`);
if (sourceAudit.unsupportedMath.length) failures.push(`source uses Phaser.Math APIs outside the custom core: ${sourceAudit.unsupportedMath.join(", ")}`);
if (sourceAudit.excludedUses.length) failures.push(`source uses intentionally excluded Phaser features: ${sourceAudit.excludedUses.join(", ")}`);

const output = {
  ok: failures.length === 0,
  path: CUSTOM_PHASER_PATH,
  rawBytes: secondBytes.byteLength,
  gzipBytes,
  sha256: second.outputSha256,
  includedApis: second.includedApis,
  sourceAudit,
  failures,
};
console.log(JSON.stringify(output, null, 2));
if (failures.length) throw new Error(failures.join(" | "));

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build, version as esbuildVersion } from "esbuild";

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(TOOL_DIR, "../..");
const ENTRY_PATH = resolve(TOOL_DIR, "custom-entry.cjs");
const CACHE_DIR = resolve(ROOT_DIR, ".cache/phaser");
const META_PATH = resolve(CACHE_DIR, "phaser-custom.meta.json");
export const CUSTOM_PHASER_PATH = resolve(CACHE_DIR, "phaser-custom.mjs");

const BUILD_SCHEMA = 1;
const EXPECTED_PHASER_VERSION = "3.90.0";
const EXPECTED_ESBUILD_VERSION = "0.27.7";
const LICENSE_BANNER = "/*! Phaser v3.90.0 (c) 2013-2025 Phaser Studio Inc. — MIT License: https://opensource.org/licenses/MIT */";
const CANVAS_FEATURES_STUB = "module.exports = { supportInverseAlpha: false, supportNewBlendModes: false };";
const FEATURE_FLAGS = Object.freeze({
  CANVAS_RENDERER: true,
  WEBGL_RENDERER: true,
  WEBGL_DEBUG: false,
  EXPERIMENTAL: false,
  PLUGIN_3D: false,
  PLUGIN_CAMERA3D: false,
  PLUGIN_FBINSTANT: false,
  FEATURE_SOUND: false,
});
const INCLUDED_APIS = Object.freeze([
  "Game",
  "Scene",
  "Events.EventEmitter",
  "Math.Between",
  "Math.Clamp",
  "GameObjects.Graphics",
  "GameObjects.Image",
  "GameObjects.Sprite",
  "GameObjects.Text",
  "GameObjectFactory.rectangle",
  "GameObjectFactory.circle",
  "GameObjectFactory.zone",
  "Input",
  "Loader.ImageFile",
  "Scale",
  "Time",
  "Tweens",
]);

const normalized = (path) => path.split(sep).join("/");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function packageVersion(name) {
  const pkg = JSON.parse(await readFile(resolve(ROOT_DIR, `node_modules/${name}/package.json`), "utf8"));
  return pkg.version;
}

async function fingerprint() {
  const [entry, builder, phaserVersion] = await Promise.all([
    readFile(ENTRY_PATH),
    readFile(fileURLToPath(import.meta.url)),
    packageVersion("phaser"),
  ]);
  if (phaserVersion !== EXPECTED_PHASER_VERSION) {
    throw new Error(`Custom Phaser requires phaser@${EXPECTED_PHASER_VERSION}; installed ${phaserVersion}`);
  }
  if (esbuildVersion !== EXPECTED_ESBUILD_VERSION) {
    throw new Error(`Custom Phaser requires esbuild@${EXPECTED_ESBUILD_VERSION}; installed ${esbuildVersion}`);
  }
  const inputs = JSON.stringify({
    schema: BUILD_SCHEMA,
    phaserVersion,
    esbuildVersion,
    entrySha256: sha256(entry),
    builderSha256: sha256(builder),
    flags: FEATURE_FLAGS,
    canvasFeaturesStub: CANVAS_FEATURES_STUB,
    includedApis: INCLUDED_APIS,
  });
  return { hash: sha256(inputs), phaserVersion };
}

function phaserSourcePlugin() {
  const flagPattern = new RegExp(`typeof (${Object.keys(FEATURE_FLAGS).join("|")})`, "g");
  return {
    name: "gaepyo-phaser-source-flags",
    setup(builder) {
      builder.onLoad({ filter: /[\\/]node_modules[\\/]phaser[\\/]src[\\/].*\.js$/ }, async (args) => {
        if (normalized(args.path).endsWith("/device/CanvasFeatures.js")) {
          return { contents: CANVAS_FEATURES_STUB, loader: "js" };
        }
        let contents = await readFile(args.path, "utf8");
        contents = contents.replace(flagPattern, (_, flag) => String(FEATURE_FLAGS[flag]));
        return { contents, loader: "js" };
      });
    },
  };
}

async function cachedMeta() {
  try {
    const [metaText, output] = await Promise.all([readFile(META_PATH, "utf8"), readFile(CUSTOM_PHASER_PATH)]);
    const meta = JSON.parse(metaText);
    if (meta.outputBytes !== output.byteLength || meta.outputSha256 !== sha256(output)) return null;
    return meta;
  } catch {
    return null;
  }
}

export async function ensureCustomPhaser({ force = false } = {}) {
  const identity = await fingerprint();
  const cached = await cachedMeta();
  if (!force && cached?.fingerprint === identity.hash) return { ...cached, cached: true };

  const result = await build({
    entryPoints: [ENTRY_PATH],
    bundle: true,
    write: false,
    minify: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    charset: "utf8",
    legalComments: "none",
    banner: { js: `${LICENSE_BANNER}\nconst global = globalThis;` },
    plugins: [phaserSourcePlugin()],
    logLevel: "warning",
  });
  const output = result.outputFiles.find((file) => file.path.endsWith(".js")) ?? result.outputFiles[0];
  if (!output) throw new Error("Custom Phaser build produced no JavaScript output");

  await mkdir(CACHE_DIR, { recursive: true });
  const temporarySuffix = `${process.pid}-${Date.now()}-${randomUUID()}.tmp`;
  const temporaryPath = `${CUSTOM_PHASER_PATH}.${temporarySuffix}`;
  try {
    await writeFile(temporaryPath, output.contents);
    await rename(temporaryPath, CUSTOM_PHASER_PATH);
  } finally {
    await rm(temporaryPath, { force: true });
  }

  const meta = {
    schemaVersion: BUILD_SCHEMA,
    fingerprint: identity.hash,
    phaserVersion: identity.phaserVersion,
    esbuildVersion,
    outputBytes: output.contents.byteLength,
    outputSha256: sha256(output.contents),
    featureFlags: FEATURE_FLAGS,
    canvasFeatures: { supportInverseAlpha: false, supportNewBlendModes: false },
    includedApis: INCLUDED_APIS,
  };
  const temporaryMetaPath = `${META_PATH}.${temporarySuffix}`;
  try {
    await writeFile(temporaryMetaPath, `${JSON.stringify(meta, null, 2)}\n`);
    await rename(temporaryMetaPath, META_PATH);
  } finally {
    await rm(temporaryMetaPath, { force: true });
  }
  return { ...meta, cached: false };
}

const isCli = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isCli) {
  const result = await ensureCustomPhaser({ force: process.argv.includes("--force") });
  console.log(JSON.stringify({ status: result.cached ? "cached" : "built", path: CUSTOM_PHASER_PATH, ...result }, null, 2));
}

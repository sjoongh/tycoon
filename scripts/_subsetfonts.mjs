import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repoRoot, "tools", "font-source");
const outputRoot = join(repoRoot, "public", "fonts");
const textInputs = [join(repoRoot, "src"), join(repoRoot, "index.html"), join(repoRoot, "public", "manifest.webmanifest")];
const acceptedExtensions = new Set([".css", ".html", ".js", ".json", ".webmanifest"]);

function collectFiles(path, files = []) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    readdirSync(path, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((entry) => collectFiles(join(path, entry.name), files));
    return files;
  }
  const extension = path.slice(path.lastIndexOf("."));
  if (acceptedExtensions.has(extension)) files.push(path);
  return files;
}

const files = textInputs.flatMap((path) => collectFiles(path));
const sourceText = files.map((path) => readFileSync(path, "utf8")).join("\n").normalize("NFC");
const codepoints = [...new Set([...sourceText].map((char) => char.codePointAt(0)))]
  .sort((a, b) => a - b);
const subsetText = codepoints.map((codepoint) => String.fromCodePoint(codepoint)).join("");

// 카툰 UI 폰트(Jua·Do Hyeon, OFL) — 게임 문구에 쓰인 글자만 남긴다. 숫자·기호는 항상 포함.
const ALWAYS = "0123456789.,%+-×/:!?·★▲▼▶◆◇✓✕≥≤~()[]";
for (const family of ["Jua", "DoHyeon"]) {
  const source = join(sourceRoot, `${family}.full.ttf`);
  const output = join(outputRoot, `${family}.woff2`);
  const subset = await subsetFont(readFileSync(source), subsetText + ALWAYS, {
    targetFormat: "woff2",
    preserveNameIds: [0, 1, 2, 3, 4, 5, 6, 13, 14],
  });
  writeFileSync(output, subset);
  const before = statSync(source).size;
  const after = statSync(output).size;
  if (after >= before) throw new Error(`${family} subset did not shrink (${before} -> ${after})`);
  console.log(`${relative(repoRoot, output)}: ${before} -> ${after} bytes`);
}
console.log(`Static UI coverage: ${codepoints.length} codepoints from ${files.length} source files`);

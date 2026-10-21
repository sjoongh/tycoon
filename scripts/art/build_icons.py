#!/usr/bin/env python3
"""아이콘 아틀라스 빌더.

scripts/art/icons.manifest.json 의 항목을 game-icons.net SVG(assets/art-src/_packs/game-icons)
또는 내장 커스텀 도트맵에서 래스터라이즈 → 1px 외곽선(#2b1d2e) + 2/3톤 셰이딩(광원 좌상단)으로
픽셀 아이콘화 → 16px/32px 그리드 아틀라스로 패킹한다.

출력
  public/art/icons16.png, public/art/icons32.png   (아틀라스)
  src/assets/iconAtlas.js                           (이름 → 시트·좌표, DOM/Phaser 공용)
  .tmp/icons-preview.png                            (검수용 4배 미리보기)

의존: ImageMagick `magick`(SVG 래스터), Pillow.
"""
from __future__ import annotations

import json
import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PACKS = ROOT / "assets" / "art-src" / "_packs"
GI = PACKS / "game-icons"
MANIFEST = ROOT / "scripts" / "art" / "icons.manifest.json"
PALETTE = ROOT / "scripts" / "art" / "palette.json"
OUT_DIR = ROOT / "public" / "art"
OUT_JS = ROOT / "src" / "assets" / "iconAtlas.js"
PREVIEW = ROOT / ".tmp" / "icons-preview.png"

# 셀 안쪽 실제 글리프 크기(여백 포함 셀 = size)
INNER = {16: 14, 32: 28}
COLS = {16: 16, 32: 8}


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def clamp(v: float) -> int:
    return max(0, min(255, int(round(v))))


def shade(rgb, k: float):
    """k>0 밝게, k<0 어둡게. 어두울 때는 약간 한색으로 기울인다(픽셀아트 관례)."""
    r, g, b = rgb
    if k >= 0:
        return (clamp(r + (255 - r) * k), clamp(g + (255 - g) * k), clamp(b + (255 - b) * k))
    f = 1 + k
    return (clamp(r * f * 0.95), clamp(g * f), clamp(b * f * 1.08))


def resolve_color(spec: str, roles: dict) -> dict:
    if spec in roles:
        return {k: hex_rgb(v) for k, v in roles[spec].items()}
    base = hex_rgb(spec)
    return {"hi": shade(base, 0.35), "base": base, "sh": shade(base, -0.35)}


# ---------- 소스 → 마스크 ----------

def rasterize_svg(svg: Path, inner: int) -> Image.Image:
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run(
            [
                "magick", "-background", "none", "-density", "384", str(svg),
                "-filter", "Lanczos", "-resize", f"{inner}x{inner}",
                "-gravity", "center", "-extent", f"{inner}x{inner}", tmp_path,
            ],
            check=True, capture_output=True,
        )
        return Image.open(tmp_path).convert("RGBA").copy()
    finally:
        os.unlink(tmp_path)


def mask_from_image(img: Image.Image, threshold: int = 128) -> set[tuple[int, int]]:
    """game-icons SVG는 검정 정사각형 배경 위 흰 글리프라 알파가 아니라 밝기로 글리프를 뽑는다."""
    w, h = img.size
    px = img.load()
    mask = set()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a >= 128 and (r + g + b) / 3 >= threshold:
                mask.add((x, y))
    return mask


BALLOT_16 = [
    "..............",
    "....########..",
    "....#......##.",
    "....#......#.#",
    "....#......###",
    "....#..##....#",
    "....#.####...#",
    "....#.####...#",
    "....#..##....#",
    "....#........#",
    "....#.####...#",
    "....#........#",
    "....#.######.#",
    "....##########",
]

BALLOT_32 = [
    "............................",
    "......##################....",
    "......#................##...",
    "......#................#.#..",
    "......#................#..#.",
    "......#................#...#",
    "......#................#####",
    "......#....######..........#",
    "......#...########.........#",
    "......#..##########........#",
    "......#..##########........#",
    "......#..##########........#",
    "......#...########.........#",
    "......#....######..........#",
    "......#....................#",
    "......#..############......#",
    "......#....................#",
    "......#..###############...#",
    "......#....................#",
    "......#..#########.........#",
    "......#....................#",
    "......#..###############...#",
    "......#....................#",
    "......#....................#",
    "......######################",
    "............................",
    "............................",
    "............................",
]

# 커스텀 맵: '#' = 베이스(종이), 'S' 영역은 아래 overlay로 지정
CUSTOM = {"ballot": {16: BALLOT_16, 32: BALLOT_32}}
# 기표 도장 영역(accent). (x, y) 사각형: 종이 안쪽 둥근 자국을 accent로 칠한다.
CUSTOM_ACCENT = {
    "ballot": {
        16: [(6, 5), (7, 5), (6, 6), (7, 6), (8, 6), (9, 6), (6, 7), (7, 7), (8, 7), (9, 7), (7, 8), (8, 8)],
        32: [(x, y) for y in range(7, 14) for x in range(9, 19)
             if not ((y in (7, 13) and x in (9, 10, 17, 18)) or (y in (8, 12) and x in (9, 18)))],
    }
}


def mask_from_map(rows: list[str]) -> set[tuple[int, int]]:
    mask = set()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                mask.add((x, y))
    return mask


# ---------- 스타일라이즈 ----------

def stylize(mask: set[tuple[int, int]], inner: int, colors: dict, outline, size: int,
            sparkle=None, accent_px=None) -> Image.Image:
    """마스크를 셀 중앙에 놓고 톤·외곽선을 입힌 size×size RGBA 이미지를 돌려준다."""
    cell = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = cell.load()
    off = (size - inner) // 2
    three_tone = size >= 32

    def inside(x, y):
        return (x, y) in mask

    for (x, y) in mask:
        top_open = not inside(x, y - 1) or not inside(x - 1, y - 1) or not inside(x - 1, y)
        bottom_open = not inside(x, y + 1) or not inside(x + 1, y + 1) or not inside(x + 1, y)
        if three_tone:
            if top_open and not bottom_open:
                tone = colors["hi"]
            elif bottom_open and not top_open:
                tone = colors["sh"]
            elif top_open and bottom_open:
                tone = colors["base"]
            else:
                tone = colors["base"]
        else:
            tone = colors["sh"] if (bottom_open and not top_open) else colors["base"]
        px[x + off, y + off] = (*tone, 255)

    if accent_px:
        for (x, y) in accent_px:
            if (x, y) in mask:
                px[x + off, y + off] = (*colors["accent"], 255)

    # 외곽선: 8방향 팽창 - 마스크
    for (x, y) in list(mask):
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nx, ny = x + dx, y + dy
                if (nx, ny) in mask:
                    continue
                cx, cy = nx + off, ny + off
                if 0 <= cx < size and 0 <= cy < size and px[cx, cy][3] == 0:
                    px[cx, cy] = (*outline, 255)

    if sparkle:
        # 좌상단에서 가장 가까운 내부 픽셀 1~2개를 흰 광택점으로
        inner_pts = [(x, y) for (x, y) in mask if all(inside(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1))]
        inner_pts.sort(key=lambda p: (p[0] + p[1], p[0]))
        for p in inner_pts[: (2 if three_tone else 1)]:
            px[p[0] + off, p[1] + off] = (*sparkle, 255)
    return cell


# ---------- 메인 ----------

def main() -> int:
    manifest = json.loads(MANIFEST.read_text("utf-8"))
    pal = json.loads(PALETTE.read_text("utf-8"))
    outline = hex_rgb(pal["outline"])
    sparkle = hex_rgb(pal["sparkle"])
    roles = pal["roles"]

    cells: dict[int, list[tuple[str, Image.Image]]] = {16: [], 32: []}
    missing = []
    cache: dict[tuple[str, int], set] = {}

    for item in manifest["icons"]:
        name, src = item["name"], item["src"]
        colors = resolve_color(item["color"], roles)
        for size in item["sizes"]:
            inner = INNER[size]
            key = (src, size)
            if key not in cache:
                if src.startswith("gi:"):
                    svg = GI / (src[3:] + ".svg")
                    if not svg.exists():
                        missing.append(src)
                        continue
                    cache[key] = mask_from_image(rasterize_svg(svg, inner))
                elif src.startswith("custom:"):
                    cache[key] = mask_from_map(CUSTOM[src[7:]][size])
                else:
                    raise SystemExit(f"unknown src {src}")
            mask = cache.get(key)
            if mask is None:
                continue
            accent = CUSTOM_ACCENT.get(src[7:], {}).get(size) if src.startswith("custom:") else None
            cells[size].append((name, stylize(mask, inner, colors, outline, size,
                                              sparkle if item.get("sparkle") else None, accent)))
            for suffix, role in (item.get("tints") or {}).items():
                tcolors = resolve_color(role, roles)
                cells[size].append((f"{name}--{suffix}", stylize(mask, inner, tcolors, outline, size)))

    if missing:
        print("MISSING SVG:", *missing, sep="\n  ", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    js_entries = []
    sheets = {}
    for size, items in cells.items():
        if not items:
            continue
        cols = COLS[size]
        rows = math.ceil(len(items) / cols)
        sheet = Image.new("RGBA", (cols * size, rows * size), (0, 0, 0, 0))
        for i, (name, img) in enumerate(items):
            x, y = (i % cols) * size, (i // cols) * size
            sheet.alpha_composite(img, (x, y))
            js_entries.append((name, size, x, y))
        out = OUT_DIR / f"icons{size}.png"
        sheet.save(out, optimize=True)
        sheets[size] = (sheet.size, len(items), out)

    lines = [
        "// 자동 생성 — scripts/art/build_icons.py. 직접 수정 금지.",
        "// 아이콘 이름 → [셀 크기, x, y]. 시트 URL은 ICON_SHEETS[size].",
        "export const ICON_SHEETS = {",
    ]
    for size, ((w, h), n, out) in sorted(sheets.items()):
        lines.append(f'  {size}: {{ url: "/art/{out.name}", width: {w}, height: {h}, count: {n} }},')
    lines.append("};")
    lines.append("export const ICONS = {")
    for name, size, x, y in js_entries:
        lines.append(f'  "{name}": [{size}, {x}, {y}],')
    lines.append("};")
    lines.append("export const ICON_NAMES = Object.keys(ICONS);")
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text("\n".join(lines) + "\n", "utf-8")

    # 미리보기(4배, 패널색 배경)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    scale = 4
    pad = 8
    blocks = []
    for size, ((w, h), n, out) in sorted(sheets.items()):
        blocks.append(Image.open(out).convert("RGBA"))
    W = max(b.width for b in blocks) * scale + pad * 2
    H = sum(b.height * scale + pad for b in blocks) + pad
    prev = Image.new("RGBA", (W, H), (0x26, 0x2B, 0x44, 255))
    y = pad
    for b in blocks:
        up = b.resize((b.width * scale, b.height * scale), Image.NEAREST)
        prev.alpha_composite(up, (pad, y))
        y += up.height + pad
    prev.save(PREVIEW)

    for size, ((w, h), n, out) in sorted(sheets.items()):
        print(f"{out.relative_to(ROOT)}  {w}x{h}  {n} icons  {out.stat().st_size} bytes")
    print(f"{OUT_JS.relative_to(ROOT)}  {len(js_entries)} entries")
    print(f"preview: {PREVIEW.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

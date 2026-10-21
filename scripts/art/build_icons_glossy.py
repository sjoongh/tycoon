#!/usr/bin/env python3
"""광택 카툰 아이콘 아틀라스 빌더 (Idle Miner Tycoon 류 모바일 타이쿤 스타일, 픽셀 아님).

icons.manifest.json 의 항목을 game-icons.net SVG(CC BY 3.0)에서 매끄럽게 래스터 → 둥근 그라데이션 배지 +
유리 하이라이트 + 드롭섀도 위에 흰 글리프(그림자 1겹)로 그린다. 탭 아이콘은 배지 없이 글리프만(비활성 회백 / 활성 금색).

출력
  public/art/icons96.png          96px 셀 아틀라스(8열)
  src/assets/iconAtlas.js         이름 → [셀, x, y] (DOM/Phaser 공용, 기존 API 유지)
  .tmp/icons-glossy-preview.png   검수용
의존: ImageMagick(magick), Pillow
"""
from __future__ import annotations

import json
import math
import os
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
GI = ROOT / "assets" / "art-src" / "_packs" / "game-icons"
MANIFEST = ROOT / "scripts" / "art" / "icons.manifest.json"
OUT_PNG = ROOT / "public" / "art" / "icons96.png"
OUT_JS = ROOT / "src" / "assets" / "iconAtlas.js"
PREVIEW = ROOT / ".tmp" / "icons-glossy-preview.png"

CELL = 96
COLS = 8

# 역할 → (위 색, 아래 색). 밝은 위, 진한 아래 = 광택 배지.
GRADIENTS = {
    "votes":    ("#ffe9a8", "#f0a020"),
    "explain":  ("#6fd6ff", "#1c7fd6"),
    "trust":    ("#ff9fb0", "#dc3b62"),
    "glyph":    ("#dfe4ee", "#6e7890"),
    "paper":    ("#ffe7b8", "#d99a3b"),
    "gold":     ("#ffe27a", "#e39a16"),
    "buy":      ("#9fe77f", "#3fa23a"),
    "danger":   ("#ff8f7f", "#d93a2f"),
    "wood":     ("#e1a66f", "#8e5a2e"),
    "ink":      ("#7f8aa0", "#3a4466"),
    "prestige": ("#b4bfd6", "#55627e"),
    "tab-facilities": ("#ffd36b", "#e08a1e"),
    "tab-crew":       ("#9fe77f", "#3fa23a"),
    "tab-events":     ("#ff8f7f", "#d93a2f"),
    "tab-goals":      ("#ffe27a", "#e39a16"),
    "tab-prestige":   ("#b4bfd6", "#55627e"),
}
# 시설·직원처럼 hex 색이 직접 오면 밝기/어둡기로 그라데이션 생성
def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))

def mix(c, w, k):
    return tuple(int(round(c[i] + (w[i] - c[i]) * k)) for i in range(3))

def gradient_for(spec):
    if spec in GRADIENTS:
        return hexrgb(GRADIENTS[spec][0]), hexrgb(GRADIENTS[spec][1])
    base = hexrgb(spec)
    return mix(base, (255, 255, 255), 0.45), mix(base, (0, 0, 0), 0.3)


def glyph(name: str, size: int) -> Image.Image:
    """game-icons SVG → 흰 글리프(알파). 검정 배경은 밝기로 제거."""
    tmp = tempfile.mktemp(suffix=".png")
    subprocess.run(
        ["magick", "-background", "none", "-density", "600", str(GI / f"{name}.svg"),
         "-resize", f"{size}x{size}", "-gravity", "center", "-extent", f"{size}x{size}", tmp],
        check=True, capture_output=True,
    )
    im = Image.open(tmp).convert("RGBA")
    os.unlink(tmp)
    px = im.load()
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    o = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            lum = (r + g + b) // 3
            if a > 0 and lum > 40:
                o[x, y] = (255, 255, 255, int(a * lum / 255))
    return out


def ballot_glyph(size: int) -> Image.Image:
    """투표지 글리프(이미 색이 입혀진 완성 글리프): 크림 종이 + 접힌 귀 + 빨간 체크 도장 + 외곽선."""
    S = size * 4  # 슈퍼샘플
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = S * 0.2, S * 0.06, S * 0.8, S * 0.94
    fold = S * 0.18
    ol = (120, 80, 30, 255)
    d.polygon([(x0, y0), (x1 - fold, y0), (x1, y0 + fold), (x1, y1), (x0, y1)], fill=(255, 244, 214, 255), outline=ol, width=int(S * 0.03))
    d.polygon([(x1 - fold, y0), (x1 - fold, y0 + fold), (x1, y0 + fold)], fill=(236, 208, 150, 255), outline=ol, width=int(S * 0.025))
    for i, w in enumerate((0.34, 0.42, 0.3)):
        y = y0 + S * (0.58 + i * 0.1)
        d.rounded_rectangle([x0 + S * 0.1, y, x0 + S * 0.1 + S * w, y + S * 0.045], S * 0.02, fill=(200, 184, 150, 255))
    d.ellipse([S * 0.33, S * 0.2, S * 0.67, S * 0.52], outline=(226, 60, 60, 255), width=int(S * 0.04))
    d.line([(S * 0.41, S * 0.37), (S * 0.48, S * 0.45), (S * 0.6, S * 0.28)], fill=(226, 60, 60, 255), width=int(S * 0.055), joint="curve")
    return im.resize((size, size), Image.LANCZOS)


def badge(top, bottom, S=CELL) -> Image.Image:
    R = int(S * 0.22)
    pad = int(S * 0.07)
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + S * 0.05, S - pad, S - pad + S * 0.03], R, fill=(0, 0, 0, 110))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * 0.03)))
    grad = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gp = grad.load()
    for y in range(S):
        c = mix(top, bottom, y / (S - 1))
        for x in range(S):
            gp[x, y] = (*c, 255)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([pad, pad, S - pad, S - pad], R, fill=255)
    im.paste(grad, (0, 0), mask)
    ImageDraw.Draw(im).rounded_rectangle([pad, pad, S - pad, S - pad], R, outline=(*mix(bottom, (0, 0, 0), 0.4), 255), width=max(2, S // 40))
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(hl).rounded_rectangle([pad + S * 0.08, pad + S * 0.06, S - pad - S * 0.08, S * 0.46], int(R * 0.8), fill=(255, 255, 255, 70))
    im.alpha_composite(hl)
    return im


def sticker_tile(rim, S=CELL) -> Image.Image:
    """크림 타일 + 색 테두리 + 부드러운 그림자·광택(스티커 아이콘 바탕)."""
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    pad = int(S * 0.06)
    R = int(S * 0.24)
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + S * 0.05, S - pad, S - pad + S * 0.03], R, fill=(0, 0, 0, 110))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * 0.035)))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([pad, pad, S - pad, S - pad], R, fill=(*mix(rim, (0, 0, 0), 0.35), 255))
    d.rounded_rectangle([pad + 1, pad + 1, S - pad - 1, S - pad - 1], R - 1, fill=(*rim, 255))
    inner = pad + max(4, S // 22)
    tile_mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(tile_mask).rounded_rectangle([inner, inner, S - inner, S - inner], R - 5, fill=255)
    im.paste(vgrad((S, S), (255, 255, 255), (250, 238, 214)), (0, 0), tile_mask)
    gloss = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(gloss).rounded_rectangle([inner + 2, inner + 2, S - inner - 2, int(S * 0.46)], R - 7, fill=(255, 255, 255, 120))
    im.alpha_composite(gloss)
    return im


def _coverage(a: Image.Image) -> float:
    bbox = a.getbbox()
    if not bbox:
        return 0.0
    hist = a.crop(bbox).histogram()
    solid = sum(hist[128:])
    return solid / float((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]))


def colored_glyph(g: Image.Image, top, bottom) -> Image.Image:
    """흰 글리프 알파 → 굵히기(가는 글리프) + 세로 그라데이션 + 3톤 베벨(좌상 밝음/우하 어두움) + 진한 외곽선 + 광택."""
    a = g.split()[3]
    # 가는 글리프는 1~2px 굵혀 멀리서도 읽히게
    cov = _coverage(a)
    if cov < 0.30:
        a = a.filter(ImageFilter.MaxFilter(5))
    elif cov < 0.42:
        a = a.filter(ImageFilter.MaxFilter(3))
    a = a.point(lambda v: 255 if v > 110 else 0).filter(ImageFilter.GaussianBlur(0.6))
    W, H = g.size
    grad = vgrad(g.size, top, bottom)
    body = Image.new("RGBA", g.size, (0, 0, 0, 0))
    body.paste(grad, (0, 0), a)
    # 베벨: 알파를 우하/좌상으로 밀어 차이 영역을 밝게/어둡게
    hi_mask = ImageChops.subtract(a, ImageChops.offset(a, 2, 2))
    sh_mask = ImageChops.subtract(a, ImageChops.offset(a, -2, -2))
    hi = Image.new("RGBA", g.size, (0, 0, 0, 0)); hi.paste((*mix(top, (255, 255, 255), 0.6), 200), (0, 0), hi_mask)
    sh = Image.new("RGBA", g.size, (0, 0, 0, 0)); sh.paste((*mix(bottom, (0, 0, 0), 0.35), 170), (0, 0), sh_mask)
    body.alpha_composite(sh)
    body.alpha_composite(hi)
    # 외곽선(굵고 진한 같은 계열)
    outline_mask = a.filter(ImageFilter.MaxFilter(7))
    out = Image.new("RGBA", g.size, (0, 0, 0, 0))
    out.paste((*mix(bottom, (0, 0, 0), 0.55), 255), (0, 0), outline_mask)
    out.alpha_composite(body)
    # 상단 광택(세로 페이드)
    hl = Image.new("RGBA", g.size, (0, 0, 0, 0))
    hp = hl.load(); ap = a.load()
    for y in range(H):
        k = max(0.0, 1 - y / (H * 0.5))
        for x in range(W):
            if ap[x, y] > 0:
                hp[x, y] = (255, 255, 255, int(70 * k * ap[x, y] / 255))
    out.alpha_composite(hl)
    return out


def vgrad(size, top, bottom):
    w, h = size
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    px = im.load()
    for y in range(h):
        c = mix(top, bottom, y / max(1, h - 1))
        for x in range(w):
            px[x, y] = (*c, 255)
    return im


def compose_badge(g: Image.Image, top, bottom, S=CELL) -> Image.Image:
    """스티커 아이콘: 테두리색 = 아래 색을 밝힌 톤, 글리프는 색 그라데이션."""
    rim = mix(bottom, (255, 255, 255), 0.25)
    im = sticker_tile(rim, S)
    cg = colored_glyph(g, top, bottom)
    gx, gy = (S - cg.width) // 2, (S - cg.height) // 2
    shadow = Image.new("RGBA", cg.size, (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 80), (0, 0), cg.split()[3])
    im.alpha_composite(shadow, (gx, gy + max(2, S // 40)))
    im.alpha_composite(cg, (gx, gy))
    return im


def tint_glyph(g: Image.Image, rgb) -> Image.Image:
    out = Image.new("RGBA", g.size, (*rgb, 0))
    out.putalpha(g.split()[3])
    return out


def compose_tab(g: Image.Image, rgb, S=CELL) -> Image.Image:
    """배지 없는 탭 글리프(이미 색이 입혀진 글리프) + 부드러운 그림자."""
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gx, gy = (S - g.width) // 2, (S - g.height) // 2
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 150), (gx, gy + 3), g.split()[3])
    im.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(2)))
    im.alpha_composite(g, (gx, gy))
    return im


def main():
    manifest = json.loads(MANIFEST.read_text("utf-8"))
    cells = []
    cache = {}
    for item in manifest["icons"]:
        name, src, color = item["name"], item["src"], item["color"]
        gsize = int(CELL * 0.68)
        key = (src, gsize)
        if key not in cache:
            cache[key] = ballot_glyph(gsize) if src == "custom:ballot" else glyph(src[3:], gsize)
        g = cache[key]
        if name.startswith("tab-"):
            # 비활성: 회백 글리프 / 활성: 금색 글리프
            cells.append((name, compose_tab(colored_glyph(g, (225, 230, 240), (120, 132, 160)), (255, 255, 255))))
            cells.append((f"{name}--on", compose_tab(colored_glyph(g, (255, 236, 160), (224, 138, 30)), (255, 255, 255))))
            continue
        top, bottom = gradient_for(color)
        if src == "custom:ballot":
            # 이미 채색된 글리프 — 타일 위에 그대로 얹는다
            im = sticker_tile(mix(bottom, (255, 255, 255), 0.25))
            gx, gy = (CELL - g.width) // 2, (CELL - g.height) // 2
            shadow = Image.new("RGBA", g.size, (0, 0, 0, 0))
            shadow.paste((0, 0, 0, 80), (0, 0), g.split()[3])
            im.alpha_composite(shadow, (gx, gy + 2))
            im.alpha_composite(g, (gx, gy))
            cells.append((name, im))
            continue
        cells.append((name, compose_badge(g, top, bottom)))

    rows = math.ceil(len(cells) / COLS)
    sheet = Image.new("RGBA", (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    entries = []
    for i, (name, img) in enumerate(cells):
        x, y = (i % COLS) * CELL, (i // COLS) * CELL
        sheet.alpha_composite(img, (x, y))
        entries.append((name, x, y))
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_PNG, optimize=True)

    lines = [
        "// 자동 생성 — scripts/art/build_icons_glossy.py. 직접 수정 금지.",
        "// 아이콘 이름 → [셀 크기, x, y]. 시트 URL은 ICON_SHEETS[size].",
        "export const ICON_SHEETS = {",
        f'  {CELL}: {{ url: "/art/{OUT_PNG.name}", width: {sheet.width}, height: {sheet.height}, count: {len(cells)} }},',
        "};",
        "export const ICONS = {",
        *[f'  "{n}": [{CELL}, {x}, {y}],' for n, x, y in entries],
        "};",
        "export const ICON_NAMES = Object.keys(ICONS);",
    ]
    OUT_JS.write_text("\n".join(lines) + "\n", "utf-8")

    PREVIEW.parent.mkdir(exist_ok=True)
    prev = Image.new("RGBA", (sheet.width + 24, sheet.height + 24), (0x2a, 0x2f, 0x55, 255))
    prev.alpha_composite(sheet, (12, 12))
    prev.save(PREVIEW)
    print(f"{OUT_PNG.relative_to(ROOT)} {sheet.size} {len(cells)} icons {OUT_PNG.stat().st_size} bytes")
    print(f"preview: {PREVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""월드 스프라이트 빌더 — 아이소메트릭 개표소 방·시설 티어 스프라이트·직원 시트.

소스
  Kenney Furniture Kit 아이소 렌더(CC0)  assets/art-src/_packs/kenney_furniturePack/Isometric
  OGA Office worker sprites (CC BY)       assets/art-src/_packs/officesprites
규칙(설계 §4.5)
  월드 표시 배율 3x. 여기서 만드는 PNG는 전부 "소스 해상도"(표시의 1/3)다.
  Endesga 32 팔레트로 양자화, 1px 외곽선 #2b1d2e, 디더링 없음.
출력
  public/art/world/room.png                 방(벽 2면 + 바닥 7x7 타일)
  public/art/world/fac-<id>-t<1..5>.png     시설 티어 스프라이트(origin: 바닥 중앙)
  public/art/world/workers.png              직원 시트(16x16, 4열, OGA 그대로 팔레트 스냅)
  src/world/worldAtlas.js                   시설 스프라이트 치수·앵커, 방 치수
  .tmp/world-preview.png                    검수용 3배 미리보기
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
KENNEY = ROOT / "assets" / "art-src" / "_packs" / "kenney_furniturePack" / "Isometric"
OGA_WORKERS = ROOT / "assets" / "art-src" / "_packs" / "officesprites"
OUT = ROOT / "public" / "art" / "world"
OUT_JS = ROOT / "src" / "world" / "worldAtlas.js"
PREVIEW = ROOT / ".tmp" / "world-preview.png"

OUTLINE = (0x2B, 0x1D, 0x2E)
ENDESGA32 = [
    "#be4a2f", "#d77643", "#ead4aa", "#e4a672", "#b86f50", "#733e39", "#3e2731", "#a22633", "#e43b44", "#f77622",
    "#feae34", "#fee761", "#63c74d", "#3e8948", "#265c42", "#193c3e", "#124e89", "#0099db", "#2ce8f5", "#ffffff",
    "#c0cbdc", "#8b9bb4", "#5a6988", "#3a4466", "#262b44", "#181425", "#ff0044", "#68386c", "#b55088", "#f6757a",
    "#e8b796", "#c28569",
]
PAL = [tuple(int(h[i : i + 2], 16) for i in (1, 3, 5)) for h in ENDESGA32]

# 아이소 타일(소스 px). 표시는 3배 → 48x24.
TILE_W, TILE_H = 16, 8
ROOM_COLS, ROOM_ROWS = 7, 7
WALL_H = 34


def nearest(rgb):
    r, g, b = rgb
    best, bd = PAL[0], 1e9
    for p in PAL:
        d = (p[0] - r) ** 2 * 0.9 + (p[1] - g) ** 2 * 1.2 + (p[2] - b) ** 2 * 0.8
        if d < bd:
            best, bd = p, d
    return best


def quantize(img: Image.Image, alpha_th=128) -> Image.Image:
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    src, dst = img.load(), out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = src[x, y]
            if a >= alpha_th:
                dst[x, y] = (*nearest((r, g, b)), 255)
    return out


def outline(img: Image.Image) -> Image.Image:
    out = img.copy()
    px = out.load()
    w, h = out.size
    solid = {(x, y) for y in range(h) for x in range(w) if px[x, y][3] > 0}
    for (x, y) in list(solid):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in solid and px[nx, ny][3] == 0:
                px[nx, ny] = (*OUTLINE, 255)
    return out


def part(name: str, width: int) -> Image.Image:
    """Kenney 아이소 PNG를 트림 후 목표 폭(소스 px)으로 줄여 양자화."""
    im = Image.open(KENNEY / f"{name}.png").convert("RGBA")
    im = im.crop(im.getbbox())
    scale = width / im.width
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    return quantize(im)


# Kenney 목재 톤 → 시설별 톤 리맵(시설 색 구분). 키: 양자화 후 나오는 목재 4색.
WOOD = [(0xE8, 0xB7, 0x96), (0xC2, 0x85, 0x69), (0xB8, 0x6F, 0x50), (0x73, 0x3E, 0x39)]
TINTS = {
    "desk": None,
    "sorter": [(0xFF, 0xFF, 0xFF), (0xEA, 0xD4, 0xAA), (0xE4, 0xA6, 0x72), (0xB8, 0x6F, 0x50)],
    "server": [(0x8B, 0x9B, 0xB4), (0x5A, 0x69, 0x88), (0x3A, 0x44, 0x66), (0x26, 0x2B, 0x44)],
    "archive": [(0xC2, 0x85, 0x69), (0xB8, 0x6F, 0x50), (0x73, 0x3E, 0x39), (0x3E, 0x27, 0x31)],
    "studio": [(0xC0, 0xCB, 0xDC), (0x8B, 0x9B, 0xB4), (0x5A, 0x69, 0x88), (0x3A, 0x44, 0x66)],
}


def retint(img: Image.Image, tint):
    if not tint:
        return img
    m = dict(zip(WOOD, tint))
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in m:
                px[x, y] = (*m[(r, g, b)], a)
    return img


SIZE_MUL = 0.7  # 가구 전역 축소(타일 16x8 기준 책상 ≈ 1.3타일)


def compose(parts: list[tuple[str, int, int, int]], pad=2, tint=None) -> Image.Image:
    """parts: (kenney_name, width, dx, dy). dx,dy는 바닥 중앙 앵커 기준(오른쪽/아래 +). 결과 origin = 바닥 중앙."""
    rendered = []
    for name, width, dx, dy in parts:
        p = retint(part(name, max(4, round(width * SIZE_MUL))), tint)
        rendered.append((p, round(dx * SIZE_MUL), round(dy * SIZE_MUL)))
    minx = min(dx - p.width // 2 for p, dx, dy in rendered) - pad
    maxx = max(dx - p.width // 2 + p.width for p, dx, dy in rendered) + pad
    miny = min(dy - p.height for p, dx, dy in rendered) - pad
    maxy = max(dy for p, dx, dy in rendered) + pad
    canvas = Image.new("RGBA", (maxx - minx, maxy - miny), (0, 0, 0, 0))
    # 뒤쪽(작은 dy) 먼저 그려 앞 물체가 덮게
    for p, dx, dy in sorted(rendered, key=lambda t: t[2]):
        canvas.alpha_composite(p, (dx - p.width // 2 - minx, dy - p.height - miny))
    canvas = outline(canvas)
    anchor = (-minx, -miny)  # 바닥 중앙의 캔버스 좌표
    return canvas, anchor


# 시설별 5티어 구성 — (Kenney 이름, 폭, dx, dy). dy=0이 바닥선. 아이소 SE 뷰.
FACILITIES = {
    "desk": [
        [("desk_SE", 30, 0, 0)],
        [("desk_SE", 30, 0, 0), ("laptop_SE", 9, 2, -8)],
        [("desk_SE", 32, 0, 0), ("computerScreen_SE", 10, -4, -9), ("computerKeyboard_SE", 8, 4, -8)],
        [("deskCorner_SE", 38, 0, 0), ("computerScreen_SE", 10, -8, -10), ("computerKeyboard_SE", 8, 0, -9), ("pottedPlant_SE", 8, 14, 0)],
        [("deskCorner_SE", 40, 0, 0), ("computerScreen_SE", 10, -10, -10), ("computerScreen_SE", 10, 0, -12), ("computerKeyboard_SE", 8, -2, -9), ("pottedPlant_SE", 9, 16, 0), ("lampSquareTable_SE", 6, 10, -8)],
    ],
    "sorter": [
        [("cardboardBoxOpen_SE", 16, 0, 0)],
        [("cardboardBoxOpen_SE", 16, -6, 0), ("cardboardBoxClosed_SE", 14, 7, 1)],
        [("cardboardBoxClosed_SE", 14, -7, 1), ("cardboardBoxOpen_SE", 16, 6, 0), ("cardboardBoxClosed_SE", 13, -2, -8)],
        [("sideTableDrawers_SE", 20, 0, 0), ("cardboardBoxOpen_SE", 14, -1, -12), ("cardboardBoxClosed_SE", 12, 12, 2)],
        [("bookcaseClosedWide_SE", 32, 0, 0), ("cardboardBoxOpen_SE", 14, -10, 4), ("cardboardBoxClosed_SE", 12, 8, 5), ("cardboardBoxClosed_SE", 12, 0, -2)],
    ],
    "server": [
        [("speaker_SE", 9, 0, 0)],
        [("speaker_SE", 9, -5, 0), ("speaker_SE", 9, 5, 0)],
        [("speaker_SE", 9, -9, 0), ("speaker_SE", 9, 0, 0), ("speaker_SE", 9, 9, 0)],
        [("speaker_SE", 9, -10, 0), ("speaker_SE", 9, -1, 0), ("speaker_SE", 9, 8, 0), ("computerScreen_SE", 9, 18, 2)],
        [("speaker_SE", 9, -14, 0), ("speaker_SE", 9, -5, 0), ("speaker_SE", 9, 4, 0), ("speaker_SE", 9, 13, 0), ("computerScreen_SE", 9, 22, 3), ("lampSquareFloor_SE", 5, -22, 0)],
    ],
    "archive": [
        [("bookcaseOpenLow_SE", 20, 0, 0)],
        [("bookcaseOpen_SE", 20, 0, 0)],
        [("bookcaseOpen_SE", 20, -8, 0), ("bookcaseClosed_SE", 20, 10, 2)],
        [("bookcaseClosedWide_SE", 34, 0, 0), ("books_SE", 8, 10, 2)],
        [("bookcaseClosedWide_SE", 34, -6, 0), ("bookcaseClosed_SE", 20, 18, 4), ("books_SE", 8, -12, 3), ("books_SE", 8, 4, 4)],
    ],
    "studio": [
        [("radio_SE", 12, 0, 0)],
        [("sideTable_SE", 16, 0, 0), ("televisionVintage_SE", 12, 0, -7)],
        [("cabinetTelevision_SE", 26, 0, 0), ("televisionModern_SE", 18, 0, -9)],
        [("cabinetTelevision_SE", 26, 0, 0), ("televisionModern_SE", 18, 0, -9), ("speakerSmall_SE", 6, 16, 0)],
        [("cabinetTelevision_SE", 28, 0, 0), ("televisionModern_SE", 20, 0, -9), ("speakerSmall_SE", 6, 18, 0), ("speakerSmall_SE", 6, -18, 0), ("lampSquareFloor_SE", 5, -24, -2)],
    ],
}

# 안심공지판은 Kenney에 없어 직접 그린다(벽 패널 + 종이). 폭이 티어마다 커진다.
NOTICE_PAPERS = [2, 3, 5, 7, 9]


def notice_sprite(tier: int):
    w = 13 + tier * 3
    h = 11 + tier
    img = Image.new("RGBA", (w + 4, h + 10), (0, 0, 0, 0))
    px = img.load()
    board = (0xB8, 0x6F, 0x50)
    cork = (0xE8, 0xB7, 0x96)
    paper = (0xEA, 0xD4, 0xAA)
    pin = (0xE4, 0x3B, 0x44)
    leg = (0x73, 0x3E, 0x39)
    ox, oy = 2, 2
    for y in range(h):
        for x in range(w):
            px[ox + x, oy + y] = (*(board if (x in (0, w - 1) or y in (0, h - 1)) else cork), 255)
    # 다리
    for y in range(h, h + 6):
        px[ox + 3, oy + y] = (*leg, 255)
        px[ox + w - 4, oy + y] = (*leg, 255)
    # 종이들
    import random
    rnd = random.Random(tier * 7)
    for i in range(NOTICE_PAPERS[tier - 1]):
        pw, ph = rnd.choice([(4, 5), (5, 4), (4, 4)])
        x0 = 2 + rnd.randint(0, w - pw - 4)
        y0 = 2 + rnd.randint(0, h - ph - 4)
        for y in range(ph):
            for x in range(pw):
                px[ox + x0 + x, oy + y0 + y] = (*paper, 255)
        px[ox + x0 + pw // 2, oy + y0] = (*pin, 255)
    img = outline(img)
    return img, (img.width // 2, h + 8 + oy)


def room_sprite():
    """벽 2면 + 7x7 바닥. origin은 바닥 다이아몬드 최상단 꼭짓점 기준으로 JS에서 계산한다."""
    floor_w = (ROOM_COLS + ROOM_ROWS) * TILE_W // 2
    floor_h = (ROOM_COLS + ROOM_ROWS) * TILE_H // 2
    W = floor_w + 4
    H = WALL_H + floor_h + 4
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    top = (W // 2, WALL_H + 1)  # 바닥 최상단 꼭짓점
    wall_a = (0xEA, 0xD4, 0xAA)
    wall_b = (0xE4, 0xA6, 0x72)
    base = (0x73, 0x3E, 0x39)
    plank_a = (0xC2, 0x85, 0x69)
    plank_b = (0xB8, 0x6F, 0x50)
    seam = (0x73, 0x3E, 0x39)

    def tile_center(i, j):
        return (top[0] + (i - j) * (TILE_W // 2), top[1] + (i + j) * (TILE_H // 2) + TILE_H // 2)

    # 바닥 타일
    for i in range(ROOM_COLS):
        for j in range(ROOM_ROWS):
            cx, cy = tile_center(i, j)
            col = plank_a if (i + j) % 2 == 0 else plank_b
            for dy in range(-TILE_H // 2, TILE_H // 2):
                half = (TILE_W // 2) * (1 - abs(dy + 0.5) / (TILE_H / 2))
                for dx in range(-int(half), int(half)):
                    x, y = cx + dx, cy + dy
                    if 0 <= x < W and 0 <= y < H:
                        px[x, y] = (*col, 255)
    # 왼쪽 벽: i=0 모서리(top → 좌하단), 오른쪽 벽: j=0 모서리(top → 우하단)
    left_edge = [(top[0] - j * (TILE_W // 2), top[1] + j * (TILE_H // 2)) for j in range(ROOM_ROWS + 1)]
    right_edge = [(top[0] + i * (TILE_W // 2), top[1] + i * (TILE_H // 2)) for i in range(ROOM_COLS + 1)]
    for pts, shade in ((left_edge, wall_a), (right_edge, wall_b)):
        for k in range(len(pts) - 1):
            (x0, y0), (x1, y1) = pts[k], pts[k + 1]
            for t in range(TILE_W // 2):
                x = x0 + (1 if x1 > x0 else -1) * t
                y = y0 + round((y1 - y0) * t / (TILE_W // 2))
                for h in range(WALL_H):
                    yy = y - h
                    if 0 <= x < W and 0 <= yy < H:
                        col = shade
                        if h <= 2:
                            col = base
                        elif h == WALL_H - 1:
                            col = (0xC2, 0x85, 0x69)
                        px[x, yy] = (*col, 255)
    # 오른쪽 벽 창문 2개, 왼쪽 벽 문 1개
    def window(ix):
        x0, y0 = right_edge[ix]
        for t in range(2, TILE_W // 2 - 2):
            x = x0 + t
            y = y0 + round((TILE_H // 2) * t / (TILE_W // 2))
            for h in range(12, 24):
                yy = y - h
                col = (0x2C, 0xE8, 0xF5) if (h % 6 != 0 and t % 5 != 0) else (0x73, 0x3E, 0x39)
                if 0 <= x < W and 0 <= yy < H:
                    px[x, yy] = (*col, 255)
    window(1)
    window(4)
    x0, y0 = left_edge[2]
    for t in range(2, TILE_W // 2 - 2):
        x = x0 - t
        y = y0 + round((TILE_H // 2) * t / (TILE_W // 2))
        for h in range(3, 22):
            yy = y - h
            col = (0x3A, 0x44, 0x66) if not (t in (2, TILE_W // 2 - 3) or h == 21) else (0x18, 0x14, 0x25)
            if 0 <= x < W and 0 <= yy < H:
                px[x, yy] = (*col, 255)
    img = outline(img)
    return img, top, (floor_w, floor_h)


def workers_sheet():
    """OGA 시트 4종을 팔레트 스냅만 해서 세로로 이어 붙인다(각 64x160, 16x16 프레임 4열 10행)."""
    names = ["WorkerSheetBrownPurple", "WorkerSheetYellowPurple", "WorkerSheetBrownWhite", "WorkerSheetYellowWhite"]
    sheets = [quantize(Image.open(OGA_WORKERS / f"{n}.png").convert("RGBA")) for n in names]
    W = sheets[0].width
    H = sum(s.height for s in sheets)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    y = 0
    for s in sheets:
        out.alpha_composite(s, (0, y))
        y += s.height
    return out, len(names), sheets[0].height


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {"scale": 3, "tile": [TILE_W, TILE_H], "roomCols": ROOM_COLS, "roomRows": ROOM_ROWS, "facilities": {}}

    room, top, floor_size = room_sprite()
    room.save(OUT / "room.png")
    meta["room"] = {"width": room.width, "height": room.height, "top": list(top), "floor": list(floor_size), "wallH": WALL_H}

    previews = [room]
    for fid, tiers in FACILITIES.items():
        meta["facilities"][fid] = []
        for t, parts in enumerate(tiers, start=1):
            img, anchor = compose(parts, tint=TINTS.get(fid))
            img.save(OUT / f"fac-{fid}-t{t}.png")
            meta["facilities"][fid].append({"w": img.width, "h": img.height, "ax": anchor[0], "ay": anchor[1]})
            previews.append(img)
    meta["facilities"]["notice"] = []
    for t in range(1, 6):
        img, anchor = notice_sprite(t)
        img.save(OUT / f"fac-notice-t{t}.png")
        meta["facilities"]["notice"].append({"w": img.width, "h": img.height, "ax": anchor[0], "ay": anchor[1]})
        previews.append(img)

    workers, variants, sheet_h = workers_sheet()
    workers.save(OUT / "workers.png")
    meta["workers"] = {"frame": 16, "cols": 4, "rowsPerVariant": sheet_h // 16, "variants": variants}

    lines = [
        "// 자동 생성 — scripts/art/build_world.py. 직접 수정 금지.",
        f"export const WORLD_ATLAS = {json.dumps(meta, ensure_ascii=False)};",
        "export const facilitySpriteKey = (id, tier) => `world/fac-${id}-t${tier}`;",
    ]
    OUT_JS.write_text("\n".join(lines) + "\n", "utf-8")

    # 미리보기(3배)
    scale = 3
    pad = 6
    W = max(p.width for p in previews) * scale + pad * 2
    rows = []
    x = pad
    y = pad
    line_h = 0
    placed = []
    for p in previews:
        pw, ph = p.width * scale, p.height * scale
        if x + pw + pad > 1200:
            y += line_h + pad
            x = pad
            line_h = 0
        placed.append((p, x, y))
        x += pw + pad
        line_h = max(line_h, ph)
    H = y + line_h + pad
    prev = Image.new("RGBA", (1200, H), (0x26, 0x2B, 0x44, 255))
    for p, px_, py_ in placed:
        prev.alpha_composite(p.resize((p.width * scale, p.height * scale), Image.NEAREST), (px_, py_))
    PREVIEW.parent.mkdir(exist_ok=True)
    prev.save(PREVIEW)
    print(f"room {room.size}, facilities {sum(len(v) for v in meta['facilities'].values())}, workers {workers.size}")
    print(f"preview: {PREVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

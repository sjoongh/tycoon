#!/usr/bin/env python3
"""벡터·카툰 월드 빌더 (픽셀 아님). Kenney Furniture Kit 아이소 렌더(CC0)를 원본 그대로 합성하고,
방(벽·바닥)과 캐릭터(국장 5단계·직원 4변형×2프레임)는 안티앨리어싱으로 직접 그린다.

모든 PNG는 "표시의 2배" 해상도(레티나)로 만들고 Phaser에서 0.5배로 표시한다.
출력
  public/art/world/room.png, fac-<id>-t<1..5>.png, gov-<1..5>.png, worker-<v>-<f>.png
  src/world/worldAtlas.js (치수·앵커·타일·배율)
  .tmp/world-vector-preview.png
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
KENNEY = ROOT / "assets" / "art-src" / "_packs" / "kenney_furniturePack" / "Isometric"
TOON = ROOT / "assets" / "art-src" / "_packs" / "kenney_toon-characters"
OUT = ROOT / "public" / "art" / "world"
OUT_JS = ROOT / "src" / "world" / "worldAtlas.js"
PREVIEW = ROOT / ".tmp" / "world-vector-preview.png"

SCALE = 0.5            # Phaser 표시 배율(소스는 2x)
TILE_W, TILE_H = 96, 48  # 소스 px(표시 48x24)
ROOM_COLS, ROOM_ROWS = 7, 7
WALL_H = 200
SS = 2                 # 방·캐릭터 슈퍼샘플


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def mix(a, b, k):
    return tuple(int(round(a[i] + (b[i] - a[i]) * k)) for i in range(3))


def vgrad(size, top, bottom):
    w, h = size
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    px = im.load()
    for y in range(h):
        c = mix(top, bottom, y / max(1, h - 1))
        for x in range(w):
            px[x, y] = (*c, 255)
    return im


def part(name: str, width: int) -> Image.Image:
    im = Image.open(KENNEY / f"{name}.png").convert("RGBA")
    im = im.crop(im.getbbox())
    k = width / im.width
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def soft_shadow(size, alpha=90, blur=10):
    w, h = size
    sh = Image.new("RGBA", (w + blur * 4, h + blur * 4), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([blur * 2, blur * 2, w + blur * 2, h + blur * 2], fill=(0, 0, 0, alpha))
    return sh.filter(ImageFilter.GaussianBlur(blur))


def compose(parts, pad=16):
    """parts: (kenney, display_width, dx, dy) — display px 기준, 소스는 2배. 결과 origin = 바닥 중앙."""
    rendered = [(part(n, int(w / SCALE)), int(dx / SCALE), int(dy / SCALE)) for n, w, dx, dy in parts]
    minx = min(dx - p.width // 2 for p, dx, dy in rendered) - pad
    maxx = max(dx - p.width // 2 + p.width for p, dx, dy in rendered) + pad
    miny = min(dy - p.height for p, dx, dy in rendered) - pad
    maxy = max(dy for p, dx, dy in rendered) + pad
    W, H = maxx - minx, maxy - miny
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # 바닥 그림자
    span = maxx - minx - pad * 2
    sh = soft_shadow((int(span * 0.9), int(TILE_H * 0.5)), alpha=80, blur=8)
    canvas.alpha_composite(sh, (int((W - sh.width) / 2), int(H - pad - sh.height * 0.62)))
    for p, dx, dy in sorted(rendered, key=lambda t: t[2]):
        canvas.alpha_composite(p, (dx - p.width // 2 - minx, dy - p.height - miny))
    return canvas, (-minx, -miny)


# 표시 px 기준 구성(아이소 SE). 바닥선 dy=0.
FACILITIES = {
    "desk": [
        [("desk_SE", 70, 0, 0)],
        [("desk_SE", 70, 0, 0), ("laptop_SE", 20, 4, -18)],
        [("desk_SE", 74, 0, 0), ("computerScreen_SE", 22, -8, -20), ("computerKeyboard_SE", 18, 8, -18)],
        [("deskCorner_SE", 88, 0, 0), ("computerScreen_SE", 22, -18, -22), ("computerKeyboard_SE", 18, 0, -20), ("pottedPlant_SE", 18, 32, 0)],
        [("deskCorner_SE", 92, 0, 0), ("computerScreen_SE", 22, -22, -22), ("computerScreen_SE", 22, 0, -26), ("computerKeyboard_SE", 18, -4, -20), ("pottedPlant_SE", 20, 36, 0), ("lampSquareTable_SE", 14, 22, -18)],
    ],
    "sorter": [
        [("cardboardBoxOpen_SE", 38, 0, 0)],
        [("cardboardBoxOpen_SE", 38, -14, 0), ("cardboardBoxClosed_SE", 32, 16, 2)],
        [("cardboardBoxClosed_SE", 32, -16, 2), ("cardboardBoxOpen_SE", 38, 14, 0), ("cardboardBoxClosed_SE", 30, -4, -18)],
        [("sideTableDrawers_SE", 46, 0, 0), ("cardboardBoxOpen_SE", 32, -2, -28), ("cardboardBoxClosed_SE", 28, 28, 4)],
        [("bookcaseClosedWide_SE", 74, 0, 0), ("cardboardBoxOpen_SE", 32, -24, 8), ("cardboardBoxClosed_SE", 28, 18, 10), ("cardboardBoxClosed_SE", 28, 0, -4)],
    ],
    "server": [
        [("speaker_SE", 22, 0, 0)],
        [("speaker_SE", 22, -12, 0), ("speaker_SE", 22, 12, 0)],
        [("speaker_SE", 22, -22, 0), ("speaker_SE", 22, 0, 0), ("speaker_SE", 22, 22, 0)],
        [("speaker_SE", 22, -24, 0), ("speaker_SE", 22, -2, 0), ("speaker_SE", 22, 20, 0), ("computerScreen_SE", 20, 42, 4)],
        [("speaker_SE", 22, -34, 0), ("speaker_SE", 22, -12, 0), ("speaker_SE", 22, 10, 0), ("speaker_SE", 22, 32, 0), ("computerScreen_SE", 20, 52, 6), ("lampSquareFloor_SE", 12, -52, 0)],
    ],
    "archive": [
        [("bookcaseOpenLow_SE", 46, 0, 0)],
        [("bookcaseOpen_SE", 46, 0, 0)],
        [("bookcaseOpen_SE", 46, -18, 0), ("bookcaseClosed_SE", 46, 22, 4)],
        [("bookcaseClosedWide_SE", 78, 0, 0), ("books_SE", 18, 24, 4)],
        [("bookcaseClosedWide_SE", 78, -14, 0), ("bookcaseClosed_SE", 46, 40, 8), ("books_SE", 18, -28, 6), ("books_SE", 18, 8, 8)],
    ],
    "studio": [
        [("radio_SE", 28, 0, 0)],
        [("sideTable_SE", 36, 0, 0), ("televisionVintage_SE", 28, 0, -16)],
        [("cabinetTelevision_SE", 60, 0, 0), ("televisionModern_SE", 42, 0, -20)],
        [("cabinetTelevision_SE", 60, 0, 0), ("televisionModern_SE", 42, 0, -20), ("speakerSmall_SE", 14, 36, 0)],
        [("cabinetTelevision_SE", 64, 0, 0), ("televisionModern_SE", 46, 0, -20), ("speakerSmall_SE", 14, 40, 0), ("speakerSmall_SE", 14, -40, 0), ("lampSquareFloor_SE", 12, -54, -4)],
    ],
}


def notice_sprite(tier: int):
    """안심공지판 — 코르크 보드 + 종이(카툰 벡터). 표시 폭 40~64."""
    w = int((40 + tier * 6) / SCALE)
    h = int((30 + tier * 3) / SCALE)
    legs = int(16 / SCALE)
    pad = 16
    im = Image.new("RGBA", (w + pad * 2, h + legs + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0, y0 = pad, pad
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], 10, fill=(176, 118, 70, 255))
    d.rounded_rectangle([x0 + 8, y0 + 8, x0 + w - 8, y0 + h - 8], 6, fill=(226, 184, 128, 255))
    for leg_x in (x0 + 18, x0 + w - 26):
        d.rounded_rectangle([leg_x, y0 + h - 4, leg_x + 8, y0 + h + legs], 4, fill=(120, 76, 40, 255))
    import random
    rnd = random.Random(tier * 11)
    papers = [2, 3, 5, 7, 9][tier - 1]
    for _ in range(papers):
        pw, ph = rnd.choice([(16, 20), (20, 16), (18, 18)])
        px_ = x0 + 12 + rnd.randint(0, max(1, w - pw - 24))
        py_ = y0 + 12 + rnd.randint(0, max(1, h - ph - 24))
        d.rectangle([px_, py_, px_ + pw, py_ + ph], fill=(255, 250, 235, 255))
        d.ellipse([px_ + pw // 2 - 3, py_ - 2, px_ + pw // 2 + 3, py_ + 4], fill=(226, 60, 60, 255))
    return im, (im.width // 2, y0 + h + legs)


def room_sprite():
    W0 = (ROOM_COLS + ROOM_ROWS) * TILE_W // 2
    floor_h = (ROOM_COLS + ROOM_ROWS) * TILE_H // 2
    W = W0 + 8
    H = WALL_H + floor_h + 40
    S = SS
    im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    top = (W // 2, WALL_H + 4)

    def tc(i, j):
        return (top[0] + (i - j) * (TILE_W // 2), top[1] + (i + j) * (TILE_H // 2))

    # 바닥: 다이아몬드 타일 2톤(나무)
    for i in range(ROOM_COLS):
        for j in range(ROOM_ROWS):
            cx, cy = tc(i, j)
            cy += TILE_H // 2
            col = (214, 168, 116) if (i + j) % 2 == 0 else (198, 150, 100)
            pts = [(cx, cy - TILE_H // 2), (cx + TILE_W // 2, cy), (cx, cy + TILE_H // 2), (cx - TILE_W // 2, cy)]
            d.polygon([(x * S, y * S) for x, y in pts], fill=(*col, 255), outline=(170, 124, 80, 255))
    # 벽: 왼쪽(j축)·오른쪽(i축), 세로 그라데이션 + 걸레받이
    left_pts = [tc(0, j) for j in range(ROOM_ROWS + 1)]
    right_pts = [tc(i, 0) for i in range(ROOM_COLS + 1)]
    wall_top = (247, 236, 214)
    wall_bot = (222, 204, 172)
    for pts, shade in ((left_pts, 1.0), (right_pts, 0.93)):
        poly_bottom = [(x * S, y * S) for x, y in pts]
        poly_top = [(x * S, (y - WALL_H) * S) for x, y in reversed(pts)]
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).polygon(poly_bottom + poly_top, fill=255)
        grad = vgrad(im.size, tuple(int(c * shade) for c in wall_top), tuple(int(c * shade) for c in wall_bot))
        im.paste(grad, (0, 0), mask)
        # 걸레받이
        base = [(x * S, y * S) for x, y in pts] + [(x * S, (y - 10) * S) for x, y in reversed(pts)]
        d.polygon(base, fill=(150, 104, 66, 255))
    # 벽 상단 테두리
    for pts in (left_pts, right_pts):
        d.line([(x * S, (y - WALL_H) * S) for x, y in pts], fill=(255, 250, 240, 255), width=3 * S)
    # 오른쪽 벽 창문 2개
    def window(ix):
        x0, y0 = right_pts[ix]
        x1, y1 = right_pts[ix + 1]
        inset = 14
        q = [(x0 + inset, y0 - 150 + inset * 0.5), (x1 - inset, y1 - 150 - inset * 0.5 + inset), (x1 - inset, y1 - 60 - inset * 0.5 + inset), (x0 + inset, y0 - 60 + inset * 0.5)]
        d.polygon([(x * S, y * S) for x, y in q], fill=(120, 78, 44, 255))
        q2 = [(x + (6 if k in (0, 3) else -6), y) for k, (x, y) in enumerate(q)]
        d.polygon([(x * S, y * S) for x, y in q2], fill=(150, 214, 255, 255))
        d.polygon([(x * S, y * S) for x, y in [(q2[0][0], q2[0][1]), (q2[1][0], q2[1][1]), (q2[1][0], q2[1][1] + 30), (q2[0][0], q2[0][1] + 30)]], fill=(205, 238, 255, 255))
    window(1)
    window(4)
    # 왼쪽 벽 문
    x0, y0 = left_pts[2]
    x1, y1 = left_pts[3]
    door = [(x0 - 12, y0 - 150), (x1 + 12, y1 - 150), (x1 + 12, y1), (x0 - 12, y0)]
    d.polygon([(x * S, y * S) for x, y in door], fill=(82, 102, 150, 255))
    d.polygon([(x * S, y * S) for x, y in [(x0 - 6, y0 - 142), (x1 + 6, y1 - 142), (x1 + 6, y1 - 4), (x0 - 6, y0 - 4)]], fill=(108, 132, 190, 255))
    d.ellipse([(x1 - 2) * S, (y1 - 78) * S, (x1 + 4) * S, (y1 - 72) * S], fill=(255, 220, 120, 255))
    out = im.resize((W, H), Image.LANCZOS)
    return out, top, (W0, floor_h)


def character(skin, hair, shirt, pants, size=1.0, arm=0, hat=None, badge=None):
    """정면 카툰 캐릭터(표시 48px 높이 기준, 소스 2배). origin 바닥 중앙."""
    H = int(96 * size)
    W = int(64 * size)
    S = SS
    im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = W * S // 2
    u = S * size
    # 그림자
    d.ellipse([cx - 22 * u, (H - 8) * S, cx + 22 * u, H * S], fill=(0, 0, 0, 70))
    # 다리
    for side in (-1, 1):
        d.rounded_rectangle([cx + side * 10 * u - 7 * u, (H - 30) * S, cx + side * 10 * u + 7 * u, (H - 6) * S], 6 * u, fill=(*pants, 255))
    # 몸통
    d.rounded_rectangle([cx - 20 * u, (H - 58) * S, cx + 20 * u, (H - 24) * S], 12 * u, fill=(*shirt, 255))
    # 팔 (arm: 0 내림, 1 올림/타이핑)
    for side in (-1, 1):
        ay = (H - 54) * S
        ex = cx + side * 30 * u
        ey = ay + (10 if arm else 26) * u
        d.line([(cx + side * 18 * u, ay), (ex, ey)], fill=(*shirt, 255), width=int(10 * u))
        d.ellipse([ex - 6 * u, ey - 6 * u, ex + 6 * u, ey + 6 * u], fill=(*skin, 255))
    # 머리
    d.ellipse([cx - 19 * u, (H - 96) * S + 2 * u, cx + 19 * u, (H - 56) * S], fill=(*skin, 255))
    d.pieslice([cx - 19 * u, (H - 96) * S + 2 * u, cx + 19 * u, (H - 56) * S], 180, 360, fill=(*hair, 255))
    d.rectangle([cx - 19 * u, (H - 78) * S, cx + 19 * u, (H - 74) * S], fill=(*hair, 255))
    # 눈·입
    for side in (-1, 1):
        d.ellipse([cx + side * 7 * u - 2.5 * u, (H - 72) * S, cx + side * 7 * u + 2.5 * u, (H - 67) * S], fill=(40, 40, 60, 255))
    d.arc([cx - 6 * u, (H - 66) * S, cx + 6 * u, (H - 60) * S], 10, 170, fill=(120, 60, 60, 255), width=int(2 * u))
    if hat == "cap":
        d.chord([cx - 21 * u, (H - 99) * S, cx + 21 * u, (H - 72) * S], 180, 360, fill=(226, 60, 60, 255))
        d.rounded_rectangle([cx - 2 * u, (H - 86) * S, cx + 28 * u, (H - 81) * S], 2 * u, fill=(200, 40, 40, 255))
    elif hat == "crown":
        pts = [(cx - 18 * u, (H - 88) * S), (cx - 18 * u, (H - 104) * S), (cx - 9 * u, (H - 94) * S), (cx, (H - 106) * S), (cx + 9 * u, (H - 94) * S), (cx + 18 * u, (H - 104) * S), (cx + 18 * u, (H - 88) * S)]
        d.polygon(pts, fill=(255, 197, 61, 255))
    if badge:
        d.ellipse([cx - 14 * u, (H - 52) * S, cx - 6 * u, (H - 44) * S], fill=(*badge, 255))
    return im.resize((W, H), Image.LANCZOS), (W // 2, H)


def ballot_sprite():
    S = SS
    W, H = 40, 52
    im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    fold = 12 * S
    d.polygon([(2 * S, 2 * S), (W * S - fold, 2 * S), (W * S - 2 * S, 2 * S + fold), (W * S - 2 * S, H * S - 2 * S), (2 * S, H * S - 2 * S)], fill=(255, 250, 235, 255), outline=(200, 180, 140, 255), width=2 * S)
    d.polygon([(W * S - fold, 2 * S), (W * S - fold, 2 * S + fold), (W * S - 2 * S, 2 * S + fold)], fill=(225, 212, 180, 255))
    for i, w in enumerate((0.5, 0.65, 0.45)):
        y = (28 + i * 6) * S
        d.rounded_rectangle([6 * S, y, 6 * S + int(W * w) * S, y + 3 * S], 2 * S, fill=(190, 198, 215, 255))
    d.ellipse([10 * S, 8 * S, 30 * S, 26 * S], outline=(226, 60, 60, 255), width=3 * S)
    d.line([(14 * S, 17 * S), (18 * S, 21 * S), (26 * S, 12 * S)], fill=(226, 60, 60, 255), width=4 * S, joint="curve")
    return im.resize((W, H), Image.LANCZOS)


GOV_STAGES = [  # 넝마 → 말단 → 정장 → 명예 → 전설
    dict(skin=(246, 210, 170), hair=(90, 60, 40), shirt=(150, 140, 130), pants=(90, 90, 100)),
    dict(skin=(246, 210, 170), hair=(90, 60, 40), shirt=(120, 160, 220), pants=(60, 70, 110)),
    dict(skin=(246, 210, 170), hair=(90, 60, 40), shirt=(50, 60, 110), pants=(40, 45, 80), badge=(255, 197, 61)),
    dict(skin=(246, 210, 170), hair=(70, 50, 40), shirt=(40, 40, 70), pants=(30, 30, 55), badge=(255, 197, 61), hat=None),
    dict(skin=(246, 210, 170), hair=(70, 50, 40), shirt=(60, 30, 90), pants=(40, 25, 60), badge=(255, 197, 61), hat="crown"),
]
WORKER_VARIANTS = [
    dict(skin=(246, 210, 170), hair=(60, 40, 30), shirt=(255, 200, 90), pants=(70, 80, 120)),
    dict(skin=(230, 190, 150), hair=(30, 30, 40), shirt=(120, 210, 130), pants=(60, 70, 100)),
    dict(skin=(246, 210, 170), hair=(170, 110, 60), shirt=(130, 190, 255), pants=(60, 70, 110)),
    dict(skin=(214, 170, 130), hair=(40, 30, 30), shirt=(255, 150, 150), pants=(70, 60, 90)),
]


def toon(folder: str, key: str, pose: str, display_h: int, crown=False, badge=None):
    """Kenney Toon Characters 포즈 → 표시 높이 display_h(소스 2배). origin 바닥 중앙. 바닥 그림자 포함."""
    im = Image.open(TOON / folder / "PNG" / "Poses HD" / f"character_{key}_{pose}.png").convert("RGBA")
    im = im.crop(im.getbbox())
    H = int(display_h / SCALE)
    k = H / im.height
    im = im.resize((max(1, round(im.width * k)), H), Image.LANCZOS)
    pad = 24
    W = im.width + pad * 2
    canvas = Image.new("RGBA", (W, H + pad * 2), (0, 0, 0, 0))
    sh = soft_shadow((int(im.width * 0.9), int(H * 0.12)), alpha=90, blur=8)
    canvas.alpha_composite(sh, (int((W - sh.width) / 2), int(H + pad - sh.height * 0.6)))
    canvas.alpha_composite(im, (pad, pad))
    d = ImageDraw.Draw(canvas)
    if crown:
        cx = W // 2
        top = pad - 6
        pts = [(cx - 26, top + 18), (cx - 26, top - 10), (cx - 13, top + 4), (cx, top - 16), (cx + 13, top + 4), (cx + 26, top - 10), (cx + 26, top + 18)]
        d.polygon(pts, fill=(255, 197, 61, 255), outline=(190, 130, 20, 255))
    if badge:
        d.ellipse([pad + im.width * 0.3, pad + H * 0.47, pad + im.width * 0.3 + 14, pad + H * 0.47 + 14], fill=(*badge, 255), outline=(120, 90, 20, 255))
    return canvas, (W // 2, H + pad)


GOV_TOON = [  # 성장 5단계: 포즈·장식으로 구분
    ("Male person", "malePerson", "idle", False, None),
    ("Male person", "malePerson", "idle", False, (255, 197, 61)),
    ("Male person", "malePerson", "show", False, (255, 197, 61)),
    ("Male person", "malePerson", "cheer0", False, (255, 197, 61)),
    ("Male person", "malePerson", "cheer0", True, (255, 197, 61)),
]
WORKER_TOON = [  # 변형 4종 × 프레임 2(idle, interact=타이핑)
    ("Female person", "femalePerson"),
    ("Male adventurer", "maleAdventurer"),
    ("Female adventurer", "femaleAdventurer"),
    ("Robot", "robot"),
]
WORKER_POSES = ["idle", "interact"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {"scale": SCALE, "tile": [TILE_W, TILE_H], "roomCols": ROOM_COLS, "roomRows": ROOM_ROWS, "facilities": {}, "style": "vector"}
    room, top, floor = room_sprite()
    room.save(OUT / "room.png")
    meta["room"] = {"width": room.width, "height": room.height, "top": list(top), "floor": list(floor), "wallH": WALL_H}
    previews = [room]
    for fid, tiers in FACILITIES.items():
        meta["facilities"][fid] = []
        for t, parts in enumerate(tiers, start=1):
            img, (ax, ay) = compose(parts)
            img.save(OUT / f"fac-{fid}-t{t}.png")
            meta["facilities"][fid].append({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
            previews.append(img)
    meta["facilities"]["notice"] = []
    for t in range(1, 6):
        img, (ax, ay) = notice_sprite(t)
        img.save(OUT / f"fac-notice-t{t}.png")
        meta["facilities"]["notice"].append({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
        previews.append(img)
    meta["gov"] = []
    for i, (folder, key, pose, crown, badge) in enumerate(GOV_TOON, start=1):
        img, (ax, ay) = toon(folder, key, pose, 58, crown=crown, badge=badge)
        img.save(OUT / f"gov-{i}.png")
        meta["gov"].append({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
        previews.append(img)
    meta["workers"] = {"variants": len(WORKER_TOON), "frames": len(WORKER_POSES), "w": 0, "h": 0}
    for v, (folder, key) in enumerate(WORKER_TOON):
        for f, pose in enumerate(WORKER_POSES):
            img, (ax, ay) = toon(folder, key, pose, 48)
            img.save(OUT / f"worker-{v}-{f}.png")
            meta["workers"].update({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
            if f == 0:
                previews.append(img)
    # 비행·적체용 투표지(벡터)
    ballot_sprite().save(OUT / "ballot.png")
    OUT_JS.write_text(
        "// 자동 생성 — scripts/art/build_world_vector.py. 직접 수정 금지.\n"
        f"export const WORLD_ATLAS = {json.dumps(meta, ensure_ascii=False)};\n"
        "export const facilitySpriteKey = (id, tier) => `world/fac-${id}-t${tier}`;\n"
        "export const govSpriteKey = (stage) => `world/gov-${stage}`;\n"
        "export const workerSpriteKey = (variant, frame) => `world/worker-${variant}-${frame}`;\n",
        "utf-8",
    )
    # 미리보기(표시 배율)
    pad = 8
    x = pad
    y = pad
    line_h = 0
    placed = []
    for p in previews:
        pw, ph = int(p.width * SCALE), int(p.height * SCALE)
        if x + pw + pad > 1100:
            y += line_h + pad
            x = pad
            line_h = 0
        placed.append((p, x, y, pw, ph))
        x += pw + pad
        line_h = max(line_h, ph)
    prev = Image.new("RGBA", (1100, y + line_h + pad), (0x2a, 0x2f, 0x55, 255))
    for p, px_, py_, pw, ph in placed:
        prev.alpha_composite(p.resize((pw, ph), Image.LANCZOS), (px_, py_))
    PREVIEW.parent.mkdir(exist_ok=True)
    prev.save(PREVIEW)
    print(f"room {room.size} facilities {sum(len(v) for v in meta['facilities'].values())} gov 5 workers {len(WORKER_VARIANTS)}x2")
    print(f"preview: {PREVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

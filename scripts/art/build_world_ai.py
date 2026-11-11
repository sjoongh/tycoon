#!/usr/bin/env python3
"""AI 생성 월드 아트 빌더 — assets/art-src/ai-world/*.png(gpt-image 원본, 투명 배경)를
게임 스프라이트로 정규화한다: 알파 트림 → 표시 크기(2배 소스) 리사이즈 → 앵커 계산 → atlas JS.

입력 원본은 scripts/art/aigen.py 로 생성한다: python3 scripts/art/aigen.py scripts/art/jobs/world.json
출력
  public/art/world/room.webp, fac-<id>-t<1..5>.webp, gov-<1..5>.webp, worker-<v>-<f>.webp, ballot.webp, cos-*.webp, sig-*.webp
  public/art/ballot.webp, public/art/ballotbox.webp (파티클·황금 투표함)
  src/world/worldAtlas.js
  .tmp/world-ai-preview.png
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets" / "art-src" / "ai-world"
OUT = ROOT / "public" / "art" / "world"
OUT_JS = ROOT / "src" / "world" / "worldAtlas.js"
PREVIEW = ROOT / ".tmp" / "world-ai-preview.png"

SCALE = 0.5                 # 소스 렌더 기준(2x 레티나). 표시 배율은 DISPLAY_SCALE
DISPLAY_SCALE = 0.58        # Phaser 표시 배율 — 방 696px 소스 → 404px(화면 390 + 양옆 7px 블리드)
ROOM_DISPLAY_W = 348        # 390 - ROOM_X*2
ROOM_COLS = ROOM_ROWS = 7
ALPHA_T = 24                # 트림 임계(외곽 글로우 제거)

# 표시 px 기준 최대 폭/높이(티어 1→5). 타일 표시 폭 ≈ 40.
FAC_BOX = {
    "desk":    [(70, 70), (78, 76), (88, 84), (98, 92), (108, 100)],
    "sorter":  [(44, 48), (54, 56), (66, 64), (78, 74), (88, 92)],
    "notice":  [(44, 50), (52, 56), (60, 64), (68, 70), (76, 82)],
    "server":  [(34, 52), (48, 56), (62, 66), (76, 74), (88, 94)],
    "archive": [(48, 52), (54, 66), (72, 72), (84, 84), (94, 96)],
    "studio":  [(46, 50), (56, 58), (68, 64), (80, 76), (92, 90)],
}
WORKER_H = 46   # 표시 높이
GOV_H = 60
HEAD_PAD = 0.34  # 캐릭터 캔버스 상단 여유(모자·후광용) = 높이 비율


def load(name: str) -> Image.Image:
    return Image.open(SRC / f"{name}.png").convert("RGBA")


def save(im: Image.Image, path: Path):
    """월드 스프라이트는 webp(알파, q90)로 저장 — 같은 품질의 PNG 대비 약 1/4 용량."""
    im.save(path.with_suffix(".webp"), "WEBP", quality=90, method=6)


def trim(im: Image.Image, t: int = ALPHA_T) -> Image.Image:
    a = im.split()[3].point(lambda v: 255 if v > t else 0)
    box = a.getbbox()
    im = im.crop(box)
    # 반투명 글로우 외곽 정리: 임계 이하 알파는 0으로
    r, g, b, al = im.split()
    al = al.point(lambda v: 0 if v <= t else v)
    return Image.merge("RGBA", (r, g, b, al))


def fit(im: Image.Image, max_w: float, max_h: float) -> Image.Image:
    """표시 크기 박스에 맞춰 축소(소스는 2배)."""
    k = min(max_w / SCALE / im.width, max_h / SCALE / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def iso_anchor(im: Image.Image):
    """아이소 물체 접지점: 밑면 다이아몬드 중앙 ≈ 최하단에서 폭의 12% 위."""
    return im.width // 2, im.height - round(im.width * 0.12)


# 방 4단계(개표소 확장): 원본 키, 타일 수, 표시 폭. 캐릭터·시설 배율은 고정이고 방만 바뀌므로 타일이 커지면(5×5) 비좁게, 작아지면(11×11) 넓게 보인다.
ROOM_STAGES = [
    {"key": "room-s", "cols": 5, "displayW": 330},
    {"key": "room", "cols": 7, "displayW": 404},
    {"key": "room-l", "cols": 9, "displayW": 404},
    {"key": "room-xl", "cols": 11, "displayW": 404},
]


def room(key="room", display_w=ROOM_DISPLAY_W, cols=ROOM_COLS):
    im = trim(load(key), 40)
    W, H = im.size
    a = im.split()[3]
    px = a.load()
    cols_bottom = [x for x in range(W) if px[x, H - 2] > 40]
    bottom_x = (cols_bottom[0] + cols_bottom[-1]) / 2 if cols_bottom else W / 2
    left_y = max(y for y in range(H) if px[1, y] > 40)
    right_y = max(y for y in range(H) if px[W - 2, y] > 40)
    corner_y = (left_y + right_y) / 2
    floor_h = (H - 1 - corner_y) * 2
    top = (bottom_x, H - 1 - floor_h)
    k = display_w / DISPLAY_SCALE / W
    out = im.resize((round(W * k), round(H * k)), Image.LANCZOS)
    meta = {
        "key": key, "cols": cols,
        "width": out.width, "height": out.height,
        "top": [round(top[0] * k, 1), round(top[1] * k, 1)],
        "floor": [round(W * k, 1), round(floor_h * k, 1)],
        "wallH": round(top[1] * k, 1),
        "tile": [round(W * k / cols, 2), round(floor_h * k / cols, 2)],
    }
    return out, meta


def character(name: str, display_h: int, canvas: tuple[int, int] | None = None):
    im = fit(trim(load(name)), 10_000, display_h)
    pad = round(im.height * HEAD_PAD)
    W, H = (canvas or (im.width + 8, im.height + pad))
    cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cv.alpha_composite(im, ((W - im.width) // 2, H - im.height))
    return cv, (W // 2, H - 3)


def head_box(gov: Image.Image):
    """국장 머리 영역 추정. 치비 비율: 머리 = 캐릭터 높이의 약 42%. 폭은 상단 30% 구간(어깨·팔 제외)의 최대 행 폭."""
    a = gov.split()[3]
    px = a.load()
    W, H = gov.size
    top = next(y for y in range(H) if any(px[x, y] > ALPHA_T for x in range(W)))
    body_h = H - top
    best = (0, W / 2, top)
    for y in range(top, top + int(body_h * 0.30)):
        xs = [x for x in range(W) if px[x, y] > ALPHA_T]
        if xs and xs[-1] - xs[0] > best[0]:
            best = (xs[-1] - xs[0], (xs[0] + xs[-1]) / 2, y)
    hw, cx, _ = best
    hh = body_h * 0.42
    return {"top": top, "cx": cx, "w": hw, "h": hh, "eye": top + hh * 0.58}


def cosmetic(cid: str, canvas: tuple[int, int], hb: dict):
    item = trim(load(cid))
    W, H = canvas
    cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    place = {
        "cos-cap":     (1.02, None, hb["top"] + hb["h"] * 0.34, "bottom"),
        "cos-tophat":  (0.98, None, hb["top"] + hb["h"] * 0.16, "bottom"),
        "cos-halo":    (1.00, None, hb["top"] - hb["h"] * 0.12, "bottom"),
        "cos-shades":  (0.92, None, hb["eye"], "center"),
        "cos-mask":    (0.80, None, hb["top"] + hb["h"] * 0.86, "center"),
        "sig-band":    (1.06, None, hb["top"] + hb["h"] * 0.30, "center"),
        "sig-glasses": (0.90, None, hb["eye"], "center"),
    }[cid]
    rel_w, _, y_ref, mode = place
    w = max(1, round(hb["w"] * rel_w))
    h = max(1, round(item.height * w / item.width))
    item = item.resize((w, h), Image.LANCZOS)
    x = round(hb["cx"] - w / 2)
    y = round(y_ref if mode == "top" else y_ref - h if mode == "bottom" else y_ref - h / 2)
    cv.alpha_composite(item, (x, y))
    return cv


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {"scale": DISPLAY_SCALE, "tile": None, "roomCols": ROOM_COLS, "roomRows": ROOM_ROWS, "facilities": {}, "style": "ai"}
    previews = []

    meta["rooms"] = []
    for st in ROOM_STAGES:
        rm, rmeta = room(st["key"], st["displayW"], st["cols"])
        save(rm, OUT / f'{st["key"]}.png')
        meta["rooms"].append(rmeta)
        previews.append(rm)
    # 하위 호환: 기본(7×7) 방을 room/tile에도 둔다
    rmeta = meta["rooms"][1]
    meta["room"] = {k: rmeta[k] for k in ("width", "height", "top", "floor", "wallH")}
    meta["tile"] = rmeta["tile"]

    for fid, boxes in FAC_BOX.items():
        meta["facilities"][fid] = []
        for t, (bw, bh) in enumerate(boxes, start=1):
            img = fit(trim(load(f"fac-{fid}-t{t}")), bw, bh)
            ax, ay = iso_anchor(img)
            save(img, OUT / f"fac-{fid}-t{t}.png")
            meta["facilities"][fid].append({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
            previews.append(img)

    # 국장 5단계 — 공통 캔버스(가장 큰 단계 기준)로 통일해 꾸미기 오버레이와 바닥 정렬을 맞춘다
    govs = [character(f"gov-{i}", GOV_H) for i in range(1, 6)]
    gw = max(g.width for g, _ in govs)
    gh = max(g.height for g, _ in govs)
    meta["gov"] = []
    gov_imgs = []
    for i in range(1, 6):
        img, (ax, ay) = character(f"gov-{i}", GOV_H, (gw, gh))
        save(img, OUT / f"gov-{i}.png")
        meta["gov"].append({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
        gov_imgs.append(img)
        previews.append(img)

    meta["workers"] = {"variants": 4, "frames": 2}
    ws = [character(f"worker-{v}-{f}", WORKER_H) for v in range(4) for f in range(2)]
    ww = max(w.width for w, _ in ws)
    wh = max(w.height for w, _ in ws)
    for v in range(4):
        for f in range(2):
            img, (ax, ay) = character(f"worker-{v}-{f}", WORKER_H, (ww, wh))
            save(img, OUT / f"worker-{v}-{f}.png")
            meta["workers"].update({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
            if f == 0:
                previews.append(img)

    # 유권자 NPC 3종(문→창구 대기열)
    vs = [character(f"visitor-{v}", WORKER_H) for v in range(3)]
    vw = max(w.width for w, _ in vs)
    vh = max(w.height for w, _ in vs)
    meta["visitors"] = {"variants": 3}
    for v in range(3):
        img, (ax, ay) = character(f"visitor-{v}", WORKER_H, (vw, vh))
        save(img, OUT / f"visitor-{v}.png")
        meta["visitors"].update({"w": img.width, "h": img.height, "ax": ax, "ay": ay})
        previews.append(img)

    # 시대 세트(중기 #2): 벽 현수막 + 시대 전용 방문객. 키는 regions.eraTheme().key 와 같다.
    ERAS = ["force", "red", "demo", "future", "space", "myth"]
    meta["eraDecor"] = {"keys": [], "w": 0, "h": 0}
    for k in ERAS:
        if not (SRC / f"decor-era-{k}.png").exists():
            continue
        img = fit(trim(load(f"decor-era-{k}")), 56, 78)
        save(img, OUT / f"decor-era-{k}.png")
        meta["eraDecor"]["keys"].append(k)
        meta["eraDecor"].update({"w": max(meta["eraDecor"]["w"], img.width), "h": max(meta["eraDecor"]["h"], img.height)})
        previews.append(img)
    ev = [k for k in ERAS if (SRC / f"visitor-era-{k}.png").exists()]
    evs = [character(f"visitor-era-{k}", WORKER_H) for k in ev]
    if evs:
        ew = max(w.width for w, _ in evs)
        eh = max(w.height for w, _ in evs)
        meta["eraVisitors"] = {"keys": ev, "w": ew, "h": eh}
        for k in ev:
            img, (ax, ay) = character(f"visitor-era-{k}", WORKER_H, (ew, eh))
            save(img, OUT / f"visitor-era-{k}.png")
            meta["eraVisitors"].update({"ax": ax, "ay": ay})
            previews.append(img)

    # 투표지(적체 더미·비행) + 파티클 + 황금 투표함
    ballot = fit(trim(load("ballot")), 16, 20)
    save(ballot, OUT / "ballot.png")
    fit(trim(load("ballot")), 11, 13).save(ROOT / "public" / "art" / "ballot.webp", quality=92)
    box = fit(trim(load("ballotbox")), 56, 62)
    box.save(ROOT / "public" / "art" / "ballotbox.webp", quality=92)
    previews.extend([ballot, box])

    hb = head_box(gov_imgs[0])
    meta["cosmetics"] = {}
    for cid in ["cos-cap", "cos-tophat", "cos-halo", "cos-shades", "cos-mask", "sig-band", "sig-glasses"]:
        img = cosmetic(cid, (gw, gh), hb)
        save(img, OUT / f"{cid}.png")
        meta["cosmetics"][cid] = {"w": gw, "h": gh, "ax": gw // 2, "ay": gh - 3}
        comp = gov_imgs[0].copy()
        comp.alpha_composite(img)
        previews.append(comp)

    OUT_JS.write_text(
        "// 자동 생성 — scripts/art/build_world_ai.py. 직접 수정 금지.\n"
        f"export const WORLD_ATLAS = {json.dumps(meta, ensure_ascii=False)};\n"
        "export const facilitySpriteKey = (id, tier) => `world/fac-${id}-t${tier}`;\n"
        "export const govSpriteKey = (stage) => `world/gov-${stage}`;\n"
        "export const workerSpriteKey = (variant, frame) => `world/worker-${variant}-${frame}`;\n",
        "utf-8",
    )

    # 미리보기(표시 배율)
    pad, x, y, line_h, placed = 8, 8, 8, 0, []
    for p in previews:
        pw, ph = max(1, int(p.width * SCALE)), max(1, int(p.height * SCALE))
        if x + pw + pad > 1100:
            y += line_h + pad
            x, line_h = pad, 0
        placed.append((p, x, y, pw, ph))
        x += pw + pad
        line_h = max(line_h, ph)
    prev = Image.new("RGBA", (1100, y + line_h + pad), (0x3a, 0x2a, 0x24, 255))
    for p, px_, py_, pw, ph in placed:
        prev.alpha_composite(p.resize((pw, ph), Image.LANCZOS), (px_, py_))
    PREVIEW.parent.mkdir(exist_ok=True)
    prev.save(PREVIEW)
    print("rooms", [(r["key"], r["cols"], r["width"], r["height"], r["tile"]) for r in meta["rooms"]], f"gov {gw}x{gh} worker {ww}x{wh}")
    print(f"preview: {PREVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

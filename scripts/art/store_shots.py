"""Play 스토어 휴대전화 스크린샷 합성: 게임 캡처(390x844 @3x) 위에 2줄 캡션을 얹어 1080x2160(2:1)으로 만든다.
사용: python3 scripts/art/store_shots.py <캡처 폴더>   → store/screenshots/shot-N-*.png
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "tools/font-source/DoHyeon.full.ttf"
W, H = 1080, 2160
SHOTS = [
    ("s1", "home", "투표함을 채우고", "개표소를 키우세요"),
    ("s2", "campus", "넓어진 개표 캠퍼스", "끌어서 둘러보세요"),
    ("s3", "crew", "현장 개표팀을 꾸려", "생산을 끌어올리세요"),
    ("s4", "event", "수상한 사건,", "당신의 선택은?"),
    ("s5", "map", "12개 구역 정복", "전국 개표 지도"),
    ("s6", "prestige", "감사 재정비로", "더 강하게 다시 시작"),
]


def background():
    top, bot = (24, 30, 58), (46, 54, 96)
    bg = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bot)))
    return bg


def compose(src, lines, out):
    bg = background()
    d = ImageDraw.Draw(bg)
    font = ImageFont.truetype(str(FONT), 92)
    for k, text in enumerate(lines):
        y = 96 + k * 118
        d.text((W / 2, y + 6), text, font=font, fill=(10, 12, 26), anchor="mt")
        d.text((W / 2, y), text, font=font, fill=(255, 214, 92) if k == 0 else (250, 246, 232), anchor="mt")
    shot = Image.open(src).convert("RGB")
    sh = 1690
    sw = round(shot.width * sh / shot.height)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    x, y = (W - sw) // 2, H - sh - 70
    pad, r = 14, 44
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).rounded_rectangle([x - pad, y - pad + 18, x + sw + pad, y + sh + pad + 18], r, fill=150)
    bg.paste((6, 8, 18), (0, 0), shadow.filter(ImageFilter.GaussianBlur(22)))
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle([x - pad, y - pad, x + sw + pad, y + sh + pad], r, fill=(255, 214, 92))
    d.rounded_rectangle([x - pad + 6, y - pad + 6, x + sw + pad - 6, y + sh + pad - 6], r - 6, fill=(18, 20, 40))
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw - 1, sh - 1], r - pad, fill=255)
    bg.paste(shot, (x, y), mask)
    bg.save(out, optimize=True)


if __name__ == "__main__":
    src = Path(sys.argv[1])
    dst = ROOT / "store/screenshots"
    for i, (key, slug, l1, l2) in enumerate(SHOTS, 1):
        out = dst / f"shot-{i}-{slug}.png"
        compose(src / f"{key}.png", (l1, l2), out)
        print(out.relative_to(ROOT))

#!/usr/bin/env python3
"""앱 아이콘 일괄 생성 — 국장 원화(assets/art-src/icon/gov-icon-fg.png, gpt-image 편집본) + 코드로 그린 햇살 배경.
출력: Android 런처(레거시·라운드·적응형 전경/배경, ldpi~xxxhdpi), 스플래시(API<31), PWA 192/512/maskable, Play 512, assets/icon-*.png.
사용: python3 scripts/art/build_app_icon.py"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets/art-src/icon/gov-icon-fg.png")
RES = os.path.join(ROOT, "android/app/src/main/res")
SPLASH_BG = (20, 18, 28)  # #14121c — 앱 배경색
C_IN, C_OUT, C_RAY = (255, 198, 96), (230, 116, 46), (255, 240, 200)
DENS = {"ldpi": 0.75, "mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

def p(*a): return os.path.join(ROOT, *a)

def sunburst(S, cy_frac=0.45):
    """중심이 살짝 위인 방사형 그라데이션 + 16갈래 햇살."""
    W = S * 2  # 2배로 그린 뒤 축소(계단 방지)
    im = Image.new("RGB", (W, W), C_OUT)
    d = ImageDraw.Draw(im)
    cx, cy, R = W / 2, W * cy_frac, W * 0.78
    for r in range(int(R), 0, -2):
        t = r / R
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(int(C_IN[i] * (1 - t) + C_OUT[i] * t) for i in range(3)))
    ray = Image.new("L", (W, W), 0)
    rd = ImageDraw.Draw(ray)
    for k in range(16):
        a0 = k * 2 * math.pi / 16
        a1 = a0 + math.pi / 16
        rd.polygon([(cx, cy), (cx + 2 * W * math.cos(a0), cy + 2 * W * math.sin(a0)), (cx + 2 * W * math.cos(a1), cy + 2 * W * math.sin(a1))], fill=30)
    ray = ray.filter(ImageFilter.GaussianBlur(W / 300))
    im = Image.composite(Image.new("RGB", (W, W), C_RAY), im, ray)
    return im.resize((S, S), Image.LANCZOS).convert("RGBA")

def character():
    fg = Image.open(SRC).convert("RGBA")
    return fg.crop(fg.getbbox())

def place(canvas, fg, box, bottom, cx=None):
    """fg 를 box(정사각 최대 변) 안에 맞추고 아래쪽을 bottom 에 붙여 가운데 배치."""
    f = fg.copy()
    f.thumbnail((box, box), Image.LANCZOS)
    x = int((cx if cx is not None else canvas.width / 2) - f.width / 2)
    canvas.alpha_composite(f, (x, int(bottom - f.height)))
    return canvas

def full_icon(S, fg):
    """정사각 전체 아이콘(배경+캐릭터). 캐릭터는 하단에 붙여 허리 아래가 잘려 보이게."""
    return place(sunburst(S), fg, int(S * 0.88), S)

def rounded(im, radius_frac=0.2):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=int(im.width * radius_frac), fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out

def circle(im):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, im.width - 1, im.height - 1], fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out

def adaptive_layers(S, fg):
    """108dp 레이어. 보이는 영역은 가운데 72dp(2/3) — 얼굴은 그 안, 몸통은 아래로 흘려 마스크에 잘리게."""
    vis = S * 2 / 3
    off = (S - vis) / 2
    bg = sunburst(S, cy_frac=0.42)
    fgl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    place(fgl, fg, int(vis * 0.9), off + vis * 1.05)
    return bg, fgl

def feature_graphic(fg):
    """Play 그래픽 이미지 1024x500 — 왼쪽 국장, 오른쪽 제목."""
    from PIL import ImageFont
    W, H = 1024, 500
    bg = sunburst(W, cy_frac=0.3).crop((0, 140, W, 140 + H))
    place(bg, fg, 470, H + 6, cx=250)
    d = ImageDraw.Draw(bg)
    font = lambda n: ImageFont.truetype(p("assets/art-src/fonts/BlackHanSans.ttf"), n)
    brown, cream = (74, 38, 22), (255, 248, 232)
    def outlined(xy, text, f, fill):
        d.text(xy, text, font=f, fill=fill, stroke_width=max(4, f.size // 12), stroke_fill=brown, anchor="mm")
    outlined((728, 150), "믿어주세요", font(92), cream)
    outlined((728, 280), "개표국", font(150), (255, 214, 92))
    d.rounded_rectangle([548, 372, 908, 428], radius=28, fill=brown)
    d.text((728, 400), "탭으로 키우는 풍자 개표 타이쿤", font=font(30), fill=cream, anchor="mm")
    return bg.convert("RGB")

def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, optimize=True)

def main():
    fg = character()
    master = full_icon(1024, fg)
    # Android 런처
    for name, k in DENS.items():
        d = os.path.join(RES, f"mipmap-{name}")
        legacy = master.resize((round(48 * k), round(48 * k)), Image.LANCZOS)
        save(rounded(legacy, 0.18), os.path.join(d, "ic_launcher.png"))
        save(circle(legacy), os.path.join(d, "ic_launcher_round.png"))
        bg, fgl = adaptive_layers(round(108 * k * 2), fg)  # 2배로 만들고 축소
        n = round(108 * k)
        save(bg.resize((n, n), Image.LANCZOS), os.path.join(d, "ic_launcher_background.png"))
        save(fgl.resize((n, n), Image.LANCZOS), os.path.join(d, "ic_launcher_foreground.png"))
    # 스플래시(API 24~30 창 배경): 앱 배경색 + 가운데 둥근 아이콘
    for folder in os.listdir(RES):
        sp = os.path.join(RES, folder, "splash.png")
        if not (folder.startswith("drawable") and os.path.exists(sp)):
            continue
        w, h = Image.open(sp).size
        canvas = Image.new("RGBA", (w, h), SPLASH_BG + (255,))
        s = int(min(w, h) * 0.32)
        ic = rounded(master.resize((s, s), Image.LANCZOS), 0.22)
        canvas.alpha_composite(ic, ((w - s) // 2, (h - s) // 2))
        save(canvas.convert("RGB"), sp)
    # PWA·스토어
    save(rounded(master.resize((192, 192), Image.LANCZOS), 0.2), p("public/icons/icon-192.png"))
    save(rounded(master.resize((512, 512), Image.LANCZOS), 0.2), p("public/icons/icon-512.png"))
    mask = sunburst(1024)
    place(mask, fg, int(1024 * 0.74), 1024 * 0.96)  # maskable 안전 영역(가운데 80%)
    save(mask.resize((512, 512), Image.LANCZOS), p("public/icons/icon-maskable-512.png"))
    save(master.resize((512, 512), Image.LANCZOS).convert("RGB"), p("store/icon-512.png"))  # Play 는 직접 둥글린다
    save(feature_graphic(fg), p("store/feature-graphic.png"))
    save(master, p("assets/icon-only.png"))
    bg, fgl = adaptive_layers(1024, fg)
    save(bg, p("assets/icon-background.png"))
    save(fgl, p("assets/icon-foreground.png"))
    print("앱 아이콘: Android 런처 6밀도 + 스플래시 + PWA 3종 + Play 512")

if __name__ == "__main__":
    main()

# 개표국 아트 생성 프롬프트 팩 — 코지 파스텔 치비

목적: 이미지 생성 AI(PixelLab / Retro Diffusion / Midjourney / Nano Banana / DALL·E 등)에 **그대로 붙여** 일관된 스프라이트를 뽑고, 코드 변경 없이 게임에 드롭인하기 위한 사양서.

> 워크플로우: **이 프롬프트로 이미지 AI가 스프라이트 생성 → PNG 파일을 `public/art/`에 저장 → Claude가 PreloadScene에서 같은 키로 로드(코드 0줄~몇 줄)** → 끝.

---

## 0. 전역 스타일 락 (모든 프롬프트 앞에 붙일 "스타일 프리앰블")

```
STYLE: cozy pastel "chibi" mobile game art, soft warm palette, rounded chunky shapes,
gentle soft shading, thin soft brown outline, isometric 2:1 view (dimetric, ~30°),
top-down-light, soft drop shadow, clean, cute, friendly. Korean cozy idle-tycoon vibe.
PALETTE (hex): backgrounds #f6ead0 #f3e3bf, floor #f7e9cf, wood/desk #ffd9a0 #ffb877 #ff9a4d,
accent green #8ec6a0, sky blue #bfe3ff, character skin #fff1d8, fabric blue #9ec7ff.
RENDER: single object centered, FULL TRANSPARENT background (PNG alpha), no ground plane,
no text, no UI, no drop-shadow baked onto a tile, tight crop, crisp edges.
```

추천 도구: **PixelLab** 또는 **Retro Diffusion** (픽셀 그리드·팔레트 고정으로 프레임 간 일관성이 좋음). Midjourney/Nano Banana면 **스타일 레퍼런스(--sref / reference image)로 office-map.png를 물려** 톤을 고정할 것. 항상 **투명 배경 + 단일 오브젝트 + 타이트 크롭**.

---

## 1. 에셋별 프롬프트 (파일명 = manifest 키)

각 항목: 저장 경로 · 권장 픽셀 크기 · 프롬프트. (크기가 권장과 달라도 됨 — 다르면 Claude가 로드 시 scale 한 줄로 맞춤.)

### 바닥 타일 — `public/art/floor-pastel.png` (키 `floor/pastel`, 64×32, 아이소 다이아몬드)
```
[스타일 프리앰블] + a single isometric floor tile, diamond/rhombus shape exactly 2:1,
warm cream tile #f7e9cf with a subtle soft seam edge #efd9b8, top surface only,
seamless tileable, 64x32 px.
```

### 뒤 벽 패널 — `public/art/room-back.png` (키 `room/back`, ~400×320)
```
[스타일 프리앰블] + a cozy interior back wall panel for a small office room,
warm beige wall #f3e3bf, soft top highlight, a wooden baseboard strip #e6cf9f at the bottom,
flat front-facing wall, rounded soft corners, no windows (added separately).
```

### 창문 데코 ×2 — `public/art/window.png` (키 `wall/back-left` 와 `wall/back-right` 둘 다 같은 파일 재사용 가능, ~64×76)
```
[스타일 프리앰블] + a cute wall window, cream frame #fff7e6, pastel blue sky #bfe3ff inside,
one small fluffy white cloud, simple cross mullion bars, front-facing, hanging on a wall.
```

### 🎯 접수창구 5티어 — `public/art/desk-t1.png` … `desk-t5.png` (키 `facility/desk/t{1..5}/idle`, ~96×80, origin 바닥중앙)
**가장 중요. 5개를 "같은 스타일·점점 커지는 성장"으로 한 세트처럼 생성** (같은 seed/sref 유지):
```
[스타일 프리앰블] + isometric reception counter for a vote-counting office, tier {N} of 5.
- t1: a tiny single wooden reception desk, one stack of papers. small & humble.
- t2: a wider reception counter with paper trays and a name plate.
- t3: a full counter with a queue stanchion pole and a stamping machine.
- t4: a large two-section counter, monitor, sorted ballot bins, busy.
- t5: a grand polished reception hall desk, multiple monitors, banner, very impressive.
Wood tones #ffd9a0→#ff9a4d as tier rises, pastel, cute, front-3/4 isometric, soft shadow under it.
```
(각 티어를 따로 생성하되 동일 스타일 레퍼런스로 묶어 실루엣만 점점 커지게.)

### 직원 스프라이트시트 — `public/art/worker-clerk.png` (키 `worker/clerk`, 가로 4프레임, 프레임당 ~24×32 → 시트 96×32; 더 크게 뽑고 배수로 맞춰도 됨)
```
[스타일 프리앰블] + a chibi office clerk character spritesheet, 4 frames in one horizontal row,
same character each frame, facing front-right 3/4 isometric:
frame1 idle standing, frame2 mid-walk step, frame3 idle, frame4 working (arms raised stamping).
soft blue shirt #9ec7ff, friendly face, big head chibi proportions, consistent size & baseline,
evenly spaced frames, transparent gaps between frames.
```
(프레임 간 캐릭터 일관성이 관건 — PixelLab의 "animation/skeleton" 기능이나 동일 캐릭터 reference 권장.)

### 화분 데코 — `public/art/plant.png` (키 `decor/plant`, ~40×54, origin 바닥중앙)
```
[스타일 프리앰블] + a cute small potted plant, terracotta pot #e89f6b, soft green leaves #8ec6a0,
isometric, soft shadow under pot.
```

### 투표용지 입자 — `public/art/ballot.png` (키 `ballot`, ~22×14)
```
[스타일 프리앰블] + a tiny cute ballot paper card, cream #fff9ef, a small green check mark,
slight fold, front view, very small icon.
```

---

## 2. 일관성 체크리스트 (생성 후 본인 확인)
- 모든 PNG가 **투명 배경**인가 (체커보드 확인)
- 같은 **아이소 각도(2:1)**, 같은 **아웃라인 두께·색**인가
- 티어 5개가 **같은 화풍에서 크기만** 커지는가 (다른 게임처럼 보이면 재생성)
- 직원 4프레임이 **같은 캐릭터·같은 baseline**인가
- 팔레트가 위 hex 범위 안인가

## 3. 드롭인 절차 (파일 주면 Claude가 처리)
1. 생성한 PNG들을 `public/art/`에 위 파일명으로 저장.
2. `src/scenes/PreloadScene.js`의 `preload()`에 키별 로드 추가:
   ```js
   this.load.image("floor/pastel", "/art/floor-pastel.png");
   this.load.image("room/back", "/art/room-back.png");
   this.load.image("wall/back-left", "/art/window.png");
   this.load.image("wall/back-right", "/art/window.png");
   this.load.image("facility/desk/t1/idle", "/art/desk-t1.png"); // t1..t5
   this.load.spritesheet("worker/clerk", "/art/worker-clerk.png", { frameWidth: 24, frameHeight: 32 });
   this.load.image("decor/plant", "/art/plant.png");
   this.load.image("ballot", "/art/ballot.png");
   ```
3. `generatePlaceholders`는 "이미 존재하면 건너뜀" 가드가 있어 **로드된 실제 아트가 우선**되고 미제공분만 플레이스홀더로 채워진다. → 부분 교체도 가능(예: 직원만 먼저).
4. 크기가 권장과 다르면 Claude가 해당 스프라이트에 scale 1줄만 추가.

## 4. 이미지 생성 도구가 이 세션에 연결되면
이미지 생성 MCP/도구가 세션에 붙으면 Claude가 위 프롬프트를 **직접 호출해 생성→저장→배선**까지 한 번에 처리 가능. 현재는 미연결이라 사람이 생성 단계만 맡으면 됨.

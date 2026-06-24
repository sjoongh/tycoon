# 개표국 버티컬 슬라이스(접수창구) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 베이크된 PNG 월드를 폐기하고, 접수창구(desk) 1개를 "GameState에서 파생되는 살아있는 아이소 스프라이트"로 재구축해 새 렌더링 아키텍처가 출시 결을 낼 수 있음을 한 화면에서 증명한다.

**Architecture:** GameState(진실원천)는 그대로 두고, 월드를 `WorldView`(합성 루트) 아래 `FacilityStationView`(티어 교체) + `WorkerActor/Manager`(애니 캐릭터) + `WorldEffects`(FX)로 분해하고 depth = base + y로 정렬한다. UI 크롬은 Phaser 캔버스 밖 DOM/CSS 오버레이로 빼낸다. 모든 스프라이트는 `assetManifest` 키로 참조하며, 실제 아트가 없으면 `devPlaceholders`가 파스텔 톤의 티어별로 구분되는 임시 스프라이트를 생성한다(아키텍처 우선, 아트는 후속 교체).

**Tech Stack:** Phaser 3.90, Vite 7, Vitest(신규, 순수함수 단위테스트), 바닐라 DOM+CSS(UI), Kenney CC0 / LPC(후속 실제 아트).

## Global Constraints

- 모바일 세로 캔버스: `GAME_WIDTH=390`, `GAME_HEIGHT=844` (`src/config.js`) — 변경 금지.
- `SAVE_KEY="trust-office-phaser-v2"`, 세이브 버전/스키마 불변 — GameState·data·세이브 로직 수정 금지.
- 뷰는 GameState를 **읽기**만. 사용자 입력은 기존 메서드만 호출: `processClick(x,y)`, `upgrade(id?)`, `select(id)`, `setTab(tab)`, `hireStaff(id)`, `advanceStage()`, `applyEffect(effect)`, `prestigeReset()`, `buyPrestigeUpgrade(id)`, `save(notify?)`.
- GameState 이벤트(구독만): `changed`, `upgraded`(payload=facility object), `ballots`({x,y,count}), `float`({text,x,y,color}), `saved`.
- GameState 읽기 API(확인됨): `level(id)`, `isUnlocked(id)`, `cost(id)`, `explainCost(id)`, `cps()`, `clickPower()`, `facility(id)`, `facilityTotal()`, `data`(votes/explain/trust/stage/...).
- 아트 톤: **귀여운 파스텔**(`assets/office-map.png` 기준). 다크 그릿티 `world-office.png`는 슬라이스에서 사용하지 않음.
- 이 프로젝트는 **git repo가 아니다.** 각 태스크 끝의 커밋 단계는 `git init` 후에만 유효 — 미초기화 상태면 커밋 단계를 건너뛰고 다음 태스크로 진행한다.
- 슬라이스 동안 다른 5개 시설/탭은 깨지지 않게 유지(기존 UIScene을 즉시 삭제하지 않고 단계적으로 대체).

## 슬라이스 완료 기준 (Acceptance — 전부 충족 시 종료)

1. 파스텔 아이소 바닥 타일 + 벽 위에 접수창구가 **개별 스프라이트**로 존재
2. 접수창구 업그레이드 시 Lv 임계값(1/5/12)에서 **스프라이트 실루엣이 실제로 교체**(t1→t2→t3)
3. 스테이션이 **작업 애니메이션** 재생
4. **직원 1–2명이 스프라이트시트 애니로 걸어와** 창구에서 작업 모션
5. **depth 정렬**로 직원이 책상 뒤/앞 자연스럽게 가림
6. 상단 **DOM HUD**(표·해명·믿음 + 진행바) + 하단 탭바가 CSS로 렌더
7. 탭 → 업그레이드가 **둥근 카드/시트**로 동작하고 `gameState.upgrade("desk")` 호출

---

## File Structure

**신규**
- `src/world/facilityTiers.js` — `level → tier`, `tier → spriteKey` (순수)
- `src/world/depth.js` — depth 계산 (순수)
- `src/world/pathGraph.js` — nav 노드/엣지 + BFS 경로 (순수)
- `src/world/worldMap.js` — 바닥/벽 레이아웃, 시설 앵커·작업스팟·nav 노드 (데이터)
- `src/assets/assetManifest.js` — 에셋 키↔경로/생성기 매핑 (데이터)
- `src/textures/devPlaceholders.js` — 파스텔 임시 스프라이트 생성 (티어별 구분)
- `src/animations/createAnimations.js` — 워커/스테이션 애니 등록
- `src/world/FacilityStationView.js` — 시설 1개 스테이션 뷰
- `src/world/WorkerActor.js` — 워커 1명
- `src/world/WorkerManager.js` — 워커 스폰/배치
- `src/world/WorldEffects.js` — 월드 FX
- `src/world/WorldView.js` — 월드 합성 루트
- `src/ui/DOMHud.js` — 상단 HUD
- `src/ui/DOMBottomPanel.js` — 하단 탭 + 시설 업그레이드 카드
- `src/ui/dom-ui.css` — DOM UI 스타일
- `vitest.config.js` — 테스트 설정
- 테스트: `test/facilityTiers.test.js`, `test/depth.test.js`, `test/pathGraph.test.js`

**수정**
- `src/scenes/PreloadScene.js` — 플레이스홀더 생성 + 애니 등록
- `src/scenes/GameScene.js` — WorldView 호스트로 슬림화
- `src/main.js` — DOM UI 마운트, (슬라이스 동안) UIScene 유지/축소
- `package.json` — vitest devDependency + `test` 스크립트

**은퇴(슬라이스 후 삭제 후보, 지금은 보존):** `BuildingNode.js`, `WorkerAgent.js`, `worldLayout.js`, `world-office.png` 로드.

---

## Task 1: Vitest 테스트 인프라

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `test/smoke.test.js`

**Interfaces:**
- Produces: `npm test` 명령으로 `test/**/*.test.js` 실행.

- [ ] **Step 1: vitest 설치**

Run: `npm install -D vitest`
Expected: `package.json` devDependencies에 `vitest` 추가, 에러 없이 완료.

- [ ] **Step 2: package.json 에 test 스크립트 추가**

`package.json`의 `"scripts"` 블록을 다음으로 만든다(기존 3개 유지 + test 추가):

```json
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5178",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 4178",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 3: vitest.config.js 생성**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
  },
});
```

- [ ] **Step 4: 스모크 테스트 작성**

`test/smoke.test.js`:

```js
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 실행해 통과 확인**

Run: `npm test`
Expected: PASS (1 test passed).

- [ ] **Step 6: 커밋** (git repo인 경우만)

```bash
git add package.json package-lock.json vitest.config.js test/smoke.test.js
git commit -m "chore: add vitest test runner"
```

---

## Task 2: facilityTiers (순수, TDD)

**Files:**
- Create: `src/world/facilityTiers.js`
- Test: `test/facilityTiers.test.js`

**Interfaces:**
- Produces:
  - `tierForLevel(level: number) => "locked"|"t1"|"t2"|"t3"|"t4"|"t5"`
  - `stationSpriteKey(facilityId: string, tier: string, variant="idle") => string` (형식 `facility/{id}/{tier}/{variant}`)

- [ ] **Step 1: 실패하는 테스트 작성**

`test/facilityTiers.test.js`:

```js
import { describe, it, expect } from "vitest";
import { tierForLevel, stationSpriteKey } from "../src/world/facilityTiers.js";

describe("tierForLevel", () => {
  it("maps level boundaries to tiers", () => {
    expect(tierForLevel(0)).toBe("locked");
    expect(tierForLevel(1)).toBe("t1");
    expect(tierForLevel(4)).toBe("t1");
    expect(tierForLevel(5)).toBe("t2");
    expect(tierForLevel(11)).toBe("t2");
    expect(tierForLevel(12)).toBe("t3");
    expect(tierForLevel(25)).toBe("t4");
    expect(tierForLevel(45)).toBe("t5");
    expect(tierForLevel(999)).toBe("t5");
  });

  it("clamps invalid input to locked", () => {
    expect(tierForLevel(-3)).toBe("locked");
    expect(tierForLevel(undefined)).toBe("locked");
    expect(tierForLevel(2.9)).toBe("t1");
  });
});

describe("stationSpriteKey", () => {
  it("builds a namespaced key", () => {
    expect(stationSpriteKey("desk", "t2")).toBe("facility/desk/t2/idle");
    expect(stationSpriteKey("desk", "t3", "work")).toBe("facility/desk/t3/work");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL ("Cannot find module ../src/world/facilityTiers.js").

- [ ] **Step 3: 구현**

`src/world/facilityTiers.js`:

```js
// 높은 임계값부터 검사
const TIER_THRESHOLDS = [
  { min: 45, tier: "t5" },
  { min: 25, tier: "t4" },
  { min: 12, tier: "t3" },
  { min: 5, tier: "t2" },
  { min: 1, tier: "t1" },
  { min: 0, tier: "locked" },
];

export function tierForLevel(level) {
  const lvl = Math.max(0, Math.floor(Number(level) || 0));
  return TIER_THRESHOLDS.find((entry) => lvl >= entry.min).tier;
}

export function stationSpriteKey(facilityId, tier, variant = "idle") {
  return `facility/${facilityId}/${tier}/${variant}`;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: 커밋** (git repo인 경우만)

```bash
git add src/world/facilityTiers.js test/facilityTiers.test.js
git commit -m "feat: facility tier mapping"
```

---

## Task 3: depth 계산 (순수, TDD)

**Files:**
- Create: `src/world/depth.js`
- Test: `test/depth.test.js`

**Interfaces:**
- Produces:
  - `DEPTH_BASE = { floor:0, station:1000, worker:1000, fx:3000 }`
  - `stationDepth(y:number) => number`
  - `workerDepth(y:number) => number`
  - `fxDepth(y:number) => number`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/depth.test.js`:

```js
import { describe, it, expect } from "vitest";
import { stationDepth, workerDepth, fxDepth, DEPTH_BASE } from "../src/world/depth.js";

describe("depth ordering", () => {
  it("places worker above a station at the same y", () => {
    expect(workerDepth(400)).toBeGreaterThan(stationDepth(400));
  });

  it("sorts by y within a layer", () => {
    expect(stationDepth(500)).toBeGreaterThan(stationDepth(300));
  });

  it("keeps fx above world objects", () => {
    expect(fxDepth(0)).toBeGreaterThan(workerDepth(844));
    expect(DEPTH_BASE.fx).toBe(3000);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL (module not found).

- [ ] **Step 3: 구현**

`src/world/depth.js`:

```js
export const DEPTH_BASE = { floor: 0, station: 1000, worker: 1000, fx: 3000 };

export function stationDepth(y) {
  return DEPTH_BASE.station + y;
}

export function workerDepth(y) {
  return DEPTH_BASE.worker + y + 20;
}

export function fxDepth(y) {
  return DEPTH_BASE.fx + y;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: 커밋** (git repo인 경우만)

```bash
git add src/world/depth.js test/depth.test.js
git commit -m "feat: depth sorting helpers"
```

---

## Task 4: pathGraph BFS (순수, TDD)

**Files:**
- Create: `src/world/pathGraph.js`
- Test: `test/pathGraph.test.js`

**Interfaces:**
- Produces:
  - `findPath(graph:{edges:Record<string,string[]>}, start:string, goal:string) => string[]|null`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/pathGraph.test.js`:

```js
import { describe, it, expect } from "vitest";
import { findPath } from "../src/world/pathGraph.js";

const graph = {
  edges: {
    entrance: ["mid"],
    mid: ["entrance", "desk_front", "sorter_front"],
    desk_front: ["mid"],
    sorter_front: ["mid"],
  },
};

describe("findPath", () => {
  it("finds a route across nodes", () => {
    expect(findPath(graph, "entrance", "desk_front")).toEqual(["entrance", "mid", "desk_front"]);
  });

  it("returns single node when start === goal", () => {
    expect(findPath(graph, "mid", "mid")).toEqual(["mid"]);
  });

  it("returns null when unreachable", () => {
    expect(findPath(graph, "entrance", "nowhere")).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL (module not found).

- [ ] **Step 3: 구현**

`src/world/pathGraph.js`:

```js
export function findPath(graph, start, goal) {
  if (start === goal) return [start];
  const queue = [[start]];
  const visited = new Set([start]);
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    for (const next of (graph.edges[node] || [])) {
      if (visited.has(next)) continue;
      if (next === goal) return [...path, next];
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return null;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: 커밋** (git repo인 경우만)

```bash
git add src/world/pathGraph.js test/pathGraph.test.js
git commit -m "feat: nav graph BFS pathfinding"
```

---

## Task 5: worldMap 데이터 모듈

**Files:**
- Create: `src/world/worldMap.js`
- Test: `test/worldMap.test.js`

**Interfaces:**
- Produces:
  - `worldMap.floor: { tileKey, originX, originY, cols, rows, tileW, tileH }`
  - `worldMap.walls: Array<{key,x,y}>`
  - `worldMap.facilities.desk: { anchor:{x,y}, workSpots:[{x,y}], navNode:string }`
  - `worldMap.nav: { nodes:Record<string,{x,y}>, edges:Record<string,string[]> }`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/worldMap.test.js`:

```js
import { describe, it, expect } from "vitest";
import { worldMap } from "../src/world/worldMap.js";
import { findPath } from "../src/world/pathGraph.js";

describe("worldMap", () => {
  it("defines a desk facility with anchor + work spots + nav node", () => {
    const desk = worldMap.facilities.desk;
    expect(desk.anchor).toHaveProperty("x");
    expect(desk.anchor).toHaveProperty("y");
    expect(desk.workSpots.length).toBeGreaterThan(0);
    expect(worldMap.nav.nodes[desk.navNode]).toBeTruthy();
  });

  it("desk nav node is reachable from entrance", () => {
    const desk = worldMap.facilities.desk;
    expect(findPath(worldMap.nav, "entrance", desk.navNode)).not.toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL (module not found).

- [ ] **Step 3: 구현**

`src/world/worldMap.js` (좌표는 390×844 기준, 상단 ~120px는 DOM HUD 영역으로 비움):

```js
export const worldMap = {
  floor: { tileKey: "floor/pastel", originX: 195, originY: 470, cols: 5, rows: 6, tileW: 64, tileH: 32 },
  walls: [
    { key: "wall/back-left", x: 120, y: 250 },
    { key: "wall/back-right", x: 270, y: 250 },
  ],
  facilities: {
    desk: {
      anchor: { x: 150, y: 420 },
      workSpots: [
        { x: 120, y: 452 },
        { x: 178, y: 452 },
      ],
      navNode: "desk_front",
    },
  },
  nav: {
    nodes: {
      entrance: { x: 195, y: 560 },
      mid: { x: 195, y: 480 },
      desk_front: { x: 150, y: 462 },
    },
    edges: {
      entrance: ["mid"],
      mid: ["entrance", "desk_front"],
      desk_front: ["mid"],
    },
  },
};
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: 커밋** (git repo인 경우만)

```bash
git add src/world/worldMap.js test/worldMap.test.js
git commit -m "feat: world map data for desk slice"
```

---

## Task 6: assetManifest + devPlaceholders (파스텔 임시 스프라이트)

**Files:**
- Create: `src/assets/assetManifest.js`
- Create: `src/textures/devPlaceholders.js`

**Interfaces:**
- Consumes: `stationSpriteKey` (Task 2)
- Produces:
  - `ASSET_KEYS` = { floor:"floor/pastel", walls:[...], deskTiers:{ t1:[idle,work], ... }, worker:{ sheet,frames } }
  - `generatePlaceholders(scene)` — 실제 아트가 없을 때 모든 키를 파스텔 텍스처로 생성 (티어별로 크기·실루엣 구분)

설명: 이 슬라이스는 **아키텍처 증명**이 목적이라 실제 Kenney/LPC/커스텀 아트 대신 코드 생성 파스텔 플레이스홀더를 쓴다. 키는 동일하므로(`facility/desk/t{n}/idle` 등) 후속 단계에서 `PreloadScene`이 실제 파일을 로드하면 코드 변경 없이 교체된다. 티어별로 **눈에 띄게 다른 실루엣**(t1 작은 책상 / t2 큰 카운터 / t3 카운터+기둥)을 생성해 완료기준 #2를 만족시킨다.

- [ ] **Step 1: assetManifest 작성**

`src/assets/assetManifest.js`:

```js
import { stationSpriteKey } from "../world/facilityTiers.js";

export const PALETTE = {
  floorA: 0xf7e9cf,
  floorB: 0xefd9b8,
  wall: 0xe7c9a9,
  deskT1: 0xffd9a0,
  deskT2: 0xffc98a,
  deskT3: 0xffb877,
  accent: 0x8ec6a0,
  worker: 0x9ec7ff,
  shadow: 0x000000,
};

export const DESK_TIERS = ["t1", "t2", "t3"];

export const ASSET_KEYS = {
  floor: "floor/pastel",
  walls: ["wall/back-left", "wall/back-right"],
  deskStation: (tier) => stationSpriteKey("desk", tier, "idle"),
  workerSheet: "worker/clerk",
};
```

- [ ] **Step 2: devPlaceholders 작성**

`src/textures/devPlaceholders.js`:

```js
import { PALETTE, ASSET_KEYS, DESK_TIERS } from "../assets/assetManifest.js";

function isoDiamond(g, cx, cy, w, h, color) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(cx, cy - h / 2);
  g.lineTo(cx + w / 2, cy);
  g.lineTo(cx, cy + h / 2);
  g.lineTo(cx - w / 2, cy);
  g.closePath();
  g.fillPath();
}

function makeFloorTile(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  isoDiamond(g, 32, 16, 64, 32, PALETTE.floorA);
  g.lineStyle(2, PALETTE.floorB, 1);
  g.strokePath();
  g.generateTexture(ASSET_KEYS.floor, 64, 32);
  g.destroy();
}

function makeWall(scene, key, color) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(color, 1);
  g.fillRoundedRect(0, 0, 60, 70, 6);
  g.generateTexture(key, 60, 70);
  g.destroy();
}

// 티어별로 폭/높이/장식이 달라 실루엣이 구분된다
const DESK_SHAPE = {
  t1: { w: 46, h: 30, color: PALETTE.deskT1, posts: 0 },
  t2: { w: 66, h: 40, color: PALETTE.deskT2, posts: 1 },
  t3: { w: 84, h: 52, color: PALETTE.deskT3, posts: 2 },
};

function makeDeskTier(scene, tier) {
  const s = DESK_SHAPE[tier];
  const W = 96;
  const H = 80;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // 그림자
  g.fillStyle(PALETTE.shadow, 0.15);
  g.fillEllipse(W / 2, H - 8, s.w + 12, 14);
  // 카운터 본체
  g.fillStyle(s.color, 1);
  g.fillRoundedRect((W - s.w) / 2, H - s.h - 8, s.w, s.h, 6);
  // 상판 하이라이트
  g.fillStyle(0xffffff, 0.35);
  g.fillRoundedRect((W - s.w) / 2 + 4, H - s.h - 4, s.w - 8, 6, 3);
  // 대기줄 기둥(티어 상승 표시)
  g.fillStyle(PALETTE.accent, 1);
  for (let i = 0; i < s.posts; i++) {
    g.fillCircle((W - s.w) / 2 - 6 + i * 0, H - 14 - i * 12, 4);
  }
  g.generateTexture(ASSET_KEYS.deskStation(tier), W, H);
  g.destroy();
}

// 워커: 4프레임 가로 스프라이트시트(walk 2 + idle 1 + work 1)
function makeWorkerSheet(scene) {
  const FW = 24;
  const FH = 32;
  const frames = 4;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  for (let f = 0; f < frames; f++) {
    const ox = f * FW;
    const legShift = f === 1 ? 2 : 0;
    g.fillStyle(PALETTE.shadow, 0.15);
    g.fillEllipse(ox + FW / 2, FH - 3, 16, 5);
    // 다리
    g.fillStyle(0x6b5b7a, 1);
    g.fillRect(ox + 8 - legShift, 22, 3, 7);
    g.fillRect(ox + 13 + legShift, 22, 3, 7);
    // 몸통
    g.fillStyle(PALETTE.worker, 1);
    g.fillRoundedRect(ox + 6, 13, 12, 11, 3);
    // 머리
    g.fillStyle(0xfff1d8, 1);
    g.fillCircle(ox + 12, 8, 5);
    // work 프레임(마지막)엔 팔 든 모션
    if (f === 3) {
      g.fillStyle(PALETTE.worker, 1);
      g.fillRect(ox + 17, 10, 3, 7);
    }
  }
  g.generateTexture(ASSET_KEYS.workerSheet, FW * frames, FH);
  g.destroy();
  // 스프라이트시트로 등록
  scene.textures.get(ASSET_KEYS.workerSheet).add("__base", 0, 0, 0, FW * frames, FH);
  if (!scene.textures.exists(ASSET_KEYS.workerSheet + "/sheet")) {
    scene.textures.addSpriteSheet
      ? null
      : null;
  }
}

export function generatePlaceholders(scene) {
  makeFloorTile(scene);
  ASSET_KEYS.walls.forEach((key) => makeWall(scene, key, PALETTE.wall));
  DESK_TIERS.forEach((tier) => makeDeskTier(scene, tier));
  makeWorkerSheet(scene);
}
```

참고: 워커 스프라이트시트의 프레임 분할은 Task 7의 `PreloadScene`에서 `this.textures.addSpriteSheet` 대신 `this.load`가 아닌 생성 텍스처를 쓰므로, 프레임 기반 애니는 Task 7에서 `frameWidth`로 재등록한다(아래 Task 7 참조).

- [ ] **Step 3: 단위 확인(키 형식만 빠르게 검증)**

`test/assetManifest.test.js`:

```js
import { describe, it, expect } from "vitest";
import { ASSET_KEYS } from "../src/assets/assetManifest.js";

describe("assetManifest", () => {
  it("derives desk station keys per tier", () => {
    expect(ASSET_KEYS.deskStation("t1")).toBe("facility/desk/t1/idle");
    expect(ASSET_KEYS.deskStation("t3")).toBe("facility/desk/t3/idle");
  });
});
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: 커밋** (git repo인 경우만)

```bash
git add src/assets/assetManifest.js src/textures/devPlaceholders.js test/assetManifest.test.js
git commit -m "feat: asset manifest + pastel placeholder generators"
```

---

## Task 7: PreloadScene 재작성 (플레이스홀더 + 워커 스프라이트시트 + 애니 등록)

**Files:**
- Modify: `src/scenes/PreloadScene.js`
- Create: `src/animations/createAnimations.js`

**Interfaces:**
- Consumes: `generatePlaceholders` (Task 6), `ASSET_KEYS` (Task 6)
- Produces: 텍스처 키 등록 완료 + 애니 키 `worker-walk`, `worker-idle`, `worker-work` 등록.

- [ ] **Step 1: 워커 스프라이트시트 재등록 유틸 + createAnimations 작성**

`src/animations/createAnimations.js`:

```js
import { ASSET_KEYS } from "../assets/assetManifest.js";

// devPlaceholders가 만든 단일 텍스처를 24px 프레임 시트로 다시 등록
export function registerWorkerSheet(scene) {
  const baseKey = ASSET_KEYS.workerSheet;
  const sheetKey = baseKey + "/sheet";
  if (scene.textures.exists(sheetKey)) return sheetKey;
  const src = scene.textures.get(baseKey).getSourceImage();
  scene.textures.addSpriteSheet(sheetKey, src, { frameWidth: 24, frameHeight: 32 });
  return sheetKey;
}

export function createAnimations(scene) {
  const sheetKey = registerWorkerSheet(scene);
  const def = (key, frames, frameRate, repeat) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: frames.map((f) => ({ key: sheetKey, frame: f })),
      frameRate,
      repeat,
    });
  };
  def("worker-walk", [0, 1], 6, -1);
  def("worker-idle", [0], 1, -1);
  def("worker-work", [2, 3], 5, -1);
}
```

- [ ] **Step 2: PreloadScene 재작성**

`src/scenes/PreloadScene.js` 전체를 교체:

```js
import Phaser from "phaser";
import { generatePlaceholders } from "../textures/devPlaceholders.js";
import { createAnimations } from "../animations/createAnimations.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // 실제 아트 파일이 생기면 여기서 this.load.image/spritesheet 로 동일 키를 로드해 교체.
  }

  create() {
    generatePlaceholders(this);
    createAnimations(this);
    this.scene.start("GameScene");
    this.scene.launch("UIScene");
  }
}
```

- [ ] **Step 3: 구동해 콘솔 에러 없음 확인**

Run: `npm run dev` (백그라운드로 띄우고 브라우저에서 `http://localhost:5178` 접속)
Expected: 콘솔에 텍스처/애니 관련 에러 없음. (월드는 다음 태스크에서 그려지므로 아직 비어 보일 수 있음.)

- [ ] **Step 4: 커밋** (git repo인 경우만)

```bash
git add src/scenes/PreloadScene.js src/animations/createAnimations.js
git commit -m "feat: preload placeholders and worker animations"
```

---

## Task 8: FacilityStationView (티어 교체 + 작업 애니)

**Files:**
- Create: `src/world/FacilityStationView.js`

**Interfaces:**
- Consumes: `tierForLevel` (Task 2), `ASSET_KEYS` (Task 6), `stationDepth` (Task 3), `worldMap` (Task 5)
- Produces:
  - `class FacilityStationView { constructor(scene, facilityId, anchor); refresh({level, unlocked, selected, canUpgrade}); playUpgrade(); destroy(); }`
  - `this.tier` 현재 티어 문자열 보관.

- [ ] **Step 1: 구현**

`src/world/FacilityStationView.js`:

```js
import { tierForLevel, stationSpriteKey } from "./facilityTiers.js";
import { stationDepth } from "./depth.js";

export class FacilityStationView {
  constructor(scene, facilityId, anchor) {
    this.scene = scene;
    this.facilityId = facilityId;
    this.anchor = anchor;
    this.tier = null;

    this.sprite = scene.add.sprite(anchor.x, anchor.y, stationSpriteKey(facilityId, "t1"))
      .setOrigin(0.5, 1)
      .setDepth(stationDepth(anchor.y))
      .setInteractive({ useHandCursor: true });

    this.ring = scene.add.ellipse(anchor.x, anchor.y, 70, 26, 0x8ec6a0, 0)
      .setStrokeStyle(3, 0x8ec6a0, 0)
      .setDepth(stationDepth(anchor.y) - 1);
  }

  onSelect(callback) {
    this.sprite.on("pointerdown", callback);
  }

  refresh({ level, unlocked, selected, canUpgrade }) {
    const tier = unlocked ? tierForLevel(level) : "locked";
    if (tier !== "locked" && tier !== this.tier) {
      const changing = this.tier !== null;
      this.tier = tier;
      this.sprite.setTexture(stationSpriteKey(this.facilityId, tier));
      this.sprite.setVisible(true);
      if (changing) this.playUpgrade();
    }
    this.sprite.setVisible(unlocked && level > 0);
    this.ring.setStrokeStyle(3, 0x8ec6a0, selected ? 0.9 : 0);
    this.sprite.setTint(canUpgrade ? 0xffffff : 0xffffff);
    // 작업 애니 강도(틴트 펄스 등)는 WorldView의 틱에서 별도 처리
  }

  playUpgrade() {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 0.86, to: 1 },
      duration: 220,
      ease: "Back.easeOut",
    });
  }

  destroy() {
    this.sprite.destroy();
    this.ring.destroy();
  }
}
```

- [ ] **Step 2: 구문/임포트 확인 (단위 불가 — Phaser 캔버스 필요)**

Run: `npm run build`
Expected: 빌드 성공(임포트 경로/구문 오류 없음).

- [ ] **Step 3: 커밋** (git repo인 경우만)

```bash
git add src/world/FacilityStationView.js
git commit -m "feat: facility station view with tier swap"
```

---

## Task 9: WorkerActor + WorkerManager (이동 + 작업 애니 + depth)

**Files:**
- Create: `src/world/WorkerActor.js`
- Create: `src/world/WorkerManager.js`

**Interfaces:**
- Consumes: `findPath` (Task 4), `worldMap` (Task 5), `workerDepth` (Task 3), 애니 키 `worker-walk/idle/work`
- Produces:
  - `class WorkerActor { constructor(scene, startNode); goTo(nodeName, then?); update(); destroy(); }`
  - `class WorkerManager { constructor(scene, gameState); sync(); destroy(); }`

- [ ] **Step 1: WorkerActor 구현**

`src/world/WorkerActor.js`:

```js
import { worldMap } from "./worldMap.js";
import { workerDepth } from "./depth.js";
import { findPath } from "./pathGraph.js";

export class WorkerActor {
  constructor(scene, startNode = "entrance") {
    this.scene = scene;
    this.node = startNode;
    const p = worldMap.nav.nodes[startNode];
    this.sprite = scene.add.sprite(p.x, p.y, "worker/clerk/sheet", 0).setOrigin(0.5, 1);
    this.sprite.play("worker-idle");
  }

  goTo(goalNode, then) {
    const path = findPath(worldMap.nav, this.node, goalNode);
    if (!path || path.length < 2) {
      if (then) then();
      return;
    }
    this.node = goalNode;
    this._walkPath(path.slice(1), then);
  }

  _walkPath(remaining, then) {
    if (remaining.length === 0) {
      this.sprite.play("worker-work");
      if (then) then();
      return;
    }
    const next = worldMap.nav.nodes[remaining[0]];
    this.sprite.play("worker-walk", true);
    this.sprite.setFlipX(next.x < this.sprite.x);
    this.scene.tweens.add({
      targets: this.sprite,
      x: next.x,
      y: next.y,
      duration: 700,
      ease: "Linear",
      onComplete: () => this._walkPath(remaining.slice(1), then),
    });
  }

  update() {
    this.sprite.setDepth(workerDepth(this.sprite.y));
  }

  destroy() {
    this.sprite.destroy();
  }
}
```

참고: `WorkerActor`는 텍스처 키 `worker/clerk/sheet`를 쓴다. Task 7의 `registerWorkerSheet`가 `ASSET_KEYS.workerSheet + "/sheet"` = `"worker/clerk/sheet"`로 등록하므로 일치한다(`ASSET_KEYS.workerSheet="worker/clerk"`).

- [ ] **Step 2: WorkerManager 구현**

`src/world/WorkerManager.js`:

```js
import { WorkerActor } from "./WorkerActor.js";
import { worldMap } from "./worldMap.js";

export class WorkerManager {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.workers = [];
  }

  sync() {
    const level = this.gameState.level("desk");
    const unlocked = this.gameState.isUnlocked("desk");
    const target = unlocked ? Math.min(2, Math.max(1, Math.ceil(level / 3))) : 0;

    while (this.workers.length < target) this._spawn();
    while (this.workers.length > target) this.workers.pop().destroy();
  }

  _spawn() {
    const worker = new WorkerActor(this.scene, "entrance");
    this.workers.push(worker);
    const loop = () => {
      worker.goTo("desk_front", () => {
        this.scene.time.delayedCall(1400, () => worker.goTo("entrance", () => {
          this.scene.time.delayedCall(600, loop);
        }));
      });
    };
    loop();
  }

  update() {
    this.workers.forEach((w) => w.update());
  }

  destroy() {
    this.workers.forEach((w) => w.destroy());
    this.workers = [];
  }
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 4: 커밋** (git repo인 경우만)

```bash
git add src/world/WorkerActor.js src/world/WorkerManager.js
git commit -m "feat: animated workers with nav-graph movement"
```

---

## Task 10: WorldEffects (월드 FX)

**Files:**
- Create: `src/world/WorldEffects.js`

**Interfaces:**
- Consumes: `fxDepth` (Task 3), `FloatTextPool` (`src/pools/FloatTextPool.js`), `BallotPool` (`src/pools/BallotPool.js`)
- Produces:
  - `class WorldEffects { constructor(scene); float(payload); ballots(payload); deskPop(x,y); destroy(); }`

- [ ] **Step 1: 구현**

`src/world/WorldEffects.js`:

```js
import { fxDepth } from "./depth.js";
import { FloatTextPool } from "../pools/FloatTextPool.js";
import { BallotPool } from "../pools/BallotPool.js";

export class WorldEffects {
  constructor(scene) {
    this.scene = scene;
    this.floatTexts = new FloatTextPool(scene);
    this.ballots = new BallotPool(scene);
  }

  float(payload) {
    this.floatTexts.show(payload.text, payload.x, payload.y, payload.color);
  }

  ballots(payload) {
    this.ballots.spawn(payload.x, payload.y, payload.count);
  }

  deskPop(x, y) {
    const dot = this.scene.add.circle(x, y, 4, 0xfff4cf).setDepth(fxDepth(y));
    this.scene.tweens.add({
      targets: dot,
      y: y - 18,
      alpha: 0,
      duration: 480,
      ease: "Quad.easeOut",
      onComplete: () => dot.destroy(),
    });
  }

  destroy() {}
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: 커밋** (git repo인 경우만)

```bash
git add src/world/WorldEffects.js
git commit -m "feat: world effects module"
```

---

## Task 11: WorldView + GameScene 슬림화 (월드 합성)

**Files:**
- Create: `src/world/WorldView.js`
- Modify: `src/scenes/GameScene.js` (전체 교체)

**Interfaces:**
- Consumes: `worldMap` (Task 5), `ASSET_KEYS` (Task 6), `FacilityStationView` (Task 8), `WorkerManager` (Task 9), `WorldEffects` (Task 10), `stationDepth`/`DEPTH_BASE` (Task 3)
- Produces:
  - `class WorldView { constructor(scene, gameState); update(delta); destroy(); }`

- [ ] **Step 1: WorldView 구현**

`src/world/WorldView.js`:

```js
import { worldMap } from "./worldMap.js";
import { ASSET_KEYS } from "../assets/assetManifest.js";
import { FacilityStationView } from "./FacilityStationView.js";
import { WorkerManager } from "./WorkerManager.js";
import { WorldEffects } from "./WorldEffects.js";
import { DEPTH_BASE } from "./depth.js";

export class WorldView {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;

    this._buildFloor();
    this._buildWalls();

    this.desk = new FacilityStationView(scene, "desk", worldMap.facilities.desk.anchor);
    this.desk.onSelect(() => gameState.select("desk"));

    this.workers = new WorkerManager(scene, gameState);
    this.effects = new WorldEffects(scene);

    this._onChanged = () => this._refresh();
    this._onUpgraded = (facility) => { if (facility.id === "desk") this.desk.playUpgrade(); };
    this._onFloat = (p) => this.effects.float(p);
    this._onBallots = (p) => this.effects.ballots(p);
    gameState.on("changed", this._onChanged);
    gameState.on("upgraded", this._onUpgraded);
    gameState.on("float", this._onFloat);
    gameState.on("ballots", this._onBallots);

    scene.input.on("pointerdown", (pointer) => {
      if (pointer.y > 600) return; // 하단 DOM UI 영역 보호
      gameState.processClick(pointer.x, pointer.y);
    });

    this._refresh();
    this._workTimer = scene.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        if (this.gameState.level("desk") > 0) {
          const spot = worldMap.facilities.desk.workSpots[0];
          this.effects.deskPop(spot.x, spot.y);
        }
      },
    });
  }

  _buildFloor() {
    const f = worldMap.floor;
    for (let r = 0; r < f.rows; r++) {
      for (let c = 0; c < f.cols; c++) {
        const x = f.originX + (c - r) * (f.tileW / 2);
        const y = f.originY + (c + r) * (f.tileH / 2);
        this.scene.add.image(x, y, ASSET_KEYS.floor).setDepth(DEPTH_BASE.floor + y);
      }
    }
  }

  _buildWalls() {
    worldMap.walls.forEach((w) => {
      this.scene.add.image(w.x, w.y, w.key).setDepth(10);
    });
  }

  _refresh() {
    const level = this.gameState.level("desk");
    const unlocked = this.gameState.isUnlocked("desk");
    const selected = this.gameState.data.selected === "desk";
    const canUpgrade = unlocked
      && this.gameState.data.votes >= this.gameState.cost("desk")
      && this.gameState.data.explain >= this.gameState.explainCost("desk");
    this.desk.refresh({ level, unlocked, selected, canUpgrade });
    this.workers.sync();
  }

  update() {
    this.workers.update();
  }

  destroy() {
    this.gameState.off("changed", this._onChanged);
    this.gameState.off("upgraded", this._onUpgraded);
    this.gameState.off("float", this._onFloat);
    this.gameState.off("ballots", this._onBallots);
    this._workTimer?.remove();
    this.desk.destroy();
    this.workers.destroy();
    this.effects.destroy();
  }
}
```

- [ ] **Step 2: GameScene 전체 교체**

`src/scenes/GameScene.js`:

```js
import Phaser from "phaser";
import { WorldView } from "../world/WorldView.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.gameState = this.registry.get("gameState");
    this.world = new WorldView(this, this.gameState);

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.gameState.tick() });

    this.events.once("shutdown", () => this.world.destroy());
  }

  update(time, delta) {
    this.world.update(delta);
    this.gameState.autosave(delta);
  }
}
```

- [ ] **Step 3: 구동 확인 (완료기준 1~5)**

Run: `npm run dev` → 브라우저 접속.
Expected:
- 파스텔 아이소 바닥 + 벽 + 접수창구 스프라이트가 보인다 (#1)
- 화면 상단(월드)을 탭하면 표가 늘고, 표가 쌓이면 desk를 업그레이드(아래 UI 태스크 전이면 콘솔에서 `registry.get('gameState').upgrade('desk')` 호출)했을 때 Lv 1/5/12 경계에서 책상 실루엣 교체 (#2)
- desk 주변 deskPop FX + 워커가 입구→창구로 걸어와 work 애니 (#3, #4)
- 워커가 책상 앞뒤로 자연스럽게 가림 (#5)

- [ ] **Step 4: 커밋** (git repo인 경우만)

```bash
git add src/world/WorldView.js src/scenes/GameScene.js
git commit -m "feat: composed world view replacing baked PNG"
```

---

## Task 12: DOM HUD (상단 통화바 + 진행바)

**Files:**
- Create: `src/ui/DOMHud.js`
- Create: `src/ui/dom-ui.css`
- Modify: `src/main.js` (CSS import + HUD 마운트)

**Interfaces:**
- Consumes: `gameState` (registry), `shortNumber` (`src/utils/format.js`)
- Produces: `class DOMHud { constructor(gameState); mount(parent); destroy(); }`

- [ ] **Step 1: CSS 작성**

`src/ui/dom-ui.css`:

```css
.gp-ui { position: absolute; inset: 0; pointer-events: none; font-family: system-ui, sans-serif; }
.gp-ui * { box-sizing: border-box; }
.gp-hud { position: absolute; top: 0; left: 0; right: 0; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.gp-hud__row { display: flex; gap: 8px; }
.gp-chip { flex: 1; display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 14px; background: rgba(255,255,255,0.92); box-shadow: 0 2px 6px rgba(120,90,60,0.18); }
.gp-chip__dot { width: 12px; height: 12px; border-radius: 50%; }
.gp-chip__val { font-weight: 700; font-size: 14px; color: #5a463a; }
.gp-chip__label { font-size: 10px; color: #9a8472; }
.gp-progress { height: 14px; border-radius: 8px; background: rgba(255,255,255,0.7); overflow: hidden; box-shadow: inset 0 1px 3px rgba(120,90,60,0.2); }
.gp-progress__fill { height: 100%; width: 0%; background: linear-gradient(90deg,#ffd28a,#ffb877); transition: width .2s; }
```

- [ ] **Step 2: DOMHud 작성**

`src/ui/DOMHud.js`:

```js
import { shortNumber } from "../utils/format.js";

export class DOMHud {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-hud";
    this.root.innerHTML = `
      <div class="gp-hud__row">
        <div class="gp-chip"><span class="gp-chip__dot" style="background:#ffc857"></span><span><div class="gp-chip__label">표</div><div class="gp-chip__val" data-k="votes">0</div></span></div>
        <div class="gp-chip"><span class="gp-chip__dot" style="background:#7fc8ff"></span><span><div class="gp-chip__label">해명</div><div class="gp-chip__val" data-k="explain">0</div></span></div>
        <div class="gp-chip"><span class="gp-chip__dot" style="background:#89d98b"></span><span><div class="gp-chip__label">믿음</div><div class="gp-chip__val" data-k="trust">0%</div></span></div>
      </div>
      <div class="gp-progress"><div class="gp-progress__fill" data-k="progress"></div></div>`;
    this._refresh = () => this.refresh();
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("changed", this._refresh);
    this.refresh();
  }

  refresh() {
    const d = this.gameState.data;
    this.root.querySelector('[data-k="votes"]').textContent = shortNumber(d.votes);
    this.root.querySelector('[data-k="explain"]').textContent = shortNumber(d.explain);
    this.root.querySelector('[data-k="trust"]').textContent = `${Math.round(d.trust)}%`;
    const ratio = Math.max(0, Math.min(1, d.stage.progress / d.stage.target));
    this.root.querySelector('[data-k="progress"]').style.width = `${ratio * 100}%`;
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    this.root.remove();
  }
}
```

- [ ] **Step 3: main.js 에 마운트**

`src/main.js`를 수정: CSS import 추가 + 게임 생성 후 HUD 마운트. `import "./style.css";` 아래에 추가:

```js
import "./ui/dom-ui.css";
import { DOMHud } from "./ui/DOMHud.js";
```

그리고 `new Phaser.Game(config);` 를 다음으로 교체:

```js
const game = new Phaser.Game(config);

const uiLayer = document.createElement("div");
uiLayer.className = "gp-ui";
document.getElementById("game").appendChild(uiLayer);

game.events.once("ready", () => {
  const gameState = game.registry.get("gameState");
  if (!gameState) return;
  new DOMHud(gameState).mount(uiLayer);
});
```

참고: `gameState`는 `BootScene.create`에서 registry에 set된다. `ready` 시점에 아직 없을 수 있으므로, 없으면 다음 틱 재시도하도록 방어한다:

```js
game.events.once("ready", () => {
  const tryMount = () => {
    const gameState = game.registry.get("gameState");
    if (!gameState) return setTimeout(tryMount, 50);
    new DOMHud(gameState).mount(uiLayer);
  };
  tryMount();
});
```

(위 `ready` 콜백은 이 방어형 버전 하나만 남긴다.)

- [ ] **Step 4: 구동 확인 (완료기준 6 일부)**

Run: `npm run dev`
Expected: 상단에 표/해명/믿음 칩 3개 + 진행바가 CSS로 렌더되고, 탭으로 표가 늘면 칩/진행바가 갱신된다. 기존 Phaser UIScene의 상단 HUD와 겹쳐 보일 수 있음(다음 태스크에서 정리).

- [ ] **Step 5: 커밋** (git repo인 경우만)

```bash
git add src/ui/DOMHud.js src/ui/dom-ui.css src/main.js
git commit -m "feat: DOM HUD overlay"
```

---

## Task 13: DOM 하단 탭 + 시설 업그레이드 카드, 기존 UIScene 비활성화

**Files:**
- Create: `src/ui/DOMBottomPanel.js`
- Modify: `src/ui/dom-ui.css` (추가)
- Modify: `src/main.js` (BottomPanel 마운트)
- Modify: `src/main.js` 또는 `src/scenes/PreloadScene.js` — UIScene 런칭 제거

**Interfaces:**
- Consumes: `gameState`, `shortNumber`, `facilities`(`src/data/facilities.js`)
- Produces: `class DOMBottomPanel { constructor(gameState); mount(parent); destroy(); }`

- [ ] **Step 1: CSS 추가**

`src/ui/dom-ui.css` 끝에 추가:

```css
.gp-bottom { position: absolute; left: 0; right: 0; bottom: 0; pointer-events: auto; background: rgba(255,248,235,0.97); border-top-left-radius: 18px; border-top-right-radius: 18px; box-shadow: 0 -3px 12px rgba(120,90,60,0.2); padding: 12px; }
.gp-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: #fff; box-shadow: 0 2px 6px rgba(120,90,60,0.15); }
.gp-card__icon { width: 44px; height: 44px; border-radius: 12px; background: #ffd9a0; }
.gp-card__body { flex: 1; }
.gp-card__title { font-weight: 700; color: #5a463a; }
.gp-card__sub { font-size: 11px; color: #9a8472; }
.gp-btn { pointer-events: auto; border: none; border-radius: 12px; padding: 12px 16px; font-weight: 700; color: #2c4a36; background: linear-gradient(180deg,#9be39c,#7fce82); box-shadow: 0 3px 0 #5fa564; cursor: pointer; }
.gp-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #5fa564; }
.gp-btn--disabled { background: #cfc6bd; box-shadow: 0 3px 0 #b3a99e; color: #fff; }
.gp-tabs { display: flex; gap: 6px; margin-top: 10px; }
.gp-tab { flex: 1; pointer-events: auto; border: none; border-radius: 10px; padding: 8px; font-size: 11px; background: #efe5d6; color: #7a6a58; cursor: pointer; }
.gp-tab--active { background: #ffd28a; color: #5a463a; font-weight: 700; }
```

- [ ] **Step 2: DOMBottomPanel 작성**

`src/ui/DOMBottomPanel.js`:

```js
import { shortNumber } from "../utils/format.js";

const TABS = [
  ["facilities", "시설"],
  ["crew", "직원"],
  ["events", "사건"],
  ["goals", "목표"],
  ["prestige", "감사"],
];

export class DOMBottomPanel {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-bottom";
    this.root.innerHTML = `
      <div class="gp-card">
        <div class="gp-card__icon"></div>
        <div class="gp-card__body">
          <div class="gp-card__title" data-k="title">접수창구 Lv.0</div>
          <div class="gp-card__sub" data-k="sub"></div>
        </div>
        <button class="gp-btn" data-k="upgrade">업그레이드</button>
      </div>
      <div class="gp-tabs" data-k="tabs"></div>`;

    const tabsEl = this.root.querySelector('[data-k="tabs"]');
    TABS.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.className = "gp-tab";
      b.dataset.tab = id;
      b.textContent = label;
      b.addEventListener("click", () => this.gameState.setTab(id));
      tabsEl.appendChild(b);
    });

    this.root.querySelector('[data-k="upgrade"]').addEventListener("click", () => {
      this.gameState.select("desk");
      this.gameState.upgrade("desk");
    });

    this._refresh = () => this.refresh();
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("changed", this._refresh);
    this.refresh();
  }

  refresh() {
    const gs = this.gameState;
    const level = gs.level("desk");
    const cost = gs.cost("desk");
    const explainCost = gs.explainCost("desk");
    const canBuy = gs.data.votes >= cost && gs.data.explain >= explainCost;
    this.root.querySelector('[data-k="title"]').textContent = `접수창구 Lv.${level}`;
    this.root.querySelector('[data-k="sub"]').textContent = `${shortNumber(cost)}표 · 해명 ${explainCost}`;
    const btn = this.root.querySelector('[data-k="upgrade"]');
    btn.classList.toggle("gp-btn--disabled", !canBuy);
    this.root.querySelectorAll(".gp-tab").forEach((el) => {
      el.classList.toggle("gp-tab--active", el.dataset.tab === gs.data.activeTab);
    });
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    this.root.remove();
  }
}
```

- [ ] **Step 3: main.js 에 마운트 + UIScene 제거**

`src/main.js`에서 `import { UIScene } ...` 라인을 삭제하고, config의 `scene` 배열에서 `UIScene`를 제거:

```js
  scene: [BootScene, PreloadScene, GameScene],
```

`PreloadScene.create`의 `this.scene.launch("UIScene");` 라인도 삭제(Task 7에서 만든 파일 수정).

그리고 `DOMHud` import 옆에 추가:

```js
import { DOMBottomPanel } from "./ui/DOMBottomPanel.js";
```

`tryMount` 안에서 HUD와 함께 마운트:

```js
    if (!gameState) return setTimeout(tryMount, 50);
    new DOMHud(gameState).mount(uiLayer);
    new DOMBottomPanel(gameState).mount(uiLayer);
```

- [ ] **Step 4: 구동 확인 (완료기준 2,6,7)**

Run: `npm run dev`
Expected:
- 하단에 둥근 카드(접수창구 Lv·비용) + 초록 입체 업그레이드 버튼 + 5개 탭바 (#6,#7)
- 업그레이드 버튼을 충분한 표가 모인 상태에서 누르면 Lv 상승, Lv 1/5/12 경계에서 **월드의 접수창구 실루엣 교체**(#2)
- Phaser UIScene이 더 이상 안 뜨고 화면이 DOM UI로 정리됨

- [ ] **Step 5: 커밋** (git repo인 경우만)

```bash
git add src/ui/DOMBottomPanel.js src/ui/dom-ui.css src/main.js src/scenes/PreloadScene.js
git commit -m "feat: DOM bottom panel + retire Phaser UIScene"
```

---

## Task 14: 슬라이스 검증 + 아트 교체 경로 문서화

**Files:**
- Create: `docs/superpowers/notes/slice-verification.md`

- [ ] **Step 1: 7개 완료기준 수동 검증**

Run: `npm run dev` → 브라우저에서 다음을 한 화면에서 확인하고 결과 기록:
1. 파스텔 아이소 바닥+벽+접수창구 스프라이트 존재
2. 업그레이드로 Lv 1→5→12 경계에서 책상 실루엣 교체
3. 스테이션/deskPop 작업 애니
4. 워커 1~2명이 걸어와 work 애니
5. depth 가림(워커 책상 앞뒤)
6. 상단 DOM HUD + 하단 탭바 CSS 렌더
7. 업그레이드 카드 버튼 → `upgrade("desk")` 동작

- [ ] **Step 2: 단위테스트 전체 통과 확인**

Run: `npm test`
Expected: 모든 순수함수 테스트 PASS (facilityTiers, depth, pathGraph, worldMap, assetManifest).

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: 아트 교체 경로 기록**

`docs/superpowers/notes/slice-verification.md`에 작성:

```markdown
# 슬라이스 검증 결과 & 실제 아트 교체 경로

## 검증 (7기준)
- (각 항목 PASS/이슈 기록)

## 플레이스홀더 → 실제 아트 교체 방법 (코드 변경 없음)
모든 스프라이트는 assetManifest 키로 참조된다. 실제 아트를 넣으려면:
1. 파일을 `public/art/...`에 둔다.
2. `src/scenes/PreloadScene.js`의 preload()에서 동일 키로 로드:
   - 바닥: `this.load.image("floor/pastel", "/art/floor-pastel.png")`
   - 벽: `this.load.image("wall/back-left", ...)`, `wall/back-right`
   - 접수창구 티어: `this.load.image("facility/desk/t1/idle", ...)` (t1/t2/t3)
   - 워커 시트: `this.load.spritesheet("worker/clerk/sheet", "/art/worker-clerk.png", {frameWidth, frameHeight})`
3. 실제 파일이 로드되면 `generatePlaceholders`가 해당 키를 덮어쓰지 않도록, PreloadScene.create에서 `if (!this.textures.exists(key))` 가드 또는 로드된 키 목록을 우선한다.

## 권장 실제 에셋 (상업사용 OK)
- 바닥/벽/가구: Kenney Isometric Tiles City + Furniture Kit (CC0)
- 워커: Universal LPC Spritesheet Generator (CC-BY-SA — 출처표기+SA 준수)
- 접수창구 6시설 티어: 파스텔 스타일가이드 락 후 커스텀(Aseprite/Pixelorama)
```

- [ ] **Step 5: 커밋** (git repo인 경우만)

```bash
git add docs/superpowers/notes/slice-verification.md
git commit -m "docs: slice verification and art-swap path"
```

---

## Self-Review (작성자 점검 결과)

**1. Spec 커버리지:**
- §2 아키텍처(WorldView/FacilityStationView/Worker*/WorldEffects/DepthSorter/worldMap/pathGraph/DOM*) → Task 5,8,9,10,11,12,13에서 구현. `DepthSorter`는 순수 `depth.js`(Task 3)로 단순화(클래스 불필요 — YAGNI).
- §4 티어 스킴(0/1/5/12/25/45) → Task 2. (슬라이스는 t1/t2/t3까지 시각화, t4/t5 키는 정의되어 후속 확장 시 아트만 추가.)
- §5 슬라이스 7기준 → Task 11,13,14에서 검증.
- §6 DOM UI → Task 12,13.
- §7 에셋/일관성 → Task 6(플레이스홀더) + Task 14(실제 교체 경로). 실제 커스텀 아트 제작은 코드 계획 밖의 아트 트랙(문서화됨).
- §8 검증 → Task 1(러너), 순수함수 TDD(Task 2~5), Task 14(수동+빌드).

**2. 플레이스홀더 스캔:** 코드 단계는 모두 실제 코드 포함. "TODO/TBD" 없음. (실제 아트 제작만 의도적으로 아트 트랙으로 분리 — 명시됨.)

**3. 타입/이름 일관성:**
- 워커 텍스처 키: `ASSET_KEYS.workerSheet="worker/clerk"` → 시트 등록 `"worker/clerk/sheet"`(Task 7) → WorkerActor가 `"worker/clerk/sheet"` 사용(Task 9). 일치.
- 시설 스프라이트 키: `stationSpriteKey`(Task 2) ↔ `ASSET_KEYS.deskStation`(Task 6) ↔ FacilityStationView(Task 8). 일치.
- depth 함수: `stationDepth/workerDepth/fxDepth`(Task 3) 사용처(Task 8,9,10) 일치.
- GameState 메서드/이벤트: Global Constraints의 확인된 시그니처만 호출.

**알려진 한계(의도적):** Task 6의 devPlaceholders는 출시급이 아니라 "티어 구분되는 파스텔 임시본". 슬라이스의 목적은 렌더링 아키텍처 증명이며, 실제 비주얼 품질은 Task 14의 교체 경로를 따라 실제 Kenney/LPC/커스텀 아트로 끌어올린다.

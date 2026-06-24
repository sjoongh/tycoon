# 개표국 프레젠테이션 레이어 재구축 — 설계 문서 (Spec)

- **프로젝트**: 믿어주세요 개표국 (풍자형 픽셀 방치 타이쿤, Phaser 3 + Vite, 모바일 세로 390×844)
- **작성일**: 2026-06-24
- **상태**: 승인됨 (설계 단계). 다음 단계 = 구현 계획(writing-plans).
- **범위**: **프레젠테이션 레이어 전면 재구축.** 게임 로직/경제/세이브는 재사용.

---

## 0. 문제 정의 (왜 재작성하나)

현재 월드는 **단일 베이크 PNG**(`GameScene.createWorld` → `this.add.image(195,422,"world-office")`)이고, 시설은 스프라이트가 아니라 **좌표로 띄운 투명 클릭영역 + 라벨 박스**(`worldLayout.js worldNodes`, `BuildingNode.js`)다. 업그레이드해도 월드 이미지는 변하지 않고 `Lv.N` 텍스트와 오버레이 알파만 바뀐다(`GameScene.refreshActivityOverlays`). 직원은 24×30 손코딩 2프레임 텍스처(`createPixelTextures.js`, `WorkerAgent.js`)다. UI는 전부 raw Phaser 사각형/원/텍스트(`UIScene.js`).

결과: 레벨에디터 디버그 화면처럼 보이고, 타이쿤/방치형의 핵심 쾌감인 **"키우면 세상이 눈에 보이게 자란다"**가 비주얼에서 통째로 빠져 있다.

### 근거 (5개 독립 소스 수렴)
Claude 분석 · Codex 독립 아키텍처 진단 · 실제 타이쿤 게임 10개 리서치 · 실제 방치형/키우기 게임 10개 리서치 · 오픈소스 에셋/기술 리서치 — **모두 동일 결론**: 출시된 게임은 예외 없이 **개별 스프라이트를 층층이 합성한 살아있는 씬**이며, 단일 PNG가 "프로토타입 티"의 단일 근본 원인이다.

진짜 게임으로 만드는 7대 패턴(임팩트순):
1. 월드 = 독립 스프라이트 합성 (배경/스테이션/캐릭터/FX 층)
2. 성장의 가시화 = **이산적 아트 티어 교체** (실루엣이 바뀐다)
3. 개수의 증식 = 보유량을 실제 스프라이트 수로
4. 상시 앰비언트 애니메이션 (가만 있어도 움직임)
5. 육즙 피드백 (떠오르는 숫자/파티클/반응 탭 오브젝트)
6. 포컬 인터랙티브 프롭 (메인 탭 액션이 월드 오브젝트에 산다)
7. 정돈된 크롬 (상단 통화 HUD + 하단 탭바, DOM/CSS — 떠다니는 라벨 금지)

---

## 1. 확정 결정사항

| 항목 | 결정 |
|---|---|
| 월드 렌더링 형식 | **아이소메트릭 합성 씬** |
| 아트 톤 | **귀여운 파스텔** (`assets/office-map.png`가 비주얼 북극성). 현재 다크 그릿티 `world-office.png`는 폐기 |
| 에셋 조달 | **하이브리드** — 바닥/가구/캐릭터/UI는 오픈소스, 시그니처 6개 시설 티어만 커스텀 |
| 첫 결과물 | **버티컬 슬라이스(접수창구 1개)** 먼저 → 검증 후 확장 |
| UI 크롬 | **DOM/HTML+CSS 오버레이** (만장일치 권고) |

---

## 2. 타깃 아키텍처

### 2.1 레이어 경계 (불변 규칙)
- `GameState`는 **유일한 진실 원천**. 경제·진행·세이브 규칙은 뷰로 절대 이동하지 않는다.
- 뷰는 GameState를 **읽기**만. 사용자 입력은 기존 GameState 메서드만 호출.
- Phaser 캔버스 = 월드(스프라이트·파티클·플로팅 숫자). DOM = 모든 앱형 UI(HUD·탭·카드·모달).

### 2.2 파일 처리
**그대로 둠:** `src/state/GameState.js`, `src/config.js`, `src/data/*.js`(facilities, staff, events, quests, prestige), `src/utils/format.js`, `src/pools/FloatTextPool.js`

**재작성:**
- `src/scenes/GameScene.js` — 씬 호스트로 슬림화. `WorldView` 인스턴스화 + update/autosave 포워딩만. 베이크 PNG·BuildingNode·activityViews·route 로직 제거.
- `src/scenes/PreloadScene.js` — `world-office`만이 아니라 아틀라스/스프라이트시트 로드 + 애니메이션 등록.
- `src/scenes/UIScene.js` — DOM UI로 대체. 잔존 시 토스트/플로팅텍스트 브리지로만 축소.
- `src/world/worldLayout.js` → `src/world/worldMap.js` + `src/world/pathGraph.js`로 대체.

**은퇴 (개발용 폴백으로만 보존 가능):**
- `src/world/BuildingNode.js` → 역할이 `FacilityStationView`로 이관
- `src/world/WorkerAgent.js` → `WorkerActor`(Phaser 애니 기반)로 이관
- `src/textures/createPixelTextures.js` → 최종 아틀라스 전까지 임시 플레이스홀더로만

**신규 모듈 (작고 단일책임):**

| 모듈 | 책임 | 의존 |
|---|---|---|
| `src/world/WorldView.js` | 월드 합성 루트. `changed/upgraded/ballots/float` 구독, 자식 뷰 오케스트레이션 | scene, gameState |
| `src/world/FacilityStationView.js` | 시설 1개: 스테이션 스프라이트·그림자·티어교체·작업애니·선택링·업그레이드 배지 | scene, facilityTiers, worldMap |
| `src/world/facilityTiers.js` | 순수함수 `level → tier`, `tier → spriteKey` | (없음) |
| `src/world/WorkerManager.js` | 워커 스폰·시설 배치·route 갱신 (staff/facility 상태 기반) | gameState, pathGraph |
| `src/world/WorkerActor.js` | 워커 1명: 스프라이트시트 애니(walk/idle/work), 노드 간 이동, 매 프레임 depth | scene, pathGraph |
| `src/world/WorldEffects.js` | 종이/표/반짝임/숫자/스탬프 버스트 FX (기존 spawn* 이전) | scene, FloatTextPool, BallotPool |
| `src/world/DepthSorter.js` | `depth = baseDepth + y` 계산·적용 | (없음) |
| `src/world/worldMap.js` | 렌더 앵커, depth base, 작업스팟, nav 노드, 히트 영역 | (없음, 데이터) |
| `src/world/pathGraph.js` | nav 노드 + 엣지, BFS/A* 경로 | (없음, 데이터+순수함수) |
| `src/ui/DOMHud.js` | 상단 통화 HUD(표·해명·믿음), 진행바, 스테이지 정보 | gameState |
| `src/ui/DOMBottomPanel.js` | 하단 탭바 + 탭별 패널(시설/직원/사건/목표/감사) | gameState |
| `src/ui/DOMModalLayer.js` | 사건/오프라인보상/업그레이드 모달, 토스트 | gameState |
| `src/assets/assetManifest.js` | 에셋 키·경로 중앙 정의 | (없음, 데이터) |
| `src/animations/createAnimations.js` | Phaser 애니 정의(워커 walk/idle/work, 스테이션 work) | scene |

### 2.3 depth 규칙
- 정적 벽/배경: 고정 낮은 depth (10대)
- 바닥: 0–99
- 스테이션: `1000 + anchor.y`
- 워커: `1000 + worker.y + 20`
- 플로팅 FX: `3000 + y`
- DOM UI: 캔버스 위 별도 레이어

→ "워커가 책상 뒤/앞으로 자연스럽게" 정확히 동작. 기존 `82 + index` 하드코딩 depth 제거.

---

## 3. 데이터 흐름

```
GameState (진실원천)
  │  emit: changed / upgraded / ballots / float / saved
  ▼
WorldView ──> FacilityStationView × N  (level→tier, 스프라이트 교체, 작업애니)
  │       └─> WorkerManager ──> WorkerActor × M (배치·이동·애니)
  │       └─> WorldEffects (FX)
DOMHud / DOMBottomPanel / DOMModalLayer (읽어서 갱신)
  ▲
  │  user input → 기존 메서드만 호출:
  └── processClick / upgrade / hireStaff / advanceStage / setTab / applyEffect / prestigeReset
```

---

## 4. 성장 가시화 스킴

### 4.1 티어 임계값 (`facilityTiers.js`)
```
level 0  → locked
level 1  → t1
level 5  → t2
level 12 → t3
level 25 → t4
level 45 → t5
```
스프라이트 키 규약: `facility/{id}/{tier}/idle`, `facility/{id}/{tier}/work`

### 4.2 교체 동작 (`FacilityStationView.refresh`)
- level에서 tier 계산 → **tier가 바뀔 때만** 스테이션 스프라이트 교체
- 교체 시: 스케일 범프 + 건설 반짝임 + (티어 변경 시) 짧은 티어 공개 연출. **세이브/데이터 변경 없음.**
- `Lv.N` 텍스트는 월드에서 제거하거나 아주 옅게. 선택링·업그레이드 배지가 affordance 담당.
- 작업 애니 강도: `clamp(0.3 + level/40, 0.3, 1.5)`

### 4.3 접수창구(desk) 티어 예시
- t1: 작은 접수 책상
- t2: 큰 카운터 + 서류 트레이
- t3: 대기줄 기둥 + 스탬프 기계
- (t4/t5는 6시설 확장 단계에서 정의)

### 4.4 직원 증식
워커 수를 숫자가 아니라 **실제 스프라이트 수**로. staff 레벨·시설 레벨·CPS 가중치 기반으로 활성 시설에 배치.

---

## 5. 🎯 버티컬 슬라이스 — 첫 결과물 (접수창구)

**목적:** 새 렌더링 방식이 "출시 결"인지 한 화면에서 눈으로 증명.

**완료 기준 (acceptance — 모두 충족해야 슬라이스 완료):**
1. 파스텔 아이소 **바닥 타일 + 벽** 위에 접수창구가 **개별 스프라이트**로 존재
2. 접수창구 업그레이드 시 Lv 임계값(1/5/12)에서 **스프라이트 실루엣이 실제로 교체**됨 (t1→t2→t3)
3. 스테이션이 **작업 애니메이션** 재생 (스탬프/종이 모션)
4. **직원 1–2명이 스프라이트시트 애니로 걸어와** 창구에서 작업 모션
5. **depth 정렬**로 직원이 책상 뒤/앞으로 자연스럽게 가림 처리
6. 상단 **DOM HUD**(표·해명·믿음 + 진행바) + 하단 탭바가 CSS로 깔끔하게 렌더
7. 탭 → 업그레이드가 **둥근 카드 모달/시트**(라벨 박스 아님)로 동작하고 `gameState.upgrade()` 호출

**검증:** `npm run dev` 구동 후 7개 기준을 실제 플레이/스크린샷으로 확인. 통과 시 나머지 5개 시설로 확장.

---

## 6. UI 크롬 (DOM/CSS)

- `#game` 래퍼 안에 절대배치 DOM 오버레이.
- `gameState.changed` 구독해 갱신. 버튼은 기존 메서드 호출.
- CSS로: 통화 HUD 바, 진행바(칸형 pip 가능), 하단 시트, 시설/직원 카드, 사건 모달, 오프라인 보상 모달, 저장 토스트. 둥근 모서리·그림자·그라데이션·웹폰트·눌림 상태.
- Phaser 캔버스에 남기는 것: 월드 위 플로팅 숫자/FX, 선택링, 시설 탭 피드백.

---

## 7. 에셋 소싱 (하이브리드, 상업 사용 가능)

| 카테고리 | 픽 | 라이선스 |
|---|---|---|
| 바닥/벽/가구 | Kenney Isometric Tiles City + Furniture Kit | CC0 (무제한) |
| 캐릭터(워커) | Universal LPC Spritesheet Generator (4방향 walk/idle) | CC-BY-SA 3.0 — **출처표기 + ShareAlike 준수 필수** |
| iso 그리드/패스 | rexrainbow phaser3-rex-plugins (Board/QuadGrid) 또는 Phaser 3.50+ 네이티브 iso 타일맵 | MIT |
| UI 아이콘 | Kenney UI Pack (필요한 아이콘만; 패널은 CSS) | CC0 |
| 도구 | Aseprite/Pixelorama(스프라이트), Tiled(맵), Free Texture Packer(아틀라스) | — |

**커스텀 대상:** 시그니처 6개 시설(접수/분류/홍보/전산/기록/브리핑) 티어 스프라이트만. 파스텔 톤.

**스타일 가이드 락(티어 제작 전 반드시 고정):** 캔버스 스케일 · 팔레트 · 아웃라인 두께 · 아이소 각도 · 그림자 스타일 · 캐릭터 높이 · 시설 footprint 크기.

**최대 리스크 — 티어 간 화풍 일관성:** 서로 다른 팩/일회성 생성에서 오면 업그레이드가 "다른 게임 붙여놓은 것"처럼 보임. 안전 파이프라인 = 베이스 팩 1개 + 시설 티어 1회 통합 작업 + 공유 팔레트/아웃라인 규칙. AI 생성은 **컨셉/베이스용**이지 최종 일관 시트 아님(Aseprite/Pixelorama 정리 필요). **접수창구 전 티어부터** 만들어 일관성 먼저 증명, 그 다음 6시설 1티어 양산.

---

## 8. 검증 / 테스트

- **시각:** 사람이 `npm run dev`로 본다. 슬라이스 7기준이 1차 게이트.
- **단위:** 순수함수 위주 — `facilityTiers`(level→tier 경계값), `pathGraph`(경로 탐색), depth 계산.
- **회귀:** GameState/세이브는 손대지 않으므로 기존 동작 보존이 기준. 세이브 키/버전 불변.

---

## 9. 슬라이스 이후 단계 (개요, 상세는 구현 계획에서)

1. `WorldView` + 바닥 + depth 정렬 골격
2. 접수창구 티어 스프라이트 → `GameState.level("desk")`로 교체 검증
3. `FacilityStationView`로 6개 시설 확장 (플레이스홀더 티어)
4. `WorkerAgent` → `WorkerActor` + 오서드 nav 그래프
5. 기존 활동 FX를 `WorldEffects`로 이전
6. `UIScene` → DOM 오버레이 완성
7. 플레이스홀더/생성 텍스처를 최종 아틀라스로 교체

**핵심 목표:** GameState가 진실원천으로 남고, 보이는 모든 월드 오브젝트는 그 상태의 스프라이트 뷰가 된다. 업그레이드는 라벨이 아니라 **실루엣·밀도·애니 강도·워커 행동**을 바꾼다.

---

## 부록 A — 리서치/분석 산출물 (참고)
- 타이쿤 10종 리서치, 방치형/키우기 10종 리서치, 오픈소스 에셋 리서치, Codex 아키텍처 진단: 세션 스크래치패드에 보관(요지는 본 문서 §0/§7에 반영).

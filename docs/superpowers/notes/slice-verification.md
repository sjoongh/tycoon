# 슬라이스 검증 결과 & 실제 아트 교체 경로

브랜치: `feature/presentation-rebuild-slice` · 플랜: `docs/superpowers/plans/2026-06-24-gaepyo-vertical-slice-desk.md`

## 자동 검증 (CI 게이트)
- `npm test` → 6 files / 13 tests PASS (facilityTiers, depth, pathGraph, worldMap, assetManifest, smoke)
- `npm run build` → 성공 (Phaser chunk-size 경고만, 에러 없음)

## 수동 검증 (브라우저에서 `npm run dev` → http://localhost:5178)
7개 완료기준 — 사람이 확인:
1. [ ] 파스텔 아이소 바닥 타일 + 벽 + 접수창구 스프라이트 존재
2. [ ] 업그레이드로 Lv 1→5→12 경계에서 접수창구 실루엣 교체(t1→t2→t3)
3. [ ] 스테이션/deskPop 작업 애니메이션
4. [ ] 직원 1~2명이 스프라이트시트 애니로 걸어와 작업 모션
5. [ ] depth 정렬 — 워커가 책상 뒤(desk_back)→앞(desk_front) 통과하며 자연스럽게 가림
6. [ ] 상단 DOM HUD(표·해명·믿음·진행바) + 하단 탭바 CSS 렌더
7. [ ] 하단 업그레이드 카드 버튼 → `upgrade("desk")` 동작

## 듀얼 트랙(Claude + Codex) 보완 내역
Codex 병렬 빌드 대조로 잡아 반영한 결함/개선:
- 🔴 `ballot` 텍스처 복구 — `createPixelTextures` 은퇴 후 `BallotPool`이 참조하는 키가 사라져 클릭 시 깨지던 것 수정
- 플레이스홀더 생성에 "이미 존재하면 건너뜀" 가드 — 실제 아트가 같은 키로 로드되면 덮어쓰지 않음
- `WorldView.destroy()`에서 pointerdown 리스너 제거 — 씬 재시작 시 중복 클릭 방지
- 워커 제거 후 지연 루프 정지 — destroyed 액터에 goTo 호출 방지
- `desk_back` nav 노드 추가 — 워커가 책상 뒤를 지나 앞으로 와 depth 정렬을 시연

## 플레이스홀더 → 실제 아트 교체 (코드 변경 없음)
모든 스프라이트는 manifest 키로 참조되고, `devPlaceholders`는 `scene.textures.exists(key)`면 생성을 건너뛴다. 실제 아트 적용:
1. 파일을 `public/art/...`에 둔다.
2. `src/scenes/PreloadScene.js`의 `preload()`에서 동일 키로 먼저 로드한다(로드가 생성보다 우선):
   - 바닥: `this.load.image("floor/pastel", "/art/floor-pastel.png")`
   - 벽: `this.load.image("wall/back-left", ...)`, `this.load.image("wall/back-right", ...)`
   - 접수창구 티어: `this.load.image("facility/desk/t1/idle", ...)` (t1/t2/t3)
   - 워커 시트: `this.load.spritesheet("worker/clerk", "/art/worker-clerk.png", { frameWidth: 24, frameHeight: 32 })`
   - 투표용지: `this.load.image("ballot", "/art/ballot.png")`
3. `create()`의 `generatePlaceholders(this)`는 이미 존재하는 키를 건너뛰므로, 로드된 실제 아트만 사용되고 미제공분만 플레이스홀더로 채워진다.

## 권장 실제 에셋 (상업 사용 OK)
- 바닥/벽/가구: Kenney Isometric Tiles City + Furniture Kit (CC0)
- 워커: Universal LPC Spritesheet Generator (CC-BY-SA — 출처표기 + ShareAlike 준수)
- 접수창구 6시설 티어: 파스텔 스타일가이드(스케일/팔레트/아웃라인/아이소각/그림자) 락 후 커스텀(Aseprite/Pixelorama)

## 다음 단계 (슬라이스 이후)
나머지 5개 시설(sorter/notice/server/archive/studio)로 `FacilityStationView` 확장 + DOM 패널의 시설/직원/사건/목표/감사 탭 내용 채우기 + 실제 아트 양산.

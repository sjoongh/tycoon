# 2026-11-10 — 개표소 확장 4단계 (중기 #1, "너무 좁다"에 대한 직접 대응)

근거: 레퍼런스 보고서 중기 #1(Idle Bank Tycoon 18항목 완성→이주, My Perfect Hotel 호텔 8개, Kolibri "새 비주얼로 프레스티지 단조로움 해결").

## 구조
- 방 4단계: 5×5(1~2구역, 동네 경로당) → 7×7(3~5구역) → 9×9(6~9구역) → 11×11(10구역~). 시설 해금(전산 3·보관 4·브리핑 5구역)과 맞물려 3구역에서 처음 넓어진다. `iso.roomStageFor(area)`.
- 캐릭터·시설 배율(0.58)은 고정, 방 이미지만 바뀐다. 5×5는 표시 폭 330(타일 66px)이라 국장·직원이 방을 꽉 채우고, 11×11은 404(타일 37px)라 넓은 청사처럼 보인다. 바닥 앞 꼭짓점 y=510 고정으로 시트·FAB 관계 유지.
- `src/world/iso.js`를 live-binding 모듈로 재작성: `setRoomStage(n)` 호출 뒤 `ROOM_X/Y/W/H`, `FACILITY_SLOTS`, `GOV_TILE`, `BIG_NUM_TILE`, `PILE_TILE`, `DOOR_TILE`, `QUEUE`, `BADGE_WALL`, `tileCenter()`가 새 단계 좌표를 돌려준다. 단계별 배치표 `STAGE_LAYOUT`. 5×5에는 server/archive/studio 슬롯이 없어 해당 시설·라벨·LED를 숨긴다.
- `WorldView._applyRoomStage(stage, animate)`: 방 텍스처·위치 교체, 시설·라벨·적체 더미·LED·국장·명패·큰 숫자 재배치, 직원 전부 재배치, 표 뭉치·유권자·뱃지 재생성, 배경 재그리기. 확장 연출: 방 0.92→1 Back ease + 플래시 + 바닥 중앙 투표지 16장 + "개표소 확장! 7×7 → 9×9" 플로팅 + 국장 환호.
- 아트: `room-s/room-l/room-xl`(gpt-image, 기존 방 참조 edits) → `build_world_ai.py ROOM_STAGES`가 4종을 측정·리사이즈해 atlas `rooms[]`에 cols/tile/top/floor/wallH 기록. `PreloadScene`이 4종 로드.
- 안내: 시설 탭 티저에 "개표소 7×7 (2/4) · 6구역에서 9×9 확장", 승격 카드에 "개표소 확장 7×7 → 9×9" 배지.

## 검증
- `npm test` 182/182, `npm run build`(커스텀 Phaser 검사 통과), a11y errors 0.
- Playwright: 1/4/7/12구역 순으로 전환해 방 키·위치·국장 좌표·가시 시설·직원 수 확인, 각 단계 캡처(`/tmp/gaepyo-preview/room-s0..3.png`), 확장 애니메이션 프레임. 아트 404 없음.
- QA 스크립트(`_pwascreenshots.mjs` 등)의 준비 대기 조건을 "월드 생성 완료"까지로 보강(방 4종 로드로 시작이 늦어져 레이스 발생).

## 남은 것
- 잠긴 구획 미리보기(공사 테이프·입간판)는 다음 패스. 지금은 티저 문구와 승격 카드로 다음 확장 시점을 알린다.

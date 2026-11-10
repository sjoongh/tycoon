# 2026-11-10 — 하단 3단 시트 (고정 탭바 + 접힘/반펼침/전체) · 월드 확대

## 배경
- 하단 패널이 844px 중 379px(45%)를 차지하고 방은 214px뿐이었다. 레퍼런스(Idle Miner Tycoon, Egg Inc, 고양이와 스프, Material/NN/G 바텀 시트 가이드) 공통 패턴은 "월드 가득 + 아이콘 탭바 고정 + 상세는 아래에서 올라오는 시트, 긴 목록은 전체 덮기".

## 구조 (`src/ui/DOMBottomPanel.js`, `dom-ui.css`)
- `.gp-bottom` = 핸들(드래그·접기 버튼) + 요약 줄(`.gp-peek`) + 패널 + 탭바(54px, 아이콘 26px). 상태 클래스 `gp-bottom--peek|half|full`.
- peek: 패널 숨김, 탭별 한 줄 요약 + 바로 쓸 버튼 하나. 시설=선택 시설 Lv·초당 증가·유입/용량·업그레이드 버튼, 직원=현장팀 n/3·보너스·슬롯 아이콘, 사건=사건 받기 또는 남은 초, 목표=받을 보상(출석·주간) 또는 다음 목표 진행, 감사=인장 예상·보기.
- half: 패널 max-height = UI 높이×0.46 − (핸들+탭바). full: HUD 바로 아래까지(`--sheet-full`), 안쪽 스크롤 영역(직원·목표 목록) 제한 해제.
- 조작: 핸들/요약 줄 드래그 40px(포인터 캡처), 접기 버튼(▾/▴), 활성 탭 재탭 = 접힘↔펼침, 다른 탭 = 그 탭의 기억된 상태(기본 시설·직원·사건 half, 목표·감사 full), Android 뒤로가기 = 한 단계 접기(`native.js`, `gp:sheet-collapse`). 사건 받기 시 접힘이면 half로. 상태는 `gp-sheet-v1`에 저장.
- 월드 연동: `gp:sheet-top`에 `state` 포함. half면 `GROUND_Y+78`까지만 보장하도록 카메라를 밀어 올리고(간판은 숨김), full이면 밀지 않음. full에서는 플로팅 버튼(브리핑·러시) 숨김(`.gp-ui--sheet-full`).

## 월드 (`iso.js`, `worldAtlas.js`, `WorldView.js`)
- 표시 배율 0.5→0.58: 방 404×248(양옆 7px 블리드, `ROOM_X -7`), 캐릭터·시설 동일 배율. `ROOM_Y 262`, 간판 175~215(높이 40). 큰 숫자는 바닥 앞 꼭짓점(5.3,5.3)으로 옮겨 왼쪽 FAB와 안 겹침.
- 세로 배분(접힘 기준): HUD 135 / 월드 547 / 시트 162.

## 검증
- `npm test` 178/178, `npm run build` OK, `scripts/_a11ytest.mjs` errors 0(44px 터치 영역 유지).
- Playwright: peek/half/full 전이, 드래그 업·다운, 탭 재탭, 사건 받기 자동 펼침, 전체 상태 FAB 숨김 확인. 캡처 `/tmp/gaepyo-preview/sheet*.png`.

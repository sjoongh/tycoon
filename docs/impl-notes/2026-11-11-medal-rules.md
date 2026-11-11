# 2026-11-11 — 조례(훈장으로 새 규칙 해금) — 중반 사막 해소

레퍼런스: Clicker Heroes 트랜센던스, Realm Grinder 리인카네이션 — 2차 프레스티지가 % 보너스가 아니라 새 메커닉을 연다. 기존 훈장 상점은 % 강화(포고령·관록·유산·전당·명예의 전당)와 비서 자동화뿐이었다.

| 조례 | 훈장 | 규칙 |
|---|---|---|
| 속행 개표 | 3 | 감사 후 3구역에서 시작(1~2구역 자동 통과, 방은 7×7부터) |
| 이중 개표 | 3 | 탭 12% 확률로 ×5 처리 |
| 자동 수금 | 4 | 표 뭉치 6개가 차면 자동 수금(70%) |
| 연쇄 특보 | 4 | 황금 투표함을 잡으면 20% 확률로 30초 뒤 하나 더 |
| 연속 대응 | 5 | 사건 대응 후 25% 확률로 다음 사건 즉시 대기 |
| 상설 특별 개표소 | 6 | 특별 개표소가 주 7일 열림 |

- 데이터: `src/data/prestige.js RULE_UPGRADES`(maxLevel 1, `rule: true`), 판정 `GameState.hasRule(id)`. 각 시스템이 직접 확인(processClick, resolveEventChoice, prestigeReset, WorldView 표 뭉치·골든 스케줄, specialSchedule).
- UI: 감사 탭 훈장 전당 아래 "조례 · 새 규칙" 목록(구매 버튼 / "시행 중").
- 계측 확장: `prestige_done`, `rule_buy`, `dex_set`, `weekly_badge` 추가. 전체 목록은 `2026-11-11-telemetry.md`.

## 검증
- `npm test` 201/201(속행 3구역·상설 개소·1회 구매·연속 대응 4건 추가), `npm run build`, a11y errors 0, 밸런스 시뮬 변화 없음(조례 미보유 기준).

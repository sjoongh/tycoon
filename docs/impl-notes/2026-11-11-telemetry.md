# 계측 이벤트 목록과 보는 법 (2026-11-11 기준)

Firebase Analytics(GA4 속성, measurementId `G-1YFQHKF8HY`)로 전송. 설정이 비어 있거나 미지원 환경이면 no-op(`src/cloud.js logEvt`).

| 이벤트 | 파라미터 | 의미 |
|---|---|---|
| `first_staff` / `first_prestige` / `first_tutorial_done` | `sec` | 첫 플레이부터 걸린 초(계정당 1회) |
| `session_end` | `sec`, `area` | 탭이 숨겨질 때 세션 길이 |
| `offline_reward` | `min`, `area` | 복귀 시 오프라인 정산 노출 |
| `area_up` | `area` | 구역 진입 |
| `prestige_done` | `runs`, `seals`, `medals` | 감사 실행 |
| `golden_tap` | `kind` | 황금 투표함 결과(breaking/donation/address/frenzy) |
| `reward_claim` | `kind`, `mode` | 보상 슬롯 사용(golden3x/boost/offline2x, free/ad) |
| `special_open` / `special_tier` | `tier` | 특별 개표소 진입·등급 달성 |
| `rule_buy` | `id` | 조례 구매 |
| `dex_set` | `id` | 도감 세트 완성 |
| `weekly_badge` | `tier`, `rank` | 주간 랭킹 뱃지 확정 |
| 기존 | | `staff_deployment`, `event_chain_ending`, `dex_milestone`, `communist_collapse` |

## 보는 법
- Firebase 콘솔 → Analytics → 이벤트: 이벤트별 횟수·사용자 수. 실시간 확인은 DebugView(디버그 모드 기기).
- 리텐션: Analytics → 리텐션(코호트) — D1/D7/D30.
- 파라미터 분포(예: `first_prestige.sec` 중앙값)는 GA4 맞춤 정의에 파라미터를 등록해야 보고서에 나온다. 정밀 분석은 BigQuery 내보내기 연결 권장(무료 한도 있음).

## 판단 기준(레퍼런스 보고서)
- 첫 감사 도달 10~20분, 일 세션 4~6회·세션 6~8분, D1 35~50%(방치형 2차 집계)와 비교해 페이싱을 조정한다.

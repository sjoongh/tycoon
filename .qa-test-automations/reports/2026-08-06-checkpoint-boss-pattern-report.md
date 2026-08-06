# QA Report — 체크포인트 보스 패턴 차별화

## Outcome

- Result: PASS
- Checks: 91/91 passed (76 unit, 15 mapped boss cases) and production build passed
- Target: localhost only (`http://localhost:5178`), target guard passed

## Covered behavior

- 3·6·9구역은 연타, 좌우 교대, 타이밍 패턴을 하나씩 가르친다.
- 12·15·18구역은 승인된 패턴만 2개, 2개, 3개 순서로 조합한다.
- 자동 생산, 콤보 보너스, 피버 피니셔와 일반 수치 API는 새 패턴 진행을 대신 채우지 않는다.
- 잘못된 좌우·이른 타이밍 입력은 진행을 깎지 않으며 다시 시도할 수 있다.
- 성공은 기존 +35% 완료 보상을, 실패·건너뛰기는 보너스 0과 무페널티 완료를 유지한다.
- 모바일 390×844와 데스크톱 1280×900에서 overflow가 없고 조작·건너뛰기는 최소 44px다.
- 최종 3단계 보스를 키보드만으로 완료하고 단계 교체 때 포커스가 다음 조작으로 이어진다.
- 구버전 active 보스의 throughput 목표와 새 패턴 단계·타이밍 원점·만료 복구를 각각 검증했다.

## Hands-on alpha result

- 상태 주입 없는 고강도 240초 플레이: 2,246탭, 42구역, 보스 13회 성공·0회 실패·14번째 진행 중, 작전 13회, 피버 5회, 오류 0.
- 연타·좌우·타이밍 세 패턴과 후반 조합이 실제 경제 성장·업그레이드·작전·피버 흐름 안에서 반복 등장해도 진행 막힘이나 입력 충돌이 없었다.

## Cross-review closure

- Claude Fable 5가 구버전 active 세이브와 전 패턴 키보드 증거 부족을 지적했다.
- 로컬 대조 결과 구버전 세이브는 저장된 목표를 유지하는 레거시 경로였고, 이를 명시적 회귀 테스트로 고정했다.
- 조합 단계의 포커스 자동 인계, 키보드 교대·타이밍 완료, NOW 라이브 안내를 구현·검증했다.

## Evidence

- Summary: `../evidence/2026-08-06/checkpoint-boss-pattern-summary.yaml`
- Unit: `npm test` — 13 files, 76/76 pass
- Build: `npm run build` — pass
- Browser: `scripts/_bosschecktest.mjs` — three patterns, composed boss, failure, skip, reload, responsive and accessibility pass
- Source detector: changed boss code introduced no new finding; four pre-existing side-tab findings remain outside scope
- URL detector: completed; global incumbent pixel UI findings remain, with no blocking boss interaction issue

## Remaining risk

- 보스 패턴의 성공률·반복 피로도는 실제 사용자 텔레메트리가 아직 없어 현재 목표 횟수는 알파 기준값이다.
- 타이밍은 100ms UI 갱신 주기와 280~408ms 성공 창을 사용하므로 매우 느린 장치에서 체감 난도가 달라질 수 있으나, 언제든 무페널티 기본 완료가 가능하다.

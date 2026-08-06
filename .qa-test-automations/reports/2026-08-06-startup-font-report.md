# QA Report — 첫 조작·폰트 전송 최적화

## Outcome

- Result: PASS
- Checks: 77/77 passed (68 unit, 2 integration/build, 6 deterministic E2E, 1 hands-on profile)
- Target: localhost only (`http://localhost:5178`), browser external requests blocked

## User-visible result

- 연속 입력 중 Firebase SDK 요청을 시작하지 않고 마지막 입력 약 750ms 뒤 browser idle에서 시작한다.
- 사용자가 가만히 있으면 기존과 같이 페이지 진입 약 5초에 시작하고, 랭킹은 대기 없이 즉시 클라우드를 연결한다.
- Galmuri9·14의 픽셀 격자와 family 이름은 유지하면서 정적 게임 글자 1,035개만 담았다.
- 정적 작은 글자·굵은 글자는 각각 Galmuri9·14를 사용하고, subset에 없는 임의 한글 닉네임은 full Galmuri11로 fallback한다.

## Measured improvement

| 항목 | 전 | 후 | 변화 |
|---|---:|---:|---:|
| 전체 폰트 전송 | 1,506,654B | 556,338B | -950,316B (-63.1%) |
| Galmuri9 | 429,336B | 20,112B | -95.3% |
| Galmuri14 | 565,420B | 24,328B | -95.7% |
| 연타 중 Firebase SDK 요청 | 첫 입력 약 197ms 뒤 시작 | 0건 | 입력 종료 뒤로 이동 |

- 첫 조작 4× CPU 측정의 큰 프레임은 Firebase 요청 전에도 발생해 Phaser 초기 부팅 비용으로 판단했다. 따라서 이번 결과는 그 프레임을 개선했다고 주장하지 않고, Firebase 네트워크·파싱 시작을 능동 입력 구간 밖으로 분리한 것으로 한정한다.
- subset 생성은 같은 소스에서 두 번 실행해 SHA-256이 동일했다.

## Font and UX evidence

- Chrome 실제 사용 폰트: 작은 정적 표본 `Galmuri9-Regular`, 굵은 정적 표본과 `101` 숫자 `Galmuri14-Regular`.
- 희귀 한글 `힣`은 `Galmuri11-Regular` 한 글자만 fallback했다.
- 모바일 스크린샷에서 9px 작은 문구, 14px 굵은 숫자 `101`, 임의 한글 닉네임이 잘림·번짐 없이 표시됐다.
- 상태 주입 없는 70초 실제 플레이: 257탭, 6구역, 강화 30회, 사건 2회, 작전 1회, 피버·피니셔·재정비 1사이클, 보스 1/1 성공, 오류 0.

## Regression

- 단위 테스트 13 files, 68/68 pass.
- production build pass.
- 오프라인 이월·감사, 보스, 작전·피버, UI 가독성, 모바일 DOM 성능, 첫 조작·폰트 E2E 모두 pass.
- 기존 DOM 성능 유지: 시설 25.0ms, 직원 25.1ms, 목표 17.1ms, 감사 16.8ms frame max.

## Evidence

- Summary: `../evidence/2026-08-06/startup-font-summary.yaml`
- Font screenshot: `../evidence/2026-08-06/screenshots/SC-MRT-006-font-subset-mobile.png`
- Startup/font E2E: `scripts/_startupfonttest.mjs`
- Subset generator: `scripts/_subsetfonts.mjs` via `npm run fonts:subset`
- Hands-on: `scripts/_operationfeverplay.mjs` with external requests blocked

## Remaining risk

- Galmuri11 full 505KB는 임의 한글 입력 지원 때문에 유지한다. 더 줄이려면 동적 한글 범위 분할 또는 사용자 입력 전용 폰트 정책을 별도 설계해야 한다.
- Phaser와 Firestore full SDK의 기존 500KB 청크 경고는 남아 있다. Phaser 초기 부팅 장기 작업은 이번 Firebase 우선순위 변경과 별개다.

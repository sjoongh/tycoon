# QA Report — 모바일 DOM·초기 로드 최적화

## Outcome

- Result: PASS
- Checks: 75/75 passed (68 unit, 1 production build, 5 deterministic E2E, 1 hands-on profile)
- Target: localhost only (`http://localhost:5178`), external requests blocked

## User-visible result

- 연타를 시작한 첫 변화는 즉시 표시되고, 이어지는 변화만 최대 100ms 창으로 합쳐진다.
- 60회 연속 변경에서 시설·직원·감사 탭 전체 교체는 60→11회, 304노드 목표 탭은 60→0회로 줄었다.
- 목표의 진행 수치만 바뀌면 ID별 막대·숫자만 수정하고, 완료·받기 버튼처럼 구조가 바뀌면 정확히 한 번 전체 갱신한다.
- 직원·목표 목록의 중간 스크롤이 값 갱신과 구조 갱신 모두에서 유지된다.
- 첫 700ms에는 Firebase SDK 요청이 없고, 첫 입력 또는 5초 뒤 기존 Firestore 클라우드 동기화가 시작된다.
- Analytics는 실제 이벤트 전에는 로드하지 않는다.

## Performance evidence

| 탭 | 전체 교체 전→후 | emit p95 | frame max |
|---|---:|---:|---:|
| 시설 | 60→11 | 0.5ms | 24.7ms |
| 직원 | 60→11 | 0.5ms | 25.1ms |
| 목표 | 60→0 | 0.5ms | 18.4ms |
| 감사 | 60→11 | 0.4ms | 16.7ms |

- 숨김 중 trailing 만료→복귀 플러시, 복귀 뒤 다음 burst, 강제 refresh 취소, destroy 취소를 별도 브라우저 경계 검사로 통과했다.
- 첫 성능 재실행에서 직원 탭 단일 프레임 41.6ms가 한 번 관찰됐으나, 즉시 재실행 16.8ms와 최종 전체 회귀 25.1ms로 재현되지 않았다. p95는 각각 25.0ms 이하였고 기능 오류는 없었다.

## Claude cross-review

- Claude Fable 5 계획 리뷰와 구현 리뷰를 각각 받았고 구현 리뷰 결과는 `ADVICE`였다.
- hidden pending 플래그 지적은 취소/복귀 코드와 새 경계 E2E로 안전성을 증명했다.
- 목표 목록은 배열 위치가 아닌 `goal-id`로 패치하며, 정의·보상 문구는 정적임을 원본에서 확인했다.
- HUD는 페이지 세션에서 한 번 생성되고 캐시 노드의 단일 작성자임을 확인했다.
- Firestore Lite의 오프라인 쓰기 의미 변경 지적은 중요하게 채택해 Lite 초안을 폐기하고 기존 full SDK를 유지했다.

## Regression and hands-on

- 13개 파일, 단위 테스트 68/68 통과.
- 오프라인 이월·감사, 체크포인트 보스, 작전·피버, UI 가독성 E2E 모두 통과.
- 상태 주입 없는 적응형 70초 플레이: 258탭, 7구역, 시설/직원 강화 34회, 사건 2회, 작전 선택 2회, 피버·피니셔·재정비 1사이클, 보스 2/2 성공, 오류 0.

## Evidence

- Summary: `../evidence/2026-08-06/mobile-runtime-summary.yaml`
- Unit: `npm test` — 13 files, 68/68 pass
- Build: `npm run build` — pass
- Performance: `scripts/_mobileperformancetest.mjs` — pass
- Existing regression: `_offlinecarrytest.mjs`, `_bosschecktest.mjs`, `_operationfevertest.mjs`, `_uireadabilitytest.mjs` — pass
- Hands-on screenshot: `../evidence/2026-08-05/screenshots/SC-OPF-004-hands-on-adaptive-70s.png`

## Remaining risk

- 픽셀 선명도 보존을 위해 Galmuri 크기별 폰트는 이번 승인 범위에서 변경하지 않았다. 전송량 1,506,654바이트는 다음 별도 폰트 전략 단계의 후보로 남는다.
- 기존 Firestore full SDK와 Phaser 생산 청크는 500kB 경고를 유지한다. Firestore는 초기 요청에서 분리했으며, Lite 전환은 저장 의미가 달라져 채택하지 않았다.

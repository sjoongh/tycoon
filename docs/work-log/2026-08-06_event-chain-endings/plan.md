# Plan — 사건 체인 결말

## 목표

3단계 사건 선택이 런 효과 결말과 영구 수집으로 이어지고 단위·E2E 검증을 통과한다

## 작업 범위

1. `eventChains` 데이터에 체인 3종, 각 3단계 선택, 경로별 결말과 런 효과를 정의한다.
2. `GameState`에 구 세이브 정규화, 체인 추첨/후속 보장, 결말 판정·즉시 보상·런 효과와 리셋을 구현한다.
3. 사건 탭에 체인 진행도·결말 도감·활성 효과를 표시하고, 모달 레이어에 결말 결과 카드를 연결한다.
4. 데이터/상태 단위 테스트와 로컬 Playwright 실플레이를 추가해 모바일·데스크톱·저장·자동 비서·리셋 회귀를 검증한다.
5. QA 추적성 문서와 증적, 구현노트의 실제 결과·이탈을 갱신한다.

## 검증 계획

- `npm test`
- `npm run build`
- `git diff --check`
- `QA_BASE_URL=http://localhost:5178 node scripts/_eventchainplaytest.mjs`
- 기존 사건/보스/작전/가독성 E2E 회귀

## 위험

- 45초 사건 주기에서 후속편을 놓치거나 잊기 쉬움 → 활성 체인의 다음 사건을 보장하고 상태를 사건 탭에 상시 표시.
- 런 효과 중첩이 기존 경제를 급격히 키울 수 있음 → 한 체인당 8~15% 범위의 가산 효과와 즉시 보상 상한 사용.
- 자동 비서가 선택 서사를 빼앗을 수 있음 → 기존 안전 선택 규칙은 유지하되 결말 카드는 사용자에게 전달하고 E2E로 확인.
- 중앙 모달·보스·작전 연출 충돌 → 기존 모달/배너 큐 규칙 안에서 결말 카드를 직렬화.

## 검증 증적

- QA 요약: `.qa-test-automations/evidence/2026-08-06/event-chain-endings-summary.yaml`
- QA 보고서: `.qa-test-automations/reports/2026-08-06-event-chain-endings-report.md`
- 구현 이력: `docs/impl-notes/2026-08-06-event-chain-endings.md`
- 결과: unit 89/89, 대상·회귀 E2E 8/8, build/diff PASS, 300초 자연 플레이 오류 0.

## 완료 상태

- dev-protocol 이탈 리뷰 2건과 사용자 이해 확인까지 완료했다.

# Plan — 작전 피버 전략형 재설계

## 목표

3구역 작전 선택과 계열별 피버·피니셔·결산이 저장 호환 및 모바일/데스크톱에서 검증됨

## 작업 범위

1. 기존 작전·피버·긴급 개표 상태와 저장 정규화, UI 소비 지점을 확인한다.
2. 작전 12종, 3구역 드래프트, 계열 우세와 추천 로직을 데이터/상태 계층에 구현한다.
3. 피버 준비→발동→피니셔→30초 회복과 세션 결산을 구현한다.
4. 작전 카드·HUD·현황 모달·월드 피드백을 기존 픽셀 컴포넌트로 연결한다.
5. 단위 테스트, 빌드, detector, 모바일/데스크톱 E2E, 직접 플레이를 수행한다.
6. 구현노트 이탈과 검증 결과를 갱신하고 사용자 인수 퀴즈를 진행한다.

## 검증 계획

- `npm test`: 작전 결정성·계열 보장·3구역 주기·구 세이브·피버 상태·피니셔·회복·감사 초기화.
- `npm run build`: Vite production build.
- `npx --yes impeccable@3.4.0 detect src`와 로컬 URL detector.
- Playwright 390×844 / 1280×900: 작전 선택, 추천·현황, 세 계열 피버, 피니셔, 결산, overflow·console·touch target.
- 3분 고강도 플레이: 팝업 빈도와 상시 피버 재발 여부를 비교한다.

## 위험

- 기존 세이브의 진행 중 드래프트와 활성 피버를 잃지 않아야 한다.
- 별도 러시 제거가 CPS 계산과 HUD 버튼 상태에 회귀를 만들 수 있다.
- 대응 계열 피버는 사건 쿨다운과 겹쳐 체감이 약해질 수 있어 즉시 체감 보상을 포함해야 한다.
- 결산 피드백은 다른 일일/오프라인/구역 모달을 가리거나 반복 플레이를 막지 않아야 한다.

## 완료 증적

- 구현노트: `docs/impl-notes/2026-08-05-operation-fever-strategy.md`
- QA 보고서: `.qa-test-automations/reports/2026-08-05-report.md`
- 단위 테스트: 10 files, 51/51 pass.
- production build: pass (기존 대형 청크 advisory 유지).
- 결정적 E2E: 모바일/desktop pass, 오류·overflow 0.
- 직접 플레이: 180초, GameState 값 주입 없음, 작전 9회/피버 4회/피니셔 4회/재정비 4회.
- 미검증: 24시간 재방문과 장기 감사 런. URL detector는 Firebase/Analytics 장기 연결로 timeout.

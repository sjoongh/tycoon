# Plan — 작전 카드와 개표 피버

## 목표

구역 돌파 3택1 작전과 10초 피버가 저장·감사·모바일 플레이에서 정상 동작한다

## 작업 범위

1. 작전 카드 데이터와 결정적 3장 선택 규칙을 만든다.
2. GameState 저장 정규화·선택·효과·열기·10초 피버·감사 초기화를 구현한다.
3. 구역 완료 작전 모달과 HUD 피버 게이지를 기존 컴포넌트·토큰으로 구현한다.
4. 단위 테스트와 localhost Playwright E2E로 선택→충전→피버→저장/감사를 검증한다.
5. 모바일/desktop 캡처, build, detector 결과와 남은 위험을 기록한다.

## 검증 계획

- `npm test`: 기존 회귀 + 작전/피버 단위 테스트.
- `npm run build`: Vite production build.
- `node scripts/_operationfevertest.mjs`: localhost 전용 모바일/desktop E2E와 스크린샷.
- `npx --yes impeccable@3.4.0 detect src` 및 `detect http://localhost:5178/`.
- 모바일 390×844, desktop 1280×900에서 overflow·console·focus-visible·reduced-motion 확인.

## 위험

- 피버가 러시·브리핑과 곱연산되어 경제가 폭주할 수 있다. 실시간 10초 한정, 오프라인 제외로 제한한다.
- 구역마다 모달이 반복되어 피로할 수 있다. 구역 완료 직후 1회, 선택 즉시 닫힘, 재로드 시 미선택 드래프트 복구로 제한한다.
- 구 세이브와 프레스티지 리셋에서 작전 데이터가 손상될 수 있다. 정규화·초기화 테스트를 추가한다.

## 실행 결과

- 작전 6종, 매 구역 3계열 3택1 드래프트, 런 누적 효과와 감사 초기화를 구현했다.
- 사용자 행동으로 열기를 채우고 100에서 10초 동안 실시간 생산·클릭이 ×2가 되는 피버를 구현했다.
- 2026-08-04 기준 Vitest 45/45, production build, 모바일·desktop E2E를 통과했다.
- source detector의 이번 변경 신규 위반은 0이다. rendered detector는 외부 장기 연결로 timeout되어 미검증 위험으로 남겼다.

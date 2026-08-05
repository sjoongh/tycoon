# Plan — UI 가독성 및 연출 우선순위 정리

## 목표

모바일·데스크톱에서 중앙 연출 중첩을 제거하고 핵심 텍스트를 읽을 수 있게 하며 기존 게임 동작을 보존한다

## 작업 범위

1. 중앙 배너·축하 이벤트 호출 경로를 추적하고 하나의 큐로 직렬화한다.
2. HUD·작전·피버·하단 패널의 텍스트 위계를 모바일 기준으로 정돈한다.
3. 진행바의 width 애니메이션을 scaleX transform으로 바꾼다.
4. 회귀 테스트, production build, detector, 모바일/desktop E2E와 90초 실플레이를 실행한다.
5. 전후 스크린샷을 비교하고 신규 오류를 한 번의 수정 배치로 정리한다.

## 검증 계획

- `npm test`
- `npm run build`
- `npx --yes impeccable@3.4.0 detect src`
- `QA_BASE_URL=http://localhost:5178 node scripts/_operationfevertest.mjs`
- `QA_BASE_URL=http://localhost:5178 node scripts/_uireadabilitytest.mjs`
- `QA_BASE_URL=http://localhost:5178 PLAY_DURATION_MS=90000 OPERATION_FAMILY=adaptive node scripts/_operationfeverplay.mjs`
- 모바일·desktop Playwright 스크린샷과 90초 신규 세이브 직접 플레이

## 위험

- 중앙 연출을 단순 지연시키면 피버·피니셔처럼 즉시성이 필요한 피드백이 늦어질 수 있다.
- 타입 상향이 390px 세로 화면의 모달·하단 시트를 과도하게 키울 수 있다.
- 공통 CSS 변경이 사건·목표·감사 탭까지 영향을 줄 수 있어 전 탭 회귀가 필요하다.

## 결과

- 구현과 자동 검증은 완료했다.
- 첫 렌더 리뷰에서 결산 뒤 배너 테두리 잔상과 시스템 float 중복을 발견해 보수적으로 제거했다.
- 사용자 이탈 리뷰·퀴즈 뒤 커밋/PR 단계로 진행한다.

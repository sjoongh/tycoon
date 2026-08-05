# Context — UI 가독성 및 연출 우선순위 정리

## 요청

- 작업: UI 가독성 및 연출 우선순위 정리
- 완료 조건: 모바일·데스크톱에서 중앙 연출 중첩을 제거하고 핵심 텍스트를 읽을 수 있게 하며 기존 게임 동작을 보존한다

## 시작 좌표

- 시작 시각: 2026-08-05T22:49:21+09:00
- 브랜치: `refactor/readability-visual-priority`
- 기준 커밋: `49e5611660e0b38f9c7dbfe14642033f7fe0393e`
- 시작 시 워킹트리 변경: 있음

## 근거와 입력

- 사용자 요청: 남은 작업을 순서대로 진행하고 스킬·리뷰·실플레이 검증을 적극 활용한다.
- 기준선 90초 신규 세이브 플레이: 16구역, 작전 5회, 피버·피니셔 각 2회, 오류 0건.
- 기준선 렌더: 중앙의 구역 진입·업적·작전 채택·득표 숫자·초당표가 동시에 경쟁하고 8~10px 보조문구가 다수다.
- 기준선 E2E: 모바일/desktop overflow 없음, focus-visible·reduced-motion 통과.
- source detector 8건: 기존 픽셀 액센트 5건, layout width transition 3건.

## 제약

- 기존 Galmuri 서체, 픽셀 프레임, 다크 네이비·골드 계층과 게임 동작을 보존한다.
- 작전·피버 수치, 경제, 저장 형식, 보스 사건은 이번 단계에서 변경하지 않는다.
- 사용자 소유 `.omc/project-memory.json`, `.omc/artifacts/`와 기존 `.impeccable/` snapshot을 덮어쓰지 않는다.
- `.claude/references/architecture.md`, `frontend-guide.md`가 없어 현재 Vite/Phaser/DOM 구현과 테스트를 정본으로 삼는다.

## 결정

- 중앙에는 가장 중요한 메시지 하나만 보이도록 연출을 직렬화한다.
- 본문 11~12px, 핵심 수치 12~14px 기준으로 관련 UI만 상향한다.
- 진행바의 layout width transition은 transform 기반으로 교체한다.
- detector가 지적한 픽셀 side accent는 세계관 정본이므로 유지한다.

## 남은 질문

- 없음. 계획 이탈은 사용자가 `A`로 그대로 승인했고 완료 퀴즈는 2/2 정답이다.

## 구현 후 증거

- 중앙 알림은 위기·구역·보상·마일스톤 우선순위 단일 큐로 통합했다.
- 모달·피버 결산과 중앙 알림의 동시 노출은 0, 중앙 알림 최대 동시 개수는 1이다.
- 390×844 및 360×740에서 overflow가 없고 설정 조작은 44×44px다.
- 최종 source detector는 width transition 3건을 제거했고 의도된 픽셀 side accent 4건만 남았다.
- 90초 신규 세이브 실제 플레이는 16구역·작전 5·피버/피니셔/재정비 2회씩·오류 0으로 통과했다.

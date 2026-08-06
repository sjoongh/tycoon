# Mobile Runtime E2E Flows

## Flow-MRT-1 — 초기 로드와 연속 렌더

1. localhost 신규 세이브를 390×844로 열고 외부 호스트 요청을 모두 차단한다.
2. 첫 700ms 리소스에서 Firebase SDK가 없는지 확인한다.
3. 시설·직원·목표·감사 탭에 각각 60회 상태 변경을 발생시킨다.
4. 패널 교체 수, 추가/제거 노드, emit p95, frame max, 스크롤 위치를 기록한다.
5. 유휴 뒤 첫 이벤트가 즉시 반영되는지 확인한다.
6. 목표 값 변경은 부분 갱신되고 구조 변경은 한 번만 전체 갱신되는지 확인한다.
7. 숨김 만료→복귀, 강제 refresh, destroy 취소 뒤 후속 렌더 횟수를 검사한다.

## Flow-MRT-2 — 기존 사용자 여정 회귀

1. 오프라인 이월·감사 판단 E2E를 실행한다.
2. 보스 성공·실패·건너뛰기 E2E를 실행한다.
3. 작전 선택·피버·피니셔·재정비 E2E를 실행한다.
4. 중앙 메시지·모바일 가독성·감속 E2E를 실행한다.
5. 상태 주입 없는 70초 플레이에서 시설·직원·사건·작전·피버·보스를 실제 화면 조작으로 진행한다.

## Flow-MRT-3 — 첫 조작 우선순위와 폰트 fallback

1. 외부 요청을 차단한 localhost 신규 세이브를 390×844로 연다.
2. pointer 입력을 250ms 간격으로 계속 보내 Firebase SDK가 입력 중 시작하지 않는지 확인한다.
3. 입력을 멈추고 약 750ms idle 뒤 SDK가 시작하는지 기록한다.
4. 별도 무입력 페이지의 5초 상한과 별도 랭킹 진입 페이지의 즉시 시작을 확인한다.
5. Galmuri9·14 정적 표본과 숫자 `101`, 서브셋에 없는 `힣`을 렌더한다.
6. Chrome 실제 사용 폰트 통계에서 정적 글자는 크기별 subset, 희귀 글자는 Galmuri11 fallback인지 확인한다.
7. 전체 폰트 요청·전송량과 모바일 스크린샷을 저장한다.

## Flow-MRT-4 — Phaser custom core 기능·rollback·startup 비교

1. custom dev 서버를 외부 요청 차단 localhost에서 열고 WebGL GameScene과 DOM HUD를 기다린다.
2. Graphics·Text·Rectangle·Image·Circle·Sprite·Zone factory와 input·loader·scale·time·tween을 검사하고 canvas를 실제 탭한다.
3. 별도 페이지에서 WebGL API를 비활성화해 Canvas renderer를 강제하고 같은 API·탭과 다색상 프레임을 확인한다.
4. custom bundle을 두 번 생성해 SHA·버전·renderer flag·MIT 배너·크기 ceiling과 현재 소스의 factory·Math·제외 API 사용을 검사한다.
5. custom cache를 고의로 망가뜨린 뒤 `GAEPYO_STOCK_PHASER=1`로 준비·alias를 우회하는 rollback production build를 만들고, stock dev의 WebGL·강제 Canvas 부팅과 탭도 확인한다.
6. 각 빌드를 4× CPU + SwiftShader 신규 브라우저에서 3번 로드해 Phaser 전송량·총/최대 long task·HUD/world-ready 중앙값을 비교한다.
7. 기존 E2E 전체와 상태 주입 없는 180초 직접 플레이로 동적 경로를 회귀 검증한다.

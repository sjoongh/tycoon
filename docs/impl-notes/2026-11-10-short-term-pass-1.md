# 2026-11-10 — 레퍼런스 로드맵 단기 패스 1 (계측·첫 60초·복귀 모달·경제 모델)

근거: `docs/research/reports/모바일 타이쿤 레퍼런스 고도화 방향.md` 단기 1~4.

## 1. 계측 (`GameState.firsts`, `main.js`)
- 세이브에 `firsts { playAt, staffAt, prestigeAt, tutorialDoneAt }` 추가(영구). 첫 로드 시 `playAt` 기록.
- 첫 채용·첫 감사·온보딩 완료 시 `markFirst()` → `first` 이벤트 → Firebase Analytics `first_staff / first_prestige / first_tutorial_done {sec}`.
- `session_end {sec, area}`(탭 숨김 시), `offline_reward {min, area}`(복귀 모달 노출 시). 기존 `area_up` 등과 함께 첫 세션·복귀 페이싱을 측정한다.

## 2. 첫 60초 (`GameState.tabLocked`, `DOMBottomPanel`)
- 점진 공개: 사건 탭은 첫 직원 채용 전, 감사 탭은 첫 구역 돌파 전 잠금(회색). 누르면 안내 플로팅("직원을 먼저 채용하면 사건 대응이 열립니다"). 온보딩 완료·감사 경험 세이브는 항상 열림.
- 탭 점등(AdVenture Capitalist Managers 탭): 선택 시설 업그레이드 가능 → 시설 탭, 채용 가능한 직원 있음 → 직원 탭에 초록 링 펄스(보고 있는 탭 제외).
- 자동화 도구 호환: `aria-disabled` 대신 `data-locked`(Playwright 클릭 가능). `qa-playwright` 시드는 clerk Lv.3이라 사건 탭 열림.

## 3. 복귀 모달 3단 (`DOMModalLayer._awayHeadlines`)
- 기존: 오프라인 수입 → 하루 1회 2배. 추가: "자리 비운 사이" 외신 헤드라인 3줄(믿음 상태 톤) + 대기 중 사건 1건 안내.
- 오프라인 벌칙 점검: `applyOfflineProgress`는 믿음·적체를 건드리지 않음을 확인(이미 벌칙 없음). 변경 없음.

## 4. 경제 모델 확정: 이사형
- 결정: 비용 계수 ×1.48(짧은 사다리) 유지 + 마일스톤 `[25,50,100]` → `[10,20,30,40,50]`(maxLevel 안에서만). 모든 시설이 2~5개 ×2를 밟고 5티어 진화와 리듬이 맞는다.
- 밸런스 시뮬(`npm run test:balance`, 3탭/초): 첫 감사 644s → 611s(목표 480~720), 반복 423/402 → 405/373(목표 300~480), 11구역 1398s → 1170s. 목표 범위 안이라 구역 목표(`FIRST_RUN_STAGE_BASE`) 재보정 없음.
- 마일스톤 배너 상수 동기화(10/20/30/40/50). 테스트: 마일스톤 배율·용량 테스트 픽스처 갱신.

## 검증
- `npm test` 178/178, `npm run build` OK, `scripts/_a11ytest.mjs` errors 0.
- Playwright: 새 유저 탭 잠금·직원 탭 점등 캡처, 3시간 부재 복귀 모달(헤드라인 3줄+사건 안내) 캡처.

## 다음
- 단기 5~8: 피드백 위계·오탭 점검, 주간 랭킹 리셋+뱃지, 풍자 고지문 점검, 지역 현판·승격 카드.

# 2026-11-10 개선 로드맵 UX 패스 (#14·#15·#17·#18·#9 잔여) + 1.2.0 Play 내부 테스트 업로드

## 목표 / 확정 사항
- 사용자 지시: 1.2.0 Play 업로드를 직접 수행하고, 개선 로드맵 미착수 항목에 착수한다.
- 이번 패스 범위는 기획·밸런스 결정이 필요 없는 항목으로 한정했다: #14 온보딩 상태머신, #15 접근성(터치 44px·글자 바닥·큰 글씨·움직임 줄이기), #17 시설별 마일스톤 상한, #18 월드 이펙트 풀링, #9 잔여(SW 캐시 버전 파일).
- 경제·세이브 형식·밸런스 수치는 바꾸지 않는다. 마일스톤 변경은 "도달 불가능했던 값 제거"뿐이라 기존 배율과 동일하다.

## Play 업로드 (1.2.0 / versionCode 6)
- 1.1.2 선례와 같이 **내부 테스트 트랙**에만 올렸다. 프로덕션은 `3 (1.1.0)` 그대로이며 승격은 실기기 확인 후 별도 승인으로 진행한다.
- 서비스 계정 키는 `~/.config/gaepyo/`(600)에서만 읽고 본문을 출력하지 않았다. Node 내장 crypto로 RS256 JWT를 서명해 OAuth 토큰을 받았다(Python 라이브러리 없음).
- 절차·결과 로그는 `docs/impl-notes/2026-10-27-release-1.2.0.md`에 기록했다. 업로드 전 `versionCode 6` 미사용 확인, 업로드 후 SHA-256 `6c5a3d3a…68343` 일치, 커밋 후 새 edit로 트랙 재조회·삭제.

## 구현 결과
- **#14 온보딩**: `GameState.tutorialProgress()`(클릭·업그레이드·채용·사건·첫 구역 돌파를 누적 통계에서 파생), `tutorialNextStep()`, `advanceTutorial()`은 순서와 무관하게 단계를 재계산한다. 기존 코드는 채용을 업그레이드보다 먼저 하면 `done`이 영영 true가 되지 않아 완료 보상(+30 해명)이 지급되지 않았다. 통계상 이미 끝낸 예전 세이브는 다음 동기화 때 1회만 보상받고 완료된다. 코치 힌트(`DOMModalLayer._maybeHint`)는 같은 함수를 쓰며 마지막 단계 "구역 목표를 채우면 다음 구역으로 진출합니다"를 추가했다.
- **#15 접근성**: `.gp-tab`·`.gp-qtybtn`·`.gp-btn--sm` min-height 44px, 375px 이하에서 36px로 줄던 설정 버튼을 44px로 유지, 8~9px 글자(배치 슬롯·직급 배지·배치 버튼) 10px 바닥, 설정 행 12px, 캔버스 속보·외신 배너 9/10px → 11/12px. 설정 > 보기에 **큰 글씨**·**움직임 줄이기** 토글(`src/ui/a11y.js`, localStorage `gp-a11y-v1`, `<html>` 클래스 `gp-bigtext`/`gp-reduce-motion`). 움직임 줄이기는 OS 설정과 합쳐 월드 장식 효과(비행 표·반짝임)도 생략한다.
- **#17 마일스톤**: `facilityMilestones(facility)`가 데이터의 `milestones`를 우선하고 없으면 기본 [25,50,100]을 `maxLevel`로 거른다. `nextFacilityMilestone`은 어떤 시설·레벨에서도 `maxLevel`을 넘는 값을 돌려주지 않는다(브리핑실 Lv.35 카드에 "Lv.50 달성 시" 영구 표시되던 문제 해소).
- **#18 풀링**: 비행 표(상한 8)와 반짝임 점(상한 12)을 풀에서 재사용한다. 백그라운드 트윈·타이머 정지는 Phaser `Game.onHidden → loop.pause`가 이미 담당하므로 추가하지 않았다.
- **#9 잔여**: `vite.config.js` PWA 버전 해시 파일에 Jua/DoHyeon/`art/icons96.png`를 추가해 폰트·아이콘 변경 시 SW 캐시가 갱신되게 했다. `index.html` 설명·설정 크레딧 문구의 "8비트/Galmuri" 잔재를 현행화했다.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)
- ⚠️ 로드맵 #14의 "건너뛰기 시 done=true"는 적용하지 않았다. 오프닝 3카드 건너뛰기와 행동 코치는 다른 것이고, 코치는 통계로 스스로 사라지므로 건너뛰기로 완료 처리하면 신규 유저가 안내를 잃는다. 건너뛰기는 기존대로 `openingSeen`만 기록한다.
- ⚠️ `scripts/_staffdeploymenttest.mjs`가 수정 전 main에서도 실패했다(1.2.0 채용 선행 조건·텍스트 배지·세이브 v10 미반영). 시설 레벨 시드, 배지 텍스트 단언, 버전 `>= 10`으로 스크립트를 현행화했다.
- ⚠️ `scripts/_mobileperformancetest.mjs`는 수정 전 main에서도 같은 구간(시설 433ms·직원 625ms)에서 33ms 게이트를 넘는다(stash로 기준선 측정). 이번 변경과 무관한 기존 상태라 이번 PR에서 다루지 않고 후속 과제로 남긴다.

## 검증 결과
- 단위: 27파일 170/170 PASS(신규 `GameState.roadmapUx.test.js` 7건 포함, TDD로 실패 확인 후 구현).
- 빌드: Vite production build PASS. 커스텀 Phaser API 감사(`test:phaser-core`) PASS.
- E2E(localhost 5178/4178): UI 가독성·44px·reduced-motion(`_uireadabilitytest`) PASS, 온보딩 코치(`_coachtest`) PASS(새 'stage' 힌트 노출 확인), 직원 배치(`_staffdeploymenttest`, 현행화 후) PASS, PWA 갱신·오프라인 재기동(`test:pwa`) PASS, 접근성 토글(`test:a11y` 신규: 클래스 적용·글자 확대·44px·새로고침 유지·비행 표 생략·콘솔 오류 0) PASS.
- 모바일 성능 게이트: FAIL(기존 상태, 위 DEVIATION 참고).

## 다음에 참고
- Play 프로덕션 승격: 실기기 터치감·WebView 폰트 렌더 확인 후 `tracks/production`에 versionCode 6을 `completed`로 올리면 된다(같은 스크립트 구조, 트랙명만 변경).
- 로드맵 잔여 #6·#7·#8·#16은 밸런스 시뮬(`test:balance`)과 함께 기획 결정이 필요하고, #11은 주간 목표·업적이 `stats` 리셋에 의존하므로 마이그레이션 방향을 먼저 정해야 한다.

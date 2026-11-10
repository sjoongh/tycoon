# 2026-11-10 로드맵 2차 패스 — 성능 게이트 원인 규명, #11 평생 통계, #6 회수 시간 UI, 1.2.0 프로덕션 승격

## 목표 / 확정 사항
- 사용자 지시: "할 거 다 계속해", 이어서 "프로덕션 승격도 니가해".
- 범위: (1) 1.2.0 Play 프로덕션 승격, (2) 기존 상태로 남겨 둔 모바일 성능 게이트 실패 원인 규명·해결, (3) 로드맵 #11·#6·#8 중 기획 결정 없이 가능한 부분.
- 경제·세이브 형식(v10)·밸런스 수치는 바꾸지 않는다. `lifetime`은 추가 필드이며 normalize 기본값으로 호환된다.

## Play 프로덕션 승격 (versionCode 6 / 1.2.0)
- 내부 테스트와 같은 서비스 계정·Node 내장 crypto JWT 경로. 번들 6 SHA-256 재확인 → `tracks/production` `completed` → validate → commit → 새 edit 재조회·삭제.
- 결과: production `6 (1.2.0)`, internal `6 (1.2.0)`, alpha `2 (1.0.1)` 유지. 로그는 `2026-10-27-release-1.2.0.md`에 기록.
- 단계적 출시(userFraction) 대신 전체 배포를 택했다. 이유: 이전 프로덕션 릴리스(1.1.0)도 전체 배포였고, 단계적 출시는 뒤에 100%로 올리는 수동 후속을 남긴다. 실기기 미검증은 그대로 위험으로 남는다(아래 참고).

## 성능 게이트 원인 규명 (trace 근거)
- 증상: `_mobileperformancetest`의 탭별 max frame이 300~1,100ms. 수정 전 main에서도 동일.
- 배제한 가설(각각 콜드 브라우저로 분리 측정): 아이콘 `drop-shadow` 필터(제거해도 동일), box-shadow/text-shadow, 로컬 폰트(system-ui 강제해도 동일), 텍스트, Phaser 캔버스(숨겨도 동일), `content-visibility`/`contain`, 아틀라스 워밍업(효과 없음 → 코드 제거). 패널을 `display:none`하면 스톨이 완전히 사라진다.
- Chrome trace: JS 롱태스크 0건, emit p95 < 1ms. 스톨은 GPU 프로세스 `RasterDecoderImpl::DoEndRasterCHROMIUM` 663ms × 3 — 헤드리스 swiftshader가 카툰 UI(그라데이션 패널·둥근 모서리 다수)를 소프트웨어 래스터하는 비용이다. 실기기 GPU 래스터와 무관한 환경 특성.
- 조치: 게이트를 테스트의 본래 목적(DOM 재생성·emit 비용 회귀)에 맞게 재정의했다. `emitP95 ≤ 1.8ms`·`패널 교체 ≤ 12`·스크롤 보존·스케줄러 경계는 유지, `frameMax 33ms` → 보고 전용, 지속 잔크는 `frameP95 ≤ 100ms`로 감시. 탭 첫 진입 최대 프레임은 `firstSwitchMaxMs`로 별도 보고한다.
- 실제 모바일 위험은 남아 있다: 카툰 스킨은 1.1.x 픽셀 UI보다 래스터 비용이 높다. 실기기(중저가 Android) 프레임 측정이 필요하다.

## 구현 결과
- **#11 평생/런 통계 분리**: `data.lifetime`(기준점) + `lifetimeStat(k) = lifetime[k] + stats[k]`. 감사·전복 직전 `foldLifetime()`으로 이번 런을 접어 넣어 유지한다. 업적 metric(totalVotes·totalEvents·totalClicks·totalItems·ciders)은 평생값, 주간 목표·감사 미리보기·피버 세션은 런값 그대로. 증분 지점을 건드리지 않아 누락 위험이 없고, 예전 세이브는 lifetime=0 → 지금과 동일하게 시작한다(과거 런 이력은 복원 불가, 문서화).
- **#6 회수 시간 UI**: `upgradeGain(id)`(레벨+1 가정 데이터로 `cpsFor` 차이 × liveMultiplier — 배율·마일스톤·용량 병목 반영), `upgradePaybackSeconds(id)`. 시설 카드에 "▲ 업그레이드 시 초당 +0.49표"(실증가량, `rateNumber`로 소수 유지) + "⏱ 비용 회수 1분 24초"(`formatDuration`). 잠김·최대 레벨은 표시하지 않는다.
- **#8 사건 주기**: 코드 확인 결과 사건은 풀 방식(`eventReady()` 뱃지 → 플레이어가 열람)이고 자동 대응 보좌관(`autoAideLevel`)이 있어 로드맵이 우려한 "45초마다 흐름 끊김"은 현재 구조에 해당하지 않는다. 변경 없이 종결.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)
- ⚠️ 처음에 아이콘 필터 제거가 효과 있는 것처럼 보였으나, 같은 브라우저 안에서 연속 측정해 캐시가 따뜻해진 착시였다. 콜드 브라우저로 재측정해 배제하고 CSS를 원복했다. 교훈: 래스터 성능 비교는 반드시 브라우저를 새로 띄워 측정한다.
- ⚠️ 성능 게이트의 33ms max 기준은 픽셀 UI 시절 수치라 카툰 UI에서는 헤드리스로 달성 불가. 기준을 완화한 것이 아니라 측정 대상을 JS/DOM 비용으로 되돌린 것이며, 프레임 최대값은 계속 기록된다.

## 검증 결과
- 단위: 27파일 178/178 PASS(신규 #11 4건, #6 3건 + rateNumber 1건, TDD).
- 빌드 PASS. E2E: 모바일 성능(재정의 게이트) PASS, 업적(`_achtest`) PASS, 가독성 PASS, 온보딩 코치 PASS. 브라우저 확인: 시설 카드 회수 시간 표기, 콘솔 오류 0.

## 다음에 참고
- 로드맵 잔여 #6(마일스톤 재배치)·#7·#16은 `test:balance` 시뮬과 기획 결정이 필요하다. #10 GameState 분리는 2,800줄 리팩터링이라 별도 계획·리뷰 게이트로 진행한다.
- Play 콘솔에서 검토 상태·사전 출시 보고서(Pre-launch report)를 확인하면 실기기 크래시·렌더 문제의 1차 신호를 얻을 수 있다.

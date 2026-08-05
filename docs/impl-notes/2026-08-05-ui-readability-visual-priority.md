# 2026-08-05 UI 가독성·연출 우선순위 정리

## 목표 / 확정 사항
- 기존 픽셀 개표국 세계관과 게임 동작을 보존한다.
- 중앙에서 동시에 경쟁하는 구역·업적·작전·피버 메시지를 한 번에 하나씩 읽히게 한다.
- 작은 보조문구와 핵심 수치의 위계를 모바일 기준으로 정돈한다.
- layout을 흔드는 진행바 width transition을 transform 기반으로 바꾼다.

## Gate evidence
- 질문: 기존 픽셀 세계관을 유지하면서 중앙 메시지 단일화, 본문 11~12px·핵심 수치 12~14px, HUD 중복 정리, transform 진행바를 적용하고 경제·보스 사건은 제외하는 추천안을 제시했다.
- 사용자 답: `ㄱㄱ 시작해`
- 승인된 범위: 가독성·연출 우선순위 UI refactor, 관련 테스트·실플레이·QA 문서와 프로젝트 로컬 디자인 스킬 설치.
- 미승인 가정: 작전/피버 배율, 경제, 저장 형식, 보스 사건, 전역 브랜드 교체는 구현하지 않는다.

### Design gate evidence

#### Mode and lock
- Mode: `refactor` — 기존 visual world를 교체하지 않는 좁은 polish.
- Application source writes: `unlocked`

#### Product interview
- [x] 실제 사용자 승인 수신.
- 핵심 사용자 과업: 모바일에서 탭·증설·사건 대응을 이어가면서 중요한 성취와 현재 피버 상태를 즉시 이해한다.
- 실패 기준: 게임 수치가 달라지거나, 픽셀 정체성이 사라지거나, 메시지를 줄였는데 중요한 피드백이 늦어지는 것.

#### Design-direction interview
- [x] 기존 Galmuri·픽셀 프레임·다크 네이비/골드·모바일 우선 밀도를 보존하고 정보 경쟁만 정리하는 방향 승인.
- 사용자 답: `ㄱㄱ 시작해`

#### Visual-world decision
- [x] 비대상: 새 visual world나 rebrand가 아니라 incumbent world를 보존하는 polish다.

#### High-fidelity comps
- [x] 비대상: 대표 화면 교체 없이 현재 렌더의 정보 위계와 모션만 좁게 수정한다.

#### Implementation unlock
- [x] 필요한 refactor gate 완료.
- Implementation unlocked: `yes`

## 계획
1. 중앙 배너 경로를 큐·우선순위 구조로 정리한다.
2. 관련 DOM/CSS 텍스트 위계와 진행바 렌더링을 개선한다.
3. 전체 테스트·빌드·detector·모바일/desktop E2E·신규 세이브 실플레이를 실행한다.
4. 전후 화면을 비교해 한 번의 결함 수정 배치 후 재확인한다.

## 판단 근거
- 90초 신규 세이브에서 기능 오류는 없었지만 구역 진입·업적·작전 채택·큰 득표 숫자가 동일한 중앙 영역에서 중첩됐다.
- 작은 보조문구는 정보가 없는 것이 아니라 읽을 수 없는 상태라, 삭제보다 역할별 타입 스케일 정리가 우선이다.
- detector의 side accent는 픽셀 프레임 세계관의 의도된 입체 표현이므로 유지한다.
- 위기(4) → 구역(3) → 보상·업적(2) → 시설 마일스톤(1) 순으로 같은 틱의 중앙 알림을 정렬한다.
- 구역·작전·업적·목표는 이미 중앙 큐가 설명하므로 같은 내용을 반복하던 Phaser float만 제거하고 자원 수치 피드백은 유지한다.

## 구현 결과
- `DOMModalLayer`: 배너와 토스트를 단일 우선순위 큐로 합치고 중복 제거·폭주 상한·ARIA live·timer cleanup을 추가했다.
- 모달과 피버 결산이 열리면 중앙 알림을 중단하고, 닫힌 뒤 중요 알림을 다시 이어서 보여준다.
- 중앙 알림이 보이는 동안 캔버스의 장식 간판과 지도 hit-area를 잠시 숨기고 큐가 끝나면 복원한다.
- `DOMHud`: 중복 CPS를 제거하고 피버 제목/설명을 분리했으며 구역·체제 진행을 transform으로 바꿨다.
- `DOMBottomPanel`: 목표와 사건 쿨다운 진행을 transform으로 바꿨다.
- 관련 UI는 라벨 10px·본문 11px·핵심 값 12px 기준으로 상향하고 설정·닫기·꾸미기 조작은 44px로 맞췄다.
- 탭 보상 float는 중앙 수치 양옆 네 레인으로 분산하고 콤보는 큰 득표 수치와 간격을 벌렸다.
- QA 도메인 `coverage/ui-readability/`와 localhost 전용 E2E를 추가했다.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)
- ⚠️ 최초 계획은 WorldView 자체의 배너 경로를 정리하는 것이었으나, 소스 추적 결과 실제 겹침은 `DOMModalLayer`의 독립 배너·토스트 큐와 GameState의 중복 float에서 발생했다. → 택한 보수적 대안: 게임 상태·경제는 유지하고 DOM 큐 통합과 중복 시각 emit 제거만 적용 → 리뷰: [x] 2026-08-05 사용자 `A`로 그대로 승인

## 다음에 참고 (unknown 대응 이력)
- 중앙 연출은 DOM과 Phaser 양쪽에서 나올 수 있다. 새 성취를 추가할 때 `celebrate`와 동일 문구의 `float`를 동시에 내보내지 않는다.
- `gp-modal-ov`와 비차단 `gp-fever-recap`은 중앙 알림을 일시 중단해야 테두리 잔상이 남지 않는다.
- source detector의 최종 4건은 목표·직원·사건·랭킹의 incumbent pixel side accent로 분류했다.

## 검증 결과
- `npm test`: 10 files, 51/51 PASS
- `npm run build`: PASS (기존 Phaser/Firebase 500kB 경고 유지)
- `npx --yes impeccable@3.4.0 detect src`: width transition 3건 제거, 의도된 side accent 4건만 잔존
- `_operationfevertest.mjs`: 작전·피버 전체 사이클, 모바일·desktop, focus·reduced-motion PASS
- `_uireadabilitytest.mjs`: 중앙 동시 노출 최대 1, 모달 충돌 0, 360/390px overflow 0, 44px 표적, transform 진행률 PASS
- 상태 주입 없는 90초 플레이: 16구역, 734탭, 작전 5, 피버·피니셔·재정비 각 2, 오류 0

## Reference review
- 기존 Galmuri, 네이비·골드 팔레트, 각진 픽셀 프레임, steps 모션을 보존했다.
- Impeccable의 width-transition 지적은 반영했고, 기존 게임의 의도된 side accent 지적은 세계관 정본으로 유지했다.
- generic redesign 권고 중 새 서체·부드러운 transition·전면 브랜드 교체는 승인 범위와 충돌해 채택하지 않았다.

## 완료 퀴즈
- 중앙 알림 우선순위: 사용자 답 `A` — 정답(위기 → 구역 → 보상)
- 영향 범위: 사용자 답 `A` — 정답(UI만 변경, 경제·피버 수치·저장 유지)
- 결과: 2/2 정답

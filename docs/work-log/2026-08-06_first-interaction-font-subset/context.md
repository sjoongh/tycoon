# Context — 첫 조작·폰트 전송 최적화

## 요청

- 작업: 첫 조작·폰트 전송 최적화
- 완료 조건: 첫 조작 프레임 경쟁을 줄이고 픽셀 선명도와 임의 한글 입력을 보존하면서 초기 폰트 전송량을 절감한다

## 시작 좌표

- 시작 시각: 2026-08-06T13:37:58+09:00
- 브랜치: `perf/first-interaction-font-subset`
- 기준 커밋: `59d3ff3a733422955a66bc9a82dafacc34fe5c26`
- 시작 시 워킹트리 변경: 있음

## 근거와 입력

- 사용자 선택: `a로가자` — 클라우드 idle 예약 + Galmuri9·14 정적 글자 서브셋.
- 직전 성능 단계: 첫 700ms Firebase SDK 0건, 첫 입력 뒤 Firebase 개발 전송 1,406,834바이트.
- 현재 폰트: Galmuri9 419KB, Galmuri11 493KB, Galmuri14 552KB, Press Start 2P 4.6KB; 브라우저 실전송 합계 1,506,654바이트.
- 폰트 이력: Galmuri14는 13px에서 숫자 `1`이 사라진 과거 버그가 있어 크기별 픽셀 격자를 유지해야 한다.
- 로컬 도구: HarfBuzz `hb-subset 14.2.1` 사용 가능.

## 제약

- Galmuri11 full은 임의 한글 닉네임·입력 fallback으로 유지한다.
- Firestore full SDK와 기존 클라우드 저장 의미를 유지한다.
- 첫 입력은 idle 예약, 5초는 절대 시작 상한, 랭킹은 즉시 시작한다.
- Phaser와 게임 경제·작전·피버·보스·오프라인 규칙은 변경하지 않는다.
- 사용자 소유 `.omc/project-memory.json`, `.impeccable/`, `.omc/artifacts/`는 변경·스테이징하지 않는다.

## 결정

- 승인 A안을 두 개의 검증 가능한 단계로 적용한다: 클라우드 우선순위 조정 후 폰트 서브셋.
- 정적 글자는 소스·HTML·manifest의 텍스트에서 재현 가능하게 수집한다.
- font-family 이름과 CSS 크기 매핑은 그대로 두고 파일만 subset 자산으로 교체한다.

## 남은 질문

- 서브셋 결과의 실제 전송 절감량과 저사양 첫 조작 frame max는 구현 후 계측한다.

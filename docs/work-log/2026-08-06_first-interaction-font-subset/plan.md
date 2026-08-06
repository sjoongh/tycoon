# Plan — 첫 조작·폰트 전송 최적화

## 목표

첫 조작 프레임 경쟁을 줄이고 픽셀 선명도와 임의 한글 입력을 보존하면서 초기 폰트 전송량을 절감한다

## 작업 범위

1. 첫 조작 직후 Firebase import·프레임과 4개 폰트 요청을 기준 측정한다.
2. 첫 pointer/keydown은 `requestIdleCallback`으로 클라우드를 예약하고 5초 절대 타이머·랭킹 즉시 경로를 유지한다.
3. 정적 글자 목록과 HarfBuzz 명령을 관리하는 재현 스크립트를 만들고 Galmuri9·14 subset을 생성한다.
4. 원본 폰트 이름·크기·fallback 체계를 유지한 채 CSS 파일 경로만 subset으로 연결한다.
5. 390×844·360×740에서 정적 한글, 숫자 `1`, 임의 한글 닉네임, DOM·Phaser 렌더와 overflow를 비교한다.
6. 단위·빌드·성능·기존 E2E·상태 주입 없는 직접 플레이를 실행한다.

## 검증 계획

- `npm test`, `npm run build`, `git diff --check`.
- localhost target guard·preflight 뒤 모바일 성능과 기존 5개 E2E를 실행한다.
- 4x CPU throttle에서 첫 조작 후 long task·frame max·Firebase 요청 시작 시점을 측정한다.
- 폰트 요청별 transfer size와 `document.fonts.check`·캔버스/DOM screenshot을 기록한다.
- 생성 스크립트를 재실행해 subset 결과가 byte-identical인지 확인한다.

## 위험

- idle 예약이 랭킹과 5초 fallback을 실수로 늦출 수 있다.
- 정적 글자 수집 누락은 특정 사건·업적·Phaser 문구를 fallback으로 바꿀 수 있다.
- Galmuri14 숫자 격자와 Galmuri9 작은 글씨 선명도가 원본과 달라질 수 있다.
- full Galmuri11 fallback 때문에 동적 닉네임은 표시되지만 일부 행에서 크기별 모양이 달라질 수 있다.

## 완료 결과

- Firebase는 연속 입력을 피해 마지막 입력 약 750ms 뒤 idle 시작하며 5초 deadline과 랭킹 즉시 경로를 유지한다.
- Galmuri9·14를 정적 1,035 코드포인트 subset으로 만들고 Galmuri11 full fallback을 유지했다.
- 폰트 전송은 1,506,654→556,338바이트(-63.1%)다.
- 68 unit + 2 integration/build + 6 E2E + 격리된 70초 직접 플레이를 통과했다.

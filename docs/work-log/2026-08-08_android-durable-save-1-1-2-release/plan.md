# Plan — Android 저장 수정 1.1.2 배포 준비

## 목표

1.1.2/versionCode 5 AAB가 실제 Android 15 force-stop 저장 게이트를 통과하고 PR이 병합된다.

## 작업 범위

1. `package.json`, lockfile, Android Gradle 버전을 `1.1.2 / 5`로 맞춘다.
2. 단위 테스트, 웹 빌드, Capacitor sync, signed release AAB 빌드와 서명·bundle 검증을 실행한다.
3. 새 AAB를 Android 15 ARM64에 설치해 시설과 직원 구매 직후 강제종료·콜드 재실행을 검증한다.
4. QA 증적, 구현노트, 작업 로그를 새 artifact 기준으로 갱신한다.
5. 독립 리뷰와 diff gate를 통과한 관련 파일만 커밋·push·PR·병합한다.
6. 병합 뒤 main을 fast-forward하고 clean worktree·병합 브랜치를 안전하게 정리한다.

## 검증 계획

- 실행할 명령은 프로젝트 설정을 확인한 뒤 `verify`로 기록한다.
- 실행하지 못한 항목은 통과가 아니라 미검증으로 남긴다.
- 필수 검증: `npm-test`, `npm-run-build`, `android-release-aab-build`, `android-15-facility-force-stop-cold-relaunch-persistence`, `android-15-staff-force-stop-cold-relaunch-persistence`

## 위험

- 버전만 올리고 구 artifact를 검증하는 혼동을 SHA-256과 설치된 versionCode 확인으로 차단한다.
- Android 에뮬레이터 자동화가 flake일 수 있으므로 저장 XML·WebView local/durable 상태를 함께 증거로 남긴다.
- 물리 Android 기기는 연결되어 있지 않으면 미검증 위험으로 남긴다.
- AIDP 자동 원장 바이너리가 없어 수동 diff·리뷰·PR 게이트로 대체한다.

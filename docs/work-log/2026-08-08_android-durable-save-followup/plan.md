# Plan — Android 구매 즉시 저장 내구성 수정

## 목표

시설·직원 구매 직후 앱을 강제 종료해도 구매 결과가 다음 실행에 보존되도록 Android 저장 경로를 수정하고 실제 AAB에서 검증한다.

## 작업 범위

1. 권위 있는 현재 상태를 확인한다.
2. 필요한 변경만 구현한다.
3. 프로젝트가 정의한 검증을 실행한다.
4. 증적과 남은 위험을 기록한다.
5. 재사용할 지식을 올바른 정본으로 승격한다.

## 검증 계획

- 실행할 명령은 프로젝트 설정을 확인한 뒤 `verify`로 기록한다.
- 실행하지 못한 항목은 통과가 아니라 미검증으로 남긴다.
- 필수 검증: `npm-test`, `npm-run-build`, `android-release-aab-build`, `android-15-facility-force-stop-cold-relaunch-persistence`, `android-15-staff-force-stop-cold-relaunch-persistence`

## 위험

- `addJavascriptInterface` 등록 시점이 초기 페이지 JavaScript 실행보다 늦으면 첫 부팅 복구가 누락될 수 있다. 실제 AAB 콜드 스타트로 확인한다.
- `SharedPreferences.commit()`은 UI 이벤트 경로를 잠깐 막으므로 저장 payload 크기와 체감 지연을 측정한다.
- 구버전 Preferences 세이브와 새 고정 슬롯이 함께 존재할 수 있으므로 `lastSavedAt` 최신값을 일관되게 선택한다.
- 인터페이스는 임의 키 접근 없이 게임 세이브 한 슬롯만 노출해 공격 표면을 제한한다.

## 결과

- 구현과 자동화 검증을 완료했다.
- 최종 수정 후보 AAB를 Android 15 ARM64에 설치해 시설·직원 즉시 force-stop과 최근 앱 스와이프 종료를 통과했다.
- 다음 배포용 `versionCode` 결정과 Git 반영은 별도 승인 대기다.

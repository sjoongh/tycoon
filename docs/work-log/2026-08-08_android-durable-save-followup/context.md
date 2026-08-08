# Context — Android 구매 즉시 저장 내구성 수정

## 요청

- 작업: Android 구매 즉시 저장 내구성 수정
- 완료 조건: 시설·직원 구매 직후 앱을 강제 종료해도 구매 결과가 다음 실행에 보존되도록 Android 저장 경로를 수정하고 실제 AAB에서 검증한다.

## 시작 좌표

- 시작 시각: 2026-08-08T16:58:46+09:00
- 브랜치: `fix/android-durable-save`
- 기준 커밋: `6c40dc13b8348182e594a292c7c4e66233426a2f`
- 시작 시 워킹트리 변경: 없음

## 근거와 입력

- `사용자 승인: 응a로가자 (A안: SharedPreferences.commit 기반 동기 저장 브리지)`

## 제약

- 웹 localStorage 동작은 유지하고 Android 전용 고정 슬롯 브리지만 추가한다.
- 버전 변경·Play 업로드·커밋·PR은 별도 승인 전 수행하지 않는다.

## 결정

- 사용자 응답 `응a로가자`를 구현 게이트 승인으로 기록한다.
- Android 동기 브리지와 `SharedPreferences.commit()`을 사용한다.
- 웹 `localStorage`를 그대로 유지하고 Capacitor Preferences를 fallback/구버전 복구 경로로 남긴다.
- 버전 변경·배포·Git 원격 반영은 별도 승인 전 수행하지 않는다.

## 남은 질문

- 새 배포 버전 번호와 Git 반영 범위는 별도 승인이 필요하다.

## 종료 게이트

- dev-protocol 이해 확인 3문항에 사용자 `A / A / A` 응답.
- 새 `versionCode`, 동기 `commit()` 저장, 검증 완료·미커밋 상태를 정확히 확인했다.

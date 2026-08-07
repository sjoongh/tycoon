# Context — Android 1.1.0 AAB 릴리스

## 요청

- 작업: Android 1.1.0 AAB 릴리스
- 완료 조건: 문서 완료 상태와 Android 1.1.0(3)이 일치하고 서명된 release AAB가 검증된 뒤 PR로 병합된다

## 시작 좌표

- 시작 시각: 2026-08-07T09:59:11+09:00
- 브랜치: `release/android-1.1.0-aab`
- 기준 커밋: `6977a5d529a24ce4fe198caa26e32d3491172120`
- 시작 시 워킹트리 변경: 없음

## 근거와 입력

- 현재 Android 기준: `versionName 1.0.1`, `versionCode 2`.
- 기존 `android/keystore.properties`와 `android/app/gaepyo-release.keystore`는 ignore된 로컬 서명 자산이다.
- 이전 릴리스 PR #11은 병합됐고 운영 `https://gaepyo-tycoon.web.app` smoke test까지 통과했으나 체크리스트 2개가 미완료 표시다.

## 제약

- Play Console 업로드는 범위 밖이다.
- keystore, 비밀번호, AAB는 Git에 커밋하지 않는다.
- 메인 작업공간의 기존 `.omc`, `.impeccable` 변경을 건드리지 않는다.

## 결정

- 사용자 승인 버전: `1.1.0 (3)`.
- 사용자 승인 범위: 문서·버전 수정, 서명 AAB 생성·검증, 커밋·PR·머지.

## 남은 질문

- 없음.

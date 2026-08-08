# Context — Android 저장 수정 1.1.2 배포 준비

## 요청

- 작업: Android 저장 수정 1.1.2 배포 준비
- 완료 조건: 1.1.2/versionCode 5 AAB가 실제 Android 15 force-stop 저장 게이트를 통과하고 PR이 병합된다.

## 시작 좌표

- 시작 시각: 2026-08-08T18:57:54+09:00
- 브랜치: `fix/android-durable-save`
- 기준 커밋: `6c40dc13b8348182e594a292c7c4e66233426a2f`
- 시작 시 워킹트리 변경: 있음

## 근거와 입력

- `1.1.1 / versionCode 4` 기존 AAB는 구매 직후 강제종료 시 시설·직원 저장이 되돌아갔다.
- 동기 네이티브 저장 브리지 수정 후보는 Android 15 ARM64에서 시설·직원 sub-second force-stop 복구를 통과했다.
- 사용자 승인 원문: `ㄱㄱ 진행하자` — 직전에 제시한 버전 상승, 새 AAB, 기기 검증, 커밋·PR·병합 순서를 승인했다.
- 관련 구현노트: `docs/impl-notes/2026-08-08-android-durable-save-followup.md`

## 제약

- Play Console 업로드·출시는 수행하지 않는다.
- 기존 로컬 release signing 구성을 변경하지 않는다.
- 실제 새 AAB의 기기 검증이 실패하면 커밋·PR을 진행하지 않는다.
- 기본 worktree의 사용자 변경은 건드리지 않는다.

## 결정

- 앱 버전은 `1.1.2`, Android `versionCode`는 `5`를 사용한다.
- 격리 worktree `gaepyo-android-durable-save`와 브랜치 `fix/android-durable-save`를 유지한다.
- 관련 코드·테스트·QA·구현/작업 문서만 커밋 대상으로 삼는다.

## 남은 질문

- 없음. 커밋 직전 실제 diff 미리보기와 dev-protocol 종료 승인이 필요하다.

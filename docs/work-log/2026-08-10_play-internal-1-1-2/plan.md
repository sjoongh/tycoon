# Plan — Google Play 1.1.2 내부 테스트 배포

## 목표

서명된 1.1.2 versionCode 5 AAB가 Google Play 내부 테스트 트랙에만 검증·배포된다

## 작업 범위

1. 서비스 계정 JSON의 메타데이터와 AAB 해시를 검증한다.
2. 키를 저장소 밖 전용 경로에 권한 `600`으로 보관한다.
3. Play Developer API 토큰 발급과 앱 접근 권한을 읽기 방식으로 검증한다.
4. AAB를 새 edit에 업로드하고 응답의 versionCode를 확인한다.
5. 내부 테스트 트랙만 `completed` 릴리스로 갱신한다.
6. edit 검증 후 커밋하고 내부 트랙을 재조회한다.
7. 배포 증적과 남은 위험을 기록한다.

## 검증 계획

- 인증 토큰 발급 및 `edits.insert` 성공 여부를 확인한다.
- 업로드 응답의 package/versionCode와 로컬 AAB의 SHA-256을 대조한다.
- `edits.validate`를 통과한 edit만 커밋한다.
- 커밋 후 내부 트랙에서 versionCode `5`를 재조회한다.
- 실행하지 못한 항목은 통과가 아니라 미검증으로 남긴다.
- 필수 검증: `play-developer-api-접근-검증`, `aab-해시-및-버전-검증`, `내부-테스트-트랙-커밋-결과-확인`

## 위험

- Play Console 초대 또는 앱 권한이 아직 반영되지 않았을 수 있다.
- Google Play Android Developer API가 Cloud 프로젝트에서 비활성화됐을 수 있다.
- versionCode `5`가 이미 업로드됐다면 같은 AAB를 새로 업로드할 수 없다.
- Play Console의 미완료 약관·정책 선언이 커밋을 막을 수 있다.

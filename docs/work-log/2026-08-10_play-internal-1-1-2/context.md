# Context — Google Play 1.1.2 내부 테스트 배포

## 요청

- 작업: Google Play 1.1.2 내부 테스트 배포
- 완료 조건: 서명된 1.1.2 versionCode 5 AAB가 Google Play 내부 테스트 트랙에만 검증·배포된다

## 시작 좌표

- 시작 시각: 2026-08-10T17:44:38+09:00
- 브랜치: `ops/play-internal-1-1-2`
- 기준 커밋: `4493e9d806cc944615594e10841e072168ced49e`
- 시작 시 워킹트리 변경: 없음

## 근거와 입력

- 사용자 선택: `A — 내부 테스트 트랙 업로드·배포`.
- 대상 앱: `kr.gaepyo.counting`.
- 대상 릴리스: `1.1.2`, `versionCode 5`.
- AAB: `/Users/manager/aidp/gaepyo-release-artifacts/1.1.2/gaepyo-1.1.2-5-release.aab`.
- 기준 SHA-256: `24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4`.
- 서비스 계정: `gaepyo-play-deployer@gaepyo-play-release.iam.gserviceaccount.com`.

## 제약

- 프로덕션 트랙·스토어 등록정보·테스터 목록·관리형 게시 설정은 변경하지 않는다.
- 서비스 계정 개인 키는 저장소와 작업 로그에 복사하거나 출력하지 않는다.
- API 접근·AAB 검증이 실패하면 edit를 커밋하지 않는다.

## 결정

- 첫 업로드는 내부 테스트 트랙으로 한정한다.
- 기존 미커밋 변경이 있는 메인 워크트리 대신 `origin/main` 기반 격리 워크트리를 사용한다.

## 남은 질문

- API에서 조회되는 내부 테스트 Google Group은 0개다. Play Console 이메일 목록에 실제 테스터가 등록됐는지는 Console에서 확인해야 한다.
- 실제 Android 기기에서 Play 내부 테스트 설치·업데이트와 구매 저장 유지 smoke test가 남았다.

## 실행 증적

- 활성 키/OAuth/API 앱 접근: PASS.
- 업로드 전 bundles: versionCode `1, 2, 3`; target `5` 미사용 확인.
- AAB ZIP 무결성 및 SHA-256: PASS.
- Play bundle versionCode `5` 업로드 및 SHA-256 대조: PASS.
- 내부 트랙: `5 (1.1.2)`, `completed`.
- 프로덕션 트랙: `3 (1.1.0)`, 변경 없음.
- post-commit verification edit 조회 및 삭제: PASS.
- 배포 후 전체 트랙 열거: versionCode `5`는 `internal`에만 존재, production은 versionCode `3` 유지.
- Claude Fable 5 독립 검증: 조건부 PASS; 전체 트랙 열거 지적은 추가 검사로 해소, 테스터·실기기 및 manifest versionName 직접 추출은 제한으로 유지.

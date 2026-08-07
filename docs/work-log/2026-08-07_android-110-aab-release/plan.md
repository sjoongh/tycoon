# Plan — Android 1.1.0 AAB 릴리스

## 목표

문서 완료 상태와 Android 1.1.0(3)이 일치하고 서명된 release AAB가 검증된 뒤 PR로 병합된다

## 작업 범위

1. 이전 릴리스 문서의 운영 배포·머지 상태를 실제 결과에 맞춘다.
2. Android `versionName`을 `1.1.0`, `versionCode`를 `3`으로 올린다.
3. unit·web build 후 Capacitor Android 자산을 동기화한다.
4. 서명된 release AAB를 만들고 bundle metadata·서명·SHA-256을 검증한다.
5. 증적과 구현노트를 갱신하고 교차리뷰·PR CI 후 병합한다.

## 검증 계획

- `npm test`
- `npm run build`
- `npx cap sync android` 및 `npx cap doctor`
- `android/gradlew bundleRelease`
- AAB의 package/versionCode/versionName, JAR 서명, SHA-256 검증
- 필수 검증: `npm-test`, `web-build`, `android-aab`

## 위험

- 격리 worktree에는 ignored keystore가 없으므로 로컬 서명 자산을 빌드 시점에만 연결해야 한다.
- AAB 산출물은 ignore 대상이며 PR에 포함하지 않는다.
- 로컬 저장소의 code 3이 Play Console에서 이미 사용됐는지는 Console 업로드 전 최종 확인이 필요하다.

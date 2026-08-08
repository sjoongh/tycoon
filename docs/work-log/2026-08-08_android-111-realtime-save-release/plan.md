# Plan — Android 1.1.1 실시간 저장 수정 릴리스

## 목표

실시간 구매 저장 수정이 포함된 Android 1.1.1(4) 서명 AAB를 검증하고 PR로 병합한다

## 작업 범위

1. package·Android·README를 `1.1.1 (4)`로 동기화한다.
2. 저장 수정 타깃 테스트와 전체 unit·웹 build를 실행한다.
3. Capacitor Android 동기화와 OpenJDK 21 clean release bundle을 실행한다.
4. AAB package/version/signature/SHA-256을 독립 도구로 검증한다.
5. 가능하면 연결된 Android 기기에서 구매→강제종료→재진입 시나리오를 검증한다.
6. 증적·릴리스 문서를 갱신하고 교차리뷰·PR CI 뒤 병합한다.

## 검증 계획

- `npm test`
- `npm run build`
- `npm run android:sync` 및 `npx cap doctor`
- `npm run android:bundle` (OpenJDK 21)
- `bundletool validate`와 manifest package/version 확인
- `jarsigner -verify` 및 keystore/AAB 인증서 SHA-256 비교
- 저장 타깃 테스트와 연결 기기 가용 시 강제종료·재진입 검증
- 필수 검증: `npm-test`, `web-build`, `android-aab`, `save-regression`

## 위험

- 격리 worktree에 ignored 서명 파일을 빌드 시점에만 안전하게 연결해야 한다.
- 실제 Android 기기가 없으면 OS 프로세스 강제종료 시나리오는 자동화 테스트 증적으로 대체할 수 없으며 별도 미검증으로 남는다.
- 릴리스 AAB는 worktree 정리 뒤에도 남도록 외부 보존 디렉터리로 복사해야 한다.

# 2026-08-10 Google Play 1.1.2 내부 테스트 배포

## 목표 / 확정 사항

- 서명된 `1.1.2 (versionCode 5)` AAB를 Google Play의 내부 테스트 트랙에만 배포한다.
- 프로덕션 트랙, 단계적 출시, 관리형 게시 설정은 변경하지 않는다.
- 서비스 계정 키는 저장소 밖 전용 경로에 권한 `600`으로 보관하고 키 본문을 로그에 출력하지 않는다.

## Gate evidence

- 질문: `A — 내부 테스트 트랙 업로드·배포`, `B — 프로덕션 초안`, `C — 프로덕션 심사 제출` 중 첫 업로드 범위를 확인했다.
- 사용자 답: `a로해`
- 승인된 범위: 서비스 계정 키의 안전한 로컬 보관, Play Developer API 접근 검증, AAB 무결성 재검증, `kr.gaepyo.counting` 내부 테스트 트랙 업로드·커밋, 결과 확인.
- 미승인 가정: 프로덕션 배포·심사 제출, 관리형 게시 변경, 테스터 목록 변경, 스토어 등록정보 변경, 저장소 배포 자동화 추가는 수행하지 않는다.

## 계획

1. 기존 배포 기록과 `origin/main`의 릴리스 좌표를 확인한다.
2. 다운로드된 서비스 계정 JSON을 저장소 밖 전용 경로에 복사하고 권한을 제한한다.
3. API 토큰을 발급해 앱·트랙 접근 권한을 읽기 방식으로 확인한다.
4. AAB 해시·패키지·버전 코드를 재확인한다.
5. 새 Play edit를 만들고 AAB를 업로드한 뒤 내부 테스트 트랙만 갱신한다.
6. edit를 검증하고 커밋한 뒤 내부 트랙의 `versionCode 5` 상태를 재조회한다.
7. 증적과 남은 위험을 작업 로그에 기록한다.

## 판단 근거

- AAB 업로드는 versionCode 재사용에 영향을 줄 수 있으므로 사용자 선택 전에는 실행하지 않았다.
- 직접 프로덕션 제출보다 내부 테스트를 먼저 사용해 설치·업데이트·저장 유지 여부를 확인할 수 있게 한다.
- 기존 메인 워크트리에 미커밋 변경이 있어 `origin/main` 기반 별도 작업공간을 사용한다.

## ⚠️ DEVIATION (계획과 달라진 것 · 복병)

- ⚠️ 다운로드된 키 ID `2cd54e3d0377…`가 Google의 서비스 계정 공개 키 목록에 없고 OAuth 토큰 발급이 `Invalid JWT Signature`로 두 차례 거부됐다. 로컬 PEM 파싱·서명과 로컬/Google 시각 일치는 통과했다. → 택한 보수적 대안: Play edit를 만들거나 AAB를 업로드하지 않고 새 활성 JSON 키 발급을 기다린다. → 리뷰: [x] 2026-08-10 사용자가 새 활성 키 `69dfe83babe7…`를 제공해 해결하고 `그대로 승인`
- ⚠️ 새 키의 OAuth 토큰 발급은 성공했지만 Cloud 프로젝트 `287645291065`에서 Google Play Android Developer API가 비활성화되어 `edits.insert`가 HTTP 403으로 거부됐다. → 택한 보수적 대안: API 활성화 전에는 AAB 업로드를 시도하지 않는다. → 리뷰: [x] 2026-08-10 사용자가 API 활성화를 완료하고 `그대로 승인`

## 실행 결과

- 활성 키 `69dfe83babe7…`의 Google 공개 키 등록, 로컬 서명, OAuth 토큰 발급을 확인했다.
- 업로드 전 Play 상태는 bundle versionCode `1, 2, 3`, 내부 테스트 `3 (1.1.0)`, 프로덕션 `3 (1.1.0)`이었다.
- 로컬 AAB ZIP 무결성과 SHA-256 `24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4`, 소스 릴리스 좌표 `kr.gaepyo.counting / 1.1.2 / 5`를 확인했다.
- AAB 업로드, 내부 트랙 `5 (1.1.2) / completed`, edit validation과 commit이 완료됐다.
- 별도 verification edit에서 versionCode `5`와 SHA-256 일치, 내부 트랙 반영, 프로덕션 트랙 불변을 재확인하고 verification edit를 삭제했다.
- API에서 조회되는 내부 테스트 Google Group은 0개다. Play Console의 이메일 목록 구성과 실제 기기 설치는 별도 확인이 필요하다.

## 다음에 참고 (unknown 대응 이력)

- Play API 권한이 없거나 API가 비활성화된 경우 edit를 커밋하지 않고 중단한다.
- 이미 사용된 versionCode 또는 정책·계약 미완료 오류가 발생하면 통과로 간주하지 않고 Play Console 조치 사항을 그대로 기록한다.
- `invalid_grant: Invalid JWT Signature`가 발생하면 로컬 키 서명뿐 아니라 서비스 계정 x509 메타데이터에 해당 `private_key_id`가 게시됐는지 확인한다.
- OAuth 성공 뒤 `edits.insert`가 API 미사용/비활성화 403을 반환하면 오류에 포함된 정확한 Cloud 프로젝트 번호에서 `androidpublisher.googleapis.com`을 활성화해야 한다.

## 이해 확인

- 변경 트랙: 사용자 `A 내부 테스트` — 정답.
- 프로덕션 상태: 사용자 `A 1.1.0 (3) 유지` — 정답.
- 실제 설치 전 남은 확인: 사용자 `B 없음` — 오답. API에서 조회되는 Google Group이 0개이고 Play Console 이메일 테스터 목록 및 실제 Android 설치를 확인하지 않았으므로 정답은 `A 테스터 등록과 실제 기기 설치`다. 재시험 없이 설명하고 종료한다.

## 독립 검증 리뷰

- Claude Fable 5 `verify/high`가 핵심 업로드·내부 트랙 커밋·프로덕션 불변 증적은 충분하다고 판단했다. 모델: `claude-fable-5`, 보조 `claude-haiku-4-5-20251001`; 비용 `$0.425974`.
- 수용: 배포 후 전체 트랙 열거가 없다는 지적. fresh edit의 `tracks.list`를 추가해 versionCode `5`가 `internal`에만 존재하고 프로덕션은 versionCode `3`으로 유지됨을 재검증했다.
- 수용: 실패 게이트 원응답 근거가 요약뿐이라는 지적. `evidence/failure-gates.md`에 비활성 키와 비활성 API 단계에서 edit ID가 생성되지 않았던 근거를 기록했다.
- 유지한 제한: API에서 보이는 Google Group은 0개이고 이메일 테스터 목록·실기기 설치는 미검증이다.
- 미수행: AAB manifest에서 versionName을 직접 추출하는 추가 검사는 로컬 Java/bundletool이 없어 수행하지 않았다. SHA-256이 일치하는 AAB, 소스 `versionName 1.1.2`, Play가 파싱한 versionCode `5`까지만 검증된 것으로 기록한다.

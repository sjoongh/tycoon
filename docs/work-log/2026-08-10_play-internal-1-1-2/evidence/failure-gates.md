# 안전 중단 증적

## 비활성 키

- OAuth 응답: `invalid_grant: Invalid JWT Signature.`
- Google 서비스 계정 공개 x509 메타데이터: 다운로드 키 ID `2cd54e3d0377…` 미게시.
- 로컬 PEM 파싱·서명과 로컬/Google 시각은 정상.
- OAuth 토큰 발급 단계에서 실패했으므로 Play edit ID는 생성되지 않았고 AAB 업로드 요청도 실행되지 않았다.

## 비활성 API

- 새 활성 키 `69dfe83babe7…`의 OAuth 토큰 발급은 성공.
- 최초 `edits.insert` 응답: HTTP 403, `Google Play Android Developer API has not been used in project 287645291065 before or it is disabled.`
- `edits.insert`가 응답 본문을 반환하기 전에 실패해 edit ID가 생성되지 않았고 AAB 업로드 요청도 실행되지 않았다.
- 사용자가 해당 프로젝트에서 API를 활성화한 뒤 별도 probe edit 생성·트랙 조회·HTTP 204 삭제를 통과했다.

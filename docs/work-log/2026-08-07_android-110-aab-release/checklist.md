# Checklist — Android 1.1.0 AAB 릴리스

- [x] 현재 상태와 관련 문서를 확인했다.
- [x] 완료 조건과 변경 범위를 고정했다.
- [x] 구현 또는 조사를 완료했다.
- [x] 현재 상태에서 검증을 실행했다.
- [x] 남은 위험과 미검증 항목을 기록했다. — Play Console의 code 3 사용 여부는 업로드 시 확인한다.
- [x] 프로젝트 문서와 조직 지식으로 승격할 내용을 분리했다. — README·구현노트·QA 증적이 프로젝트 정본이며 별도 조직 위키 승격은 필요 없다.

## 릴리스

- [x] 앱·Android 버전을 `1.1.0 (3)`으로 동기화했다.
- [x] package, Android, README 버전 표기를 함께 동기화했다.
- [x] OpenJDK 21에서 clean release bundle과 npm 릴리스 명령을 통과했다.
- [x] bundletool manifest·bundle, JAR 서명, keystore 지문, SHA-256을 검증했다.
- [x] signing properties·keystore 누락 시 release 빌드가 fail-closed 되는지 확인했다.
- [x] worktree 외부에 최종 AAB 사본을 보존했다.
- [x] Claude Fable 5·Sonnet 5 xhigh 교차 리뷰와 보강 후 최종 PASS.
- [ ] PR CI, squash merge, 임시 서명 링크 제거, 원장·worktree 정리.

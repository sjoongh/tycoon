# Checklist — Android 1.1.1 실시간 저장 수정 릴리스

- [x] 현재 상태와 관련 문서를 확인했다.
- [x] 완료 조건과 변경 범위를 고정했다.
- [x] 구현 또는 조사를 완료했다.
- [x] 현재 상태에서 검증을 실행했다.
- [x] 남은 위험과 미검증 항목을 기록했다. — Android 실기기 강제종료 검증과 Play Console 검사는 미수행.
- [x] 프로젝트 문서와 조직 지식으로 승격할 내용을 분리했다. — README·구현노트·QA 증적이 프로젝트 정본이며 별도 위키 승격은 필요 없다.

## 릴리스

- [x] package·Android·README를 `1.1.1 (4)`로 동기화했다.
- [x] 저장 타깃 테스트와 전체 unit·웹 build를 통과했다.
- [x] OpenJDK 21에서 Android sync와 clean signed bundle을 통과했다.
- [x] AAB package/version/signature/SHA-256을 검증했다.
- [x] 연결 기기에서 구매→강제종료→재진입을 검증했거나 미검증 사유를 기록했다. — 연결 기기 0대, emulator 없음.
- [x] 최종 AAB를 worktree 외부에 보존했다.
- [ ] 독립 리뷰와 PR CI를 통과했다. — Claude Fable 5 review+verify PASS, PR CI 대기.

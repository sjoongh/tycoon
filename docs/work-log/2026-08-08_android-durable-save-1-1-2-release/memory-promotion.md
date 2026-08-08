# Memory Promotion — Android 저장 수정 1.1.2 배포 준비

## Project repository

- Code-coupled specifications, commands, and evidence remain in this repository.

## Ontology Lens candidates

- Android 저장 hotfix 릴리스는 exact AAB의 신규 설치뿐 아니라 이전 versionCode에서 데이터 삭제 없는 업데이트를 검증한다.
- 동기 durable slot 도입 시 실제 설정 초기화가 구 슬롯을 부활시키지 않는지 force-stop과 cold relaunch로 검증한다.

## Remaining risks / open questions

- Play 단계적 출시 전 물리 Android 기기 1종 smoke test를 권장한다.
- Play Console 업로드와 출시는 이번 승인 범위에서 수행하지 않았다.
- 루트 aggregate connectedDebugAndroidTest의 생성 플러그인 Kotlin 중복 그래프는 비게이팅 후속 정리가 필요하다.

## Handoff

- 남은 작업이 없으면 `HANDOFF.md`를 DONE 처리하고 삭제 또는 보관한다.
- 남은 작업이 있으면 이 문서가 아니라 활성 `HANDOFF.md`에 다음 좌표를 기록한다.

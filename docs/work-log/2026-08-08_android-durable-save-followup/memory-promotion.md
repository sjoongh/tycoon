# Memory Promotion — Android 구매 즉시 저장 내구성 수정

## Project repository

- Code-coupled specifications, commands, and evidence remain in this repository.

## Ontology Lens candidates

- Android WebView 구매 저장은 실제 release AAB의 sub-second force-stop gate로 검증한다.
- 동기 고정 슬롯은 lastSavedAt이 같아도 JSON이 다르면 마지막 durable 값을 우선한다.

## Remaining risks / open questions

- 다음 배포는 versionCode를 올린 뒤 새 AAB로 device gate를 반복해야 한다.
- 단계적 출시 전 물리 Android 기기 1종 smoke test를 권장한다.

## Handoff

- 남은 작업이 없으면 `HANDOFF.md`를 DONE 처리하고 삭제 또는 보관한다.
- 남은 작업이 있으면 이 문서가 아니라 활성 `HANDOFF.md`에 다음 좌표를 기록한다.

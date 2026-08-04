# Checklist — 작전 카드와 개표 피버

- [x] 현재 상태와 관련 문서를 확인했다.
- [x] 완료 조건과 변경 범위를 고정했다.
- [x] 구현 또는 조사를 완료했다.
- [x] 현재 상태에서 검증을 실행했다.
- [x] 남은 위험과 미검증 항목을 기록했다.
- [x] 프로젝트 문서와 조직 지식으로 승격할 내용을 분리했다.

## 구현
- [x] 작전 데이터·결정적 3장 드래프트
- [x] GameState 선택·저장·경제 효과·열기·피버
- [x] 구역 완료 작전 선택 모달
- [x] HUD 열기/피버 상태와 모션 감소

## 검증
- [x] 작전/피버 단위 테스트
- [x] 전체 Vitest — 10 files, 45/45 pass
- [x] Vite production build
- [x] 모바일/desktop Playwright 실제 플레이 — 3장 선택, 피버 ×2, 저장 복구, overflow·focus·reduced-motion 확인
- [x] source Impeccable detector — 신규 위반 0, 기존 스타일 8건 범위 밖
- [ ] rendered Impeccable detector — Firebase/Analytics 장기 연결로 30초 navigation timeout; Playwright 렌더 검증으로 보완했으나 탐지기 자체는 미완
- [x] 구현 편차 사용자 리뷰와 인수 퀴즈 완료 — 오답 항목 설명, 재시험 없음

## 남은 위험

- Phaser 번들이 500 kB를 넘는 기존 Vite 경고는 이번 기능 범위 밖이다.
- 첫 작전의 체감 보강을 위해 `+12%` 대신 `클릭 +1`로 바꾼 편차는 2026-08-04 사용자가 그대로 승인했다.
- 프로젝트 문서·조직 위키로 별도 승격할 장기 지식은 없다. 구현 근거는 구현 노트와 QA 증적에 남겼다.

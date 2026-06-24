# 개표국 — 밤샘 자율 작업 핸드오프 로그

자율 모드로 5관점 리뷰 백로그를 끝까지 진행 중. 각 항목: 구현 → `npm run build`/`npm test` → Playwright 스샷 자가검증 → 커밋. 아트는 codex로 생성(`scripts/shot.mjs`로 검증).

## 상태 범례
[x] 완료 · [~] 진행중 · [ ] 대기

## 백로그 (우선순위)
- [x] Batch A: 직원 뭉침/그림자/틴트/모션, nav 메시, 탭팝, 시설 Lv0 숨김 (e65bc7d)
- [x] Batch B: UI 디자인시스템(폰트/패널/진행바/칩아이콘/썸네일/희귀도/탭/비용/D카운트/커서) (c9c45fe)
- [x] C1. 신규 온보딩: 첫 탭 유도 오버레이 + 첫 성취 (UX/기획 P0)
- [x] C2. 오프라인 보상 모달 (UIScene 제거 회귀 복구; 기획 P1)
- [x] C3. 마일스톤 연출: Lv5/10/25 배너+플래시 (기획 P1)
- [x] C4. HUD 자원 아이콘(투표함/말풍선/하트) — codex 아트 (디자인 P0-4)
- [x] C5. 표/초·업글 델타 표기, 사건 알림 뱃지 (기획 P2)
- [x] C6. 벽 장식(시계/포스터)로 빈 벽 채우기 — codex 아트 (디자인 P1-1)
- [x] C7. 월드 탭-수집 프롭(투표함) (기획 P1-4)
- [x] C8. QA 잔여: BUG-05 탭강제전환, BUG-11 프레스티지 표시, BUG-01 퀘스트 자동완료
- [ ] C9. 직원 프레임 애니(스프라이트시트) — codex 아트
- [ ] 최종: 전체 회귀 스샷 검증 + 리뷰 재실행

## 진행 기록
- (작업하며 한 줄씩 append)

- 2026-06-24T18:05 C1-3 done (f01ae21): onboarding hint, offline modal, milestone toast/flash
- 2026-06-24T18:08 C5 gain delta (d546182), BUG-11 prestige mult (c2a8065). 목표/감사/사건 탭 회귀검증 OK. C4/C6/C7/C9는 codex UI아트(bej3uauil) 생성 대기중.
- 2026-06-24T18:13 C4/C6/C7 wired (2e97c9c): HUD icons, wall clock/poster, ballotbox prop, tutorial hand. C8 partial (BUG-11 done). 신규유저 휑함 해소.
- 2026-06-24T18:14 C3 milestone toast verified via playwright drive(ms.png). 직원 변형 2종 codex 생성중(b10s9wx4y). C9 walk-sheet 보류(현 bob/breath 충분).

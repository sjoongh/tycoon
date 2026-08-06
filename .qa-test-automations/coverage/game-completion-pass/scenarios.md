# 게임 완성도 마감 패스 시나리오

## SC-GCP-001: 직원 3슬롯과 기존 효과 보존

기존 직원 기본 효과는 배치와 무관하게 유지하고, 채용한 직원 중 최대 세 명만 현장 보너스를 받는다. 네 번째 자동배치는 거부되며 해제한 자리에 다른 직원을 넣을 수 있다.

## SC-GCP-002: 직급·필드 외형 승급

Lv.5/10/15/20에서 직급 tier가 2/3/4/5로 오르고 카드 배지와 월드 오버레이 텍스처가 같은 tier를 표시한다. 360px 화면에서도 배치 조작은 44px 이상이다.

## SC-GCP-003: 첫/반복 감사 페이싱과 저장 이관

초당 3탭·45초 사건·5초 구매 모델에서 첫 감사는 480~720초, 2·3회차는 300~480초에 도달한다. v8 진행 중 세이브는 v9 목표로 옮겨도 현재 구역 진행률을 보존한다.

## SC-GCP-004: 사용자 선택형 PWA 갱신

새 서비스워커는 사용자 선택 전 대기한다. `나중에`는 현재 세션을 유지하고, `지금 갱신`은 저장 후 활성화·한 번만 재로드하며 새 앱 셸은 오프라인 재실행된다.

## SC-GCP-005: 설치 자산과 Hosting 계약

manifest의 PNG·maskable·390×844·1280×900 자산과 `/privacy.html`이 빌드에 포함된다. Firebase는 `dist`를 SPA로 제공하고 `/sw.js`를 캐시하지 않는다.

## Traceability

| Scenario | Cases | Evidence |
|---|---|---|
| SC-GCP-001 | TC-GCP-001, 003, 004, 006 | game-completion-pass-summary.yaml |
| SC-GCP-002 | TC-GCP-002, 005 | `game-completion-pass-staff/` 직원 E2E 스크린샷 2장 |
| SC-GCP-003 | TC-GCP-007~009 | 밸런스 integration·`SC-GCP-015` 10분 자연 플레이 |
| SC-GCP-004 | TC-GCP-010~013 | PWA unit/E2E |
| SC-GCP-005 | TC-GCP-012, 014 | build·preview·Firebase smoke |

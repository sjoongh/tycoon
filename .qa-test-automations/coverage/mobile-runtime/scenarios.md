# Mobile Runtime Scenarios

## SC-MRT-001: 연타의 첫 반영은 즉시, 후속 반영은 100ms 안에 합쳐진다

| 항목 | 내용 |
|---|---|
| AC 참조 | 사용자 승인 A안 |
| 리스크 | HIGH |
| 전제 조건 | 모바일 390×844, 60회 상태 변경을 약 16ms 간격으로 발생 |

왜 필요한가: 모든 상태 이벤트마다 큰 패널을 다시 만들면 프레임이 끊기고, 반대로 첫 갱신까지 늦추면 구매·진행 반응이 둔하게 느껴진다.

## SC-MRT-002: 렌더 예약의 경계 상태가 마지막 화면을 잃지 않는다

| 항목 | 내용 |
|---|---|
| AC 참조 | 숨김 복귀·강제 갱신·destroy 안전성 |
| 리스크 | HIGH |
| 전제 조건 | trailing 예약 뒤 visibility 변경 또는 직접 refresh/cancel |

왜 필요한가: pending 플래그나 rAF가 남으면 복귀 뒤 후속 상태가 영구적으로 누락되거나 파괴된 UI가 다시 그려질 수 있다.

## SC-MRT-003: 긴 목표 목록과 HUD가 값만 바뀔 때 DOM 구조를 보존한다

| 항목 | 내용 |
|---|---|
| AC 참조 | 목표 부분 갱신·HUD 쓰기 캐시 |
| 리스크 | HIGH |
| 전제 조건 | 304노드 목표 목록, 중간 스크롤, 구조/값 변경 각각 발생 |

왜 필요한가: 전체 재생성은 스크롤·포커스를 흔들고, 잘못된 부분 갱신은 보상 버튼과 진행률을 오래된 상태로 남긴다.

## SC-MRT-004: 첫 화면에서 Firebase SDK가 핵심 게임과 경쟁하지 않는다

| 항목 | 내용 |
|---|---|
| AC 참조 | 첫 입력 또는 5초 뒤 클라우드 시작 |
| 리스크 | HIGH |
| 전제 조건 | 신규 페이지, 첫 700ms 네트워크 관찰 |

왜 필요한가: 모바일에서 큰 인증·Firestore 청크를 즉시 읽고 파싱하면 첫 화면과 폰트 표시가 늦어진다.

## SC-MRT-005: 성능 최적화 뒤 기존 게임과 저장 의미가 유지된다

| 항목 | 내용 |
|---|---|
| AC 참조 | 게임 규칙·Firestore 저장 의미 비변경 |
| 리스크 | HIGH |
| 전제 조건 | 단위 68개, 4개 기존 E2E, 상태 주입 없는 70초 플레이 |

왜 필요한가: 렌더 소비자와 초기화 시점 변경이 작전·피버·보스·오프라인·멀티기기 저장을 간접적으로 깨뜨릴 수 있다.

## SC-MRT-006: 클라우드는 연타를 피하되 동기화 상한과 명시적 진입을 지킨다

| 항목 | 내용 |
|---|---|
| AC 참조 | 사용자 승인 A안의 idle 예약·5초 상한 |
| 리스크 | HIGH |
| 전제 조건 | 250ms 연속 pointer 입력, 무입력 페이지, 랭킹 직접 진입 |

왜 필요한가: 첫 조작만 보고 SDK를 즉시 읽으면 플레이가 계속되는 동안 비필수 파싱이 겹치고, 지나치게 미루면 멀티기기 동기화와 랭킹이 늦어진다.

## SC-MRT-007: 정적 픽셀 폰트는 작아지고 동적 한글은 full fallback을 쓴다

| 항목 | 내용 |
|---|---|
| AC 참조 | Galmuri9·14 정적 서브셋, Galmuri11 full 보존 |
| 리스크 | HIGH |
| 전제 조건 | 390×844, 정적 작은/굵은 문구, 숫자 101, 희귀 한글 `힣` |

왜 필요한가: 단순 파일 축소는 특정 한글·숫자를 누락하거나 픽셀 격자를 흐릴 수 있고, 닉네임은 정적 문자열 목록으로 제한할 수 없다.

## SC-MRT-008: custom Phaser core가 WebGL과 Canvas에서 같은 게임 기능을 제공한다

| 항목 | 내용 |
|---|---|
| AC 참조 | 사용자 승인 A안의 custom core·Canvas fallback |
| 리스크 | HIGH |
| 전제 조건 | exact Phaser/esbuild, 외부 요청 차단 localhost, WebGL 및 강제 Canvas 각각 신규 세이브 |

왜 필요한가: 사용하지 않는 엔진 모듈을 제거하면 정적 참조에 드러나지 않는 factory·scene system이 빠질 수 있고, Canvas 능력검사를 보수적으로 고정하면 fallback 렌더가 달라질 수 있다.

## SC-MRT-009: custom build는 재현 가능하고 stock rollback보다 startup long task가 작다

| 항목 | 내용 |
|---|---|
| AC 참조 | hash 재생성·stock rollback·4× CPU 성능 기준 |
| 리스크 | HIGH |
| 전제 조건 | stock/custom production build, 390×844, 4× CPU + SwiftShader, 각 3회 신규 브라우저 |

왜 필요한가: 개발 환경에만 남은 cache나 우연한 warm cache로 빨라진 것처럼 보이면 CI·배포에서 재현되지 않고, 현장 회귀 때 stock 엔진으로 즉시 돌아갈 수 없다.

## SC-MRT-010: Android 구매는 즉시 프로세스가 종료돼도 유지된다

| 항목 | 내용 |
|---|---|
| AC 참조 | Android 동기 durable-save 후속 수정 |
| 리스크 | HIGH |
| 전제 조건 | 수정 후보 릴리스 AAB, Android 15 ARM64, 신규 로컬 세이브 |

왜 필요한가: WebView `localStorage`는 메모리 반영 뒤 디스크 flush 전에 프로세스가 종료될 수 있으므로, 구매 직후 화면 값과 브라우저 reload만으로 실제 내구성을 보장할 수 없다.

## Traceability Matrix

| AC | Scenario | Test Cases | Test Code | Evidence |
|---|---|---|---|---|
| 첫 반영·합류 예산 | SC-MRT-001 | TC-MRT-001~002 | `scripts/_mobileperformancetest.mjs` | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 예약 경계 | SC-MRT-002 | TC-MRT-003~004 | `scripts/_mobileperformancetest.mjs` | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 목표·HUD 보존 | SC-MRT-003 | TC-MRT-005~006 | performance + readability E2E | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 초기 클라우드 지연 | SC-MRT-004 | TC-MRT-007 | performance E2E | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 전체 의미 회귀 | SC-MRT-005 | TC-MRT-008 | unit + 4 E2E + hands-on | `evidence/2026-08-06/mobile-runtime-summary.yaml` |
| 클라우드 idle·상한 | SC-MRT-006 | TC-MRT-009~010 | `scripts/_startupfonttest.mjs` | `evidence/2026-08-06/startup-font-summary.yaml` |
| 폰트 subset·fallback | SC-MRT-007 | TC-MRT-011~013 | startup/font E2E + subset generation | `evidence/2026-08-06/startup-font-summary.yaml` |
| custom core 기능·Canvas | SC-MRT-008 | TC-MRT-014~016 | builder assertion + Phaser core E2E | `evidence/2026-08-06/phaser-core-summary.yaml` |
| startup 성능·rollback | SC-MRT-009 | TC-MRT-017~018 | stock build + startup comparison | `evidence/2026-08-06/phaser-core-summary.yaml` |
| Android 즉시 저장 | SC-MRT-010 | TC-MRT-019~022 | bundletool + adb Android 15 E2E | `evidence/2026-08-08/android-durable-save-followup-summary.yaml` |

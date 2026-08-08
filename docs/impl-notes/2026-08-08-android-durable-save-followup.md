# 2026-08-08 Android 구매 즉시 저장 내구성 수정

## 목표 / 확정 사항

- 시설·직원 구매 직후 Android 앱을 강제 종료해도 구매 결과가 다음 실행에 남아야 한다.
- 웹의 기존 `localStorage` 저장은 유지한다.
- Android에서는 고정된 게임 세이브 슬롯만 노출하는 동기 JavaScript 인터페이스를 추가하고, `SharedPreferences.commit()` 성공 뒤 저장 호출을 반환한다.
- 앱 부팅 시 `GameState` 생성 전에 동기 네이티브 세이브를 읽어 더 최신인 값을 `localStorage`에 복구한다.
- 기존 Capacitor Preferences 경로는 구버전 데이터 복구와 동기 브리지 미지원 환경을 위한 비동기 fallback으로 유지한다.

## Gate evidence

- 질문: 실제 `1.1.1 (4)` AAB에서 시설·직원 구매 직후 1초 이내 force-stop 후 재실행 시 구매가 되돌아가는 문제에 대해 다음 두 안을 제시했다.
  - A: Android 전용 동기 브리지와 `SharedPreferences.commit()`으로 구매 저장의 디스크 반영을 보장한다.
  - B: 기존 비동기 Capacitor Preferences 호출을 기다리되 앱 종료 경합 가능성을 남긴다.
- 사용자 답 원문: `응a로가자`.
- 승인된 범위: A안 구현, 웹 저장 동작 유지, 부팅 복구, 자동화 테스트, 새 AAB 빌드, Android 15 force-stop 재검증.
- 미승인 범위: 버전 번호 변경, Play Console 업로드·출시, 커밋·push·PR·병합.

## 계획

1. Android 동기 세이브 브리지와 고정 저장 슬롯을 구현한다.
2. JavaScript 저장 미러가 동기 브리지를 우선 사용하고, 부팅 전에 최신 세이브를 채택하도록 연결한다.
3. 브리지 우선순위·fallback·최신값 선택·오류 격리 회귀 테스트를 추가한다.
4. 전체 단위 테스트와 웹/Android 빌드를 실행한다.
5. 빌드한 AAB를 Android 15 에뮬레이터에 설치해 시설·직원 구매 직후 강제 종료·콜드 재실행을 각각 검증한다.

## 판단 근거

- 실제 릴리스 AAB에서 `localStorage`는 구매 직후 프로세스 종료 시 flush 전에 유실됐다.
- 기존 `@capacitor/preferences` 경로는 앱의 SharedPreferences 파일을 만들지 못했고, 플러그인 내부 저장도 `apply()` 기반 비동기 기록이다.
- 세이브 쓰기 자체가 동기 완료되어야 구매 함수가 반환된 직후 프로세스를 종료하는 최악 조건도 보장할 수 있다.
- 브리지는 임의 키나 파일 접근을 제공하지 않고 세이브 JSON 한 슬롯의 `read`/`write`/`clear`만 노출한다.

## 기존 계획과의 편차

- 이전 릴리스 노트의 mock 네이티브 저장 테스트 PASS는 실제 Android 디스크 내구성을 증명하지 못했다.
- Android 15 에뮬레이터에서 릴리스 AAB를 직접 검증한 결과 시설과 직원 모두 즉시 종료 시 FAIL이 확인되어, 본 후속 수정이 출시 차단 작업으로 승격됐다.
- 구현 중 동일한 `lastSavedAt` 밀리초에 내용이 다른 두 세이브가 생길 수 있는 경계조건을 발견해, 타임스탬프가 같고 JSON이 다르면 마지막 동기 슬롯을 우선하도록 계획 범위 안에서 보강했다.
- 기존 Android 샘플 계측 테스트가 폐기된 패키지명 `com.getcapacitor.app`을 기대해 실패하므로 실제 패키지 `kr.gaepyo.counting`으로 정정했다.

## 구현 결과

- `DurableSavePlugin`을 Capacitor 초기 플러그인으로 등록해 첫 WebView 문서보다 먼저 `GaepyoSaveBridge`를 주입했다.
- 브리지는 `gaepyo_durable_save/game_save_v1` 고정 슬롯의 `read`/`write`/`clear`만 노출한다.
- `write`와 `clear`는 `SharedPreferences.commit()` 결과를 동기 반환하고 1,000,000자를 넘는 payload를 거부한다.
- JavaScript는 동기 브리지를 우선하고 실패할 때만 기존 Capacitor Preferences로 fallback한다.
- `GameState` 생성 전에 네이티브 슬롯을 읽어 localStorage보다 최신하거나 동일 시각·다른 내용이면 복구한다.
- 유효한 동기 슬롯이 존재하면 구형 비동기 슬롯이 이를 덮어쓰지 않게 했다.

## 검증 기록

- `npm test -- --run`: 21파일 132/132 PASS.
- `npm run build`, `npm run android:sync`: PASS.
- Android instrumentation: 4/4 PASS.
- OpenJDK 21 clean signed `bundleRelease`, lint vital, bundletool 1.18.1 validate, JAR signature: PASS.
- 최종 QA 후보 AAB: 4,454,725 bytes, SHA-256 `5306792d9aae299e227854994f04d2a2e767e201ff9078cf6e671c8829d8b874`.
- Android 15 ARM64에서 최종 AAB 설치 후 시설 `Lv.1→2`, 직원 `Lv.0→1` 구매 직후 sub-second force-stop·cold relaunch: local/durable 모두 PASS.
- 직원 `Lv.1→2` 구매 후 최근 앱 위로 밀기·cold relaunch: local/durable 모두 PASS.
- 네이티브 XML `/data/user/0/kr.gaepyo.counting/shared_prefs/gaepyo_durable_save.xml`과 `game_save_v1` 엔트리 존재 확인.
- 2,286-byte payload 동기 쓰기: cold 21.8ms, 후속 0.1~2.3ms.
- `npm audit --omit=dev`: 취약점 0건. `git diff --check`: PASS.

## 남은 위험

- 검증 후보는 아직 `1.1.1 / versionCode 4`다. 기존 실패 artifact와 식별자가 같으므로 배포 전 새 `versionCode`로 재빌드하고 device gate를 반복해야 한다.
- Android 15 ARM64 에뮬레이터 1종에서 검증했다. 단계적 출시 전 실제 기기 1종 smoke test를 권장한다.
- 기존 Vite chunk-size, Gradle `flatDir`, Gradle 9 deprecation 경고는 변경되지 않았다.
- Play 업로드·Git 원격 반영은 승인 범위 밖이라 수행하지 않았다.

## dev-protocol 종료 확인

- 질문 1: 다음 배포는 새 `versionCode`를 사용해야 하는가, 기존 4를 재사용해도 되는가.
  - 사용자 답: `A` — 새 `versionCode` 사용.
- 질문 2: 구매 저장은 `SharedPreferences.commit()` 동기 기록인가, `localStorage` 단독인가.
  - 사용자 답: `A` — 동기 기록.
- 질문 3: 현재 상태는 검증 완료·미커밋인가, 이미 병합됐는가.
  - 사용자 답: `A` — 검증 완료·미커밋.
- 사용자 응답 원문: `A / A / A로 가자`.
- 편차 승인 결과: 동일 밀리초 복구 경계와 낡은 패키지명 계측 테스트 정정은 승인된 A안의 검증·보강 범위로 수용했다. 버전 변경·배포·커밋은 수행하지 않는다.

## 1.1.2 배포 후속 Gate evidence

- 질문: 검증된 저장 수정에 대해 다음 단계로 `versionCode` 증가 → 새 AAB 생성 → 기기 게이트 반복 → 커밋·PR·병합을 진행할지 제시했다.
- 사용자 답 원문: `ㄱㄱ 진행하자`.
- 승인된 범위: 앱 버전을 `1.1.2`, Android `versionCode 5`로 올리고, 새 release AAB를 검증한 뒤 관련 변경만 커밋·push·PR·병합하며 병합 후 안전한 로컬 정리를 수행한다.
- 미승인 범위: Play Console 업로드·출시, 서명키 변경, 원격 저장소 규칙 변경, 실제 기기 없이 통과한 것으로 간주하는 것.

### 배포 후속 계획

1. package와 Android 버전을 `1.1.2 / 5`로 일치시킨다.
2. 단위 테스트·웹 빌드·Android sync·signed release AAB 빌드를 실행한다.
3. 새 AAB를 Android 15에 설치해 시설·직원 구매 직후 강제 종료 복구를 반복한다.
4. 변경 범위와 증적을 교차 리뷰하고 관련 파일만 커밋·PR·병합한다.
5. 병합 뒤 기본 브랜치와 작업트리를 안전하게 정리한다.

### ⚠️ DEVIATION

- ⚠️ `aidp-flow` 상세 프로토콜 파일과 실행 바이너리가 현재 환경에 없어 자동 원장·게이트 명령을 사용할 수 없다. → 보수적 대안: 기존 격리 worktree를 유지하고, diff·테스트·외부 리뷰·PR 게이트를 수동 기록한다. → 리뷰: [x] 2026-08-08 사용자 `A`로 그대로 승인
- ⚠️ 격리 worktree에는 무시 파일인 `android/local.properties`가 없고 시스템 기본 Java도 연결되지 않아 첫 release Gradle 진입이 SDK 탐색에서 중단됐다. → 보수적 대안: 기존 OpenJDK 21과 Android SDK 절대 경로를 명시해 clean build를 재실행했고 제품 코드는 바꾸지 않았다. → 리뷰: [x] 2026-08-08 사용자 `A`로 그대로 승인
- ⚠️ 루트 aggregate `connectedDebugAndroidTest`는 앱 계측 4개 PASS 뒤 생성 Cordova 플러그인 모듈의 Kotlin test graph 중복 클래스로 실패했다. → 보수적 대안: 제품 소유 범위인 `:app:connectedDebugAndroidTest`를 결정적 게이트로 고정해 4/4 PASS를 확인하고 aggregate 실패는 QA 진단에 공개했다. → 리뷰: [x] 2026-08-08 사용자 `A`로 그대로 승인
- ⚠️ 직원 테스트 자원 fixture를 일반 reload로 주입했을 때 기존 pagehide 저장이 마지막 in-memory 값을 정상적으로 다시 써 fixture를 덮었다. → 보수적 대안: fixture를 동기 durable slot에 commit하고 force-stop·cold boot로 채택한 뒤 실제 채용 버튼만 테스트했다. → 리뷰: [x] 2026-08-08 사용자 `A`로 그대로 승인

### 1.1.2 배포 후속 결과

- `package.json`, lockfile, Android Gradle을 `1.1.2 / versionCode 5`로 일치시켰다.
- clean signed release AAB: 4,454,773 bytes, SHA-256 `24878940e160a126bea117cffd15c0e74b448e2ca9c30512910cf52f9529fba4`.
- bundletool manifest와 설치된 package 모두 `1.1.2 (5)`로 확인했다.
- Android 15 ARM64 exact-AAB에서 시설 `Lv.1→2`와 직원 `Lv.0→1`이 0.4초/0.7초 내 force-stop 뒤 native XML·cold relaunch local/durable에 유지되어 PASS했다.
- `npm test -- --run` 132/132, `:app:connectedDebugAndroidTest` 4/4, clean `bundleRelease`, lint vital, bundletool validate, JAR signature, Capacitor doctor, production audit 모두 PASS했다.
- 배포 복사본: `/Users/manager/aidp/gaepyo-release-artifacts/1.1.2/gaepyo-1.1.2-5-release.aab` (원본과 해시 일치).
- Play Console 업로드는 승인 범위 밖이라 수행하지 않았다.
- 데이터 삭제 없는 exact-AAB `1.1.1 (4)→1.1.2 (5)` 업데이트에서 구버전 실제 시설 `Lv.2` 세이브가 local에 유지되고 durable slot으로 마이그레이션됐으며, 즉시 force-stop 뒤 `2/2`로 복구되어 PASS했다.
- 설정의 실제 2단 초기화 뒤 구 `Lv.2` 세이브는 부활하지 않았고 fresh local/durable `Lv.1/1`로 재시작되어 PASS했다.
- Git 최초 `0.1.0` GameState부터 모든 형상에 `lastSavedAt` 필드와 정규화가 존재함을 확인했다.
- Claude Fable 5 독립 리뷰(`review`, effort high, `$0.772461`)는 커밋·PR·병합 PASS를 판정했다. 누락 지적 중 upgrade/reset/legacy audit는 추가 검증했고, 손상값·async 억제·동일 timestamp·oversize 우려는 기존 코드와 테스트로 반려했다.

### 1.1.2 dev-protocol 종료 승인

- 편차 리뷰 답: `A` — 문서화한 수동 게이트·환경 경로 지정·앱 범위 계측·fixture 대안을 그대로 승인.
- 이해 확인 1 답: `A` — 최종 릴리스 식별자는 `1.1.2 (versionCode 5)`.
- 이해 확인 2 답: `A` — 시설·직원·무삭제 업데이트·초기화 실제 기기 게이트가 모두 PASS.
- Git 진행 답: `A` — 관련 파일 커밋, push, PR 생성, 병합 및 안전한 로컬 정리를 승인.
- 사용자 응답 원문: `A / A / A / A로 진행해`.

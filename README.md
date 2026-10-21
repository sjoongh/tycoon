# 믿어주세요 개표국

개표국 시설과 현장 직원을 운영하고, 사건·체크포인트 보스·작전·개표 피버에 대응하며 감사를 반복하는 풍자형 픽셀 방치 타이쿤입니다. 모바일 세로 화면을 기준으로 웹·PWA·Android를 지원합니다.

## 실행

```bash
npm install
npm run dev
```

프로덕션 빌드와 로컬 미리보기는 다음과 같습니다.

```bash
npm run build
npm run preview
```

## 게임 시스템

- 표·해명·믿음 3자원과 탭 콤보, 시설 자동 생산, 오프라인 정산
- 6개 시설의 레벨·구역/선행 시설 해금·시너지와 t1~t5 아이소 스프라이트 승급
- 유입(intake) vs 처리 용량(capacity): 분류·기록·전산과 운반·전산 직원이 용량을 올리고, 초과 유입은 적체로 쌓여 믿음을 깎는다
- 6명 직원의 기존 상시 효과, 담당 시설 레벨이 직원 레벨 상한, 3개 현장 배치 슬롯, 역할별 배치 보너스
- 직원 Lv.5/10/15/20 직급 승진과 필드·카드 외형 변화
- 일반 사건, 3단계 연쇄 사건 3종과 경로별 특별 결말 9종
- 3구역 주기 체크포인트 보스, 감사 런 작전, 계열별 개표 피버·피니셔
- 감사 인장·훈장 영구 성장과 첫 감사 8~12분, 반복 감사 5~8분 목표 곡선
- 목표·업적·도감·출석·주간 목표·칭호·캐릭터·꾸미기·랭킹
- 저장 v10, 구버전 진행률 보존 마이그레이션, 클라우드 저장(서버 시계 보정·최신/누적표 승자 규칙·10초 디바운스)

## 아트 파이프라인

아이콘과 월드 스프라이트는 전부 스크립트로 재생성한다(원본 팩은 `assets/art-src/_packs/`, gitignore).

```bash
npm run art:icons            # game-icons.net SVG → public/art/icons32.png + src/assets/iconAtlas.js
python3 scripts/art/build_world.py   # Kenney 아이소 가구 → public/art/world/*.png + src/world/worldAtlas.js
```

- 규칙: 32px 아이콘(1x/2x 표시), 월드 3x 전역 배율, 1px 외곽선 `#2b1d2e`, Endesga 32 팔레트. 상세는 `docs/superpowers/specs/2026-10-21-visual-and-systems-overhaul-design.md`
- 크레딧: `public/art/CREDITS.md` (game-icons.net CC BY 3.0, Kenney CC0, OGA office workers CC BY)
- 필요 도구: ImageMagick(`magick`), Python 3 + Pillow

## PWA와 배포

- 192/512/maskable PNG 아이콘과 모바일·와이드 설치 화면
- 오프라인 앱 셸과 정적 자산 캐시
- 새 버전 발견 시 플레이를 끊지 않고 `나중에 / 지금 갱신` 선택 제공
- `지금 갱신`은 로컬 진행을 먼저 저장한 뒤 대기 중인 서비스워커를 활성화
- Firebase Hosting은 `dist/`를 배포하며 `/privacy.html`을 함께 보존

## Android 릴리스

- 현재 앱 버전: `1.1.1` (`versionCode 4`)
- Android 빌드 도구체인: OpenJDK 21
- release keystore와 `android/keystore.properties`는 로컬에만 두고 Git에 커밋하지 않음
- 로컬 서명 설정이 연결된 환경에서 clean AAB 생성: `npm run android:bundle`
- 서명 설정·keystore가 없거나 불완전하면 release 빌드는 즉시 실패
- 산출물: `android/app/build/outputs/bundle/release/app-release.aab`

## 검증

```bash
npm test

# npm run dev 실행 후 (별도 터미널)
npm run test:balance
npm run test:staff
npm run build

# npm run preview 실행 후
QA_BASE_URL=http://localhost:4178 npm run test:pwa
```

브라우저 E2E는 안전을 위해 `localhost`와 `127.0.0.1`만 허용합니다. 전체 회귀 범위와 최신 증적은 `.qa-test-automations/`에서 추적합니다.

# 2026-11-10 — 월드 아트 전면 교체 (Kenney 합성 → gpt-image 생성)

## 배경
- 사용자 판정: 기존 월드(Kenney Furniture Kit 아이소 렌더 + Toon Characters 합성)는 "마인크래프트 같다", 애니메이션은 뻣뻣하다. 기성 에셋 대신 생성형으로 새로 만들 것.
- 수용된 방향: 코지 카툰(둥근 형태, 굵은 다크브라운 외곽선, 웜 파스텔, 치비 캐릭터). 샘플(접수창구 1·3티어, 직원, 국장)로 확인 후 전체 생성.

## 생성 경로
- `scripts/art/aigen.py` — 로컬 Quotio CLIProxyAPI(127.0.0.1:8317, 사용자 ChatGPT 계정)의 `gpt-image-1.5`를 OpenAI `/images/generations`·`/images/edits`로 호출. 투명 배경 PNG, 장당 25~35초, 체인 간 병렬 5.
- 일관성: 시설 2~5티어·국장 2~5단계·직원 2프레임은 **이전 결과를 참조한 edits**("Upgrade this exact object… keep style/angle/footprint"). 프롬프트 전문: `scripts/art/jobs/world.json`.
- 원본 56장(약 60MB)은 `assets/art-src/ai-world/`에 두고 gitignore. 재생성 `npm run art:gen`.
- codex CLI는 이 환경에서 이미지 도구가 없고(프록시 모델만), 1Password의 OpenAI 키는 타 고객사 과금 키라 사용하지 않음.

## 빌드 경로
- `scripts/art/build_world_ai.py`(`npm run art:world`): 알파 트림(임계 24, 외곽 글로우 제거) → 표시 박스 기준 리사이즈(소스 2배 레티나) → 앵커(아이소 물체: 최하단에서 폭의 12% 위, 캐릭터: 바닥 중앙) → `public/art/world/*.webp`(q90) + `src/world/worldAtlas.js` + `.tmp/world-ai-preview.png`.
- 방은 AI 생성 1장을 알파에서 바닥 다이아몬드 꼭짓점을 실측해 `room.top/floor/wallH`를 산출. `iso.js` 타일 = 바닥/7. 방 표시 348×214, 타일 49.7×20.3.
- 꾸미기(cos-*, sig-*)는 단품 생성 후 국장 1단계 머리 박스(상단 30% 최대 행 폭, 머리 높이 42%)에 맞춰 같은 캔버스에 합성.
- `ROOM_Y` 160→222: 간판(170~216)과 벽 겹침 해소.
- 월드 폴더 용량: PNG 1.8MB → WebP 560KB (교체 전 Kenney PNG 세트와 비슷한 수준).

## 함께 고친 것
- `FloatTextPool`·`BallotPool` depth 미설정(0) → 방 이미지(depth 5)에 가려 보상 텍스트·투표지 분출이 방 안에서 안 보이던 결함. `DEPTH_BASE.fx + 900/950`으로 올림.
- `build_world_vector.py`(Kenney 합성) 삭제, CREDITS·README 갱신, `art:gen` 스크립트 추가.

## 검증
- `npm test` 178/178, `npm run build` 성공, Playwright 스모크에서 아트 404·콘솔 오류 0, 텍스처 키 전부 존재.
- 증적: `evidence/2026-11-10-world-art-ai/` (before-mid, after-early, after-mid, after-late, cosmetics).

## 남은 것 (다음 패스)
- 모션: 직원 2프레임 3fps 교체뿐. 걷기·작업 루프·시설 가동 모션·탭 반동은 별도 패스.
- 후반(5티어) 밀도: 7×7 방에서 시설이 서로 맞닿음. 슬롯 재배치 또는 방 확장 검토.
- 시설 진행판 라벨(구역 개표 %)이 문 위에 겹침(기존).

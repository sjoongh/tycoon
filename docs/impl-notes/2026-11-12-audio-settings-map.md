# 배경음 교체 · 소리/기기 설정 · 백그라운드 무음 · 넓은 맵 · 스토어 스크린샷

사용자 피드백(2026-11-12): 배경음 품질, 소리 끄기·켜기 등 다른 타이쿤에 있는 설정이 없음, 앱을 내려도 소리가 남, Play 스토어에 구버전 화면, 맵이 작음.

## 참고한 게임
| 항목 | 참고 | 반영 |
|---|---|---|
| 시대별 배경음 | AdVenture Capitalist(행성마다 곡), Egg Inc(구역마다 분위기) | 시대 6개마다 다른 곡. 곡이 바뀌는 구역에 들어서면 교체 |
| 설정 | My Perfect Hotel, Idle Miner, Eatventure 설정 화면 | 배경음/효과음 따로 켜기·음량, 진동, 절전(30fps), 화면 켜두기 |
| 넓은 맵 | My Perfect Hotel, Idle Supermarket Tycoon | 개표소 밖 캠퍼스(광장·분수·도로·소품)를 그리고 끌어서 이동, 두 손가락 확대/축소, '개표소로' 복귀 버튼 |

## 배경음
- `src/audio/songs.js`: 시대별 악보 데이터(장조/단조, BPM, 스윙, 리듬 패턴). 같은 곡은 시드 고정 선율이라 반복 청취 때 같은 곡으로 들린다.
- `src/audio/bgm.js`: Web Audio 합성(일렉 피아노·마림바·벨·플루트·하프·패드, 드럼). 외부 음원 파일이 없어 라이선스·다운로드 부담이 없다.
- 새 곡은 선율 + 화음 반주 + 베이스 + 드럼 구성. 오프라인 렌더 RMS −32~−27dB, 피크 0.21 이하(`scripts/_audiocheck.mjs`).

## 소리·기기 설정
- `src/audio/audioPrefs.js`: `gp-audio` 저장. 예전 단일 음소거(`gp-muted=1`)는 배경음·효과음·진동 모두 끔으로 이어받는다.
- 효과음과 배경음은 별도 게인 버스 → 압축기. 음량 슬라이더는 제곱 곡선.
- `src/ui/devicePrefs.js`: 절전 모드는 Phaser 루프 프레임 제한을 30으로 바꾼다. 화면 켜두기는 Android에서 `ScreenAwakePlugin`(창 `FLAG_KEEP_SCREEN_ON`), 웹에서 Screen Wake Lock API.
- 설정 화면 구역: 소리 / 기기 / 보기 / 데이터 / 정보. 꺼진 토글은 회색으로 구분.

## 백그라운드 무음
- `visibilitychange`(hidden), `pagehide`, Android 앱 `pause`(native.js → `gp:app-pause`) 중 먼저 오는 신호에서 배경음을 멈추고 AudioContext를 suspend 한다. 돌아오면 resume 후 곡을 다시 고른다.
- 숨김 상태에선 효과음·진동도 내지 않는다.

## 넓은 맵
- 월드 경계 `_worldBounds()`를 개표소 크기에 맞춰 잡고(좌우 ±230 여백, 앞쪽 광장 470), 바닥 격자·광장·도로·하늘 그라데이션을 경계 전체에 그린다.
- 바깥 소품 12종(`public/art/world/out-*.webp`, Quotio 이미지 생성 → `build_world_ai.py` OUT_BOX). 뒤쪽 소품은 깊이 2, 앞쪽은 시설과 같은 y 정렬.
- 카메라: 9px 넘게 끌면 팬, 관성(감쇠 0.9), 핀치 0.8~1.6배(두 손가락 가운데 고정), 경계 클램프. 시트 높이가 바뀌면 오프셋을 트윈. 홈에서 벗어나면 '개표소로' 버튼.
- 동작 줄이기 설정이 켜져 있으면 관성을 쓰지 않는다.

## 스토어 스크린샷
- Play 등록 정보의 휴대전화 스크린샷 4장은 초기 픽셀 버전 화면이었다(해시가 삭제한 `store/screenshots/cap-*.png`와 일치).
- `scripts/_worldshot.mjs`(CLEAN=1로 배너 숨김, DSF=3)로 6장면 캡처 → `scripts/art/store_shots.py`로 1080×2160 캡션 이미지 합성 → `store/screenshots/shot-1..6-*.png`.
- `tools/play/upload-listing-images.mjs --screenshots a,b,...`: 기존 스크린샷 전부 삭제 → 순서대로 업로드 → validate/commit → 새 edit에서 순서·개수·sha256 대조.

## 검증
- `npx vitest run` 296건 통과(곡 데이터·설정 정규화 신규 포함). `npm run build` 통과.
- `_audiocheck.mjs`(Playwright): 첫 탭 후 재생, hidden → suspended·정지, visible → 재개, `gp:app-pause`/`gp:app-resume` 동일, 배경음 끔 저장.
- `_worldshot.mjs`: 1/4/8/12구역 렌더, 실제 마우스 드래그 팬, 핀치 0.8배, 12구역 경계 클램프 확인. 콘솔 오류 없음.

## 아직 확인할 것
- 배경음은 수치(음량·피크)만 확인했고 사람이 들어 본 품질 평가는 미측정이다.
- 실기기에서 홈 버튼·화면 끔 시 무음, 터치 드래그·핀치 손맛은 실기기 미확인(브라우저 이벤트로만 검증).
- 시설을 누른 채 끌기 시작하면 첫 누름이 선택·투표로 처리된다(기존 탭 동작 유지).

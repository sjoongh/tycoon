// ────────────────────────────────────────────────────────────────
// Play Games 설정 — Play Console에서 게임/리더보드를 만든 뒤 여기에 ID를 채우세요.
//
// [채우는 법]
// 1) Google Play Console → 앱 생성(kr.gaepyo.counting) → 'Play Games Services' 설정
// 2) 리더보드 추가: 이름 '도달 구역', 정렬 = 큰 값이 위(More is better), 정수
// 3) 생성된 리더보드 ID(예: CgkI...XXXX)를 아래 LEADERBOARD_AREA에 붙여넣기
// 4) OAuth 동의화면 구성 + 앱 서명키 SHA-1 등록(내부테스트 트랙 업로드 후)
//
// ID가 비어 있으면(아래 빈 문자열) 코드는 안전하게 무동작 — 앱은 정상 실행됩니다.
// ────────────────────────────────────────────────────────────────
export const PLAY_GAMES = {
  LEADERBOARD_AREA: "", // ← 여기에 '도달 구역' 리더보드 ID
  SNAPSHOT_NAME: "gaepyo-save", // 클라우드 세이브 스냅샷 이름(고정)
};

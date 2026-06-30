// ────────────────────────────────────────────────────────────────
// Firebase 설정 — 콘솔에서 프로젝트 만든 뒤 여기에 값을 채우세요. (무료)
//
// [채우는 법]
// 1) https://console.firebase.google.com → 프로젝트 추가(이름 아무거나)
// 2) 좌측 '빌드 → Firestore Database' → 데이터베이스 만들기(프로덕션/테스트 모드)
// 3) 좌측 '빌드 → Authentication' → 시작하기 → '익명' 로그인 사용 설정
// 4) 프로젝트 설정(⚙️) → 일반 → 내 앱 → 웹 앱(</>) 추가 → firebaseConfig 복사
// 5) 아래 FIREBASE_CONFIG에 그대로 붙여넣기
//
// apiKey가 비어 있으면 코드는 안전하게 무동작(랭킹/클라우드세이브 OFF) — 앱은 정상 실행.
// (웹 apiKey는 비밀이 아니라 공개돼도 됩니다. 보안은 Firestore 규칙으로 합니다.)
// ────────────────────────────────────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBXoox16wKeEithTT5pJO7nOzKCRs-wedI",
  authDomain: "gaepyo-tycoon.firebaseapp.com",
  projectId: "gaepyo-tycoon",
  storageBucket: "gaepyo-tycoon.firebasestorage.app",
  messagingSenderId: "60363002316",
  appId: "1:60363002316:web:5f087f6e4bf740c8860d69",
  measurementId: "G-1YFQHKF8HY",
};

export const cloudEnabled = () => !!FIREBASE_CONFIG.apiKey;

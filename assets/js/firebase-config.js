/* ===== Firebase web app config =====
   The course auth reads this file on every page load.
   To change values: Firebase console → Project settings → General →
   Your apps → (your web app) → SDK setup and configuration → copy the
   `firebaseConfig` object and paste it below, then commit and push.

   NOTE: idempotent (window.*, guarded) — loading this file twice, e.g. by
   the static <script> tag and the dynamic fallback, never throws. */
if (typeof window.FIREBASE_CONFIG === 'undefined') {
  window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyC4MYNCptNFAquPIECE6sV8TObMRinspPo",
    authDomain: "english-for-game-dev.firebaseapp.com",
    projectId: "english-for-game-dev",
    storageBucket: "english-for-game-dev.firebasestorage.app",
    messagingSenderId: "1094418312043",
    appId: "1:1094418312043:web:6311617777f8c7759cba2e"
  };
}

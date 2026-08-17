/* MalaMusic Firebase bootstrap.
 * Uses the browser-compatible Firebase CDN globals so Vercel's Node bundler
 * cannot rewrite the module imports into invalid browser-side require() calls.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDP1Yh0E8f_PgLFuLprIhFX3gccM9A4gfk',
  authDomain: 'auth.music.malawalipayment.web.id',
  databaseURL: 'https://heroikzre-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'heroikzre',
  storageBucket: 'heroikzre.firebasestorage.app',
  messagingSenderId: '834111954916',
  appId: '1:834111954916:web:a13ebb552f18bc253131f1',
  measurementId: 'G-XHCH3JMFSZ'
};

(function initMalaFirebase() {
  if (!window.firebase || typeof window.firebase.initializeApp !== 'function') {
    console.error('[MalaMusic] Firebase compat SDK belum termuat.');
    return;
  }
  const firebaseApp = window.firebase.apps && window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  const firebaseAuth = window.firebase.auth(firebaseApp);
  const googleProvider = new window.firebase.auth.GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  window.MalaFirebase = {
    app: firebaseApp,
    config: firebaseConfig,
    analytics: null,
    auth: firebaseAuth,
    googleProvider: googleProvider,
    googleSignIn: function() { return firebaseAuth.signInWithPopup(googleProvider); },
    googleRedirect: function() { return firebaseAuth.signInWithRedirect(googleProvider); },
    redirectResult: firebaseAuth.getRedirectResult().catch(function() { return null; }),
    log: function() {}
  };

  window.MalaFirebase.redirectResult.then(function(result) {
    if (result && result.user) {
      window.dispatchEvent(new CustomEvent('malamusic-google-redirect', { detail: result.user }));
    }
  });
})();

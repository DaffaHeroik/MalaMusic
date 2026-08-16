import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDP1Yh0E8f_PgLFuLprIhFX3gccM9A4gfk',
  authDomain: 'heroikzre.firebaseapp.com',
  databaseURL: 'https://heroikzre-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'heroikzre',
  storageBucket: 'heroikzre.firebasestorage.app',
  messagingSenderId: '834111954916',
  appId: '1:834111954916:web:a13ebb552f18bc253131f1',
  measurementId: 'G-XHCH3JMFSZ'
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
window.MalaFirebase = {
  app: firebaseApp,
  config: firebaseConfig,
  analytics: null,
  auth: firebaseAuth,
  googleProvider: googleProvider,
  googleSignIn: function() { return signInWithPopup(firebaseAuth, googleProvider); },
  googleRedirect: function() { return signInWithRedirect(firebaseAuth, googleProvider); },
  redirectResult: getRedirectResult(firebaseAuth).catch(function() { return null; }),
  log: function(name, params) {
    if (this.analytics) logEvent(this.analytics, name, params || {});
  }
};
window.MalaFirebase.redirectResult.then(function(result) {
  if (result && result.user) window.dispatchEvent(new CustomEvent('malamusic-google-redirect', { detail: result.user }));
});

isSupported().then(function(supported) {
  if (supported) return getAnalytics(firebaseApp);
  return null;
}).then(function(analytics) {
  window.MalaFirebase.analytics = analytics;
}).catch(function() {});

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js';

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
window.MalaFirebase = {
  app: firebaseApp,
  config: firebaseConfig,
  analytics: null,
  log: function(name, params) {
    if (this.analytics) logEvent(this.analytics, name, params || {});
  }
};

isSupported().then(function(supported) {
  if (supported) return getAnalytics(firebaseApp);
  return null;
}).then(function(analytics) {
  window.MalaFirebase.analytics = analytics;
}).catch(function() {});

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCFm6XNdSXWEdlgwpuOZ9vtShHrNdj8ZHs',
  authDomain: 'malawali-account.firebaseapp.com',
  projectId: 'malawali-account',
  storageBucket: 'malawali-account.firebasestorage.app',
  messagingSenderId: '199823078646',
  appId: '1:199823078646:web:c499409fefeea80ff368d7',
  measurementId: 'G-YWR5P59J30'
};

const firebaseApp = initializeApp(firebaseConfig);
window.MalaFirebase = { app: firebaseApp, analytics: null, log: function(name, params) { if (this.analytics) logEvent(this.analytics, name, params || {}); } };

isSupported().then(function(supported) {
  if (supported) return getAnalytics(firebaseApp);
  return null;
}).then(function(analytics) {
  window.MalaFirebase.analytics = analytics;
}).catch(function() {});

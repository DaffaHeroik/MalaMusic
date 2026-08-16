# Firebase integration notes

Firebase official Web setup documentation recommends initializing the registered Web app with the configuration object, then importing only the needed services. The modular SDK is optimized for bundlers, while the existing MalaMusic vanilla frontend can use the browser ESM CDN build for a small incremental integration. Firestore client requests are evaluated against Firestore Security Rules before reads/writes. Rules version 2 is the current documented format. User-specific Firestore rules normally rely on Firebase Authentication `request.auth`, so the existing custom Resend OTP session cannot safely authorize direct client Firestore writes without either adding Firebase Auth or routing writes through the existing trusted backend. Firebase Analytics is initialized with `getAnalytics(app)` after `initializeApp(config)`.

References:
- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/analytics/get-started

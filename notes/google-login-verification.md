# Google Login verification

Firebase CLI PowerShell verification confirmed `projects/834111954916/defaultSupportedIdpConfigs/google.com` has `Enabled: True` and a client ID present.

Vercel deployment commit `f2555fd` is READY in production.

Production test URL: https://music.malawalipayment.web.id/?v=58-google-login#dev

The v58 bundle loaded after the splash screen and Home rendered normally. Profile interaction is the remaining UI smoke-test step.

## Profile smoke test

After opening Profile and waiting for render, collection actions showed `Login / Daftar`, but the main account panel content was not visible in the extracted viewport. The Google button was not yet confirmed visually. This needs DOM/script inspection before declaring UI smoke test complete.

## DOM diagnostic

Production DOM confirms `window.EmailAuth` exists and `EmailAuth.googleLogin` is a function, but `#profile-account-panel` exists with empty innerHTML. This indicates `EmailAuth.refresh()` is not completing its normal unauthenticated render path, despite collection actions rendering. Manual refresh invocation is needed to isolate timing or exception behavior.

## Production v59 verification

After deploying commit `7fa86be` and opening `https://music.malawalipayment.web.id/?v=59-auth-fix`, Profile renders correctly. The previously blank account panel now shows `Akun MalaMusic`, `Lanjutkan dengan Google`, `Login`, `Daftar`, and `Lupa password?`. The root cause was `EmailAuth.refresh()` calling `this.applyAvatar`, although `applyAvatar` belongs to `Profile`; all three auth-refresh branches now call `Profile.applyAvatar`.

Google sign-in was not submitted during this verification because that is an account-login action requiring the user's interaction/session. The button is present and wired in production.

## Google readiness failure

When the user clicked Google in production, the UI reported `Google Login belum siap`. Browser diagnostic showed `document.readyState = complete`, but `window.MalaFirebase`, `window.firebase`, `MalaFirebase.googleSignIn`, and `MalaFirebase.googleRedirect` were all undefined. The failure occurs before OAuth; the Firebase module is not being initialized or is not available to `profile.js`.

## v60 Firebase compat fix

Production initially served the ESM file as a Vercel-transpiled CommonJS bundle (`require("https://www.gstatic.com/...")`), which browsers cannot execute. Commit `05deaa6` changed the bootstrap to Firebase compat CDN scripts plus a normal browser script, and bumped the app/service-worker assets to v60. After unregistering the old service worker and clearing its caches in the verification browser, production loaded `/firebase.js?v=60`; `window.firebase` is an object, one Firebase app is initialized, `window.MalaFirebase` contains `googleSignIn` and `googleRedirect`, and `googleSignIn` is a function.

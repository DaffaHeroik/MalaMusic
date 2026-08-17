# Firebase Custom Auth Domain Research

Firebase's official guidance says the default Identity Platform handler uses `https://[PROJECT-ID].firebaseapp.com`, which is why Google sign-in can show `heroikzre.firebaseapp.com`. A custom handler can use a custom domain, but the domain must be connected/configured for the Firebase/Identity Platform authentication handler and the provider redirect URI must use `https://<custom-domain>/__/auth/handler`.

Official references:

- [Firebase redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices): custom `authDomain` is supported directly when the app is hosted on Firebase Hosting; for non-Firebase hosts, Firebase documents a transparent reverse proxy for `/__/auth/*` or self-hosting the helper files.
- [Identity Platform: Show a custom domain during sign-in](https://docs.cloud.google.com/identity-platform/docs/show-custom-domain): connect the project to a custom domain, add the domain to the identity provider settings, update the callback URL, and set the Web SDK `authDomain` to the custom domain.
- [Firebase Hosting custom domain](https://firebase.google.com/docs/hosting/custom-domain): domain ownership, DNS, and SSL provisioning are required for Firebase Hosting custom domains.

MalaMusic currently runs on Vercel, so v76 uses the documented transparent proxy approach in `vercel.json` for `/__/auth/*` and `/__/firebase/*`, and changes `public/firebase.js` to `authDomain: 'music.malawalipayment.web.id'`. Production tests show `/__/auth/handler` and `/__/auth/iframe` return Firebase helper HTML through the MalaMusic domain. `/__/firebase/init.json` returns 404 both on MalaMusic and the Firebase default host, but MalaMusic uses an explicit Firebase config and does not depend on that endpoint.

The remaining end-to-end check is an actual Google sign-in attempt. If Google rejects the new callback, the custom redirect URI `https://music.malawalipayment.web.id/__/auth/handler` must also be added in the Google/Identity Platform provider configuration.

Browser verification on production v76 loaded the redesigned Profile auth choice screen through `firebase.js?v=76`, with Google, Login, Daftar, and reset controls rendered normally. The next verification step is to click Google and inspect the OAuth consent/redirect URL without completing sign-in. The production browser rendered the Google button, but the sandbox click did not open a visible popup or navigate, and the console had no new output. This is inconclusive for OAuth success and should not be reported as a completed Google login test. The custom handler endpoints themselves are reachable on the MalaMusic domain.

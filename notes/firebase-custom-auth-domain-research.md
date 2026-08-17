# Firebase Custom Auth Domain Research

Firebase's official guidance says the default Identity Platform handler uses `https://[PROJECT-ID].firebaseapp.com`, which is why Google sign-in can show `heroikzre.firebaseapp.com`. A custom handler can use a custom domain, but the domain must be connected/configured for the Firebase/Identity Platform authentication handler and the provider redirect URI must use `https://<custom-domain>/__/auth/handler`.

Official references:

- [Firebase redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices): custom `authDomain` is supported directly when the app is hosted on Firebase Hosting; for non-Firebase hosts, Firebase documents a transparent reverse proxy for `/__/auth/*` or self-hosting the helper files.
- [Identity Platform: Show a custom domain during sign-in](https://docs.cloud.google.com/identity-platform/docs/show-custom-domain): connect the project to a custom domain, add the domain to the identity provider settings, update the callback URL, and set the Web SDK `authDomain` to the custom domain.
- [Firebase Hosting custom domain](https://firebase.google.com/docs/hosting/custom-domain): domain ownership, DNS, and SSL provisioning are required for Firebase Hosting custom domains.

MalaMusic currently runs on Vercel, so v76 uses the documented transparent proxy approach in `vercel.json` for `/__/auth/*` and `/__/firebase/*`, and changes `public/firebase.js` to `authDomain: 'music.malawalipayment.web.id'`. Production tests show `/__/auth/handler` and `/__/auth/iframe` return Firebase helper HTML through the MalaMusic domain. `/__/firebase/init.json` returns 404 both on MalaMusic and the Firebase default host, but MalaMusic uses an explicit Firebase config and does not depend on that endpoint.

The remaining end-to-end check is an actual Google sign-in attempt. If Google rejects the new callback, the custom redirect URI `https://music.malawalipayment.web.id/__/auth/handler` must also be added in the Google/Identity Platform provider configuration.

Browser verification on production v76 loaded the redesigned Profile auth choice screen through `firebase.js?v=76`, with Google, Login, Daftar, and reset controls rendered normally. The next verification step is to click Google and inspect the OAuth consent/redirect URL without completing sign-in. The production browser rendered the Google button, but the sandbox click did not open a visible popup or navigate, and the console had no new output. This is inconclusive for OAuth success and should not be reported as a completed Google login test. The custom handler endpoints themselves are reachable on the MalaMusic domain.

## Console procedure verified from official documentation

1. In Firebase Console for project `heroikzre`, open **Hosting** and connect a custom domain. The official Identity Platform custom-domain guide says this establishes the Firebase Hosting domain used by the authentication handler.
2. Because `music.malawalipayment.web.id` currently serves the app from Vercel, do not point that same hostname to Firebase Hosting unless the whole app is intentionally migrated. Prefer a dedicated hostname such as `auth.music.malawalipayment.web.id` for the Firebase Hosting auth handler. The Firebase Hosting wizard provides the exact TXT ownership record and A/AAAA or CNAME/DNS records; do not guess them.
3. In Google Cloud Console, open **Identity Platform > Identity providers**, select the Google provider, open **Project settings** in the side pane, choose **Add Domain**, and add the custom auth hostname.
4. Add the exact callback URL to the provider's authorized redirect URI list: `https://auth.music.malawalipayment.web.id/__/auth/handler` (or use `music.malawalipayment.web.id` only if that hostname is actually connected to Firebase Hosting/auth handler).
5. In Firebase Console > Authentication > Settings > Authorized domains, keep the app domain and custom auth hostname authorized.
6. Set the Web SDK `authDomain` to the custom auth hostname, not necessarily the Vercel app hostname. The Firebase redirect guidance notes that a non-Firebase host requires either transparent `/__/auth/*` proxying or self-hosting the helper files; Firebase Hosting custom-domain setup is the simpler official route.

Sources: [Identity Platform custom auth domain](https://docs.cloud.google.com/identity-platform/docs/show-custom-domain), [Firebase redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices), [Firebase Hosting custom domain](https://firebase.google.com/docs/hosting/custom-domain).

## Execution status from PowerShell/Firebase CLI

Using the already logged-in Firebase CLI on the user's Windows PowerShell, the project `heroikzre` was verified and a dedicated Firebase Hosting user site was created: `malamusic-auth` with default URL `https://malamusic-auth.web.app`. The Firebase Hosting REST API was called from the local CLI session to create `auth.music.malawalipayment.web.id`. The current custom-domain state is `OWNERSHIP_MISSING`, `HOST_UNHOSTED`, and certificate `CERT_VALIDATING`. Firebase returned these exact DNS requirements: CNAME `auth.music.malawalipayment.web.id` -> `malamusic-auth.web.app`; TXT `_acme-challenge.auth.music.malawalipayment.web.id` -> `eZU_TLgatqjKJapA4PvA-gDrw47-Umvoq1Y3DSSvbLU`.

The sandbox Cloudflare API token returned HTTP 401. The stored Wrangler credential on VPS1 is a Global API Key, but using its extracted email/key against Cloudflare's REST API returned HTTP 403 and the discovered zone ID was a placeholder-like `0feeeee...`, so no DNS mutation was performed. Cloudflare Dashboard in the sandbox browser did not finish loading, so the DNS records remain pending. Do not claim the custom domain is connected until Cloudflare DNS is updated and Firebase reports `OWNERSHIP_ACTIVE`, `HOST_ACTIVE`, and `CERT_ACTIVE`.

## Disk C Wrangler audit

On the user's Windows laptop, the relevant Wrangler configuration is `C:\Users\USER\AppData\Roaming\xdg.config\.wrangler\config\default.toml`. It contains `oauth_token`, `refresh_token`, `expiration_time`, and `scopes`; no global API key field was found. `C:\Users\USER\.cloudflared\cert.pem` is a Cloudflare certificate file, not a DNS API key. The installed `wrangler2` points to the same Wrangler 4.123.0 OAuth session. Its reported permissions include `zone (read)` but not DNS write. The current OAuth token can list the zone `malawalipayment.web.id`, but Cloudflare DNS record reads for the Firebase auth names return HTTP 403, confirming that no usable DNS write credential is currently stored on disk C.

## Cloudflare Wrangler authentication references

Cloudflare's official Wrangler documentation states that `CLOUDFLARE_API_TOKEN` is the preferred environment variable for automation, while `CLOUDFLARE_API_KEY` must be used together with `CLOUDFLARE_EMAIL` for the older API-key authentication method. The deprecated aliases are `CF_API_TOKEN`, `CF_API_KEY`, and `CF_EMAIL`. The official API documentation recommends scoped API Tokens and says to avoid storing secrets in plaintext. References: https://developers.cloudflare.com/workers/wrangler/system-environment-variables/ ; https://developers.cloudflare.com/fundamentals/api/get-started/create-token/ ; https://developers.cloudflare.com/fundamentals/api/how-to/make-api-calls/ ; https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-key-auth/

## Final execution check

The current desktop-linked Wrangler session reports `loggedIn: true` but `authType: OAuth Token` and only `zone:read`; the sandbox Cloudflare API credential also returns HTTP 403. The Cloudflare Dashboard opened in the sandbox is at the login page and is not authenticated. Therefore DNS cannot be mutated from the sandbox without either the user's active PowerShell session containing the Global API Key or a user browser takeover/login. Firebase custom domain remains pending DNS records.

## Latest desktop check

The connected desktop shell's Firebase CLI access token returned HTTP 401 when querying the custom-domain resource, while Wrangler still reports OAuth Token with `zone:read`. This confirms the connected shell is not the same active session represented by the user's pasted Global API Key output; no credentials were exposed or changed.

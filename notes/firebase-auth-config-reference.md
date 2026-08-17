Official documentation consulted:

- https://cloud.google.com/identity-platform/docs/reference/rest/v2/Config
  The Identity Platform Config resource has `signIn.email.enabled` and `signIn.email.passwordRequired` fields. `enabled` controls whether email auth is enabled; `passwordRequired` controls whether a password is required.
- https://cloud.google.com/identity-platform/docs/reference/rest/v2/projects/updateConfig
  Update uses PATCH `https://identitytoolkit.googleapis.com/admin/v2/{config.name=projects/*/config}` with an `updateMask`; authorization scopes include `https://www.googleapis.com/auth/identitytoolkit`, `https://www.googleapis.com/auth/firebase`, and `https://www.googleapis.com/auth/cloud-platform`.

Observed project response: Firebase Auth REST returned `CONFIGURATION_NOT_FOUND`, and Firebase Admin local test returned `auth/configuration-not-found`, confirming the Email/Password provider/configuration is not enabled for project heroikzre yet.

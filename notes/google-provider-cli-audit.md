# Google provider CLI audit

The connected Windows PowerShell session has Firebase CLI 15.27.0 and is authenticated as `daffaheroik2020@gmail.com`.

Firebase CLI project listing confirms project `heroikzre` (Malawali Account), project number `834111954916`, active state, and Realtime Database instance `heroikzre-default-rtdb`.

The local Firebase CLI credential file is present at `C:\Users\USER\.config\configstore\firebase-tools.json`; token values were not saved or printed in this note.

An Identity Toolkit request using the CLI access token to `https://identitytoolkit.googleapis.com/admin/v2/projects/heroikzre/defaultSupportedIdpConfigs` returned HTTP 200 with an empty JSON object. A direct GET for `.../google.com` returned HTTP 404. This means the attempted provider-config resource is not the correct or existing resource for this project; Google Sign-In has not yet been confirmed enabled. Do not expose CLI token values.

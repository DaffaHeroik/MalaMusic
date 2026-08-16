# MalaMusic Project Rules

## Frontend cache and verification

After every frontend, UI, PWA, or asset change, do not assume the change is visible just because it was committed or deployed. Always update the asset version and service-worker version, ensure the service worker uses a cache strategy that retrieves the latest HTML and JavaScript when online, restart the preview server when needed, and verify the result in a real browser viewport, including Android-responsive behavior when relevant.

Before reporting completion, open the current preview URL with a fresh cache-busting query, navigate to the affected screen, and confirm the actual rendered text and interactions. If an old UI is still rendered, diagnose the active service worker and deployment rather than only incrementing a query-string version.

For authentication changes, verify the complete user flow from the initial Login/Daftar choice through email input, OTP request, OTP verification, authenticated state, and logout. MalaMusic's primary authentication flow is Email OTP through Resend and accepts only Gmail addresses.

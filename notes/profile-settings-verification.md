# Profile avatar and settings verification

Preview URL: http://127.0.0.1:3000/?v=52-profile-settings#dev

Header Profile now shows a circular avatar and a camera button labeled `Ganti avatar`. The unauthenticated preview correctly falls back to the MalaMusic logo and shows the auth server warning only because local development does not have the production session secret.

The Settings modal opened successfully at desktop viewport 893x768. It displayed sections for Pemutaran, Tampilan, Offline & data, and Profil & privasi. Controls visible included Putar otomatis, Kecepatan putar, Timer tidur, Equalizer suara, Latar cover bergerak, Tema aplikasi, Mode Offline, Bersihkan cache offline, Riwayat pemutaran, Backup Data, Pulihkan Data, Ganti avatar, Kembalikan avatar bawaan, and Playlist publik. The modal is scrollable and did not overflow horizontally in the preview.

Avatar upload is intentionally local-device storage, resized to 256x256 JPEG; Firebase Email/Password accounts have no photo URL by default, so the UI now uses account photo when available, local avatar when selected, and deterministic initials/logo fallback otherwise.

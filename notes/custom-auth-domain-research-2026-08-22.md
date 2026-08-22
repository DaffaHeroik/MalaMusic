# Custom Firebase Auth Domain Research

Tanggal akses: 22 Agustus 2026.

## Sumber resmi

1. Google Cloud Identity Platform — Showing a custom domain during sign in: https://docs.cloud.google.com/identity-platform/docs/show-custom-domain
2. Firebase Help — Set a web app's OAuth redirect domains: https://support.google.com/firebase/answer/6400741?hl=id
3. Firebase Auth — Redirect best practices: https://firebase.google.com/docs/auth/web/redirect-best-practices

## Temuan

- Default Identity Platform auth handler memakai https://[PROJECT-ID].firebaseapp.com.
- Custom auth handler perlu didaftarkan melalui Identity Platform > Identity providers > pilih provider > Project settings > Add Domain.
- Callback custom wajib memakai trailing path: https://auth.music.malawalipayment.web.id/__/auth/handler.
- Firebase web config harus memakai authDomain: auth.music.malawalipayment.web.id setelah custom handler dikonfigurasi.
- Domain yang menghosting aplikasi juga harus ada di authorized domains.
- Handler custom MalaMusic merespons HTTP 200 dan CNAME mengarah ke malamusic-auth.web.app.
- Pada 22 Agustus 2026, authorizedDomains project heroikzre ditambahkan melalui Identity Toolkit API: auth.music.malawalipayment.web.id.
- Firebase CLI VPS 1 valid sebagai daffaheroik2020@gmail.com dan dapat mengakses project heroikzre.
- Firebase CLI VPS 2 terpasang tetapi belum login.
- Google Cloud Console di browser sandbox belum login, sehingga langkah provider Add Domain/OAuth client belum bisa divalidasi melalui UI.

## Status kode

- Repository lokal public/firebase.js memakai authDomain custom.
- Production sebelumnya masih memakai heroikzre.firebaseapp.com.
- Jangan menyatakan OAuth custom selesai sebelum redirect URI custom pada provider/Google OAuth client tervalidasi.

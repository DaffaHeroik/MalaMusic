
## Browser validation

Pada browser lokal v133, halaman memuat `/stats.js?v=133` dan audio element dalam keadaan paused. Probe DOM menunjukkan `Stats.active=false`, `pending=0`; `Stats.tick()` sebelum `Stats.start()` tidak menambah pending; setelah `Stats.start()` dan progres media 5 detik, pending menjadi 5; setelah `Stats.stop()`, tick tambahan tidak menambah durasi. Ini membuktikan metrik tidak berjalan hanya karena web/APK dibuka.

## Production validation

Production `music.malawalipayment.web.id` menyajikan `MALA_SW_VERSION = v133`, memuat `/stats.js?v=133`, dan audio element idle dalam keadaan paused. Probe browser menghasilkan `beforePlaying=0`, `afterPlaying=5`, `afterStop=5`, `activeAfterStop=false`; dengan demikian membuka web saja tidak mencatat durasi dan tracker berhenti setelah playback dihentikan.


## Browser validation

Pada browser lokal v133, halaman memuat `/stats.js?v=133` dan audio element dalam keadaan paused. Probe DOM menunjukkan `Stats.active=false`, `pending=0`; `Stats.tick()` sebelum `Stats.start()` tidak menambah pending; setelah `Stats.start()` dan progres media 5 detik, pending menjadi 5; setelah `Stats.stop()`, tick tambahan tidak menambah durasi. Ini membuktikan metrik tidak berjalan hanya karena web/APK dibuka.

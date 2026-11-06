# PANDUAN PENGAMANAN KAUR KEUANGAN DESA TANJUNG MANIS
## Aplikasi "SI-SERAH DESA" (Kuitansi & BAST Digital Dana Desa)

---

### 1. LATAR BELAKANG & MITIGASI RISIKO HUKUM KAUR KEUANGAN

Berdasarkan **Permendagri No. 20 Tahun 2018 tentang Pengelolaan Keuangan Desa**:
1. **Kaur Keuangan bertindak sebagai Bendahara Desa**, yang memegang fungsi kasir dan penatausahaan rekening kas desa.
2. Pengeluaran kas desa seharusnya dilakukan kepada **Pelaksana Kegiatan Anggaran (PKA)** berdasarkan **Surat Permintaan Pembayaran (SPP)** yang telah diverifikasi oleh **Sekretaris Desa** dan disetujui oleh **Kepala Desa**.
3. **Fakta di Lapangan**:
   - Kepala Desa seringkali mengambil alih dana operasional pemerintah desa maupun kegiatan lain secara langsung.
   - Pihak BPD seringkali meminta dana operasional BPD diserahkan langsung ke pengurus BPD tanpa mekanisme administrasi PKA yang tertib.
   - SPJ (Surat Pertanggungjawaban) sering terlambat dibuat atau bahkan tidak dibuat sama sekali oleh pihak yang memegang uang.
4. **Bahaya Bagi Kaur Keuangan**:
   - Jika terjadi pemeriksaan dari **Inspektorat Daerah Kabupaten Kutai Timur**, **BPK (Badan Pemeriksa Keuangan)**, atau **APH (Kejaksaan/Tipikor Polres)**, yang pertama kali diperiksa adalah **Buku Kas Umum (BKU) dan saldo kas Kaur Keuangan**.
   - Jika terdapat selisih kas atau uang kas cair namun SPJ belum ada, **Kaur Keuangan berisiko dituduh menggelapkan dana (korupsi)** jika tidak memiliki bukti fisik penyerahan uang.

**Aplikasi SI-SERAH DESA** diciptakan untuk menjadi **perisai hukum dan pegangan administrasi tak terbantahkan** bagi Anda sebagai Kaur Keuangan.

---

### 2. ELEMEN PENGAMAN PADA APLIKASI

1. **Foto Bukti Fisik Serah Terima + Watermark Forensik**:
   - Saat menyerahkan uang, ambil foto orang yang menerima (Kades / BPD) sambil memegang map/uang/dokumen.
   - Aplikasi otomatis menyematkan stempel visual (*watermark*) permanen di atas foto yang berisi: **Nama Desa Tanjung Manis, Tanggal & Jam Menit Detik, Nama Penerima, Nominal Rp, dan Koordinat GPS**. Foto ini tidak bisa diedit atau disangkal.

2. **Kunci Koordinat Lokasi (GPS Geotagging)**:
   - Mencatat titik lintang dan bujur di mana uang tersebut diserahkan (misal: di Kantor Desa Tanjung Manis, di rumah Kades, atau di bank saat pencairan).

3. **Tanda Tangan Digital di Layar HP**:
   - Pihak penerima (Kades/BPD/PKA) langsung menandatangani di layar HP Anda menggunakan jari. Ini membuktikan bahwa yang bersangkutan secara sadar telah menerima uang tersebut.

4. **Klausul Pernyataan Tanggung Jawab Mutlak**:
   - Di dokumen Berita Acara tercantum klausul hukum baku:
     > *"Pihak Penerima menyatakan telah menerima fisik uang tunai dalam jumlah penuh dan bertanggung jawab mutlak baik secara yuridis, administratif, maupun keuangan atas penggunaan dana tersebut serta wajib menyelesaikan kelengkapan bukti SPJ."*

5. **Kirim Konfirmasi Otomatis ke WhatsApp Penerima**:
   - Setelah data tersimpan, Anda bisa langsung menekan tombol **"Kirim WA"**. Pesan konfirmasi formal akan terkirim ke WhatsApp Kades atau BPD. Ini menjadi jejak digital ganda bahwa mereka mengakui penerimaan uang tersebut.

6. **Rekapitulasi Audit per Pihak**:
   - Tab Rekapitulasi otomatis menghitung berapa total akumulasi uang kas yang telah diambil oleh Kepala Desa, berapa yang diambil oleh BPD, dan berapa yang dikelola oleh PKA.

---

### 3. CARA PENGGUNAAN DI HP (SMARTPHONE)

Aplikasi ini dibuat dengan teknologi **Progressive Web App (PWA)** yang sangat ringan, bisa bekerja **100% offline** (tanpa sinyal internet), dan foto tersimpan di penyimpanan internal HP (IndexedDB).

#### Cara A: Menghubungkan Laptop ke HP (Satu Jaringan Wi-Fi / Hotspot)
1. Nyalakan Hotspot HP Anda, lalu hubungkan Laptop ke Hotspot tersebut (atau keduanya terhubung ke Wi-Fi yang sama).
2. Di folder aplikasi laptop, klik ganda file **`jalankan-aplikasi.bat`**.
3. Di layar laptop akan muncul alamat IP (misalnya: `http://10.104.112.87:8080`).
4. Buka browser **Google Chrome** di HP Anda, lalu ketikkan alamat tersebut.
5. Di Chrome HP Anda:
   - Ketuk menu titik tiga (⋮) di pojok kanan atas.
   - Pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)** atau **"Instal Aplikasi"**.
   - Ikon aplikasi **SI-SERAH** akan muncul di menu HP Anda seperti aplikasi Play Store pada umumnya.

#### Cara B: Mengunggah ke Hosting Gratis (Akses Online Dari Mana Saja)
Jika ingin aplikasi bisa dibuka kapan saja di HP tanpa perlu laptop menyala:
- Anda dapat mengunggah folder ini ke **GitHub Pages**, **Vercel**, atau **Netlify** secara gratis (cukup drag and drop folder ke Netlify Drop).
- Link website (misal: `https://kuitansi-desa-tanjungmanis.netlify.app`) bisa dibuka langsung dari HP Anda kapan pun Anda berada di luar kantor.

---

### 4. TIPS PRAKTIS UNTUK KAUR KEUANGAN SAAT PENCAIRAN

1. **Sebelum Uang Diserahkan**:
   - Buka aplikasi SI-SERAH di HP Anda.
   - Pilih Pihak Penerima (Kepala Desa / BPD / PKA).
   - Masukkan nominal uang. Sistem otomatis membuat kalimat terbilang.
   - Tekan tombol **"Ambil GPS"**.

2. **Saat Menyerahkan Uang**:
   - Tekan tombol **"Buka Kamera HP"** dan ambil foto momen penyerahan secara santai dan sopan (misal: *"Pak Kades / Pak Ketua BPD, mohon izin saya ambil foto sebentar untuk arsip buku kas desa ya"*).
   - Sodorkan HP Anda dan minta penerima menandatangani di kotak putih layar HP.
   - Tekan **"SIMPAN & BUAT BUKTI KUITANSI"**.

3. **Setelah Penyerahan**:
   - Dokumen Berita Acara langsung terbit di layar HP.
   - Tekan **"Kirim WA"** untuk mengirimkan ringkasan bukti serah terima ke nomor WhatsApp beliau.
   - Anda juga dapat menekan **"Cetak / PDF"** untuk menyimpannya sebagai file PDF di HP atau mencetaknya jika ada printer.

4. **Cadangan Data (Backup)**:
   - Seminggu sekali atau setelah masa pencairan selesai, masuk ke tab **Profil** -> tekan **"Download File Backup Lengkap (.json)"** atau **"Ekspor Excel"**, lalu kirimkan file tersebut ke email atau Google Drive pribadi Anda agar data tidak pernah hilang meskipun HP berganti.

Dengan prosedur ini, integritas Anda sebagai Kaur Keuangan terjaga 100%, terhindar dari fitnah atau tuduhan selisih kas, dan siap menghadapi audit Inspektorat maupun BPK dengan data yang transparan dan akuntabel.

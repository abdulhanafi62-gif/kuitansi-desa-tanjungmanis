# PANDUAN LENGKAP: MEMBUAT FILE APK DI GITHUB SECARA OTOMATIS

Anda **SANGAT BISA** membuat file `.apk` langsung di **GitHub**!  
Sistem cloud **GitHub Actions** akan secara otomatis mengompilasi kode menjadi file installer `.apk` asli dalam waktu sekitar 1-2 menit, tanpa Anda perlu menginstal Android Studio atau aplikasi berat di laptop Anda.

---

### LANGKAH 1: Buat Repository Baru di Akun GitHub Anda
1. Buka situs [https://github.com](https://github.com) dan login ke akun Anda.
2. Di pojok kanan atas, klik tombol **`+`** lalu pilih **New repository**.
3. Masukkan nama repository, contoh: `kuitansi-desa-tanjungmanis`.
4. Anda bisa memilih **Public** atau **Private** (bebas).
5. **JANGAN** centang "Add a README file" (karena kita sudah punya berkas lengkap di laptop).
6. Klik tombol hijau **Create repository**.
7. Salin alamat URL repository Anda, contohnya:  
   `https://github.com/USERNAME-ANDA/kuitansi-desa-tanjungmanis.git`

---

### LANGKAH 2: Hubungkan & Push Proyek ke GitHub (Cuma 2 Baris Perintah)
Repository git di laptop Anda **sudah siap 100% dan sudah saya inisialisasi**. Anda hanya perlu membuka terminal/PowerShell di folder ini dan menjalankan perintah berikut:

1. Buka **PowerShell** atau **Command Prompt**.
2. Masuk ke folder aplikasi:
   ```powershell
   cd "C:\Users\Asus GK\.gemini\antigravity\scratch\kuitansi-desa"
   ```
3. Hubungkan ke repository GitHub Anda (ganti URL dengan URL repository Anda):
   ```bash
   git remote add origin https://github.com/USERNAME-ANDA/kuitansi-desa-tanjungmanis.git
   ```
4. Kirim (push) ke GitHub:
   ```bash
   git push -u origin main
   ```

*(Jika diminta login oleh GitHub di browser/terminal, cukup lakukan login atau gunakan Personal Access Token).*

---

### LANGKAH 3: GitHub Otomatis Mengompilasi File APK
Begitu perintah `git push` selesai:
1. Buka repository Anda di browser GitHub.
2. Klik tab **Actions** di bagian atas menu GitHub.
3. Anda akan melihat proses kompilasi berjalan: **"Build SI-SERAH DESA APK"**.
4. GitHub sedang menyiapkan sistem Android SDK, Gradle, dan membungkus aplikasi Anda menjadi file APK Android murni (membutuhkan waktu sekitar 1 hingga 2 menit).
5. Ketika proses selesai dan bertanda centang hijau (✅):
   - Klik pada alur kerja (*workflow run*) tersebut.
   - Gulir ke bagian paling bawah di bawah judul **Artifacts**.
   - Anda akan menemukan file:  
     📦 **`SI-SERAH-DESA-TANJUNG-MANIS-APK`** (siap diunduh langsung!).
   - Atau buka menu **Releases** di sebelah kanan halaman repository Anda untuk mengunduh:  
     📥 **`SI-SERAH-DESA-TANJUNG-MANIS.apk`**.

---

### LANGKAH 4: Pasang (Install) di HP Android Anda
1. Anda bisa langsung membuka link GitHub tersebut dari browser HP Android Anda.
2. Unduh file `SI-SERAH-DESA-TANJUNG-MANIS.apk`.
3. Buka file hasil unduhan di HP Anda.
4. Jika muncul peringatan *"Izinkan instalasi dari sumber tidak dikenal"*, pilih **Izinkan/Allow**.
5. Aplikasi **SI-SERAH DESA** resmi terpasang di HP Anda seperti aplikasi bawaan!

---

### KEUNGGULAN SISTEM INI:
- Setiap kali ada pembaruan kode atau Anda ingin mengubah data desa, Anda cukup lakukan `git commit` dan `git push`. GitHub akan secara otomatis mengompilasi APK versi terbaru!
- File installer `.apk` tersimpan aman di cloud server GitHub selamanya, sehingga jika HP hilang atau ganti baru, Anda tinggal mengunduh ulang APK-nya dari akun GitHub Anda.

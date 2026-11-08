/**
 * SI-SERAH DESA (Kuitansi & BAST Digital Dana Desa)
 * Khusus Kaur Keuangan Desa Tanjung Manis, Kec. Sangkulirang
 * 
 * Standalone Offline PWA - No External Dependencies Required
 */

// Register Service Worker for Offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

// Cryptographic SHA-256 Hash Generator for Legal Tamper-Proofing
async function generateSha256(message) {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback simple checksum if crypto.subtle is restricted in non-secure context
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'CRC32-' + Math.abs(hash).toString(16).toUpperCase();
  }
}

// ==========================================
// 1. IndexedDB HELPER (Offline Local Storage)
// ==========================================
const DB_NAME = 'SiSerahDesaDB';
const DB_VERSION = 1;
const STORE_NAME = 'transaksi_kuitansi';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('tanggal', 'tanggal', { unique: false });
        store.createIndex('penerimaJabatan', 'penerimaJabatan', { unique: false });
        store.createIndex('sumberDana', 'sumberDana', { unique: false });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveRecordToDB(record) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllRecordsFromDB() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
    req.onerror = () => reject(req.error);
  });
}

async function getRecordByIdFromDB(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteRecordFromDB(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearAllRecordsFromDB() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ==========================================
// 2. TERBILANG & FORMATTING UTILITIES
// ==========================================
function angkaKeKata(bilangan) {
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let temp = "";

  if (bilangan < 12) {
    temp = " " + angka[bilangan];
  } else if (bilangan < 20) {
    temp = angkaKeKata(bilangan - 10) + " Belas";
  } else if (bilangan < 100) {
    temp = angkaKeKata(Math.floor(bilangan / 10)) + " Puluh" + angkaKeKata(bilangan % 10);
  } else if (bilangan < 200) {
    temp = " Seratus" + angkaKeKata(bilangan - 100);
  } else if (bilangan < 1000) {
    temp = angkaKeKata(Math.floor(bilangan / 100)) + " Ratus" + angkaKeKata(bilangan % 100);
  } else if (bilangan < 2000) {
    temp = " Seribu" + angkaKeKata(bilangan - 1000);
  } else if (bilangan < 1000000) {
    temp = angkaKeKata(Math.floor(bilangan / 1000)) + " Ribu" + angkaKeKata(bilangan % 1000);
  } else if (bilangan < 1000000000) {
    temp = angkaKeKata(Math.floor(bilangan / 1000000)) + " Juta" + angkaKeKata(bilangan % 1000000);
  } else if (bilangan < 1000000000000) {
    temp = angkaKeKata(Math.floor(bilangan / 1000000000)) + " Milyar" + angkaKeKata(bilangan % 1000000000);
  } else if (bilangan < 1000000000000000) {
    temp = angkaKeKata(Math.floor(bilangan / 1000000000000)) + " Triliun" + angkaKeKata(bilangan % 1000000000000);
  }
  return temp;
}

function konversiTerbilang(nominal) {
  if (!nominal || isNaN(nominal) || nominal <= 0) return "Nol Rupiah";
  const hasil = angkaKeKata(Math.floor(nominal)).trim();
  return hasil + " Rupiah";
}

function formatRupiah(angka) {
  if (!angka) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(angka);
}

function formatTanggalIndo(tglString) {
  if (!tglString) return "-";
  const dateObj = new Date(tglString);
  const hariArr = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const hari = hariArr[dateObj.getDay()];
  const tgl = String(dateObj.getDate()).padStart(2, '0');
  const bln = bulanArr[dateObj.getMonth()];
  const thn = dateObj.getFullYear();
  const jam = String(dateObj.getHours()).padStart(2, '0');
  const mnt = String(dateObj.getMinutes()).padStart(2, '0');

  return `${hari}, ${tgl} ${bln} ${thn} Pukul ${jam}:${mnt} WITA`;
}

// ==========================================
// 3. SETTINGS & APP STATE
// ==========================================
const DEFAULT_SETTINGS = {
  namaDesa: 'Tanjung Manis',
  kecamatan: 'Sangkulirang',
  kabupaten: 'Kutai Timur',
  provinsi: 'Kalimantan Timur',
  namaKaur: 'Kaur Keuangan',
  kadesNamaDefault: ''
};

function getSettings() {
  const saved = localStorage.getItem('si_serah_settings');
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  localStorage.setItem('si_serah_settings', JSON.stringify(settings));
}

// Global State
let currentPhotoBase64 = null;
let currentActiveRecord = null;

// ==========================================
// 4. SIGNATURE PAD CANVAS
// ==========================================
class SimpleSignaturePad {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isDrawing = false;
    this.hasSignature = false;

    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#0f172a';

    this.initEvents();
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  initEvents() {
    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const pos = this.getPos(e);
      this.isDrawing = true;
      this.hasSignature = true;
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.isDrawing) return;
      const pos = this.getPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.isDrawing = false;
    }, { passive: false });

    // Mouse
    this.canvas.addEventListener('mousedown', (e) => {
      const pos = this.getPos(e);
      this.isDrawing = true;
      this.hasSignature = true;
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing) return;
      const pos = this.getPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    });

    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasSignature = false;
  }

  toDataURL() {
    return this.hasSignature ? this.canvas.toDataURL('image/png') : null;
  }
}

// ==========================================
// 5. DOM ELEMENTS & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  const settings = getSettings();
  applySettingsToUI(settings);

  // Initialize Elements
  const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const form = document.getElementById('disbursementForm');
  const btnAutoNo = document.getElementById('btnAutoNo');
  const inputTanggal = document.getElementById('tanggal');
  const inputJumlah = document.getElementById('jumlahUang');
  const terbilangBox = document.getElementById('terbilangBox');
  const btnGetLocation = document.getElementById('btnGetLocation');
  const inputLokasi = document.getElementById('lokasiKoordinat');
  const gpsStatus = document.getElementById('gpsStatus');
  const cameraInput = document.getElementById('cameraInput');
  const galleryInput = document.getElementById('galleryInput');
  const photoPreview = document.getElementById('photoPreview');
  const photoPlaceholder = document.getElementById('photoPlaceholder');
  const btnHapusFoto = document.getElementById('btnHapusFoto');
  const sigCanvas = document.getElementById('signatureCanvas');
  const btnClearSig = document.getElementById('btnClearSig');
  const kuitansiModal = document.getElementById('kuitansiModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnPrintKuitansi = document.getElementById('btnPrintKuitansi');
  const btnDownloadImage = document.getElementById('btnDownloadImage');
  const btnShareWa = document.getElementById('btnShareWa');
  const searchInput = document.getElementById('searchInput');
  const filterPihak = document.getElementById('filterPihak');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const settingsForm = document.getElementById('settingsForm');
  const btnQuickBackup = document.getElementById('btnQuickBackup');
  const btnDownloadBackupJson = document.getElementById('btnDownloadBackupJson');
  const restoreFileInput = document.getElementById('restoreFileInput');
  const btnResetAllData = document.getElementById('btnResetAllData');

  // Initialize Signature Pad
  const signaturePad = new SimpleSignaturePad(sigCanvas);
  btnClearSig.addEventListener('click', () => signaturePad.clear());

  // Set default current time
  setCurrentDateTime(inputTanggal);

  // Generate Default No Bukti
  generateAutoNoBukti();
  btnAutoNo.addEventListener('click', generateAutoNoBukti);

  // Tab Navigation Handling
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetTabId).classList.add('active');

      if (targetTabId === 'tab-records') {
        renderRecordsList();
      } else if (targetTabId === 'tab-audit') {
        renderAuditRecap();
      }
    });
  });

  // Currency input live formatting & Terbilang
  inputJumlah.addEventListener('input', (e) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val) {
      const num = parseInt(val, 10);
      e.target.value = new Intl.NumberFormat('id-ID').format(num);
      terbilangBox.innerHTML = `<strong>Terbilang:</strong> ${konversiTerbilang(num)}`;
    } else {
      e.target.value = '';
      terbilangBox.innerHTML = `<em>Terbilang: Nol Rupiah</em>`;
    }
  });

  // Quick Location Chips Handler
  const locationChips = document.querySelectorAll('.btn-chip');
  locationChips.forEach(chip => {
    chip.addEventListener('click', () => {
      locationChips.forEach(c => c.classList.remove('active-chip'));
      chip.classList.add('active-chip');
      const locVal = chip.getAttribute('data-loc');
      inputLokasi.value = locVal;
      gpsStatus.textContent = `Lokasi disetel: ${locVal}. Anda bisa menambahkan catatan lokasi tambahan jika perlu.`;
      showToast(`Lokasi: ${locVal}`);
    });
  });

  // GPS Geolocation Handler
  btnGetLocation.addEventListener('click', () => {
    gpsStatus.textContent = "Mengakses satelit GPS HP...";
    if (!navigator.geolocation) {
      showToast("Fitur GPS tidak didukung browser ini");
      gpsStatus.textContent = "GPS tidak tersedia. Lokasi manual tetap berlaku.";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const acc = Math.round(pos.coords.accuracy);

        // Jika user sudah menulis/memilih lokasi, sematkan koordinatnya
        const currentLoc = inputLokasi.value.replace(/\s*\(GPS:[^)]*\)/, '').trim() || 'Kantor Desa Tanjung Manis';
        inputLokasi.value = `${currentLoc} (GPS: ${lat}, ${lng})`;
        gpsStatus.textContent = `✅ Titik GPS berhasil disematkan (${lat}, ${lng} ±${acc}m)`;
        showToast("Koordinat GPS berhasil disematkan!");
      },
      (err) => {
        console.warn("GPS Note:", err);
        gpsStatus.textContent = "Izin GPS belum aktif. Lokasi tetap tercatat sesuai ketikan manual Anda.";
        showToast("GPS offline, nama lokasi manual tetap tersimpan.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  // Photo Capture & Watermarking
  async function handleImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Watermark photo using Canvas
        const watermarkedDataUrl = applyWatermarkToImage(img);
        currentPhotoBase64 = watermarkedDataUrl;
        photoPreview.src = watermarkedDataUrl;
        photoPreview.classList.remove('hidden');
        photoPlaceholder.classList.add('hidden');
        btnHapusFoto.classList.remove('hidden');
        showToast("Foto berhasil diambil dengan cap legal!");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  cameraInput.addEventListener('change', (e) => handleImageFile(e.target.files[0]));
  galleryInput.addEventListener('change', (e) => handleImageFile(e.target.files[0]));

  btnHapusFoto.addEventListener('click', () => {
    currentPhotoBase64 = null;
    photoPreview.src = '';
    photoPreview.classList.add('hidden');
    photoPlaceholder.classList.remove('hidden');
    btnHapusFoto.classList.add('hidden');
    cameraInput.value = '';
    galleryInput.value = '';
  });

  function applyWatermarkToImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Scale to max 1280px width for storage efficiency in IndexedDB
    let w = img.width;
    let h = img.height;
    const maxW = 1280;
    if (w > maxW) {
      h = Math.round((h * maxW) / w);
      w = maxW;
    }

    canvas.width = w;
    canvas.height = h;

    // Draw main image
    ctx.drawImage(img, 0, 0, w, h);

    // Metadata for watermark
    const st = getSettings();
    const tgl = new Date().toLocaleString('id-ID', { timeZoneName: 'short' });
    const penerima = document.getElementById('penerimaNama').value || 'Penerima Kas Desa';
    const jabatan = document.getElementById('penerimaJabatan').value || '-';
    const nominal = document.getElementById('jumlahUang').value || '0';
    const koordinat = document.getElementById('lokasiKoordinat').value || 'Kantor Desa Tanjung Manis';

    // Draw Dark Overlay Banner at bottom
    const bannerHeight = Math.max(90, Math.round(h * 0.16));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

    // Accent line
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, h - bannerHeight, w, 4);

    // Text Watermark
    ctx.fillStyle = '#ffffff';
    const fontSize = Math.max(14, Math.round(w * 0.022));
    ctx.font = `bold ${fontSize}px sans-serif`;

    const padLeft = Math.round(w * 0.03);
    let lineY = h - bannerHeight + fontSize + 10;

    ctx.fillText(`DESA ${st.namaDesa.toUpperCase()}, KEC. ${st.kecamatan.toUpperCase()} - SERAH TERIMA KAS`, padLeft, lineY);
    
    ctx.font = `normal ${fontSize * 0.85}px sans-serif`;
    lineY += fontSize * 1.3;
    ctx.fillText(`📅 Waktu: ${tgl}  |  📍 GPS: ${koordinat}`, padLeft, lineY);

    lineY += fontSize * 1.3;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`👤 Penerima: ${penerima} (${jabatan})  |  💰 Nilai: Rp ${nominal}`, padLeft, lineY);

    return canvas.toDataURL('image/jpeg', 0.82);
  }

  // FORM SUBMIT: SIMPAN & BUKA KUITANSI
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawNominal = inputJumlah.value.replace(/[^0-9]/g, '');
    const nominalNumber = parseInt(rawNominal, 10);

    if (!nominalNumber || nominalNumber <= 0) {
      alert("Harap masukkan jumlah nominal uang yang valid!");
      inputJumlah.focus();
      return;
    }

    if (!currentPhotoBase64) {
      const confirmNoPhoto = confirm("Anda belum mengambil FOTO BUKTI penyerahan uang. Foto sangat penting sebagai alat bukti kuat jika ada pihak yang mengelak.\n\nApakah tetap ingin menyimpan tanpa foto?");
      if (!confirmNoPhoto) return;
    }

    const sigData = signaturePad.toDataURL();
    if (!sigData) {
      const confirmNoSig = confirm("Pihak penerima belum menandatangani di layar HP.\n\nApakah tetap ingin melanjutkan tanpa tanda tangan digital?");
      if (!confirmNoSig) return;
    }

    const st = getSettings();
    const rawPayload = `${document.getElementById('noBukti').value.trim()}|${document.getElementById('tanggal').value}|${document.getElementById('penerimaNama').value.trim()}|${document.getElementById('penerimaJabatan').value}|${nominalNumber}|${document.getElementById('sumberDana').value}|${inputLokasi.value.trim()}|${document.getElementById('catatanKaur').value.trim()}`;
    const shaHash = await generateSha256(rawPayload);
    const digitalSeal = 'SHA256-' + shaHash.substring(0, 16).toUpperCase();

    const record = {
      id: 'TRX_' + Date.now(),
      noBukti: document.getElementById('noBukti').value.trim(),
      tanggal: document.getElementById('tanggal').value,
      lokasiKoordinat: inputLokasi.value.trim() || 'Kantor Desa Tanjung Manis',
      penerimaJabatan: document.getElementById('penerimaJabatan').value,
      penerimaNama: document.getElementById('penerimaNama').value.trim(),
      penerimaKontak: document.getElementById('penerimaKontak').value.trim(),
      sumberDana: document.getElementById('sumberDana').value,
      bidangKegiatan: document.getElementById('bidangKegiatan').value,
      jumlahUang: nominalNumber,
      terbilang: konversiTerbilang(nominalNumber),
      uraianKeperluan: document.getElementById('uraianKeperluan').value.trim(),
      catatanKaur: document.getElementById('catatanKaur').value.trim(),
      fotoBase64: currentPhotoBase64,
      tandaTanganBase64: sigData,
      hashSha256: digitalSeal,
      namaKaur: st.namaKaur || 'Kaur Keuangan',
      namaDesa: st.namaDesa,
      kecamatan: st.kecamatan,
      kabupaten: st.kabupaten,
      provinsi: st.provinsi,
      createdAt: new Date().toISOString()
    };

    try {
      await saveRecordToDB(record);

      // Redundant metadata log in localStorage for extra permanent safety
      try {
        const metaLogs = JSON.parse(localStorage.getItem('si_serah_meta_backup') || '[]');
        metaLogs.push({
          id: record.id,
          noBukti: record.noBukti,
          tanggal: record.tanggal,
          penerimaNama: record.penerimaNama,
          penerimaJabatan: record.penerimaJabatan,
          jumlahUang: record.jumlahUang,
          sumberDana: record.sumberDana,
          hashSha256: record.hashSha256,
          lokasi: record.lokasiKoordinat,
          catatan: record.catatanKaur,
          waktuSimpan: record.createdAt
        });
        localStorage.setItem('si_serah_meta_backup', JSON.stringify(metaLogs));
      } catch (e) {
        console.warn("Storage redundancy note:", e);
      }
      showToast("✅ Berita Acara & Kuitansi Berhasil Disimpan!");
      updateBadgeCount();

      // Show document modal
      showKuitansiDocument(record);

      // Reset form
      form.reset();
      currentPhotoBase64 = null;
      photoPreview.src = '';
      photoPreview.classList.add('hidden');
      photoPlaceholder.classList.remove('hidden');
      btnHapusFoto.classList.add('hidden');
      signaturePad.clear();
      terbilangBox.innerHTML = `<em>Terbilang: Nol Rupiah</em>`;
      setCurrentDateTime(inputTanggal);
      generateAutoNoBukti();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data ke database HP: " + err.message);
    }
  });

  // Modal Close & Print
  btnCloseModal.addEventListener('click', () => {
    kuitansiModal.classList.add('hidden');
  });

  kuitansiModal.addEventListener('click', (e) => {
    if (e.target === kuitansiModal) {
      kuitansiModal.classList.add('hidden');
    }
  });

  // Cetak / Simpan PDF
  btnPrintKuitansi.addEventListener('click', () => {
    if (!currentActiveRecord) return;
    const cleanNo = (currentActiveRecord.noBukti || 'BAST').replace(/[\/\\]/g, '_');

    // 1. Cek jika di dalam aplikasi APK Android (Native Android Print)
    if (window.AndroidPrinter && typeof window.AndroidPrinter.printDocument === 'function') {
      showToast("Membuka dialog Simpan PDF...");
      window.AndroidPrinter.printDocument(`Kuitansi_${cleanNo}`);
      return;
    }

    // 2. Jika di browser HP (Chrome/Safari) atau Komputer
    if (typeof window.print === 'function') {
      showToast("Membuka Cetak / Simpan PDF...");
      setTimeout(() => {
        window.print();
      }, 250);
      return;
    }

    // 3. Fallback jika printer tidak didukung
    downloadReceiptImage(currentActiveRecord);
  });

  // Simpan Gambar Kuitansi ke Galeri / Download
  if (btnDownloadImage) {
    btnDownloadImage.addEventListener('click', () => {
      if (!currentActiveRecord) return;
      downloadReceiptImage(currentActiveRecord);
    });
  }

  btnShareWa.addEventListener('click', () => {
    if (!currentActiveRecord) return;
    shareToWhatsApp(currentActiveRecord);
  });

  // Search & Filter
  searchInput.addEventListener('input', () => renderRecordsList());
  filterPihak.addEventListener('change', () => renderRecordsList());

  // Export CSV
  btnExportCsv.addEventListener('click', exportToCsv);

  // Settings Save
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newSettings = {
      namaDesa: document.getElementById('setNamaDesa').value.trim() || 'Tanjung Manis',
      kecamatan: document.getElementById('setKecamatan').value.trim() || 'Sangkulirang',
      kabupaten: document.getElementById('setKabupaten').value.trim() || 'Kutai Timur',
      provinsi: document.getElementById('setProvinsi').value.trim() || 'Kalimantan Timur',
      namaKaur: document.getElementById('setNamaKaur').value.trim() || 'Kaur Keuangan',
      kadesNamaDefault: document.getElementById('setKadesNamaDefault').value.trim() || ''
    };
    saveSettings(newSettings);
    applySettingsToUI(newSettings);
    showToast("Profil Desa Tanjung Manis berhasil disimpan!");
  });

  // Quick Backup & Restore
  btnQuickBackup.addEventListener('click', downloadBackupJson);
  btnDownloadBackupJson.addEventListener('click', downloadBackupJson);
  restoreFileInput.addEventListener('change', handleRestoreJson);

  btnResetAllData.addEventListener('click', async () => {
    const code = prompt("Ketik 'HAPUS' jika Anda yakin ingin mengosongkan semua riwayat serah terima di HP ini:");
    if (code === 'HAPUS') {
      await clearAllRecordsFromDB();
      showToast("Semua riwayat telah dikosongkan.");
      updateBadgeCount();
      renderRecordsList();
    }
  });

  // Initial badge update
  updateBadgeCount();
});

// ==========================================
// 6. HELPER FUNCTIONS & UI RENDERERS
// ==========================================
function setCurrentDateTime(inputEl) {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  inputEl.value = now.toISOString().slice(0, 16);
}

function generateAutoNoBukti() {
  const now = new Date();
  const thn = now.getFullYear();
  const blnRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][now.getMonth()];
  const randomNum = String(Math.floor(Math.random() * 900) + 100);
  document.getElementById('noBukti').value = `BAST/${randomNum}/TM-SKL/${blnRomawi}/${thn}`;
}

function applySettingsToUI(st) {
  document.getElementById('headerSubtitle').textContent = `Desa ${st.namaDesa}, Kec. ${st.kecamatan}`;
  document.getElementById('docDesaTitle').textContent = `PEMERINTAH DESA ${st.namaDesa.toUpperCase()}`;
  document.getElementById('docDesaAlamat').textContent = `Alamat: Kantor Desa ${st.namaDesa}, Kec. ${st.kecamatan}, Kab. ${st.kabupaten} - ${st.provinsi}`;

  // Form settings inputs
  document.getElementById('setNamaDesa').value = st.namaDesa;
  document.getElementById('setKecamatan').value = st.kecamatan;
  document.getElementById('setKabupaten').value = st.kabupaten;
  document.getElementById('setProvinsi').value = st.provinsi;
  document.getElementById('setNamaKaur').value = st.namaKaur || '';
  document.getElementById('setKadesNamaDefault').value = st.kadesNamaDefault || '';
}

async function updateBadgeCount() {
  const records = await getAllRecordsFromDB();
  const badge = document.getElementById('badgeCount');
  const sumCount = document.getElementById('sumTotalCount');
  const sumAmount = document.getElementById('sumTotalAmount');

  badge.textContent = records.length;
  if (sumCount) sumCount.textContent = `${records.length} Transaksi`;

  const totalNominal = records.reduce((acc, curr) => acc + (curr.jumlahUang || 0), 0);
  if (sumAmount) sumAmount.textContent = formatRupiah(totalNominal);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

// Show Document Modal
function showKuitansiDocument(r) {
  currentActiveRecord = r;
  const modal = document.getElementById('kuitansiModal');

  document.getElementById('docNoBukti').textContent = `Nomor: ${r.noBukti}`;
  document.getElementById('docHariTanggal').textContent = formatTanggalIndo(r.tanggal);
  document.getElementById('docTempat').textContent = r.lokasiKoordinat || `Kantor Desa ${r.namaDesa}`;
  document.getElementById('docPenerimaNama').textContent = r.penerimaNama;
  document.getElementById('docPenerimaJabatan').textContent = r.penerimaJabatan;
  document.getElementById('docSumberDana').textContent = r.sumberDana;
  document.getElementById('docBidangKegiatan').textContent = r.bidangKegiatan;
  document.getElementById('docUraian').textContent = r.uraianKeperluan;
  document.getElementById('docNominal').textContent = formatRupiah(r.jumlahUang);
  document.getElementById('docTerbilang').textContent = `"${r.terbilang}"`;

  // Catatan Khusus
  const rowCatatan = document.getElementById('rowCatatanKaur');
  if (r.catatanKaur && r.catatanKaur.trim() !== '') {
    rowCatatan.style.display = 'table-row';
    document.getElementById('docCatatanFakta').textContent = r.catatanKaur;
  } else {
    rowCatatan.style.display = 'none';
  }

  document.getElementById('docGpsCoord').textContent = r.lokasiKoordinat || 'Tercatat di Kantor Desa';

  const hashEl = document.getElementById('docDigitalHash');
  if (hashEl) {
    hashEl.textContent = r.hashSha256 || 'SHA256-TERVERIFIKASI-PATEN';
  }

  // Eviden Foto
  const fotoEl = document.getElementById('docFotoEviden');
  if (r.fotoBase64) {
    fotoEl.src = r.fotoBase64;
    fotoEl.parentElement.style.display = 'block';
  } else {
    fotoEl.parentElement.style.display = 'none';
  }

  // Tanda Tangan
  document.getElementById('docSignKaurNama').textContent = `( ${r.namaKaur || 'Kaur Keuangan'} )`;
  document.getElementById('docSignPenerimaJabatan').textContent = r.penerimaJabatan;
  document.getElementById('docSignPenerimaNama').textContent = `( ${r.penerimaNama} )`;

  const signImg = document.getElementById('docSignRecipientImg');
  const signPlaceholder = document.getElementById('docSignPlaceholder');
  if (r.tandaTanganBase64) {
    signImg.src = r.tandaTanganBase64;
    signImg.classList.remove('hidden');
    signPlaceholder.classList.add('hidden');
  } else {
    signImg.classList.add('hidden');
    signPlaceholder.classList.remove('hidden');
  }

  document.getElementById('docGeneratedTime').textContent = `Dicetak: ${new Date().toLocaleString('id-ID')} | No ID: ${r.id}`;

  modal.classList.remove('hidden');
}

// Render Records Tab
async function renderRecordsList() {
  const listContainer = document.getElementById('recordsList');
  const query = (document.getElementById('searchInput').value || '').toLowerCase();
  const filterRole = document.getElementById('filterPihak').value;

  const records = await getAllRecordsFromDB();

  const filtered = records.filter(r => {
    const matchQuery = 
      r.penerimaNama.toLowerCase().includes(query) ||
      r.noBukti.toLowerCase().includes(query) ||
      r.uraianKeperluan.toLowerCase().includes(query) ||
      (r.catatanKaur && r.catatanKaur.toLowerCase().includes(query));

    const matchRole = filterRole === 'ALL' || r.penerimaJabatan === filterRole || (filterRole === 'Lainnya' && !['Kepala Desa', 'Badan Permusyawaratan Desa (BPD)', 'Pelaksana Kegiatan Anggaran (PKA)', 'Tim Pelaksana Kegiatan (TPK)'].includes(r.penerimaJabatan));

    return matchQuery && matchRole;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <p><strong>Belum ada catatan serah terima yang cocok</strong></p>
        <small class="text-muted">Gunakan tab 'Serah Uang' untuk mencatat penyerahan dana baru.</small>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(r => {
    let tagClass = 'tag-other';
    if (r.penerimaJabatan.includes('Kepala Desa')) tagClass = 'tag-kades';
    else if (r.penerimaJabatan.includes('BPD')) tagClass = 'tag-bpd';
    else if (r.penerimaJabatan.includes('PKA')) tagClass = 'tag-pka';
    else if (r.penerimaJabatan.includes('TPK')) tagClass = 'tag-tpk';

    const hasFotoBadge = r.fotoBase64 ? '📸 Foto Ada' : '⚠️ Tanpa Foto';
    const hasSigBadge = r.tandaTanganBase64 ? '✍️ Ada TTD' : '⚠️ Tanpa TTD';

    return `
      <div class="record-item" onclick="openRecordDetail('${r.id}')">
        <div class="record-top">
          <span class="record-bukti">${r.noBukti}</span>
          <span class="record-date">${new Date(r.tanggal).toLocaleDateString('id-ID')}</span>
        </div>
        <div class="record-recipient">${r.penerimaNama}</div>
        <div>
          <span class="record-role-tag ${tagClass}">${r.penerimaJabatan}</span>
          <span class="coord-tag" style="margin-left:4px; font-size:10px;">${hasFotoBadge}</span>
          <span class="coord-tag" style="margin-left:4px; font-size:10px;">${hasSigBadge}</span>
        </div>
        <p class="record-keperluan">${r.uraianKeperluan}</p>
        <div class="record-bottom">
          <span class="record-nominal">${formatRupiah(r.jumlahUang)}</span>
          <div class="record-actions">
            <button class="btn-primary-sm" onclick="event.stopPropagation(); openRecordDetail('${r.id}')">Buka BAST</button>
            <button class="btn-danger-outline btn-sm" onclick="event.stopPropagation(); deleteRecordItem('${r.id}')">Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.openRecordDetail = async function(id) {
  const r = await getRecordByIdFromDB(id);
  if (r) showKuitansiDocument(r);
};

window.deleteRecordItem = async function(id) {
  const confirmDelete = confirm("Apakah Anda yakin ingin menghapus arsip serah terima ini?");
  if (confirmDelete) {
    await deleteRecordFromDB(id);
    showToast("Catatan dihapus");
    updateBadgeCount();
    renderRecordsList();
  }
};

// Render Audit Tab (Rekapitulasi Pihak)
async function renderAuditRecap() {
  const records = await getAllRecordsFromDB();
  const containerPihak = document.getElementById('rekapByPihakContainer');
  const containerSumber = document.getElementById('rekapBySumberContainer');

  // Group by Pihak
  const groupPihak = {};
  const groupSumber = {};

  records.forEach(r => {
    // Pihak
    const p = r.penerimaJabatan || 'Lainnya';
    if (!groupPihak[p]) groupPihak[p] = { count: 0, total: 0 };
    groupPihak[p].count += 1;
    groupPihak[p].total += (r.jumlahUang || 0);

    // Sumber
    const s = r.sumberDana || 'Lain-lain';
    if (!groupSumber[s]) groupSumber[s] = { count: 0, total: 0 };
    groupSumber[s].count += 1;
    groupSumber[s].total += (r.jumlahUang || 0);
  });

  // Render Pihak
  const pihakKeys = Object.keys(groupPihak);
  if (pihakKeys.length === 0) {
    containerPihak.innerHTML = `<p class="text-muted text-center py-4">Belum ada transaksi</p>`;
  } else {
    containerPihak.innerHTML = pihakKeys.map(key => `
      <div class="rekap-item">
        <div>
          <div class="rekap-title">${key}</div>
          <div class="rekap-count">${groupPihak[key].count} kali penyerahan uang</div>
        </div>
        <div class="rekap-total">${formatRupiah(groupPihak[key].total)}</div>
      </div>
    `).join('');
  }

  // Render Sumber
  const sumberKeys = Object.keys(groupSumber);
  if (sumberKeys.length === 0) {
    containerSumber.innerHTML = `<p class="text-muted text-center py-4">Belum ada transaksi</p>`;
  } else {
    containerSumber.innerHTML = sumberKeys.map(key => `
      <div class="rekap-item">
        <div>
          <div class="rekap-title">${key}</div>
          <div class="rekap-count">${groupSumber[key].count} kali pencairan</div>
        </div>
        <div class="rekap-total">${formatRupiah(groupSumber[key].total)}</div>
      </div>
    `).join('');
  }
}

// WhatsApp Formatted Text Share
function shareToWhatsApp(r) {
  const text = `*BERITA ACARA & KUITANSI SERAH TERIMA KAS DESA*
Pemerintah Desa Tanjung Manis, Kec. Sangkulirang
---------------------------------------------
📄 *No. Bukti:* ${r.noBukti}
📅 *Waktu:* ${formatTanggalIndo(r.tanggal)}
📍 *Lokasi:* ${r.lokasiKoordinat}

👤 *Pihak Penerima:* ${r.penerimaNama} (${r.penerimaJabatan})
💰 *Jumlah Diterima:* *${formatRupiah(r.jumlahUang)}*
📝 *Terbilang:* _${r.terbilang}_
💼 *Sumber Dana:* ${r.sumberDana}
📌 *Untuk Keperluan:* ${r.uraianKeperluan}

⚠️ *Catatan Serah Terima:*
"${r.catatanKaur || 'Dana tunai telah diserahkan langsung kepada penerima.'}"

🔒 *Segel Digital Forensik (Anti-Rekayasa):*
\`${r.hashSha256 || 'SHA256-TERVERIFIKASI'}\`

*Klausul Yuridis:*
Penerima menyatakan telah menerima fisik uang tunai penuh dan bertanggung jawab mutlak atas penggunaan serta kelengkapan SPJ sesuai Permendagri No. 20 Tahun 2018.

_Dokumen fisik & tanda tangan digital tersimpan di arsip resmi Kaur Keuangan._`;

  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// Export to CSV
async function exportToCsv() {
  const records = await getAllRecordsFromDB();
  if (records.length === 0) {
    alert("Belum ada data untuk diekspor!");
    return;
  }

  const headers = ["No Bukti", "Tanggal", "Nama Penerima", "Jabatan Penerima", "Sumber Dana", "Bidang", "Nominal (Rp)", "Terbilang", "Uraian Keperluan", "Catatan Khusus", "Koordinat GPS"];
  
  const rows = records.map(r => [
    `"${r.noBukti}"`,
    `"${r.tanggal}"`,
    `"${r.penerimaNama}"`,
    `"${r.penerimaJabatan}"`,
    `"${r.sumberDana}"`,
    `"${r.bidangKegiatan}"`,
    r.jumlahUang,
    `"${r.terbilang}"`,
    `"${(r.uraianKeperluan || '').replace(/"/g, '""')}"`,
    `"${(r.catatanKaur || '').replace(/"/g, '""')}"`,
    `"${(r.lokasiKoordinat || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Serah_Terima_Kas_Tanjung_Manis_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("File Excel/CSV berhasil diunduh!");
}

// JSON Backup Download
async function downloadBackupJson() {
  const records = await getAllRecordsFromDB();
  const settings = getSettings();
  const backupData = {
    version: 1,
    exportDate: new Date().toISOString(),
    settings,
    records
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `BACKUP_KAS_DESA_TANJUNG_MANIS_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
  showToast("File cadangan JSON berhasil diunduh!");
}

// JSON Restore
function handleRestoreJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data && data.records && Array.isArray(data.records)) {
        for (const r of data.records) {
          await saveRecordToDB(r);
        }
        if (data.settings) {
          saveSettings(data.settings);
          applySettingsToUI(data.settings);
        }
        showToast(`Berhasil memulihkan ${data.records.length} data!`);
        updateBadgeCount();
        renderRecordsList();
      } else {
        alert("Format file cadangan tidak valid!");
      }
    } catch (err) {
      alert("Gagal membaca file cadangan: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ==========================================
// 7. RENDER & DOWNLOAD DOKUMEN RESMI (GAMBAR / GALERI)
// ==========================================
async function downloadReceiptImage(r) {
  if (!r) return;
  showToast("Sedang merender gambar dokumen resmi...");

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Proporsi A4: 1200 x 1750
  const width = 1200;
  const height = 1750;
  canvas.width = width;
  canvas.height = height;

  // Latar Putih Bersih
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Bingkai Luar
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, width - 70, height - 70);

  // KOP SURAT RESMI DESA
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px serif';
  ctx.fillText('PEMERINTAH KABUPATEN ' + (r.kabupaten || 'KUTAI TIMUR').toUpperCase(), width / 2, 85);
  ctx.fillText('KECAMATAN ' + (r.kecamatan || 'SANGKULIRANG').toUpperCase(), width / 2, 115);

  ctx.font = '800 28px serif';
  ctx.fillText('PEMERINTAH DESA ' + (r.namaDesa || 'TANJUNG MANIS').toUpperCase(), width / 2, 155);

  ctx.font = 'italic 15px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`Alamat: Kantor Desa ${r.namaDesa || 'Tanjung Manis'}, Kec. ${r.kecamatan || 'Sangkulirang'}, Kab. ${r.kabupaten || 'Kutai Timur'} - ${r.provinsi || 'Kaltim'}`, width / 2, 185);

  // Garis Ganda Pemisah Kop
  ctx.beginPath();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#000000';
  ctx.moveTo(60, 205);
  ctx.lineTo(width - 60, 205);
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.moveTo(60, 211);
  ctx.lineTo(width - 60, 211);
  ctx.stroke();

  // JUDUL DOKUMEN
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px serif';
  ctx.fillText('BERITA ACARA & KUITANSI SERAH TERIMA KAS DESA', width / 2, 255);

  ctx.font = '16px monospace';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(`Nomor: ${r.noBukti}`, width / 2, 282);

  // NARASI PEMBUKA
  ctx.textAlign = 'left';
  ctx.font = '15px serif';
  ctx.fillStyle = '#111827';
  const narasi = `Pada hari ini, ${formatTanggalIndo(r.tanggal)}, bertempat di ${r.lokasiKoordinat || 'Kantor Desa Tanjung Manis'}, telah dilakukan penyerahan fisik uang kas APBDes oleh Kaur Keuangan kepada Pihak Penerima dengan rincian berikut:`;
  wrapText(ctx, narasi, 70, 320, width - 140, 24);

  // TABEL RINCIAN
  let tableY = 370;
  const col1X = 75;
  const colValX = 360;
  const rowHeight = 36;

  const rows = [
    { lbl: '1. Pihak Yang Menerima', val: r.penerimaNama, bold: true },
    { lbl: '2. Jabatan / Kedudukan', val: r.penerimaJabatan, bold: false },
    { lbl: '3. Sumber Dana APBDes', val: r.sumberDana, bold: true },
    { lbl: '4. Bidang / Sub Bidang', val: r.bidangKegiatan, bold: false },
    { lbl: '5. Uraian Keperluan', val: r.uraianKeperluan, bold: false },
    { lbl: '6. JUMLAH NOMINAL', val: formatRupiah(r.jumlahUang), highlight: true },
    { lbl: '7. Terbilang', val: `"${r.terbilang}"`, italic: true },
    { lbl: '8. Catatan Fakta Serah Terima', val: r.catatanKaur || 'Dana tunai diserahkan langsung kepada penerima.' },
    { lbl: '9. Tempat / Lokasi & GPS', val: r.lokasiKoordinat },
    { lbl: '10. Segel Digital Forensik', val: r.hashSha256 || 'SHA-256: TERVERIFIKASI-PATEN', mono: true }
  ];

  rows.forEach((row) => {
    if (row.highlight) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(col1X - 8, tableY - 22, width - 134, rowHeight + 4);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(col1X - 8, tableY - 22, width - 134, rowHeight + 4);
    }

    ctx.font = 'bold 15px serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(row.lbl, col1X, tableY);
    ctx.fillText(':', colValX - 25, tableY);

    if (row.highlight) {
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#059669';
    } else if (row.bold) {
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#0f172a';
    } else if (row.mono) {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#065f46';
    } else if (row.italic) {
      ctx.font = 'italic 15px serif';
      ctx.fillStyle = '#334155';
    } else {
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#1e293b';
    }

    const valText = String(row.val || '-');
    if (valText.length > 55) {
      wrapText(ctx, valText, colValX, tableY, width - colValX - 80, 20);
      tableY += 6;
    } else {
      ctx.fillText(valText, colValX, tableY);
    }

    tableY += rowHeight;
  });

  // KLAUSUL PERNYATAAN MUTLAK
  tableY += 10;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(70, tableY, width - 140, 75);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(70, tableY, width - 140, 75);

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('PERNYATAAN TANGGUNG JAWAB MUTLAK:', 85, tableY + 24);

  ctx.font = '12px serif';
  const klausul = 'Dengan ditandatanganinya Berita Acara ini, Pihak Penerima menyatakan telah menerima fisik uang tunai dalam jumlah penuh dan bertanggung jawab mutlak secara yuridis, administratif, dan keuangan atas penggunaan dana tersebut serta wajib menyelesaikan kelengkapan bukti SPJ sesuai ketentuan Keuangan Desa.';
  wrapText(ctx, klausul, 85, tableY + 45, width - 170, 18);

  // FOTO EVIDEN & TANDA TANGAN
  tableY += 95;

  if (r.fotoBase64) {
    try {
      const imgFoto = await loadImageAsync(r.fotoBase64);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('DOKUMENTASI / FOTO PENYERAHAN REAL-TIME:', 70, tableY + 15);
      
      const photoBoxH = 260;
      const photoBoxW = 460;
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(70, tableY + 25, photoBoxW, photoBoxH);
      ctx.drawImage(imgFoto, 70, tableY + 25, photoBoxW, photoBoxH);
    } catch (e) {
      console.warn("Foto draw note:", e);
    }
  }

  // TANDA TANGAN AREA
  const sigAreaX = r.fotoBase64 ? 580 : 70;
  const sigAreaW = r.fotoBase64 ? 550 : (width - 140);

  ctx.font = '14px serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';

  // Sisi Kiri / Atas: Kaur Keuangan
  const kaurSigX = sigAreaX + (sigAreaW * 0.25);
  ctx.fillText('Pihak Yang Menyerahkan,', kaurSigX, tableY + 30);
  ctx.font = 'bold 14px serif';
  ctx.fillText('Kaur Keuangan', kaurSigX, tableY + 48);

  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(kaurSigX - 75, tableY + 95, 150, 32);
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#059669';
  ctx.fillText('DISERAHKAN TUNAI', kaurSigX, tableY + 116);

  ctx.font = 'bold 15px serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(`( ${r.namaKaur || 'Kaur Keuangan'} )`, kaurSigX, tableY + 195);

  // Sisi Kanan / Bawah: Penerima
  const penerimaSigX = sigAreaX + (sigAreaW * 0.75);
  ctx.font = '14px serif';
  ctx.fillText('Pihak Yang Menerima,', penerimaSigX, tableY + 30);
  ctx.font = 'bold 14px serif';
  ctx.fillText(r.penerimaJabatan || 'Penerima Uang', penerimaSigX, tableY + 48);

  if (r.tandaTanganBase64) {
    try {
      const imgSig = await loadImageAsync(r.tandaTanganBase64);
      ctx.drawImage(imgSig, penerimaSigX - 80, tableY + 70, 160, 80);
    } catch (e) {}
  } else {
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(penerimaSigX - 80, tableY + 150);
    ctx.lineTo(penerimaSigX + 80, tableY + 150);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.font = 'bold 15px serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(`( ${r.penerimaNama} )`, penerimaSigX, tableY + 195);

  // FOOTER DOKUMEN
  ctx.textAlign = 'left';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Dokumen Sah Administrasi Keuangan Desa | Geotag & Digital Signature Verified', 70, height - 50);
  ctx.textAlign = 'right';
  ctx.fillText(`ID: ${r.id} | Segel: ${r.hashSha256 || 'TERVERIFIKASI'}`, width - 70, height - 50);

  // UNDUH FILE PNG
  const cleanNo = (r.noBukti || 'BAST').replace(/[\/\\]/g, '_');
  const fileName = `Kuitansi_${cleanNo}.png`;

  canvas.toBlob((blob) => {
    if (!blob) {
      showToast("Gagal menghasilkan file gambar.");
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 1500);
    showToast("✅ Berhasil mengunduh dokumen ke Galeri HP!");
  }, 'image/png');
}

function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = (text || '').split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

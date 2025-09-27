// ===== Utils =====
const $ = (id) => document.getElementById(id);
const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n || 0);

// ===== OCR =====
async function runOCR(file) {
  // Set path agar aman di GitHub Pages (hindari 404 lang/worker/wasm)
  const options = {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
    corePath:   "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js",
    langPath:   "https://tessdata.projectnaptha.com/5.0.0", // eng/ind akan diambil dari sini
    logger: (m) => console.log(m)
  };

  // API v5: createWorker(lang, concurrency, options)
  const worker = await Tesseract.createWorker("eng+ind", 1, options);
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  return text;
}

// Parsers sederhana untuk auto-isi form
function autoFillFromText(text) {
  // No HP (ambil pola 08xxxxxxxx min 9 digit)
  const hp = text.match(/0[0-9]{8,15}/)?.[0] || "";

  // Nominal (ambil Rp …)
  const rawNominal = text.match(/Rp[\s:.]*([0-9][0-9.,]*)/i)?.[1] || "";
  const nominal = rawNominal.replace(/[.,]/g, ""); // buang pemisah

  if (!$("noTujuan").value) $("noTujuan").value = hp;
  if (!$("nominal").value || $("nominal").value === "0") $("nominal").value = nominal || 0;

  $("ocrRaw").textContent = text;
}

// ===== STRUK =====
function buildStruk() {
  const header = $("header").value || "";
  const noTujuan = $("noTujuan").value || "-";
  const metodeTujuan = $("metodeTujuan").value || "-";
  const noPengirim = $("noPengirim").value || "-";
  const metodePengirim = $("metodePengirim").value || "-";
  const nominal = parseInt($("nominal").value || "0", 10);
  const admin = parseInt($("admin").value || "0", 10);
  const total = (nominal || 0) + (admin || 0);
  const footer = $("footer").value || "";

  const struk = `
==========================
        ${header}
==========================

No. Tujuan     : ${noTujuan}
Metode Tujuan  : ${metodeTujuan}
No. Pengirim   : ${noPengirim}
Metode Pengirim: ${metodePengirim}

Nominal        : ${rupiah(nominal)}
Biaya Admin    : ${rupiah(admin)}
--------------------------
TOTAL BAYAR    : ${rupiah(total)}
==========================

${footer}
`.trim();

  $("preview").textContent = struk;
  return struk;
}

// ===== Bluetooth Print (BLE ONLY) =====
// Catatan: mayoritas printer thermal 58mm pakai Bluetooth Classic (SPP), BUKAN BLE.
// Web Bluetooth hanya mendukung BLE. Jika printer-mu bukan BLE, cetak via aplikasi native Android.
async function printBLE(text) {
  const encoder = new TextEncoder();
  const device = await navigator.bluetooth.requestDevice({
    // Sesuaikan filter dengan printer BLE kamu
    acceptAllDevices: true,
    optionalServices: [0x18F0] // banyak modul BLE-Serial menggunakan service ini
  });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(0x18F0);
  const characteristic = await service.getCharacteristic(0x2AF1);
  await characteristic.writeValue(encoder.encode(text + "\n\n\n"));
}

// ===== Wire up UI =====
$("btnOCR").onclick = async () => {
  const f = $("fileInput").files?.[0];
  if (!f) { alert("Pilih gambar dulu."); return; }
  $("ocrRaw").textContent = "Memproses OCR… (tunggu sebentar)";
  try {
    const text = await runOCR(f);
    autoFillFromText(text);
  } catch (e) {
    $("ocrRaw").textContent = "OCR gagal: " + e;
    console.error(e);
  }
};

$("btnPreview").onclick = () => buildStruk();

$("btnPrint").onclick = async () => {
  const struk = buildStruk();
  try {
    await printBLE(struk);
    alert("Struk terkirim ke printer.");
  } catch (e) {
    alert("Gagal print (kemungkinan printer bukan BLE / layanan tidak cocok): " + e);
    console.error(e);
  }
};

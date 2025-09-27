// OCR pakai Tesseract.js
function runOCR() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Pilih gambar dulu!");
    return;
  }

  Tesseract.recognize(
    file,
    'eng+ind',
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    document.getElementById("ocrResult").innerText = "Hasil OCR:\n" + text;

    // Parsing sederhana
    document.getElementById("noTujuan").value = text.match(/08[0-9]{8,}/)?.[0] || "";
    document.getElementById("nominal").value = (text.match(/Rp\W?([0-9.,]+)/)?.[1] || "").replace(/[.,]/g,"");
  });
}

// Format angka jadi Rupiah
function formatCurrency(num) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num);
}

// Preview Struk
function previewStruk() {
  const header = document.getElementById("header").value;
  const noTujuan = document.getElementById("noTujuan").value;
  const metodeTujuan = document.getElementById("metodeTujuan").value;
  const noPengirim = document.getElementById("noPengirim").value;
  const metodePengirim = document.getElementById("metodePengirim").value;
  const nominal = parseInt(document.getElementById("nominal").value) || 0;
  const admin = parseInt(document.getElementById("admin").value) || 0;
  const total = nominal + admin;
  const footer = document.getElementById("footer").value;

  const struk = `
==========================
       ${header}
==========================

No. Tujuan     : ${noTujuan}
Metode Tujuan  : ${metodeTujuan}
No. Pengirim   : ${noPengirim}
Metode Pengirim: ${metodePengirim}

Nominal        : ${formatCurrency(nominal)}
Biaya Admin    : ${formatCurrency(admin)}
--------------------------
TOTAL BAYAR    : ${formatCurrency(total)}
==========================

${footer}
`;

  document.getElementById("preview").textContent = struk;
  return struk;
}

// Print ke Bluetooth (ESC/POS)
async function printStruk() {
  const struk = previewStruk();
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Printer' }],
      optionalServices: [0x18F0]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(0x18F0);
    const characteristic = await service.getCharacteristic(0x2AF1);

    const encoder = new TextEncoder();
    await characteristic.writeValue(encoder.encode(struk + "\n\n\n"));

    alert("Struk terkirim ke printer!");
  } catch (e) {
    alert("Gagal print: " + e);
  }
}

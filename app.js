function formatCurrency(num) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num);
}

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

// Cetak via Web Bluetooth API (ESC/POS)
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

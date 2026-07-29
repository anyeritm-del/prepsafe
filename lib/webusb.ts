// USB device class code for "Printer" (see usb.org base class table).
const USB_PRINTER_CLASS = 7;

export interface PrinterConnection {
  device: USBDevice;
  interfaceNumber: number;
  endpointOut: number;
}

export function isWebUsbSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

/**
 * Finds the interface/endpoint to write raw TSPL bytes to. Prefers a
 * Printer-class (07) interface, but falls back to the first interface with
 * an OUT bulk endpoint for vendor-specific printers that don't declare the
 * standard class.
 */
function findPrintTarget(
  device: USBDevice,
): { interfaceNumber: number; endpointOut: number } | null {
  const config = device.configuration ?? device.configurations[0];
  if (!config) return null;

  let fallback: { interfaceNumber: number; endpointOut: number } | null = null;

  for (const iface of config.interfaces) {
    const alt = iface.alternates[0];
    if (!alt) continue;
    const outEndpoint = alt.endpoints.find((e) => e.direction === "out");
    if (!outEndpoint) continue;

    const candidate = {
      interfaceNumber: iface.interfaceNumber,
      endpointOut: outEndpoint.endpointNumber,
    };

    if (alt.interfaceClass === USB_PRINTER_CLASS) {
      return candidate;
    }
    if (!fallback) fallback = candidate;
  }

  return fallback;
}

class WebUsbDriverError extends Error {
  constructor(cause: unknown) {
    super(
      "Tidak bisa mengambil alih koneksi ke printer. Di Windows, ini biasanya " +
        "karena driver bawaan 'USB Printing Support' masih menguasai perangkat. " +
        "Ganti driver khusus untuk printer ini ke WinUSB memakai Zadig (lihat README), " +
        "lalu coba hubungkan ulang.",
      { cause },
    );
    this.name = "WebUsbDriverError";
  }
}

async function openAndClaim(device: USBDevice): Promise<PrinterConnection> {
  if (!device.opened) {
    await device.open();
  }
  if (!device.configuration) {
    await device.selectConfiguration(1);
  }

  const target = findPrintTarget(device);
  if (!target) {
    throw new Error(
      "Tidak menemukan endpoint output pada printer ini. Pastikan perangkat yang dipilih benar.",
    );
  }

  try {
    await device.claimInterface(target.interfaceNumber);
  } catch (cause) {
    throw new WebUsbDriverError(cause);
  }

  return {
    device,
    interfaceNumber: target.interfaceNumber,
    endpointOut: target.endpointOut,
  };
}

/** Opens the browser's device picker so the user can authorize the printer. */
export async function requestAndConnectPrinter(): Promise<PrinterConnection> {
  if (!isWebUsbSupported()) {
    throw new Error(
      "Browser ini tidak mendukung WebUSB. Gunakan Chrome atau Edge versi terbaru.",
    );
  }
  const device = await navigator.usb.requestDevice({ filters: [] });
  return openAndClaim(device);
}

/**
 * Reconnects to a printer the user has previously authorized, without
 * showing the device picker. Call this on page load so the user doesn't
 * have to reconnect on every visit.
 */
export async function reconnectPrinter(): Promise<PrinterConnection | null> {
  if (!isWebUsbSupported()) return null;
  const devices = await navigator.usb.getDevices();
  if (devices.length === 0) return null;
  try {
    return await openAndClaim(devices[0]);
  } catch {
    return null;
  }
}

export async function disconnectPrinter(connection: PrinterConnection): Promise<void> {
  try {
    await connection.device.releaseInterface(connection.interfaceNumber);
    await connection.device.close();
  } catch {
    // Device may already be gone (unplugged); nothing more to clean up.
  }
}

export async function sendToPrinter(
  connection: PrinterConnection,
  tsplCommand: string,
): Promise<void> {
  const bytes = new TextEncoder().encode(tsplCommand);
  const result = await connection.device.transferOut(connection.endpointOut, bytes);
  if (result.status !== "ok") {
    throw new Error(`Gagal mengirim data ke printer (status: ${result.status}).`);
  }
}

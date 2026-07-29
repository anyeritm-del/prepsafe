"use client";

import { useEffect, useState } from "react";
import {
  PrinterConnection,
  isWebUsbSupported,
  reconnectPrinter,
  requestAndConnectPrinter,
} from "@/lib/webusb";

interface PrinterConnectProps {
  connection: PrinterConnection | null;
  onConnectionChange: (connection: PrinterConnection | null) => void;
}

export function PrinterConnect({ connection, onConnectionChange }: PrinterConnectProps) {
  // This component only ever mounts client-side (rendered via next/dynamic
  // with ssr: false in app/page.tsx), so reading navigator.usb up front is
  // safe and avoids a spurious extra render.
  const [supported] = useState(isWebUsbSupported);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reconnectPrinter()
      .then((conn) => {
        if (conn) onConnectionChange(conn);
      })
      .catch(() => {
        // Silent: user just hasn't authorized a device yet.
      });
    // Only attempt auto-reconnect once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      const conn = await requestAndConnectPrinter();
      onConnectionChange(conn);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal menghubungkan ke printer.");
      }
    } finally {
      setConnecting(false);
    }
  }

  if (!supported) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Browser ini tidak mendukung WebUSB. Buka halaman ini di Chrome atau Edge terbaru.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            connection ? "bg-green-500" : "bg-neutral-300"
          }`}
        />
        <span className="text-sm text-neutral-700">
          {connection
            ? `Terhubung: ${connection.device.productName ?? "Printer"}`
            : "Printer belum terhubung"}
        </span>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="ml-auto rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {connecting ? "Menghubungkan..." : connection ? "Ganti Printer" : "Hubungkan Printer"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

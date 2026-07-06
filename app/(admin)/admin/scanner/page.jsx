"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ScanLine,
  Sparkles,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCcw,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage } from "@/hooks/useLanguage";

export default function AdminScannerPage() {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [scannerState, setScannerState] = useState("idle"); // idle | scanning | processing | success | error
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  const scannerRef = useRef(null);
  const html5QrScannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrScannerRef.current) {
      try {
        const state = html5QrScannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await html5QrScannerRef.current.stop();
        }
      } catch (e) {
        // Scanner may already be stopped
      }
      try {
        await html5QrScannerRef.current.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      html5QrScannerRef.current = null;
    }
  }, []);

  const listCameras = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0) {
        // Prefer back camera if available
        const backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("belakang")
        );
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      }
      return devices;
    } catch (err) {
      console.error("Failed to list cameras:", err);
      const errStr = err.toString();
      const isSecureContextIssue = !window.isSecureContext || errStr.includes("Permission") || errStr.includes("NotAllowed") || errStr.includes("secure");
      if (isSecureContextIssue && window.location.protocol !== 'https:') {
        setErrorMessage(
          "Akses kamera diblokir karena halaman tidak diakses melalui HTTPS. Untuk scan dari HP, jalankan server dengan perintah: npm run dev:https lalu akses via https://IP_LAPTOP:3000"
        );
      } else {
        setErrorMessage(
          "Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin kamera pada browser dan halaman diakses melalui HTTPS."
        );
      }
      setScannerState("error");
      return [];
    }
  }, []);

  const processToken = useCallback(async (token) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScannerState("processing");

    try {
      const res = await fetch("/api/payments/scan-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal memverifikasi pembayaran.");
        setScannerState("error");
      } else {
        setSuccessData(data.booking);
        setScannerState("success");
      }
    } catch (err) {
      console.error("Scan verification error:", err);
      setErrorMessage("Terjadi kesalahan jaringan saat memverifikasi pembayaran.");
      setScannerState("error");
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  const onScanSuccess = useCallback(
    (decodedText) => {
      if (isProcessingRef.current) return;

      let token = decodedText;

      // If it's a URL, extract token param
      try {
        if (decodedText.startsWith("http")) {
          const url = new URL(decodedText);
          const scanToken = url.searchParams.get("token") || url.searchParams.get("scan_token");
          if (scanToken) {
            token = scanToken;
          }
        }
      } catch {
        // Not a valid URL, use as-is
      }

      // Stop the scanner before processing
      stopScanner().then(() => {
        processToken(token);
      });
    },
    [stopScanner, processToken]
  );

  const startScanner = useCallback(
    async (cameraId) => {
      await stopScanner();
      setScannerState("scanning");
      setErrorMessage("");
      setSuccessData(null);

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        const scannerId = "qr-scanner-viewport";
        // Ensure the element exists
        if (!document.getElementById(scannerId)) {
          setErrorMessage("Element scanner viewport tidak ditemukan.");
          setScannerState("error");
          return;
        }

        const scanner = new Html5Qrcode(scannerId);
        html5QrScannerRef.current = scanner;

        await scanner.start(
          cameraId || selectedCameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          onScanSuccess,
          () => {
            // QR scan error (frame didn't contain QR) - ignore
          }
        );
      } catch (err) {
        console.error("Failed to start scanner:", err);
        const errStr = err.toString();
        const isPermission = errStr.includes("Permission") || errStr.includes("NotAllowed");
        if (isPermission && window.location.protocol !== 'https:') {
          setErrorMessage(
            "Izin kamera ditolak karena halaman diakses melalui HTTP (bukan HTTPS). Untuk menggunakan kamera dari HP, jalankan server dengan: npm run dev:https, lalu akses via https://IP_LAPTOP:3000"
          );
        } else if (isPermission) {
          setErrorMessage(
            "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda, lalu coba lagi."
          );
        } else {
          setErrorMessage(
            "Gagal memulai kamera. Pastikan kamera tidak sedang digunakan aplikasi lain."
          );
        }
        setScannerState("error");
      }
    },
    [selectedCameraId, stopScanner, onScanSuccess]
  );

  const handleStartScan = useCallback(async () => {
    const devices = await listCameras();
    if (devices.length > 0) {
      const backCam = devices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("belakang")
      );
      const camId = backCam ? backCam.id : devices[0].id;
      setSelectedCameraId(camId);
      startScanner(camId);
    } else {
      setErrorMessage("Tidak ada kamera yang terdeteksi pada perangkat ini.");
      setScannerState("error");
    }
  }, [listCameras, startScanner]);

  const handleReset = useCallback(() => {
    setScannerState("idle");
    setErrorMessage("");
    setSuccessData(null);
    isProcessingRef.current = false;
  }, []);

  const handleScanAgain = useCallback(async () => {
    setErrorMessage("");
    setSuccessData(null);
    isProcessingRef.current = false;
    if (selectedCameraId) {
      startScanner(selectedCameraId);
    } else {
      handleStartScan();
    }
  }, [selectedCameraId, startScanner, handleStartScan]);

  const handleCameraSwitch = useCallback(
    async (newCamId) => {
      setSelectedCameraId(newCamId);
      if (scannerState === "scanning") {
        startScanner(newCamId);
      }
    },
    [scannerState, startScanner]
  );

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background dark:bg-zinc-950 min-h-screen">
        <div className="h-8 bg-muted dark:bg-zinc-800/60 rounded-xl w-48 mb-4" />
        <div className="h-6 bg-muted dark:bg-zinc-800/60 rounded-xl w-96 mb-8" />
        <div className="h-96 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-background dark:bg-zinc-950 p-4 sm:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>Scanner Pembayaran</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-zinc-50">
          Scan QR Bukti Pembayaran
        </h1>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          Pindai kode QR dari bukti pemesanan PDF pelanggan untuk memverifikasi pembayaran offline secara instan.
        </p>
      </div>

      {/* Main Scanner Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
          {/* Scanner Viewport Area */}
          <div className="relative bg-zinc-950 aspect-square w-full max-w-[480px] mx-auto flex items-center justify-center overflow-hidden">
            {/* QR Scanner Element (always rendered, visibility controlled) */}
            <div
              id="qr-scanner-viewport"
              ref={scannerRef}
              className={`w-full h-full ${
                scannerState === "scanning" ? "block" : "hidden"
              } [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover`}
            />

            {/* IDLE State */}
            {scannerState === "idle" && (
              <div className="flex flex-col items-center gap-6 p-8 text-center">
                <div className="p-6 bg-zinc-800/60 rounded-full border-2 border-dashed border-zinc-700">
                  <Camera className="w-12 h-12 text-zinc-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-200">
                    Kamera Belum Aktif
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-xs">
                    Klik tombol di bawah untuk mengaktifkan kamera dan mulai memindai QR Code bukti pemesanan.
                  </p>
                </div>
                <button
                  onClick={handleStartScan}
                  className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                >
                  <ScanLine className="w-5 h-5" />
                  Aktifkan Kamera & Mulai Scan
                </button>
              </div>
            )}

            {/* PROCESSING State */}
            {scannerState === "processing" && (
              <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-sm font-bold text-zinc-300 animate-pulse">
                  Memverifikasi pembayaran...
                </p>
              </div>
            )}

            {/* SUCCESS State */}
            {scannerState === "success" && successData && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center z-10 p-6">
                <div className="bg-card dark:bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in duration-300 shadow-2xl shadow-emerald-500/10">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-foreground dark:text-zinc-50">
                      Pembayaran Terverifikasi!
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Status berhasil diubah menjadi Lunas
                    </p>
                  </div>

                  <div className="space-y-3 text-left bg-muted/30 dark:bg-zinc-800/40 rounded-2xl p-5 border border-border/60 dark:border-zinc-700/60">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nama Kucing</span>
                      <span className="font-bold text-foreground dark:text-zinc-100">
                        {successData.catName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pemilik</span>
                      <span className="font-bold text-foreground dark:text-zinc-100">
                        {successData.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-border/50 dark:border-zinc-700/50 pt-3 font-extrabold">
                      <span className="text-foreground dark:text-zinc-200">Total Bayar</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-base">
                        {formatRupiah(successData.amount)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleScanAgain}
                    className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Pindai Lagi
                  </button>
                </div>
              </div>
            )}

            {/* ERROR State */}
            {scannerState === "error" && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center z-10 p-6">
                <div className="bg-card dark:bg-zinc-900 border border-rose-500/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in duration-300 shadow-2xl shadow-rose-500/10">
                  <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border-2 border-rose-500/20">
                    <XCircle className="w-9 h-9 text-rose-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground dark:text-zinc-50">
                      Verifikasi Gagal
                    </h3>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 px-4 py-3 border border-border dark:border-zinc-700 hover:bg-muted/80 dark:hover:bg-zinc-800 text-sm font-bold rounded-2xl transition-all cursor-pointer text-foreground dark:text-zinc-200"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleScanAgain}
                      className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Coba Lagi
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="p-5 border-t border-border/80 dark:border-zinc-800 space-y-4">
            {/* Camera selector */}
            {cameras.length > 1 && scannerState === "scanning" && (
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedCameraId || ""}
                  onChange={(e) => handleCameraSwitch(e.target.value)}
                  className="flex-1 px-3 py-2 bg-muted/40 dark:bg-zinc-800/40 border border-border dark:border-zinc-700 rounded-xl text-xs font-medium text-foreground dark:text-zinc-200 focus:outline-none focus:border-primary/50"
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Kamera ${cam.id.substring(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scanner status & actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {scannerState === "scanning" && (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Kamera aktif — Arahkan QR Code ke kamera
                    </span>
                  </>
                )}
                {scannerState === "idle" && (
                  <>
                    <CameraOff className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Kamera belum diaktifkan
                    </span>
                  </>
                )}
              </div>

              {scannerState === "scanning" && (
                <button
                  onClick={async () => {
                    await stopScanner();
                    setScannerState("idle");
                  }}
                  className="px-4 py-2 border border-rose-200 dark:border-rose-900 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  Matikan Kamera
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Help Info Card */}
        <div className="mt-6 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-extrabold text-muted-foreground dark:text-zinc-450 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Panduan Penggunaan
          </h4>
          <ul className="text-xs text-muted-foreground dark:text-zinc-400 space-y-2 leading-relaxed font-medium">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">1.</span>
              Klik tombol <strong>"Aktifkan Kamera"</strong> dan izinkan akses kamera di browser Anda (kamera laptop/webcam maupun kamera HP didukung).
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">2.</span>
              Arahkan QR Code dari PDF Bukti Pemesanan pelanggan ke kamera hingga terbaca secara otomatis.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">3.</span>
              Sistem akan memverifikasi token pembayaran dan mengubah status menjadi <strong>"Lunas"</strong> secara instan.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">⚠</span>
              QR Code hanya berlaku <strong>24 jam</strong> sejak persetujuan admin dan hanya bisa digunakan <strong>satu kali</strong>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

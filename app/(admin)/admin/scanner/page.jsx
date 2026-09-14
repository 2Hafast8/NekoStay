"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";

const emptySubscribe = () => () => {};
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
  ShieldCheck,
  Zap,
  Cat,
  ExternalLink,
  Search,
  Clock,
  Wallet,
  Keyboard,
  Check,
  HelpCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage } from "@/hooks/useLanguage";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { GsapTextButton } from "@/components/shared/GsapTextButton";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AdminScannerPage() {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Active Mode: 'camera' | 'manual'
  const [activeMode, setActiveMode] = useState("camera");

  // Scanner States: 'idle' | 'scanning' | 'processing' | 'success' | 'error'
  const [scannerState, setScannerState] = useState("idle");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Manual token input state
  const [manualToken, setManualToken] = useState("");
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Recent session verification logs
  const [sessionScans, setSessionScans] = useState([]);

  const scannerRef = useRef(null);
  const html5QrScannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  useGsapReveal(
    containerRef,
    { selector: ".anim-item", y: 20, stagger: 0.05, duration: 0.45 },
    [activeMode, scannerState, sessionScans.length]
  );

  const stopScanner = useCallback(async () => {
    if (html5QrScannerRef.current) {
      try {
        const state = html5QrScannerRef.current.getState();
        if (state === 2 || state === 3) {
          await html5QrScannerRef.current.stop();
        }
      } catch {
        // Scanner might already be stopped
      }
      try {
        await html5QrScannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      html5QrScannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const listCameras = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0) {
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
      const isSecureContextIssue =
        !window.isSecureContext ||
        errStr.includes("Permission") ||
        errStr.includes("NotAllowed") ||
        errStr.includes("secure");

      if (isSecureContextIssue && window.location.protocol !== "https:") {
        setErrorMessage(
          "Akses kamera diblokir karena halaman tidak diakses melalui HTTPS. Untuk scan via kamera HP, jalankan server dengan: npm run dev:https lalu akses via https://IP_LAPTOP:3000"
        );
      } else {
        setErrorMessage(
          "Tidak dapat mengakses kamera. Pastikan Anda telah mengizinkan akses kamera pada browser."
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
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        const err = data.error || "Gagal memverifikasi pembayaran.";
        setErrorMessage(err);
        setScannerState("error");
        toast.error(err);
      } else {
        const booking = data.booking;
        setSuccessData(booking);
        setScannerState("success");
        toast.success("Pembayaran berhasil diverifikasi!");

        // Add to session scans history
        setSessionScans((prev) => [
          {
            ...booking,
            timestamp: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error("Scan verification error:", err);
      const msg = "Terjadi kesalahan jaringan saat memverifikasi pembayaran.";
      setErrorMessage(msg);
      setScannerState("error");
      toast.error(msg);
    } finally {
      isProcessingRef.current = false;
      setIsManualSubmitting(false);
    }
  }, []);

  const onScanSuccess = useCallback(
    (decodedText) => {
      if (isProcessingRef.current) return;

      let token = decodedText;
      try {
        if (decodedText.startsWith("http")) {
          const url = new URL(decodedText);
          const scanToken =
            url.searchParams.get("token") ||
            url.searchParams.get("scan_token");
          if (scanToken) {
            token = scanToken;
          }
        }
      } catch {
        // Use as-is
      }

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
            fps: 12,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          onScanSuccess,
          () => {}
        );
      } catch (err) {
        console.error("Failed to start scanner:", err);
        const errStr = err.toString();
        const isPermission =
          errStr.includes("Permission") || errStr.includes("NotAllowed");

        if (isPermission && window.location.protocol !== "https:") {
          setErrorMessage(
            "Izin kamera ditolak karena halaman diakses via HTTP biasa. Jalankan: npm run dev:https untuk akses via HTTPS."
          );
        } else if (isPermission) {
          setErrorMessage(
            "Izin kamera ditolak browser. Izinkan izin kamera di peramban Anda, lalu coba lagi."
          );
        } else {
          setErrorMessage(
            "Gagal memulai kamera. Pastikan kamera tidak sedang dipakai aplikasi lain."
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
    setManualToken("");
    isProcessingRef.current = false;
    if (activeMode === "camera") {
      if (selectedCameraId) {
        startScanner(selectedCameraId);
      } else {
        handleStartScan();
      }
    }
  }, [activeMode, selectedCameraId, startScanner, handleStartScan]);

  const handleCameraSwitch = useCallback(
    async (newCamId) => {
      setSelectedCameraId(newCamId);
      if (scannerState === "scanning") {
        startScanner(newCamId);
      }
    },
    [scannerState, startScanner]
  );

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      toast.error("Silakan masukkan token pembayaran.");
      return;
    }
    setIsManualSubmitting(true);
    processToken(manualToken);
  };

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background min-h-screen">
        <div className="h-8 bg-muted rounded-xl w-48 mb-4" />
        <div className="h-6 bg-muted rounded-xl w-96 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  const selectedCamObj = cameras.find((c) => c.id === selectedCameraId);

  return (
    <div ref={containerRef} className="space-y-7">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 anim-item">
        <div className="space-y-1.5">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold tracking-wide border border-rose-500/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>KASIR CHECK-IN & PEMBAYARAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Scan QR Bukti Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Pindai kode QR dari PDF bukti pemesanan pelanggan untuk memverifikasi pembayaran
            offline di kasir secara instan, aman, dan tercatat otomatis.
          </p>
        </div>

        {/* Status indicator pill */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
              scannerState === "scanning"
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-850"
                : scannerState === "processing"
                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-850"
                : "bg-muted/60 text-muted-foreground border-border"
            }`}
          >
            {scannerState === "scanning" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Kamera Aktif Memindai</span>
              </>
            ) : scannerState === "processing" ? (
              <>
                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Token...</span>
              </>
            ) : (
              <>
                <CameraOff className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Pemindai Siaga</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Executive KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-item">
        {/* Card 1: Scan Mode */}
        <div className="p-4 sm:p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Metode Validasi
            </span>
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-foreground">
              Kamera & Token
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Dukungan scan webcam HP/PC & input manual
            </p>
          </div>
        </div>

        {/* Card 2: Security */}
        <div className="p-4 sm:p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Proteksi Token
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              One-Time (24 Jam)
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Anti double-spend & expired otomatis
            </p>
          </div>
        </div>

        {/* Card 3: Session Scans */}
        <div className="p-4 sm:p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Verifikasi Sesi Ini
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-foreground">
              {sessionScans.length} Sukses
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Total pesanan divalidasi kasir sesi ini
            </p>
          </div>
        </div>

        {/* Card 4: Automations */}
        <div className="p-4 sm:p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Sinkronisasi
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-foreground">
              Real-time DB
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Ubah status Lunas & kirim notifikasi
            </p>
          </div>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start anim-item">
        {/* Left / Main Column: Scanner / Manual Input Card */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between gap-3 p-1.5 bg-muted/60 border border-border rounded-2xl">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("camera");
                  handleReset();
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === "camera"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Kamera QR Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  setActiveMode("manual");
                  handleReset();
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === "manual"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Input Token Manual</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-md">
            {activeMode === "camera" ? (
              /* ================= CAMERA SCANNER MODE ================= */
              <div>
                {/* Viewport Box */}
                <div className="relative bg-zinc-950 aspect-square sm:aspect-4/3 w-full flex items-center justify-center overflow-hidden">
                  {/* HTML5 QR Scanner Container */}
                  <div
                    id="qr-scanner-viewport"
                    ref={scannerRef}
                    className={`w-full h-full ${
                      scannerState === "scanning" ? "block" : "hidden"
                    } [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover`}
                  />

                  {/* HUD Viewfinder Overlay (When Scanning) */}
                  {scannerState === "scanning" && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-primary/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(234,88,12,0.15)]">
                        {/* Target Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />

                        {/* Animated Laser Scan Line */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-[0_0_12px_#ea580c]" />
                      </div>

                      <div className="mt-4 px-3.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 text-zinc-300 text-xs font-semibold flex items-center gap-2">
                        <ScanLine className="w-3.5 h-3.5 text-primary animate-pulse" />
                        <span>Arahkan QR Code tepat di dalam kotak</span>
                      </div>
                    </div>
                  )}

                  {/* IDLE State */}
                  {scannerState === "idle" && (
                    <div className="flex flex-col items-center gap-5 p-8 text-center max-w-sm">
                      <div className="w-20 h-20 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner">
                        <Camera className="w-10 h-10 text-zinc-400" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-zinc-100">
                          Kamera Belum Aktif
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Izinkan akses kamera laptop, webcam, atau kamera HP Anda untuk
                          mulai memindai QR Code bukti pemesanan secara instan.
                        </p>
                      </div>
                      <button
                        onClick={handleStartScan}
                        className="px-7 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.02]"
                      >
                        <ScanLine className="w-4 h-4" />
                        <span>Aktifkan Kamera & Mulai Scan</span>
                      </button>
                    </div>
                  )}

                  {/* PROCESSING State */}
                  {scannerState === "processing" && (
                    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                      <div className="w-12 h-12 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                      <div className="text-center space-y-1">
                        <p className="text-sm font-extrabold text-zinc-100">
                          Memverifikasi Pembayaran...
                        </p>
                        <p className="text-xs text-zinc-400">
                          Sedang mencocokkan token di basis data NekoStay
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SUCCESS State Overlay */}
                  {scannerState === "success" && successData && (
                    <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center z-30 p-6">
                      <div className="bg-card border border-emerald-500/30 rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in duration-200 shadow-2xl shadow-emerald-500/15">
                        <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/25">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-foreground">
                            Pembayaran Terverifikasi!
                          </h3>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            Status pesanan berhasil diubah menjadi Lunas
                          </p>
                        </div>

                        {/* Booking Summary Box */}
                        <div className="space-y-2.5 text-left bg-muted/40 rounded-2xl p-4 border border-border/60 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-semibold">
                              Nama Kucing:
                            </span>
                            <span className="font-extrabold text-foreground flex items-center gap-1.5">
                              <Cat className="w-3.5 h-3.5 text-primary" />
                              <span>{successData.catName}</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-semibold">
                              Pemilik:
                            </span>
                            <span className="font-bold text-foreground">
                              {successData.customerName}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline border-t border-border/60 pt-2.5">
                            <span className="text-muted-foreground font-bold uppercase text-[10px]">
                              Total Dibayar:
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                              {formatRupiah(successData.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <button
                            onClick={handleScanAgain}
                            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            <span>Pindai Kode Berikutnya</span>
                          </button>
                          {successData.id && (
                            <Link
                              href={`/admin/bookings/${successData.id}`}
                              className="w-full py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-foreground block text-center"
                            >
                              <span>Buka Detail Booking</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ERROR State Overlay */}
                  {scannerState === "error" && (
                    <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center z-30 p-6">
                      <div className="bg-card border border-rose-500/30 rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in duration-200 shadow-2xl shadow-rose-500/15">
                        <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/25">
                          <XCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-black text-foreground">
                            Verifikasi Gagal
                          </h3>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                            {errorMessage}
                          </p>
                        </div>
                        <div className="flex gap-2.5 pt-1">
                          <button
                            onClick={handleReset}
                            className="flex-1 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all cursor-pointer text-foreground"
                          >
                            Kembali
                          </button>
                          <button
                            onClick={handleScanAgain}
                            className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            <span>Coba Lagi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls Footer */}
                <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                  {/* Camera Switcher Dropdown */}
                  {cameras.length > 1 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all cursor-pointer">
                        <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="max-w-[150px] truncate font-bold">
                          {selectedCamObj?.label || "Pilih Kamera"}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        sideOffset={6}
                        className="p-1"
                      >
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                          Ganti Perangkat Kamera
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {cameras.map((cam) => (
                          <DropdownMenuItem
                            key={cam.id}
                            onClick={() => handleCameraSwitch(cam.id)}
                            className={`text-xs font-semibold cursor-pointer ${
                              selectedCameraId === cam.id
                                ? "text-primary font-bold bg-primary/5"
                                : ""
                            }`}
                          >
                            {selectedCameraId === cam.id ? (
                              <Check className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                            )}
                            {cam.label || `Kamera ${cam.id.substring(0, 8)}...`}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>
                        {selectedCamObj?.label || "Kamera Perangkat Aktif"}
                      </span>
                    </div>
                  )}

                  {/* Stop Camera Button */}
                  {scannerState === "scanning" && (
                    <button
                      onClick={async () => {
                        await stopScanner();
                        setScannerState("idle");
                      }}
                      className="px-4 py-2 border border-rose-200 dark:border-rose-900 hover:border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Matikan Kamera</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ================= MANUAL TOKEN INPUT MODE ================= */
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-primary" />
                    <span>Validasi Token Pembayaran Manual</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Jika kamera tidak tersedia atau kode QR buram/rusak pada cetakan kertas,
                    salin dan tempel 32 karakter token pembayaran yang tertera pada bukti pemesanan PDF.
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Kode Token Pembayaran (Offline Token)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        placeholder="Contoh: a89f21b7c84d43e2... atau URL lengkap scan-verify"
                        className="w-full px-4 py-3 bg-muted/40 border border-border rounded-2xl text-xs sm:text-sm font-mono focus:outline-hidden focus:border-primary/60 text-foreground transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setManualToken("")}
                      className="px-4 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      Bersihkan
                    </button>
                    <GsapTextButton
                      type="submit"
                      isLoading={isManualSubmitting}
                      idleText="Verifikasi Token Sekarang"
                      loadingText="Memverifikasi..."
                      successText="Berhasil!"
                      icon={<ShieldCheck className="w-4 h-4" />}
                      className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    />
                  </div>
                </form>

                {/* Success Feedback for Manual Mode */}
                {scannerState === "success" && successData && (
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl space-y-3 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Token Berhasil Diverifikasi (Status: Lunas)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-emerald-500/20">
                      <div>
                        <span className="font-semibold block">Kucing:</span>
                        <strong className="text-foreground">{successData.catName}</strong>
                      </div>
                      <div>
                        <span className="font-semibold block">Pemilik:</span>
                        <strong className="text-foreground">{successData.customerName}</strong>
                      </div>
                      <div className="col-span-2 pt-1 flex justify-between items-baseline">
                        <span className="font-semibold">Total Tagihan:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                          {formatRupiah(successData.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Link
                        href={`/admin/bookings/${successData.id}`}
                        className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>Lihat Rincian Reservasi</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Error Feedback for Manual Mode */}
                {scannerState === "error" && errorMessage && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-bold flex items-start gap-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Session History & Guidelines */}
        <div className="lg:col-span-4 space-y-5">
          {/* Recent Scans Session Log */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Riwayat Sesi Kasir</span>
              </h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {sessionScans.length} Sukses
              </span>
            </div>

            {sessionScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <ScanLine className="w-7 h-7 mx-auto text-muted-foreground/40" />
                <p className="text-xs font-semibold">
                  Belum ada QR yang dipindai pada sesi aktif ini.
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Data scan yang berhasil akan muncul di sini sebagai riwayat.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {sessionScans.map((scan, idx) => (
                  <div
                    key={`${scan.id}-${idx}`}
                    className="p-3 bg-muted/40 border border-border/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-extrabold text-foreground flex items-center gap-1.5 truncate">
                        <Cat className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{scan.catName}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {scan.customerName} • {scan.timestamp}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(scan.amount)}
                      </div>
                      <Link
                        href={`/admin/bookings/${scan.id}`}
                        className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Detail</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Guide Bento Card */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Panduan Validasi Kasir</span>
            </h4>
            <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Minta pelanggan menunjukkan <strong>PDF Bukti Pemesanan</strong> (bisa dari layar HP atau cetakan fisik).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Arahkan kamera ke kotak QR Code, atau salin 32 karakter token di tab <strong>Input Token Manual</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Sistem otomatis mengubah status pembayaran menjadi <strong>Lunas</strong> dan mencatat transaksi ke database.
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-border/60">
              <div className="p-3 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] rounded-xl font-medium flex items-start gap-2 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Setiap token QR hanya berlaku <strong>24 jam</strong> sejak disetujui admin dan hanya dapat diverifikasi <strong>1 kali</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

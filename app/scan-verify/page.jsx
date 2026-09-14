"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Cat, ArrowRight, ShieldCheck, Home } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

function ScanResultContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState(() => (!token ? "error" : "loading"));
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(() =>
    !token ? "Token pembayaran tidak ditemukan pada tautan QR ini." : ""
  );

  useEffect(() => {
    if (!token) return;

    fetch("/api/payments/scan-offline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim() }),
    })
      .then((res) => res.json().then((d) => ({ ok: res.ok, d })))
      .then(({ ok, d }) => {
        if (ok) {
          setData(d.booking);
          setState("success");
        } else {
          setErrorMsg(d.error || "Verifikasi gagal");
          setState("error");
        }
      })
      .catch(() => {
        setErrorMsg("Terjadi gangguan koneksi saat memverifikasi pembayaran.");
        setState("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-primary/10 text-primary mb-1 border border-primary/20 shadow-xs">
            <Cat className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            NekoStay Care
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Verifikasi Pembayaran & Check-In Kasir Offline
          </p>
        </div>

        {/* LOADING STATE */}
        {state === "loading" && (
          <div className="bg-card border border-border rounded-3xl p-10 text-center space-y-4 shadow-lg">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-foreground animate-pulse">
                Memverifikasi Pembayaran...
              </p>
              <p className="text-xs text-muted-foreground">
                Mohon tunggu, sistem sedang memeriksa keabsahan token QR Anda.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {state === "success" && data && (
          <div className="bg-card border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl shadow-emerald-500/10 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/25">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-foreground">
                Pembayaran Terverifikasi!
              </h2>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                Status pesanan telah resmi diubah menjadi Lunas
              </p>
            </div>

            <div className="space-y-2.5 text-left bg-muted/40 rounded-2xl p-4 border border-border/70 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Nama Kucing:</span>
                <span className="font-extrabold text-foreground flex items-center gap-1">
                  <Cat className="w-3.5 h-3.5 text-primary" />
                  <span>{data.catName}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Pemilik:</span>
                <span className="font-bold text-foreground">{data.customerName}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-border/60 pt-2.5">
                <span className="text-muted-foreground font-bold uppercase text-[10px]">
                  Total Tagihan:
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                  {formatRupiah(data.amount)}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href="/"
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda NekoStay</span>
              </Link>
            </div>

            <p className="text-[11px] text-muted-foreground font-medium pt-1">
              Terima kasih telah mempercayakan kucing kesayangan Anda di NekoStay.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {state === "error" && (
          <div className="bg-card border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl shadow-rose-500/10 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/25">
              <XCircle className="w-9 h-9 text-rose-500" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-foreground">
                Verifikasi Tidak Berhasil
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed max-w-xs mx-auto">
                {errorMsg}
              </p>
            </div>

            <div className="p-3.5 bg-muted/40 rounded-2xl text-[11px] text-muted-foreground text-left space-y-1 border border-border">
              <span className="font-bold text-foreground block">Catatan Keamanan:</span>
              <span>Kode QR hanya berlaku 24 jam dan hanya bisa diverifikasi satu kali untuk mencegah penyalahgunaan.</span>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="w-full py-2.5 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <ScanResultContent />
    </Suspense>
  );
}

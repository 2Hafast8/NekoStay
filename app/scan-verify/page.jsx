"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function ScanResultContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState("loading"); // loading | success | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Token pembayaran tidak ditemukan pada URL.");
      return;
    }

    fetch("/api/payments/scan-offline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
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
        setErrorMsg("Kesalahan jaringan saat memverifikasi pembayaran.");
        setState("error");
      });
  }, [token]);

  const formatRupiah = (val) =>
    `Rp ${(val || 0).toLocaleString("id-ID")}`;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-orange-500">🐱 NekoStay</h1>
          <p className="text-xs text-zinc-500 mt-1">Verifikasi Pembayaran Offline</p>
        </div>

        {/* Loading */}
        {state === "loading" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-zinc-300 animate-pulse">
              Memverifikasi pembayaran...
            </p>
          </div>
        )}

        {/* Success */}
        {state === "success" && data && (
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl shadow-emerald-500/10">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-zinc-50">
                Pembayaran Terverifikasi!
              </h2>
              <p className="text-xs text-emerald-400 font-semibold">
                Status berhasil diubah menjadi Lunas
              </p>
            </div>

            <div className="space-y-3 text-left bg-zinc-800/40 rounded-2xl p-5 border border-zinc-700/60">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Nama Kucing</span>
                <span className="font-bold text-zinc-100">{data.catName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Pemilik</span>
                <span className="font-bold text-zinc-100">{data.customerName}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-zinc-700/50 pt-3 font-extrabold">
                <span className="text-zinc-200">Total Bayar</span>
                <span className="text-emerald-400 text-base">
                  {formatRupiah(data.amount)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-600 font-medium">
              Halaman ini dapat ditutup.
            </p>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="bg-zinc-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl shadow-rose-500/10">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border-2 border-rose-500/20">
              <XCircle className="w-9 h-9 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-zinc-50">
                Verifikasi Gagal
              </h2>
              <p className="text-xs text-rose-400 font-medium leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <p className="text-[10px] text-zinc-600 font-medium">
              Hubungi admin jika masalah berlanjut.
            </p>
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
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      }
    >
      <ScanResultContent />
    </Suspense>
  );
}

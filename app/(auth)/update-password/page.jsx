"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cat, KeyRound, Sparkles, ArrowRight, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") return;

      const fullUrl = window.location.href;
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      // Check URL for expiration/error flags
      if (
        fullUrl.includes("otp_expired") ||
        fullUrl.includes("access_denied") ||
        fullUrl.includes("invalid") ||
        fullUrl.includes("expired")
      ) {
        setIsExpired(true);
        setErrorMsg(
          "Tautan email pemulihan telah kadaluarsa atau sudah pernah digunakan. Silakan minta tautan baru."
        );
        setIsVerifying(false);
        return;
      }

      // If PKCE code is present in query, exchange code for session
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("Code exchange error:", error.message);
            setIsExpired(true);
            setErrorMsg(
              "Kode verifikasi tidak valid atau telah kadaluarsa. Silakan minta tautan baru."
            );
          }
        } catch (err) {
          console.warn("Code exchange exception:", err);
        }
      }

      // Verify active session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !code && !window.location.hash.includes("access_token")) {
        setIsExpired(true);
        setErrorMsg(
          "Sesi pemulihan tidak ditemukan. Silakan klik tautan dari email pemulihan atau minta tautan baru."
        );
      }

      setIsVerifying(false);
    };

    initAuth();
  }, [supabase]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Trigger server-side notification & security email via Resend
      try {
        await fetch("/api/auth/notify-password-changed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            userId: user?.id,
            email: user?.email,
          }),
        });
      } catch (notifErr) {
        console.warn("[Warning] Password change notification error:", notifErr.message);
      }

      setSuccessMsg(
        "Password berhasil diperbarui! Email notifikasi keamanan & notifikasi aplikasi telah dikirim. Anda akan diarahkan ke halaman login...",
      );
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setErrorMsg(
        err.message || "Gagal memperbarui password. Silakan coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-secondary/30 via-background to-background p-4 relative">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-extrabold text-2xl mb-2"
          >
            <div className="p-2.5 bg-primary text-primary-foreground rounded-2xl">
              <Cat className="w-6 h-6" />
            </div>
            <span>NekoStay</span>
          </Link>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Perbarui Sandi</span>
          </div>
          <h2 className="text-2xl font-black text-foreground">Password Baru</h2>
          <p className="text-xs text-muted-foreground">
            Silakan masukkan password baru untuk akun Anda.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 rounded-xl p-3.5 text-xs font-semibold space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {isExpired && (
              <Link
                href="/forgot-password"
                className="mt-2 w-full py-2 bg-rose-600 text-white rounded-lg font-bold text-center block hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Minta Link Pemulihan Baru
              </Link>
            )}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 rounded-xl p-3.5 text-xs font-semibold leading-relaxed flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isVerifying ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-semibold">
              Memverifikasi tautan pemulihan sandi...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Password Baru
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Sedang Menyimpan..." : "Simpan Password Baru"}
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cat,
  User,
  Mail,
  Phone,
  KeyRound,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const supabase = createClient();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (password.length < 8) {
        throw new Error("Password minimal 8 karakter.");
      }

      // Verify referral code first if filled
      let finalReferral = referralCode.trim().toUpperCase();
      if (finalReferral) {
        const verifyRes = await fetch(`/api/referral/verify?code=${finalReferral}`);
        const verifyData = await verifyRes.json();
        if (!verifyData.valid) {
          throw new Error("Kode referral tidak valid atau milik Anda sendiri.");
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            referred_by_code: finalReferral || null,
          },
        },
      });

      if (error) throw error;

      setSuccessMsg(
        "Pendaftaran sukses! Silakan cek email masuk / spam Anda untuk verifikasi akun.",
      );
      // Clear inputs
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setReferralCode("");
    } catch (err) {
      setErrorMsg(
        err.message || "Terjadi kesalahan saat mendaftar. Coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-secondary/30 via-background to-background p-4 relative">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

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
            <span>Gabung Hari Ini</span>
          </div>
          <h2 className="text-2xl font-black text-foreground">
            Daftar Akun Baru
          </h2>
          <p className="text-xs text-muted-foreground">
            Isi formulir pendaftaran di bawah ini untuk membuat akun.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 rounded-xl p-3.5 text-xs font-semibold leading-relaxed flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Lengkap Anda"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Nomor WhatsApp / HP
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Password (Min. 8 Karakter)
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
              Kode Referral (Opsional)
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Contoh: NEKO-XXXXXXXX"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium uppercase"
              />
            </div>
          </div>


          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-bold text-primary hover:underline"
          >
            Masuk ke Akun
          </Link>
        </p>
      </div>
    </div>
  );
}

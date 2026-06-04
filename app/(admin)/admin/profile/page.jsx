"use client";

import { useState, useEffect } from "react";
import { User, Phone, Mail, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminProfilePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
          setRole(profile.role || "");
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("id", userId);

      if (error) throw error;
      setSuccessMsg("Profil Admin berhasil diperbarui!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse p-4 sm:p-6 bg-background dark:bg-zinc-950 min-h-screen">
        <div className="h-6 w-24 bg-muted dark:bg-zinc-800 rounded-md" />
        <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto mt-4">
      {/* Header */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
          <User className="w-3 h-3 text-primary" />
          <span>Pengaturan Akun</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-zinc-100">
          Profil Admin
        </h1>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          Kelola informasi identitas Anda sebagai administrator sistem NekoStay.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 text-xs font-semibold leading-relaxed flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Lengkap Admin"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              Nomor WhatsApp / HP
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Misal: 08123456789"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                Alamat Email (Akun)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/35" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-11 pr-4 py-3 bg-muted/40 dark:bg-zinc-950/20 border border-border/80 dark:border-zinc-850 rounded-xl text-sm font-medium text-muted-foreground dark:text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                Peran (Role)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={role === "admin" ? "Administrator" : "Pemilik Kucing"}
                  className="w-full px-4 py-3 bg-muted/40 dark:bg-zinc-950/20 border border-border/80 dark:border-zinc-850 rounded-xl text-sm font-bold text-primary/80 dark:text-primary/60 cursor-not-allowed uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60 dark:border-zinc-800/60">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

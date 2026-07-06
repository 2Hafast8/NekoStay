"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, Sparkles, Check, AlertCircle, CheckCircle2, Copy, Share2, Users, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage, dictionary } from "@/hooks/useLanguage";
import { useGsapReveal } from "@/hooks/useGsapReveal";

export default function ProfilePage() {
  const router = useRouter();
  const { language: storeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const language = mounted ? storeLanguage : "id";
  const t = (key) => dictionary[language]?.[key] || key;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referredCount, setReferredCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const supabase = createClient();
  const containerRef = useRef(null);

  useGsapReveal(containerRef, { selector: ".anim-item", y: 20, stagger: 0.1, duration: 0.5 });

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
          setReferralCode(profile.referral_code || "");
          
          // Fetch referred friends count
          const { count, error: countErr } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("referred_by", user.id);

          if (!countErr) {
            setReferredCount(count || 0);
          }
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
      setSuccessMsg(language === "en" ? "Profile updated successfully!" : "Profil Anda berhasil diperbarui!");
    } catch (err) {
      setErrorMsg(err.message || (language === "en" ? "Failed to update profile." : "Gagal memperbarui profil."));
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-pulse mt-8">
        <div className="h-6 w-24 bg-muted dark:bg-zinc-800 rounded-md" />
        <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto space-y-8 mt-4">
      {/* Header */}
      <div className="space-y-1 anim-item">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>{language === "en" ? "Account Settings" : "Pengaturan Akun"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-zinc-100">
          {t("nav_profile")}
        </h1>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          {language === "en" 
            ? "Manage your personal profile information for faster boarding requests." 
            : "Kelola informasi diri Anda untuk mempermudah pendaftaran penitipan."}
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
      <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6 anim-item">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              {language === "en" ? "Full Name" : "Nama Lengkap"}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === "en" ? "Your full name" : "Nama Lengkap Anda"}
                className="w-full pl-11 pr-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              {language === "en" ? "Phone Number" : "Nomor WhatsApp / HP"}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08123456789"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                {language === "en" ? "Email Address" : "Alamat Email (Akun)"}
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
                {language === "en" ? "Account Role" : "Peran (Role)"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={role === "admin" ? "Administrator" : (language === "en" ? "Cat Owner" : "Pemilik Kucing")}
                  className="w-full px-4 py-3 bg-muted/40 dark:bg-zinc-950/20 border border-border/80 dark:border-zinc-850 rounded-xl text-sm font-bold text-primary/80 dark:text-primary/60 cursor-not-allowed"
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
              {isUpdating ? (language === "en" ? "Saving..." : "Menyimpan...") : (language === "en" ? "Save Changes" : "Simpan Perubahan")}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Referral Card */}
      {role !== "admin" && (
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6 anim-item">
          <div className="flex items-center gap-2 font-bold text-foreground dark:text-zinc-100 text-lg border-b border-border/60 dark:border-zinc-800/60 pb-3">
            <Gift className="w-5 h-5 text-primary" />
            <span>{t("ref_title")}</span>
          </div>

          <p className="text-sm text-muted-foreground dark:text-zinc-400 leading-relaxed">
            {t("ref_desc")}
          </p>

          <div className="p-5 bg-secondary/50 dark:bg-zinc-950/30 border border-primary/20 dark:border-primary/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-wider">
                {t("ref_your_code")}
              </span>
              <p className="text-xl font-black text-primary tracking-wider uppercase">
                {referralCode || "NEKO-LOADING"}
              </p>
            </div>
            
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  <span>{t("ref_copy_success")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{language === "en" ? "Copy Code" : "Salin Kode"}</span>
                </>
              )}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              {t("ref_stats_title")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 dark:bg-zinc-950/20 border border-border dark:border-zinc-850 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground dark:text-zinc-200">
                    {referredCount}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground dark:text-zinc-400">
                    {t("ref_stats_joined")}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 dark:bg-zinc-950/20 border border-border dark:border-zinc-850 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground dark:text-zinc-200">
                    {referredCount * 1}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground dark:text-zinc-400">
                    {t("ref_stats_points")}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground dark:text-zinc-500 italic mt-1 text-center sm:text-left">
              * {t("ref_stats_points_desc")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

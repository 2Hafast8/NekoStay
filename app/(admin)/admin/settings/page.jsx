"use client";

import { useState, useEffect } from "react";
import { Settings, Check, HelpCircle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage } from "@/hooks/useLanguage";

export default function AdminSettingsPage() {
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Edit prices state
  const [prices, setPrices] = useState({});
  const [isUpdating, setIsUpdating] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadClasses() {
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .order("price_per_day", { ascending: true });

        if (error) throw error;
        setClasses(data);

        // Prepopulate price edits
        const initialPrices = {};
        data?.forEach((c) => {
          initialPrices[c.id] = c.price_per_day;
        });
        setPrices(initialPrices);
      } catch (err) {
        console.error("Error fetching classes:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClasses();
  }, [supabase]);

  const handleUpdatePrice = async (classId, className) => {
    setIsUpdating(classId);
    setSuccessMsg(null);
    setErrorMsg(null);

    const newPrice = prices[classId];
    if (isNaN(newPrice) || newPrice <= 0) {
      setErrorMsg(t("admin_set_err_positive"));
      setIsUpdating(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("classes")
        .update({ price_per_day: newPrice })
        .eq("id", classId);

      if (error) throw error;
      setSuccessMsg(
        language === "en"
          ? `Rate for ${className} class successfully updated to ${formatRupiah(newPrice)}/day!`
          : `Tarif kelas ${className} berhasil diperbarui menjadi ${formatRupiah(newPrice)}/hari!`
      );
    } catch (err) {
      setErrorMsg(err.message || t("admin_set_err_failed"));
    } finally {
      setIsUpdating(null);
    }
  };

  const getTranslatedDescription = (name, originalDesc) => {
    if (language === "en") {
      if (name === "Basic") return "Comfortable standard cage with regularly maintained fresh air ventilation.";
      if (name === "Standard") return "Spacious cage equipped with a cat playground to eliminate boredom.";
      if (name === "Premium") return "Exclusive private air-conditioned room with intensive monitoring and daily luxury grooming.";
    }
    return originalDesc;
  };

  const getTranslatedFacilities = (name, originalFacilities) => {
    if (language === "en") {
      if (name === "Basic") return ["Standard cage", "Meals 2x/day", "Sterile drinking water"];
      if (name === "Standard") return ["Spacious cage", "Meals 3x/day", "Basic toys", "Scented sand"];
      if (name === "Premium") return ["Private AC room", "Premium meals 3x/day", "Daily grooming", "On-call veterinary services"];
    }
    return originalFacilities;
  };

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background dark:bg-zinc-950 min-h-screen">
        <div className="h-8 bg-muted dark:bg-zinc-800/60 rounded-xl w-48 mb-4" />
        <div className="h-6 bg-muted dark:bg-zinc-800/60 rounded-xl w-96 mb-8" />
        <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
          <Settings className="w-3 h-3 text-rose-500" />
          <span>{t("admin_set_badge")}</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          {t("admin_set_title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin_set_subtitle")}
        </p>
      </div>
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold leading-relaxed flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Classes Settings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 bg-card border border-border rounded-3xl"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-primary/20 transition-all"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-lg text-foreground">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {getTranslatedDescription(cls.name, cls.description)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    {t("admin_set_rate_label")}
                  </label>
                  <input
                    type="number"
                    value={prices[cls.id] || ""}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        [cls.id]: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder={t("admin_set_rate_placeholder")}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-bold"
                  />
                </div>

                <div className="space-y-2 border-t border-border/50 pt-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    {t("admin_set_fac_title")}
                  </span>
                  <ul className="space-y-1.5">
                    {getTranslatedFacilities(cls.name, cls.facilities).map((fac) => (
                      <li
                        key={fac}
                        className="flex items-center gap-2 text-xs text-muted-foreground font-medium"
                      >
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <button
                  onClick={() => handleUpdatePrice(cls.id, cls.name)}
                  disabled={isUpdating === cls.id}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs hover:shadow cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdating === cls.id ? t("admin_set_btn_saving") : t("admin_set_btn_save")}
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-muted/30 border border-border p-5 rounded-3xl flex gap-3.5 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <Info className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground block mb-0.5">
            {t("admin_set_info_title")}
          </strong>
          {t("admin_set_info_desc")}
        </div>
      </div>
    </div>
  );
}

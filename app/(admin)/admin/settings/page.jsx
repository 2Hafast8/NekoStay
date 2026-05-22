"use client";

import { useState, useEffect } from "react";
import { Settings, Check, HelpCircle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/format";

export default function AdminSettingsPage() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Edit prices state
  const [prices, setPrices] = useState({});
  const [isUpdating, setIsUpdating] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const supabase = createClient();

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
      setErrorMsg("Tarif harus berupa angka positif.");
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
        `Tarif kelas ${className} berhasil diperbarui menjadi ${formatRupiah(newPrice)}/hari!`,
      );
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui tarif.");
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
          <Settings className="w-3 h-3 text-rose-500" />
          <span>Pengaturan Sistem</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Tarif & Kelas Penitipan
        </h1>
        <p className="text-sm text-muted-foreground">
          Sesuaikan tarif harian masing-masing kelas penitipan kucing yang
          ditawarkan.
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
                    {cls.description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Tarif Harian (Rupiah)
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
                    placeholder="Masukkan tarif baru"
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-bold"
                  />
                </div>

                <div className="space-y-2 border-t border-border/50 pt-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Fasilitas Kelas
                  </span>
                  <ul className="space-y-1.5">
                    {cls.facilities.map((fac) => (
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
                  {isUpdating === cls.id ? "Menyimpan..." : "Perbarui Tarif"}
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
            Keterangan Tarif & Tagihan
          </strong>
          Pembaruan tarif harian di atas hanya akan berlaku untuk pemesanan baru
          yang diajukan setelah perubahan disimpan. Pemesanan yang sedang
          berjalan (Aktif) atau sedang menunggu konfirmasi (Menunggu) akan tetap
          menggunakan tarif lama yang terdaftar saat pemesanan dibuat demi
          kenyamanan pelanggan.
        </div>
      </div>
    </div>
  );
}

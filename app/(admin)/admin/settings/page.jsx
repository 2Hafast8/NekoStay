"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Check,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  LayoutGrid,
  Layers,
  RotateCcw,
  Plus,
  Trash2,
  Activity,
  Heart,
  Shield,
  Users,
  Star,
  Cat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage } from "@/hooks/useLanguage";
import { ImageUpload } from "@/components/shared/ImageUpload";

const DEFAULT_HERO = {
  badge: "Penitipan Kucing Premium",
  title: "Kasih Sayang & Perawatan Terbaik untuk Kucing Kesayangan Anda",
  subtitle:
    "Platform penitipan kucing premium dengan laporan harian berkala, dokter hewan siaga 24/7, dan kalkulasi harga otomatis.",
  cta_text: "Pesan Sekarang",
  cta_link: "/booking/new",
  hero_image: "",
};

const DEFAULT_WHY_US = [
  {
    id: "1",
    title: "Laporan Berkala",
    description:
      "Dapatkan update foto dan catatan kondisi kucing Anda secara berkala via WhatsApp & email.",
    icon: "Activity",
  },
  {
    id: "2",
    title: "Dokter Hewan Siaga",
    description:
      "Layanan pemeriksaan dan konsultasi dokter hewan siaga 24/7 untuk memastikan kesehatan kucing.",
    icon: "Heart",
  },
  {
    id: "3",
    title: "Fasilitas Ber-AC & Steril",
    description:
      "Ruangan ber-AC dengan pembersihan rutin, pasir wangi, dan ventilasi udara yang sehat.",
    icon: "Shield",
  },
  {
    id: "4",
    title: "Kalkulasi Harga Transparan",
    description:
      "Hitung estimasi biaya secara otomatis tanpa biaya tersembunyi dengan diskon referral.",
    icon: "Users",
  },
];

const AVAILABLE_ICONS = [
  { name: "Activity", label: "Aktivitas / Grafik", icon: Activity },
  { name: "Heart", label: "Kesehatan / Hati", icon: Heart },
  { name: "Shield", label: "Keamanan / Perisai", icon: Shield },
  { name: "Users", label: "Pengguna / Komunitas", icon: Users },
  { name: "Star", label: "Bintang / Rating", icon: Star },
  { name: "Sparkles", label: "Kilau / Premium", icon: Sparkles },
  { name: "Cat", label: "Kucing", icon: Cat },
];

export default function AdminSettingsPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("rooms"); // 'rooms' | 'hero' | 'why_us' | 'reset'
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Edit states for Rooms (classes)
  const [prices, setPrices] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [roomImages, setRoomImages] = useState({});
  const [isUpdatingClass, setIsUpdatingClass] = useState(null);

  // Hero state
  const [heroForm, setHeroForm] = useState(DEFAULT_HERO);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Why Choose Us state
  const [whyUsItems, setWhyUsItems] = useState(DEFAULT_WHY_US);
  const [isSavingWhyUs, setIsSavingWhyUs] = useState(false);

  // Alert msgs
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadAllSettings() {
      try {
        setIsLoading(true);

        // 1. Fetch Classes (Rooms)
        const { data: classData, error: classErr } = await supabase
          .from("classes")
          .select("*")
          .order("price_per_day", { ascending: true });

        if (!classErr && classData) {
          setClasses(classData);
          const initialPrices = {};
          const initialDescs = {};
          const initialImages = {};
          classData.forEach((c) => {
            initialPrices[c.id] = c.price_per_day;
            initialDescs[c.id] = c.description || "";
            initialImages[c.id] = c.image_url || "";
          });
          setPrices(initialPrices);
          setDescriptions(initialDescs);
          setRoomImages(initialImages);
        }

        // 2. Fetch Landing Settings (Hero & Why Us)
        const { data: landingData, error: landingErr } = await supabase
          .from("landing_settings")
          .select("*");

        if (!landingErr && landingData) {
          landingData.forEach((row) => {
            if (row.id === "hero" && row.content) {
              setHeroForm({ ...DEFAULT_HERO, ...row.content });
            }
            if (row.id === "why_us" && Array.isArray(row.content)) {
              setWhyUsItems(row.content);
            }
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAllSettings();
  }, [supabase]);

  // Handle Save Room Class
  const handleUpdateClass = async (cls) => {
    setIsUpdatingClass(cls.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    const newPrice = prices[cls.id];
    const newDesc = descriptions[cls.id];
    const newImg = roomImages[cls.id];

    if (isNaN(newPrice) || newPrice <= 0) {
      setErrorMsg("Tarif kamar harus berupa angka positif.");
      setIsUpdatingClass(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("classes")
        .update({
          price_per_day: newPrice,
          description: newDesc,
          image_url: newImg || null,
        })
        .eq("id", cls.id);

      if (error) throw error;
      setSuccessMsg(
        `Tarif & informasi kelas ${cls.name} berhasil diperbarui!`
      );
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui kamar.");
    } finally {
      setIsUpdatingClass(null);
    }
  };

  // Handle Save Hero Section
  const handleSaveHero = async (e) => {
    e.preventDefault();
    setIsSavingHero(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("landing_settings").upsert({
        id: "hero",
        content: heroForm,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccessMsg("Tampilan Hero Banner berhasil diperbarui dan dipublikasikan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan Hero Banner.");
    } finally {
      setIsSavingHero(false);
    }
  };

  // Handle Save Why Choose Us
  const handleSaveWhyUs = async () => {
    setIsSavingWhyUs(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("landing_settings").upsert({
        id: "why_us",
        content: whyUsItems,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccessMsg("Daftar Keunggulan (Why Choose Us) berhasil disimpan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan bagian keunggulan.");
    } finally {
      setIsSavingWhyUs(false);
    }
  };

  // Why Us Helpers
  const handleAddWhyUsCard = () => {
    const newItem = {
      id: Date.now().toString(),
      title: "Keunggulan Baru",
      description: "Tuliskan penjelasan keunggulan layanan NekoStay di sini.",
      icon: "Sparkles",
    };
    setWhyUsItems([...whyUsItems, newItem]);
  };

  const handleUpdateWhyUsItem = (index, field, value) => {
    const updated = [...whyUsItems];
    updated[index] = { ...updated[index], [field]: value };
    setWhyUsItems(updated);
  };

  const handleDeleteWhyUsItem = (index) => {
    const updated = whyUsItems.filter((_, i) => i !== index);
    setWhyUsItems(updated);
  };

  // Handle Reset to Default
  const handleResetToDefault = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mengembalikan seluruh konten Landing Page ke tampilan bawaan awal?"
      )
    )
      return;

    setIsResetting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await supabase.from("landing_settings").upsert({
        id: "hero",
        content: DEFAULT_HERO,
        updated_at: new Date().toISOString(),
      });

      await supabase.from("landing_settings").upsert({
        id: "why_us",
        content: DEFAULT_WHY_US,
        updated_at: new Date().toISOString(),
      });

      setHeroForm(DEFAULT_HERO);
      setWhyUsItems(DEFAULT_WHY_US);
      setSuccessMsg("Seluruh konten Landing Page berhasil dikembalikan ke tampilan awal bawaan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal melakukan reset.");
    } finally {
      setIsResetting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 min-h-screen max-w-4xl mx-auto">
        <div className="h-8 bg-muted rounded-xl w-48 mb-4" />
        <div className="h-64 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title Header */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
          <Settings className="w-3 h-3 text-rose-500" />
          <span>Pengaturan Sistem & CMS</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Kelola Landing Page & Kamar
        </h1>
        <p className="text-sm text-muted-foreground">
          Ubah teks banner, gambar hero, keunggulan layanan, dan pilihan kelas kamar dengan mudah secara langsung.
        </p>
      </div>

      {/* Global Alert Messages */}
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("rooms")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "rooms"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Layers className="w-4 h-4" />
          Pilihan Kamar & Tarif
        </button>

        <button
          onClick={() => setActiveTab("hero")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "hero"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Hero Banner
        </button>

        <button
          onClick={() => setActiveTab("why_us")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "why_us"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Keunggulan (Why Choose Us)
        </button>

        <button
          onClick={() => setActiveTab("reset")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "reset"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Reset ke Default
        </button>
      </div>

      {/* TAB 1: Pilihan Kamar & Tarif */}
      {activeTab === "rooms" && (
        <div className="space-y-6">
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
                  className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-primary/30 transition-all space-y-4 shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-lg text-foreground">
                        {cls.name}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded-full uppercase">
                        Kelas Kamar
                      </span>
                    </div>

                    {/* Room Image Upload */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Foto Kamar
                      </label>
                      <ImageUpload
                        label=""
                        defaultValue={roomImages[cls.id] || null}
                        onUpload={(url) =>
                          setRoomImages({ ...roomImages, [cls.id]: url })
                        }
                      />
                    </div>

                    {/* Price Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Tarif per Hari (Rp)
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
                        placeholder="Contoh: 50000"
                        className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-hidden text-foreground font-bold"
                      />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Deskripsi Kamar
                      </label>
                      <textarea
                        rows={3}
                        value={descriptions[cls.id] || ""}
                        onChange={(e) =>
                          setDescriptions({
                            ...descriptions,
                            [cls.id]: e.target.value,
                          })
                        }
                        placeholder="Tuliskan deskripsi ringkas mengenai fasilitas & keunggulan kelas kamar ini."
                        className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-hidden text-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <button
                      onClick={() => handleUpdateClass(cls)}
                      disabled={isUpdatingClass === cls.id}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isUpdatingClass === cls.id ? "Menyimpan..." : "Simpan Perubahan"}
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Hero Banner */}
      {activeTab === "hero" && (
        <form
          onSubmit={handleSaveHero}
          className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Pengaturan Hero Banner Utama
            </h3>
            <p className="text-xs text-muted-foreground">
              Ubah kata-kata sambutan, badge khusus, tombol aksi, dan gambar utama di bagian atas Landing Page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Teks Badge (Paling Atas)
                </label>
                <input
                  type="text"
                  value={heroForm.badge || ""}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, badge: e.target.value })
                  }
                  placeholder="Contoh: Penitipan Kucing Premium"
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-semibold focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Judul Utama Hero (Title)
                </label>
                <textarea
                  rows={3}
                  value={heroForm.title || ""}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, title: e.target.value })
                  }
                  placeholder="Tulis judul utama yang memikat pengunjung..."
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-semibold focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Subtitle / Deskripsi Penjelas
                </label>
                <textarea
                  rows={4}
                  value={heroForm.subtitle || ""}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, subtitle: e.target.value })
                  }
                  placeholder="Tulis penjelasan singkat mengenai keunggulan layanan NekoStay..."
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    value={heroForm.cta_text || ""}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, cta_text: e.target.value })
                    }
                    placeholder="Pesan Sekarang"
                    className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-semibold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Link Tujuan Tombol
                  </label>
                  <input
                    type="text"
                    value={heroForm.cta_link || ""}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, cta_link: e.target.value })
                    }
                    placeholder="/booking/new"
                    className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground font-semibold focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Right Image Upload */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Gambar Banner Hero (Opsional)
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Unggah gambar atau gunakan gambar bawaan berformat PNG/JPG.
                </p>
              </div>

              <ImageUpload
                label="Foto Banner Hero"
                defaultValue={heroForm.hero_image || null}
                onUpload={(url) =>
                  setHeroForm({ ...heroForm, hero_image: url })
                }
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isSavingHero}
              className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSavingHero ? "Memublikasikan..." : "Simpan & Publikasikan Hero Banner"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Keunggulan (Why Choose Us) */}
      {activeTab === "why_us" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  Kelola Kartu Keunggulan (Why Choose Us)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tambah, ubah teks, ganti ikon, atau hapus poin keunggulan layanan NekoStay yang tampil di Landing Page.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddWhyUsCard}
                className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Kartu Baru
              </button>
            </div>

            {/* List of Cards */}
            <div className="space-y-4">
              {whyUsItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-muted/30 border border-border p-5 rounded-2xl space-y-4 relative group"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-extrabold text-primary">
                      Kartu #{index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteWhyUsItem(index)}
                      className="p-1.5 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hapus Kartu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Title */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Judul Keunggulan
                      </label>
                      <input
                        type="text"
                        value={item.title || ""}
                        onChange={(e) =>
                          handleUpdateWhyUsItem(index, "title", e.target.value)
                        }
                        placeholder="Contoh: Dokter Hewan Siaga"
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-hidden text-foreground"
                      />
                    </div>

                    {/* Icon Selection */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Pilihan Ikon
                      </label>
                      <select
                        value={item.icon || "Sparkles"}
                        onChange={(e) =>
                          handleUpdateWhyUsItem(index, "icon", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-hidden text-foreground"
                      >
                        {AVAILABLE_ICONS.map((ic) => (
                          <option key={ic.name} value={ic.name}>
                            {ic.label} ({ic.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Deskripsi Singkat
                      </label>
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) =>
                          handleUpdateWhyUsItem(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Penjelasan keunggulan..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={handleSaveWhyUs}
                disabled={isSavingWhyUs}
                className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingWhyUs ? "Memperbarui..." : "Simpan Semua Keunggulan"}
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Reset ke Default */}
      {activeTab === "reset" && (
        <div className="bg-card border border-rose-200 dark:border-rose-950 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="space-y-2">
            <span className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl inline-block">
              <RotateCcw className="w-6 h-6" />
            </span>
            <h3 className="font-extrabold text-lg text-foreground">
              Reset Konten Landing Page ke Bawaan
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Jika Anda ingin memulihkan tampilan teks dan kartu keunggulan NekoStay ke kondisi awal bawaan pabrik, Anda dapat menekan tombol di bawah ini.
            </p>
          </div>

          <div className="pt-4 border-t border-border flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isResetting}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isResetting ? "Memulihkan..." : "Kembalikan Tampilan ke Default"}
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Info Banner */}
      <div className="bg-muted/30 border border-border p-5 rounded-3xl flex gap-3.5 max-w-2xl text-xs text-muted-foreground leading-relaxed">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground block mb-0.5">
            Informasi Perubahan CMS
          </strong>
          Semua perubahan teks, tarif kamar, dan gambar yang disimpan di halaman ini akan langsung tampil secara real-time pada Landing Page utama tanpa perlu melakukan build atau deploy ulang.
        </div>
      </div>
    </div>
  );
}

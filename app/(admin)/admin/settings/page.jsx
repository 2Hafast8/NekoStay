"use client";

import { useState, useEffect } from "react";
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
  Ticket,
  MapPin,
  Mail,
  Phone,
  Clock,
  Globe,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Palette,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage } from "@/hooks/useLanguage";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { useBrandColor } from "@/components/providers/BrandColorProvider";

const DEFAULT_HERO = {
  badge_id: "Penitipan Kucing Premium",
  badge_en: "Premium Cat Boarding",
  title_id: "Kasih Sayang & Perawatan Terbaik untuk Kucing Kesayangan Anda",
  title_en: "Love & Best Care for Your Beloved Cat",
  subtitle_id: "Platform penitipan kucing premium dengan laporan harian berkala, dokter hewan siaga 24/7, dan kalkulasi harga otomatis.",
  subtitle_en: "Premium cat boarding platform with daily reports, 24/7 vet on standby, and automatic pricing.",
  cta_text_id: "Pesan Sekarang",
  cta_text_en: "Book Now",
  cta_link: "/booking/new",
  hero_image: "",
};

const DEFAULT_WHY_US = [
  {
    id: "1",
    title_id: "Laporan Berkala",
    title_en: "Periodic Reports",
    description_id: "Dapatkan update foto dan catatan kondisi kucing Anda secara berkala via WhatsApp & email.",
    description_en: "Get regular photo updates and cat condition notes via WhatsApp & email.",
    icon: "Activity",
  },
  {
    id: "2",
    title_id: "Dokter Hewan Siaga",
    title_en: "Vet on Standby 24/7",
    description_id: "Layanan pemeriksaan dan konsultasi dokter hewan siaga 24/7 untuk memastikan kesehatan kucing.",
    description_en: "24/7 vet inspection and consultation service to ensure your cat's health.",
    icon: "Heart",
  },
  {
    id: "3",
    title_id: "Fasilitas Ber-AC & Steril",
    title_en: "Air Conditioned & Sterile",
    description_id: "Ruangan ber-AC dengan pembersihan rutin, pasir wangi, dan ventilasi udara yang sehat.",
    description_en: "AC rooms with regular cleaning, scented litter, and healthy ventilation.",
    icon: "Shield",
  },
  {
    id: "4",
    title_id: "Kalkulasi Harga Transparan",
    title_en: "Transparent Pricing",
    description_id: "Hitung estimasi biaya secara otomatis tanpa biaya tersembunyi dengan diskon referral.",
    description_en: "Calculate estimated costs automatically without hidden fees plus referral discounts.",
    icon: "Users",
  },
];

const DEFAULT_FAQS = [
  {
    id: "1",
    q_id: "Bagaimana cara penyerahan kucing?",
    q_en: "How do I check-in my cat?",
    a_id: "Bawa kucing Anda beserta pakan kesukaannya ke lokasi NekoStay pada hari check-in. Staf kami akan mendata dan memeriksa ulang kondisi kesehatan kucing sebelum masuk ke kandang.",
    a_en: "Bring your cat and its favorite food to NekoStay on check-in day. Our staff will register and inspect the cat before cage entry.",
  },
  {
    id: "2",
    q_id: "Bagaimana denda keterlambatan dihitung?",
    q_en: "How is the late pickup fee calculated?",
    a_id: "Jika penjemputan terlambat dari jadwal, denda 8% akumulatif per hari akan dikenakan pada tarif harian untuk mengompensasi slot kandang.",
    a_en: "If pickup is delayed, an 8% daily fee will be applied to the daily rate to compensate for cage slot holding.",
  },
  {
    id: "3",
    q_id: "Dapatkah saya mengubah jadwal atau detail pesanan?",
    q_en: "Can I change my booking dates or room class?",
    a_id: "Untuk pesanan yang sedang berjalan, Anda dapat mengajukan perpanjangan hari atau perubahan kelas kamar secara mudah dengan mengklik tombol 'Hubungi Admin' di halaman detail pesanan.",
    a_en: "For active bookings, you can request extensions or class changes easily by clicking 'Contact Admin' on your booking detail page.",
  },
];

const DEFAULT_CONTACT = {
  email: "care@nekostay.com",
  phone: "+62 812-3456-7890",
  address_id: "Jl. Kucing Bahagia No. 12, Kebayoran Baru, Jakarta Selatan, 12340",
  address_en: "12 Happy Cat Street, Kebayoran Baru, South Jakarta, 12340",
  hours_id: "Senin - Minggu: 08:00 - 20:00 WIB",
  hours_en: "Monday - Sunday: 08:00 - 20:00 WIB",
  google_map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.275727196024!2d106.80498707572886!3d-6.227339793760775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f14d31481f33%3A0xb3047a0640f09918!2sSenayan%20City!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid",
};

const AVAILABLE_ICONS = [
  { name: "Activity", label: "Aktivitas", icon: Activity },
  { name: "Heart", label: "Kesehatan", icon: Heart },
  { name: "Shield", label: "Keamanan", icon: Shield },
  { name: "Users", label: "Pengguna", icon: Users },
  { name: "Star", label: "Bintang", icon: Star },
  { name: "Sparkles", label: "Kilau", icon: Sparkles },
  { name: "Cat", label: "Kucing", icon: Cat },
];

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHSL(hex) {
  if (!hex || typeof hex !== "string") return { h: 24, s: 95, l: 53 };
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length !== 6) return { h: 24, s: 95, l: 53 };
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getBrandShades(primaryHex) {
  const { h, s, l } = hexToHSL(primaryHex);
  return [
    { shade: "50", hex: hslToHex(h, s, 97), desc: "Background sangat terang" },
    { shade: "100", hex: hslToHex(h, s, 92), desc: "Background card ringan" },
    { shade: "200", hex: hslToHex(h, s, 83), desc: "Border, divider" },
    { shade: "300", hex: hslToHex(h, s, 73), desc: "Hover state" },
    { shade: "400", hex: hslToHex(h, s, 61), desc: "Secondary accent" },
    { shade: "500", hex: primaryHex, desc: "PRIMARY — brand utama", isPrimary: true },
    { shade: "600", hex: hslToHex(h, s, Math.max(10, l - 5)), desc: "Primary hover", isHover: true },
    { shade: "700", hex: hslToHex(h, s, Math.max(10, l - 12)), desc: "Primary pressed" },
    { shade: "800", hex: hslToHex(h, s, 32), desc: "Teks di atas bg terang" },
    { shade: "900", hex: hslToHex(h, s, 24), desc: "Teks dark" },
    { shade: "950", hex: hslToHex(h, s, 14), desc: "Teks dark pekat" },
  ];
}

export default function AdminSettingsPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("rooms"); // 'rooms' | 'promos' | 'hero' | 'why_us' | 'faqs' | 'contact' | 'reset'
  const [classes, setClasses] = useState([]);
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states for Rooms (classes)
  const [prices, setPrices] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [roomImages, setRoomImages] = useState({});
  const [facilitiesMap, setFacilitiesMap] = useState({});
  const [isUpdatingClass, setIsUpdatingClass] = useState(null);

  // New Class Form State
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    name: "",
    price_per_day: "",
    description: "",
    facilitiesText: "",
    image_url: "",
  });
  const [isAddingClass, setIsAddingClass] = useState(false);

  // New Promo Form State
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [newPromoForm, setNewPromoForm] = useState({
    code: "",
    title: "",
    discount_type: "percentage", // 'percentage' | 'fixed'
    discount_value: "",
    min_spend: "0",
    max_discount: "",
    applicable_class: "all",
    usage_limit: "",
    is_active: true,
  });
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // Hero state
  const [heroForm, setHeroForm] = useState(DEFAULT_HERO);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Why Choose Us state
  const [whyUsItems, setWhyUsItems] = useState(DEFAULT_WHY_US);
  const [isSavingWhyUs, setIsSavingWhyUs] = useState(false);

  // FAQ state
  const [faqItems, setFaqItems] = useState(DEFAULT_FAQS);
  const [isSavingFaqs, setIsSavingFaqs] = useState(false);

  // Contact & Map state
  const [contactForm, setContactForm] = useState(DEFAULT_CONTACT);
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Brand Color state
  const { primaryHex, setPrimaryHex } = useBrandColor();
  const [isSavingBrandColor, setIsSavingBrandColor] = useState(false);

  // Alert msgs
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const supabase = createClient();

  // Load all settings
  const loadAllSettings = async () => {
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
        const initialFacs = {};
        classData.forEach((c) => {
          initialPrices[c.id] = c.price_per_day;
          initialDescs[c.id] = c.description || "";
          initialImages[c.id] = c.image_url || "";
          initialFacs[c.id] = (c.facilities || []).join(", ");
        });
        setPrices(initialPrices);
        setDescriptions(initialDescs);
        setRoomImages(initialImages);
        setFacilitiesMap(initialFacs);
      }

      // 2. Fetch Promos
      const { data: promoData } = await supabase
        .from("promos")
        .select("*")
        .order("created_at", { ascending: false });

      if (promoData) {
        setPromos(promoData);
      }

      // 3. Fetch Landing Settings
      const { data: landingData } = await supabase
        .from("landing_settings")
        .select("*");

      if (landingData) {
        landingData.forEach((row) => {
          if (row.id === "hero" && row.content) {
            setHeroForm({ ...DEFAULT_HERO, ...row.content });
          }
          if (row.id === "why_us" && Array.isArray(row.content)) {
            setWhyUsItems(row.content);
          }
          if (row.id === "faqs" && Array.isArray(row.content)) {
            setFaqItems(row.content);
          }
          if (row.id === "contact" && row.content) {
            setContactForm({ ...DEFAULT_CONTACT, ...row.content });
          }
          if (row.id === "brand_color" && row.content?.primary_hex) {
            setPrimaryHex(row.content.primary_hex);
          }
        });
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Brand Color
  const handleSaveBrandColor = async (e) => {
    e.preventDefault();
    setIsSavingBrandColor(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("landing_settings").upsert({
        id: "brand_color",
        content: { primary_hex: primaryHex },
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccessMsg("Warna brand utama website berhasil disimpan & diterapkan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan warna brand.");
    } finally {
      setIsSavingBrandColor(false);
    }
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  // Save Class Details
  const handleUpdateClass = async (cls) => {
    setIsUpdatingClass(cls.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    const newPrice = parseInt(prices[cls.id], 10);
    const newDesc = descriptions[cls.id];
    const newImg = roomImages[cls.id];
    const newFacsText = facilitiesMap[cls.id] || "";
    const facilitiesArray = newFacsText
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

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
          facilities: facilitiesArray,
        })
        .eq("id", cls.id);

      if (error) throw error;
      setSuccessMsg(`Tarif & informasi kelas ${cls.name} berhasil diperbarui!`);
      loadAllSettings();
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui kamar.");
    } finally {
      setIsUpdatingClass(null);
    }
  };

  // Add New Class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setIsAddingClass(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const price = parseInt(newClassForm.price_per_day, 10);
    if (!newClassForm.name.trim() || isNaN(price) || price <= 0) {
      setErrorMsg("Nama kelas dan tarif per hari (angka positif) wajib diisi.");
      setIsAddingClass(false);
      return;
    }

    const facilitiesArray = newClassForm.facilitiesText
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    try {
      const { error } = await supabase.from("classes").insert({
        name: newClassForm.name.trim(),
        price_per_day: price,
        description: newClassForm.description.trim(),
        facilities: facilitiesArray,
        image_url: newClassForm.image_url || null,
      });

      if (error) throw error;

      setSuccessMsg(`Kelas kamar baru "${newClassForm.name}" berhasil ditambahkan!`);
      setShowAddClassModal(false);
      setNewClassForm({
        name: "",
        price_per_day: "",
        description: "",
        facilitiesText: "",
        image_url: "",
      });
      loadAllSettings();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menambahkan kelas kamar baru.");
    } finally {
      setIsAddingClass(false);
    }
  };

  // Delete Class
  const handleDeleteClass = async (cls) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${cls.name}"?`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.from("classes").delete().eq("id", cls.id);
      if (error) throw error;

      setSuccessMsg(`Kelas kamar "${cls.name}" berhasil dihapus.`);
      loadAllSettings();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menghapus kelas kamar.");
    }
  };

  // Create New Promo
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setIsAddingPromo(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const code = newPromoForm.code.trim().toUpperCase();
    const val = parseInt(newPromoForm.discount_value, 10);
    const minSpend = parseInt(newPromoForm.min_spend || "0", 10);

    if (!code || !newPromoForm.title.trim() || isNaN(val) || val <= 0) {
      setErrorMsg("Kode promo, judul, dan nilai diskon wajib diisi secara valid.");
      setIsAddingPromo(false);
      return;
    }

    try {
      const { error } = await supabase.from("promos").insert({
        code,
        title: newPromoForm.title.trim(),
        discount_type: newPromoForm.discount_type,
        discount_value: val,
        min_spend: isNaN(minSpend) ? 0 : minSpend,
        max_discount: newPromoForm.max_discount ? parseInt(newPromoForm.max_discount, 10) : null,
        applicable_class: newPromoForm.applicable_class,
        usage_limit: newPromoForm.usage_limit ? parseInt(newPromoForm.usage_limit, 10) : null,
        is_active: newPromoForm.is_active,
      });

      if (error) throw error;

      setSuccessMsg(`Kode promo "${code}" berhasil ditambahkan!`);
      setShowAddPromoModal(false);
      setNewPromoForm({
        code: "",
        title: "",
        discount_type: "percentage",
        discount_value: "",
        min_spend: "0",
        max_discount: "",
        applicable_class: "all",
        usage_limit: "",
        is_active: true,
      });
      loadAllSettings();
    } catch (err) {
      setErrorMsg(err.message || "Gagal membuat kode promo.");
    } finally {
      setIsAddingPromo(false);
    }
  };

  // Toggle Promo Active
  const handleTogglePromo = async (promo) => {
    try {
      const { error } = await supabase
        .from("promos")
        .update({ is_active: !promo.is_active })
        .eq("id", promo.id);
      if (error) throw error;
      loadAllSettings();
    } catch (err) {
      setErrorMsg("Gagal merubah status promo.");
    }
  };

  // Delete Promo
  const handleDeletePromo = async (promo) => {
    if (!confirm(`Hapus kode promo "${promo.code}"?`)) return;
    try {
      const { error } = await supabase.from("promos").delete().eq("id", promo.id);
      if (error) throw error;
      setSuccessMsg(`Kode promo "${promo.code}" berhasil dihapus.`);
      loadAllSettings();
    } catch (err) {
      setErrorMsg("Gagal menghapus kode promo.");
    }
  };

  // Save Hero Section
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
      setSuccessMsg("Tampilan Hero Banner (Bilingual ID/EN) berhasil disimpan & dipublikasikan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan Hero Banner.");
    } finally {
      setIsSavingHero(false);
    }
  };

  // Save Why Choose Us
  const handleSaveWhyUs = async (e) => {
    e.preventDefault();
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
      setSuccessMsg("Fitur Keunggulan (Bilingual ID/EN) berhasil diperbarui!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan fitur keunggulan.");
    } finally {
      setIsSavingWhyUs(false);
    }
  };

  // Save FAQs
  const handleSaveFaqs = async (e) => {
    e.preventDefault();
    setIsSavingFaqs(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("landing_settings").upsert({
        id: "faqs",
        content: faqItems,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccessMsg("Daftar FAQ (Bilingual ID/EN) berhasil disimpan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan FAQ.");
    } finally {
      setIsSavingFaqs(false);
    }
  };

  // Save Contact & Map
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setIsSavingContact(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("landing_settings").upsert({
        id: "contact",
        content: contactForm,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccessMsg("Informasi Kontak & Peta Interaktif Footer berhasil disimpan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan kontak.");
    } finally {
      setIsSavingContact(false);
    }
  };

  // Reset all landing settings to default
  const handleResetToDefault = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mengembalikan seluruh konten Landing Page, Hero Banner, Keunggulan, FAQ, dan Kontak ke kondisi awal bawaan?"
      )
    )
      return;

    setIsResetting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await supabase.from("landing_settings").upsert([
        { id: "hero", content: DEFAULT_HERO, updated_at: new Date().toISOString() },
        { id: "why_us", content: DEFAULT_WHY_US, updated_at: new Date().toISOString() },
        { id: "faqs", content: DEFAULT_FAQS, updated_at: new Date().toISOString() },
        { id: "contact", content: DEFAULT_CONTACT, updated_at: new Date().toISOString() },
      ]);

      setHeroForm(DEFAULT_HERO);
      setWhyUsItems(DEFAULT_WHY_US);
      setFaqItems(DEFAULT_FAQS);
      setContactForm(DEFAULT_CONTACT);
      setSuccessMsg("Seluruh konten Landing Page berhasil dikembalikan ke tampilan awal bawaan!");
    } catch (err) {
      setErrorMsg(err.message || "Gagal melakukan reset ke default.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-2">
            <Settings className="w-3 h-3" />
            <span>Pengaturan Sistem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground dark:text-zinc-100 tracking-tight">
            Pengaturan Aplikasi & CMS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-zinc-400 mt-1">
            Kelola tarif kamar, promo & voucher, konten bilingual (ID/EN), kontak usaha & peta interaktif.
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/80 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "rooms"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kelas Kamar ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("promos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "promos"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Kode Promo & Voucher ({promos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "hero"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Hero Banner (Bilingual)</span>
        </button>

        <button
          onClick={() => setActiveTab("why_us")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "why_us"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Keunggulan (Bilingual)</span>
        </button>

        <button
          onClick={() => setActiveTab("faqs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "faqs"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>FAQ (Bilingual)</span>
        </button>

        <button
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "contact"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Kontak & Peta Footer</span>
        </button>

        <button
          onClick={() => setActiveTab("color")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "color"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted/40 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Warna Brand Website</span>
        </button>

        <button
          onClick={() => setActiveTab("reset")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "reset"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "bg-muted/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset ke Default</span>
        </button>
      </div>

      {/* TAB 1: KELAS KAMAR */}
      {activeTab === "rooms" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Kelola Kelas Kamar & Tarif</span>
            </h3>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-3xl text-xs text-muted-foreground">
              Belum ada kelas kamar. Klik 'Tambah Kelas Baru' untuk membuat kelas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h4 className="text-base font-black text-foreground dark:text-zinc-100">
                          {cls.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                          ID Kelas: {cls.id.slice(0, 8)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        Foto Kamar / Kandang
                      </label>
                      <ImageUpload
                        value={roomImages[cls.id] || ""}
                        onChange={(url) =>
                          setRoomImages({ ...roomImages, [cls.id]: url })
                        }
                        folder="rooms"
                      />
                    </div>

                    {/* Price Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        Tarif per Hari (Rp)
                      </label>
                      <input
                        type="number"
                        value={prices[cls.id] ?? ""}
                        onChange={(e) =>
                          setPrices({ ...prices, [cls.id]: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border dark:border-zinc-800 rounded-xl text-sm font-bold text-foreground"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        Deskripsi Layanan
                      </label>
                      <textarea
                        rows={2}
                        value={descriptions[cls.id] ?? ""}
                        onChange={(e) =>
                          setDescriptions({
                            ...descriptions,
                            [cls.id]: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-muted/30 border border-border dark:border-zinc-800 rounded-xl text-xs font-medium text-foreground resize-none"
                      />
                    </div>

                    {/* Facilities list */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        Fasilitas (Dipisah Koma)
                      </label>
                      <input
                        type="text"
                        value={facilitiesMap[cls.id] ?? ""}
                        onChange={(e) =>
                          setFacilitiesMap({
                            ...facilitiesMap,
                            [cls.id]: e.target.value,
                          })
                        }
                        placeholder="Contoh: AC, Makan 3x, Grooming"
                        className="w-full px-4 py-2 bg-muted/30 border border-border dark:border-zinc-800 rounded-xl text-xs font-medium text-foreground"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpdateClass(cls)}
                    disabled={isUpdatingClass === cls.id}
                    className="w-full mt-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingClass === cls.id ? (
                      "Memperbarui..."
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KODE PROMO & VOUCHER */}
      {activeTab === "promos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-100 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                <span>Manajemen Kode Promo & Voucher Diskon</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Buat aturan diskon promo berdasarkan persentase (%), nominal tetap (Rp), minimal transaksi, atau kelas kamar tertentu.
              </p>
            </div>
            <button
              onClick={() => setShowAddPromoModal(true)}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Promo Baru</span>
            </button>
          </div>

          {promos.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-3xl text-xs text-muted-foreground">
              Belum ada kode promo aktif. Klik 'Buat Promo Baru' untuk membuat voucher diskon.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promos.map((p) => (
                <div
                  key={p.id}
                  className={`bg-card dark:bg-zinc-900 border p-6 rounded-3xl space-y-4 relative flex flex-col justify-between ${
                    p.is_active ? "border-emerald-500/30" : "border-border opacity-75"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-black text-xs uppercase tracking-wider">
                          {p.code}
                        </span>
                        <h4 className="text-sm font-extrabold text-foreground dark:text-zinc-100 mt-1">
                          {p.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleDeletePromo(p)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl cursor-pointer"
                        title="Hapus Promo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs space-y-1.5 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Nilai Diskon:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {p.discount_type === "percentage"
                            ? `${p.discount_value}%`
                            : formatRupiah(p.discount_value)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimal Transaksi:</span>
                        <span className="font-bold text-foreground">
                          {p.min_spend > 0 ? formatRupiah(p.min_spend) : "Tanpa Minimal"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Berlaku Kelas:</span>
                        <span className="font-bold text-foreground">
                          {p.applicable_class === "all" ? "Semua Kelas" : p.applicable_class}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Penggunaan:</span>
                        <span className="font-bold text-foreground">
                          {p.used_count} / {p.usage_limit ? p.usage_limit : "∞"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">
                      Status Promo:
                    </span>
                    <button
                      onClick={() => handleTogglePromo(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        p.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {p.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                      <span>{p.is_active ? "Aktif" : "Non-Aktif"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HERO BANNER (BILINGUAL) */}
      {activeTab === "hero" && (
        <form onSubmit={handleSaveHero} className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-100 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <span>Konten Hero Banner Utama (Bilingual ID / EN)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola teks judul, subjudul, dan tombol CTA dalam Bahasa Indonesia dan Bahasa Inggris agar tersinkronisasi otomatis saat user memilih bahasa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bahasa Indonesia */}
            <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/60">
              <h4 className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Versi Bahasa Indonesia (ID)</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Badge Teks</label>
                <input
                  type="text"
                  value={heroForm.badge_id || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, badge_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Judul Utama (Title)</label>
                <textarea
                  rows={2}
                  value={heroForm.title_id || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, title_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Subjudul (Subtitle)</label>
                <textarea
                  rows={3}
                  value={heroForm.subtitle_id || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, subtitle_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Teks Tombol CTA</label>
                <input
                  type="text"
                  value={heroForm.cta_text_id || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, cta_text_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground"
                />
              </div>
            </div>

            {/* English Version */}
            <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/60">
              <h4 className="text-xs font-black uppercase text-blue-500 tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Versi English (EN)</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Badge Text (EN)</label>
                <input
                  type="text"
                  value={heroForm.badge_en || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, badge_en: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Title (EN)</label>
                <textarea
                  rows={2}
                  value={heroForm.title_en || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, title_en: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Subtitle (EN)</label>
                <textarea
                  rows={3}
                  value={heroForm.subtitle_en || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, subtitle_en: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">CTA Button Text (EN)</label>
                <input
                  type="text"
                  value={heroForm.cta_text_en || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, cta_text_en: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Pengaturan Tambahan Hero (Link CTA & Gambar Utama) */}
          <div className="pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">Link Tujuan Tombol CTA</label>
              <input
                type="text"
                value={heroForm.cta_link || "/booking/new"}
                onChange={(e) => setHeroForm({ ...heroForm, cta_link: e.target.value })}
                placeholder="/booking/new"
                className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-medium text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <ImageUpload
                label="Gambar / Foto Utama Hero Banner"
                defaultValue={heroForm.hero_image || null}
                onUploadComplete={(url) => setHeroForm({ ...heroForm, hero_image: url })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={isSavingHero}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingHero ? "Menyimpan..." : "Publikasikan Hero Banner (ID/EN)"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: KEUNGGULAN (BILINGUAL) */}
      {activeTab === "why_us" && (
        <form onSubmit={handleSaveWhyUs} className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Fitur Keunggulan NekoStay (Bilingual ID / EN)</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                setWhyUsItems([
                  ...whyUsItems,
                  {
                    id: String(Date.now()),
                    title_id: "Fitur Baru",
                    title_en: "New Feature",
                    description_id: "Deskripsi fitur baru dalam bahasa Indonesia.",
                    description_en: "Feature description in English.",
                    icon: "Sparkles",
                  },
                ])
              }
              className="px-3.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyUsItems.map((item, idx) => (
              <div key={item.id} className="p-5 bg-muted/20 border border-border rounded-2xl space-y-4 relative">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">Fitur #{idx + 1}</span>
                    <select
                      value={item.icon || "Sparkles"}
                      onChange={(e) => {
                        const updated = [...whyUsItems];
                        updated[idx].icon = e.target.value;
                        setWhyUsItems(updated);
                      }}
                      className="px-2 py-1 bg-background border border-border rounded-lg text-xs font-semibold text-foreground cursor-pointer"
                    >
                      {AVAILABLE_ICONS.map((ic) => (
                        <option key={ic.name} value={ic.name}>
                          {ic.label} ({ic.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWhyUsItems(whyUsItems.filter((i) => i.id !== item.id))}
                    className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                    title="Hapus Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Judul (ID)</label>
                    <input
                      type="text"
                      value={item.title_id || ""}
                      onChange={(e) => {
                        const updated = [...whyUsItems];
                        updated[idx].title_id = e.target.value;
                        setWhyUsItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Title (EN)</label>
                    <input
                      type="text"
                      value={item.title_en || ""}
                      onChange={(e) => {
                        const updated = [...whyUsItems];
                        updated[idx].title_en = e.target.value;
                        setWhyUsItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Deskripsi (ID)</label>
                    <textarea
                      rows={2}
                      value={item.description_id || ""}
                      onChange={(e) => {
                        const updated = [...whyUsItems];
                        updated[idx].description_id = e.target.value;
                        setWhyUsItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Description (EN)</label>
                    <textarea
                      rows={2}
                      value={item.description_en || ""}
                      onChange={(e) => {
                        const updated = [...whyUsItems];
                        updated[idx].description_en = e.target.value;
                        setWhyUsItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={isSavingWhyUs}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingWhyUs ? "Menyimpan..." : "Simpan Fitur Keunggulan (ID/EN)"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: FAQ (BILINGUAL) */}
      {activeTab === "faqs" && (
        <form onSubmit={handleSaveFaqs} className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span>Daftar Tanya Jawab / FAQ (Bilingual ID / EN)</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                setFaqItems([
                  ...faqItems,
                  {
                    id: String(Date.now()),
                    q_id: "Pertanyaan Baru?",
                    q_en: "New Question?",
                    a_id: "Jawaban pertanyaan dalam Bahasa Indonesia.",
                    a_en: "Answer to question in English.",
                  },
                ])
              }
              className="px-3.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah FAQ</span>
            </button>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, idx) => (
              <div key={faq.id} className="p-5 bg-muted/20 border border-border rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-primary">FAQ #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setFaqItems(faqItems.filter((f) => f.id !== faq.id))}
                    className="text-rose-500 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Pertanyaan (ID)</label>
                    <input
                      type="text"
                      value={faq.q_id || ""}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[idx].q_id = e.target.value;
                        setFaqItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground"
                    />
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Jawaban (ID)</label>
                    <textarea
                      rows={3}
                      value={faq.a_id || ""}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[idx].a_id = e.target.value;
                        setFaqItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Question (EN)</label>
                    <input
                      type="text"
                      value={faq.q_en || ""}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[idx].q_en = e.target.value;
                        setFaqItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground"
                    />
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Answer (EN)</label>
                    <textarea
                      rows={3}
                      value={faq.a_en || ""}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[idx].a_en = e.target.value;
                        setFaqItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={isSavingFaqs}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingFaqs ? "Menyimpan..." : "Simpan Daftar FAQ (ID/EN)"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: KONTAK & PETA FOOTER */}
      {activeTab === "contact" && (
        <form onSubmit={handleSaveContact} className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-extrabold text-foreground dark:text-zinc-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Pengaturan Rincian Usaha & Navigasi Peta Interaktif Footer</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Atur Gmail/Email usaha, Nomor WhatsApp, Alamat Lokasi, dan URL Embed Google Maps interaktif yang akan ditampilkan di bagian Footer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Email Gmail Usaha</span>
                </label>
                <input
                  type="email"
                  value={contactForm.email || ""}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="e.g. care@nekostay.com"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Nomor Telepon / WhatsApp Usaha</span>
                </label>
                <input
                  type="text"
                  value={contactForm.phone || ""}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="e.g. +62 812-3456-7890"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Jam Operasional (ID)</span>
                </label>
                <input
                  type="text"
                  value={contactForm.hours_id || ""}
                  onChange={(e) => setContactForm({ ...contactForm, hours_id: e.target.value })}
                  placeholder="e.g. Senin - Minggu: 08:00 - 20:00 WIB"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Opening Hours (EN)</span>
                </label>
                <input
                  type="text"
                  value={contactForm.hours_en || ""}
                  onChange={(e) => setContactForm({ ...contactForm, hours_en: e.target.value })}
                  placeholder="e.g. Monday - Sunday: 08:00 - 20:00 WIB"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Alamat Lengkap Usaha (ID)</span>
                </label>
                <textarea
                  rows={2}
                  value={contactForm.address_id || ""}
                  onChange={(e) => setContactForm({ ...contactForm, address_id: e.target.value })}
                  className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Full Address (EN)</span>
                </label>
                <textarea
                  rows={2}
                  value={contactForm.address_en || ""}
                  onChange={(e) => setContactForm({ ...contactForm, address_en: e.target.value })}
                  className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>Google Maps Embed iframe URL</span>
                </label>
                <input
                  type="text"
                  value={contactForm.google_map_url || ""}
                  onChange={(e) => setContactForm({ ...contactForm, google_map_url: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium text-foreground"
                />
                <span className="text-[10px] text-muted-foreground italic block">
                  *Masukkan link 'src' dari Google Maps Share -&gt; Embed Map.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={isSavingContact}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingContact ? "Menyimpan..." : "Simpan Informasi Kontak & Peta"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB: WARNA BRAND WEBSITE */}
      {activeTab === "color" && (
        <form onSubmit={handleSaveBrandColor} className="space-y-8">
          <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-lg text-foreground dark:text-zinc-100">
                    Pengaturan Skema Warna Brand & Aksesori Website
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Ubah warna utama (*Primary Color*) menggunakan Color Wheel Picker di bawah. Warna dasar ini akan secara otomatis dikalkulasikan ke 10 tingkatan pecahan warna (*brand shades 50–950*), tombol aksen, hover state, dan efek highlight di seluruh website.
                </p>
              </div>
            </div>

            {/* Color Picker & Presets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Color Wheel Selector */}
              <div className="space-y-4 bg-muted/20 dark:bg-zinc-950/40 p-5 rounded-2xl border border-border/60">
                <label className="text-xs font-extrabold text-foreground dark:text-zinc-200 uppercase tracking-wider block">
                  Pilih Warna Primary (Color Wheel)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={primaryHex}
                    onChange={(e) => setPrimaryHex(e.target.value)}
                    className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-border p-1 bg-card shadow-sm hover:scale-105 transition-transform"
                  />
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Kode HEX Warna</span>
                    <input
                      type="text"
                      value={primaryHex}
                      onChange={(e) => setPrimaryHex(e.target.value)}
                      placeholder="#f97316"
                      className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-black text-foreground uppercase tracking-widest font-mono shadow-inner"
                    />
                  </div>
                </div>

                {/* Preset Color Swatches */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Preset Warna Pilihan Cepat:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Default Orange", hex: "#f97316" },
                      { name: "Sapphire Blue", hex: "#3b82f6" },
                      { name: "Emerald Green", hex: "#10b981" },
                      { name: "Royal Purple", hex: "#8b5cf6" },
                      { name: "Sunset Rose", hex: "#f43f5e" },
                      { name: "Warm Amber", hex: "#f59e0b" },
                      { name: "Cyber Teal", hex: "#14b8a6" },
                      { name: "Deep Indigo", hex: "#6366f1" },
                    ].map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setPrimaryHex(p.hex)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          primaryHex.toLowerCase() === p.hex.toLowerCase()
                            ? "border-foreground ring-2 ring-primary bg-card"
                            : "border-border/60 bg-card/60 hover:bg-card"
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0" style={{ backgroundColor: p.hex }} />
                        <span className="text-[11px]">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live UI Components Preview */}
              <div className="space-y-4 bg-muted/20 dark:bg-zinc-950/40 p-5 rounded-2xl border border-border/60">
                <span className="text-xs font-extrabold text-foreground dark:text-zinc-200 uppercase tracking-wider block">
                  Pratinjau Langsung (Live UI Preview)
                </span>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20">
                      Tombol Utama (Primary)
                    </button>
                    <button type="button" className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold">
                      Tombol Sekunder (Secondary)
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Kotak Highlight / Badge Notifikasi</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-black">
                      AKTIF
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Color Shades Breakdown Table */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <div>
                <h4 className="text-sm font-extrabold text-foreground dark:text-zinc-100">
                  Hasil Konversi Pecahan Warna (Brand Shades 50–950)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Pecahan warna ini dihitung otomatis dari warna Primary yang Anda pilih.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {getBrandShades(primaryHex).map((s) => (
                  <div
                    key={s.shade}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                      s.isPrimary
                        ? "border-primary ring-2 ring-primary/40 bg-card shadow-sm"
                        : "border-border/60 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-foreground font-mono">
                        {s.shade}
                      </span>
                      {s.isPrimary && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                          PRIMARY
                        </span>
                      )}
                      {s.isHover && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          HOVER
                        </span>
                      )}
                    </div>

                    <div
                      className="h-10 w-full rounded-xl border border-black/10 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: s.hex }}
                    />

                    <div>
                      <span className="text-[11px] font-bold text-foreground font-mono block">
                        {s.hex}
                      </span>
                      <span className="text-[9px] text-muted-foreground line-clamp-1 block">
                        {s.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={isSavingBrandColor}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingBrandColor ? "Menyimpan Warna..." : "Simpan Warna Brand Website"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB 7: RESET KE DEFAULT */}
      {activeTab === "reset" && (
        <div className="bg-card dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="space-y-2">
            <span className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl inline-block">
              <RotateCcw className="w-6 h-6" />
            </span>
            <h3 className="font-extrabold text-lg text-foreground dark:text-zinc-100">
              Reset Konten CMS Landing Page ke Bawaan
            </h3>
            <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed max-w-xl">
              Jika Anda ingin memulihkan seluruh konten Landing Page (Hero Banner, Kartu Keunggulan, FAQ, dan Kontak Usaha NekoStay) ke kondisi awal bawaan pabrik, Anda dapat menekan tombol di bawah ini.
            </p>
          </div>

          <div className="pt-4 border-t border-border/60 dark:border-zinc-800 flex items-center gap-4">
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

      {/* MODAL 1: TAMBAH KELAS KAMAR BARU */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 w-full max-w-lg p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-black text-foreground dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <span>Tambah Kelas Kamar Baru</span>
              </h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                  placeholder="Contoh: Deluxe Suite / Executive"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">Tarif per Hari (Rp)</label>
                <input
                  type="number"
                  required
                  value={newClassForm.price_per_day}
                  onChange={(e) => setNewClassForm({ ...newClassForm, price_per_day: e.target.value })}
                  placeholder="Contoh: 150000"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={newClassForm.description}
                  onChange={(e) => setNewClassForm({ ...newClassForm, description: e.target.value })}
                  placeholder="Deskripsi keunggulan kelas kamar ini..."
                  className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium text-foreground resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">Fasilitas (Dipisah Koma)</label>
                <input
                  type="text"
                  value={newClassForm.facilitiesText}
                  onChange={(e) => setNewClassForm({ ...newClassForm, facilitiesText: e.target.value })}
                  placeholder="Contoh: AC, Air Minum Filter, Grooming 2x"
                  className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">Foto Kamar</label>
                <ImageUpload
                  value={newClassForm.image_url}
                  onChange={(url) => setNewClassForm({ ...newClassForm, image_url: url })}
                  folder="rooms"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAddingClass}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 cursor-pointer disabled:opacity-50"
                >
                  {isAddingClass ? "Menyimpan..." : "Simpan Kelas Kamar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BUAT KODE PROMO BARU */}
      {showAddPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 w-full max-w-lg p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-black text-foreground dark:text-zinc-100 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <span>Buat Kode Promo / Voucher Baru</span>
              </h3>
              <button
                onClick={() => setShowAddPromoModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase">Kode Promo</label>
                  <input
                    type="text"
                    required
                    value={newPromoForm.code}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: LIBURAN15"
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase">Tipe Diskon</label>
                  <select
                    value={newPromoForm.discount_type}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, discount_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">Judul / Deskripsi Promo</label>
                <input
                  type="text"
                  required
                  value={newPromoForm.title}
                  onChange={(e) => setNewPromoForm({ ...newPromoForm, title: e.target.value })}
                  placeholder="Contoh: Diskon Spesial Liburan 15%"
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase">
                    {newPromoForm.discount_type === "percentage" ? "Persentase (%)" : "Nominal Diskon (Rp)"}
                  </label>
                  <input
                    type="number"
                    required
                    value={newPromoForm.discount_value}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, discount_value: e.target.value })}
                    placeholder={newPromoForm.discount_type === "percentage" ? "15" : "20000"}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase">Minimal Transaksi (Rp)</label>
                  <input
                    type="number"
                    value={newPromoForm.min_spend}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, min_spend: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase">Berlaku untuk Kelas</label>
                  <select
                    value={newPromoForm.applicable_class}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, applicable_class: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground"
                  >
                    <option value="all">Semua Kelas Kamar</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        Khusus {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase">Batas Total Pemakaian</label>
                  <input
                    type="number"
                    value={newPromoForm.usage_limit}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, usage_limit: e.target.value })}
                    placeholder="Kosongkan jika tak terbatas"
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-medium text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowAddPromoModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAddingPromo}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 cursor-pointer disabled:opacity-50"
                >
                  {isAddingPromo ? "Membuat..." : "Terbitkan Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

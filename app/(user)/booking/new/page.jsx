"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cat,
  Calendar,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { formatRupiah } from "@/lib/utils/format";
import { getBookingSummary } from "@/lib/utils/pricing";
import { useLanguage, dictionary } from "@/hooks/useLanguage";
export default function NewBookingPage() {
  return (
    <div className="max-w-3xl w-full mx-auto">
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground animate-pulse">
            Memuat form pemesanan...
          </div>
        }
      >
        <BookingFormContent />
      </Suspense>
    </div>
  );
}

function BookingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { language: storeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const language = mounted ? storeLanguage : "id";
  const t = (key) => dictionary[language]?.[key] || key;

  // Form State
  const [step, setStep] = useState(1);
  const [catName, setCatName] = useState("");
  const [catGender, setCatGender] = useState("Jantan");
  const [catAge, setCatAge] = useState("");
  const [catHealth, setCatHealth] = useState("Sehat");
  const [catFood, setCatFood] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [catNotes, setCatNotes] = useState("");
  const [catPhotoUrl, setCatPhotoUrl] = useState("");

  const [bookingClass, setBookingClass] = useState("Standard");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  // Referral states
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isVerifyingReferral, setIsVerifyingReferral] = useState(false);
  const [appliedReferral, setAppliedReferral] = useState(null);
  const [referralError, setReferralError] = useState(null);
  const [referralSuccess, setReferralSuccess] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  // Auto-fill class from query parameter if available
  useEffect(() => {
    const classParam = searchParams.get("class");
    if (
      classParam === "Basic" ||
      classParam === "Standard" ||
      classParam === "Premium"
    ) {
      setBookingClass(classParam);
    }
  }, [searchParams]);

  // Handle referral verification
  const handleVerifyReferral = async () => {
    const code = referralCodeInput.trim().toUpperCase();
    if (!code) return;
    
    setIsVerifyingReferral(true);
    setReferralError(null);
    setReferralSuccess(null);
    setAppliedReferral(null);

    try {
      const res = await fetch(`/api/referral/verify?code=${code}`);
      const data = await res.json();

      if (data.valid) {
        setAppliedReferral(code);
        setReferralSuccess(
          language === "en" 
            ? `Referral valid! 10% discount applied (by ${data.ownerName})` 
            : `Kode referral valid! Diskon 10% diterapkan (oleh ${data.ownerName})`
        );
      } else {
        setReferralError(
          language === "en"
            ? data.message || "Invalid referral code"
            : data.message || "Kode referral tidak valid atau milik Anda sendiri"
        );
      }
    } catch (err) {
      setReferralError(language === "en" ? "Failed to verify code" : "Gagal memverifikasi kode");
    } finally {
      setIsVerifyingReferral(false);
    }
  };

  // Clear applied referral
  const handleRemoveReferral = () => {
    setAppliedReferral(null);
    setReferralSuccess(null);
    setReferralCodeInput("");
  };

  // Pricing preview calculation
  const pricingPreview = useMemo(() => {
    if (!checkInDate || !checkOutDate) return null;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (
      isNaN(checkIn.getTime()) ||
      isNaN(checkOut.getTime()) ||
      checkOut <= checkIn
    )
      return null;

    const baseSummary = getBookingSummary(bookingClass, checkIn, checkOut);
    
    // Apply 10% discount if referral applied
    const discount = appliedReferral ? Math.floor(baseSummary.totalCost * 0.1) : 0;
    const finalTotal = baseSummary.totalCost - discount;

    return {
      ...baseSummary,
      discount,
      finalTotal,
    };
  }, [bookingClass, checkInDate, checkOutDate, appliedReferral]);

  const validateStep1 = () => {
    const errors = {};
    if (!catName.trim()) {
      errors.catName = language === "en" ? "Cat name is required" : "Nama kucing wajib diisi";
    }
    if (!catAge.trim()) {
      errors.catAge = language === "en" ? "Cat age is required" : "Usia kucing wajib diisi";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!checkInDate) {
      errors.checkInDate = language === "en" ? "Check-in date is required" : "Tanggal masuk wajib diisi";
    }
    if (!checkOutDate) {
      errors.checkOutDate = language === "en" ? "Check-out date is required" : "Tanggal keluar wajib diisi";
    }
    if (checkInDate && checkOutDate) {
      const inD = new Date(checkInDate);
      const outD = new Date(checkOutDate);
      if (outD <= inD) {
        errors.checkOutDate = language === "en" ? "Check-out must be after check-in" : "Tanggal keluar harus setelah tanggal masuk";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error(
          language === "en" 
            ? "Unauthenticated. Please login again." 
            : "Pengguna tidak terautentikasi. Silakan masuk kembali."
        );
      }

      const pricePerDay = { Basic: 50000, Standard: 80000, Premium: 130000 }[
        bookingClass
      ];

      const discount = pricingPreview?.discount || 0;

      // Insert booking record
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          cat_name: catName,
          cat_gender: catGender,
          cat_age: catAge,
          cat_health_status: catHealth,
          cat_favorite_food: catFood || null,
          cat_is_pregnant: catGender === "Betina" ? isPregnant : false,
          cat_notes: catNotes || null,
          cat_photo_url: catPhotoUrl || null,
          class: bookingClass,
          price_per_day: pricePerDay,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          status: "Menunggu",
          discount_amount: discount,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert in-app notification for admin securely via RPC
      const adminNotifTitle = language === "en" ? "New Boarding Booking" : "Pesanan Penitipan Baru";
      const adminNotifMsg = language === "en" 
        ? `New booking for cat ${catName} class ${bookingClass}.` 
        : `Booking baru untuk kucing ${catName} kelas ${bookingClass}.`;

      await supabase.rpc("create_admin_notification", {
        booking_id_param: booking.id,
        title_param: adminNotifTitle,
        message_param: adminNotifMsg,
        type_param: "info",
      });

      // Redirect to booking detail page
      router.push(`/booking/${booking.id}`);
      router.refresh();
    } catch (err) {
      setServerError(
        err.message || (language === "en" ? "Failed to save booking" : "Gagal menyimpan pesanan. Silakan coba lagi.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 mt-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>{language === "en" ? "Boarding Service" : "Layanan Penitipan"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-zinc-100">
          {language === "en" ? "Boarding Booking Form" : "Form Pemesanan Penitipan"}
        </h1>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          {language === "en" 
            ? "Complete the cat and booking details to reserve a cage." 
            : "Isi data kucing dan pemesanan secara lengkap untuk memesan kandang."}
        </p>
      </div>

      {/* Stepper progress */}
      <div className="grid grid-cols-3 gap-2 border-b border-border/80 dark:border-zinc-800 pb-4 text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
        <div
          className={`flex items-center gap-2 pb-2 border-b-2 ${step >= 1 ? "border-primary text-primary" : "border-transparent"}`}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            1
          </span>
          <span>{t("book_step_1")}</span>
        </div>
        <div
          className={`flex items-center gap-2 pb-2 border-b-2 ${step >= 2 ? "border-primary text-primary" : "border-transparent"}`}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            2
          </span>
          <span>{t("book_step_2")}</span>
        </div>
        <div
          className={`flex items-center gap-2 pb-2 border-b-2 ${step >= 3 ? "border-primary text-primary" : "border-transparent"}`}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            3
          </span>
          <span>{t("book_step_3")}</span>
        </div>
      </div>

      {serverError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* STEP 1: Data Kucing */}
      {step === 1 && (
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-foreground dark:text-zinc-100 text-lg border-b border-border/60 dark:border-zinc-800/60 pb-3">
            <Cat className="w-5 h-5 text-primary" />
            <span>{language === "en" ? "Your Cat Details" : "Informasi Detail Kucing Anda"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                {t("book_cat_name")}
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder={language === "en" ? "e.g. Mochi, Kuro" : "Misal: Mochi, Kuro"}
                className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
              />

              {validationErrors.catName && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {validationErrors.catName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                {t("book_cat_gender")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCatGender("Jantan")}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    catGender === "Jantan"
                      ? "border-primary bg-primary/10 text-primary dark:bg-primary/25"
                      : "border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800"
                  }`}
                >
                  {t("book_cat_gender_m")}
                </button>
                <button
                  type="button"
                  onClick={() => setCatGender("Betina")}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    catGender === "Betina"
                      ? "border-primary bg-primary/10 text-primary dark:bg-primary/25"
                      : "border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800"
                  }`}
                >
                  {t("book_cat_gender_f")}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                {language === "en" ? "Cat's Age" : "Usia Kucing"}
              </label>
              <input
                type="text"
                value={catAge}
                onChange={(e) => setCatAge(e.target.value)}
                placeholder={t("book_cat_age")}
                className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
              />

              {validationErrors.catAge && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {validationErrors.catAge}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                {t("book_cat_health")}
              </label>
              <select
                value={catHealth}
                onChange={(e) => setCatHealth(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-250 dark:bg-zinc-900"
              >
                <option value="Sehat">{t("book_cat_health_healthy")}</option>
                <option value="Sakit">{t("book_cat_health_sick")}</option>
                <option value="Dalam Pengobatan">{t("book_cat_health_med")}</option>
              </select>
            </div>
          </div>

          {catGender === "Betina" && (
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-550/20 p-4 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="pregnant"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary rounded-sm cursor-pointer"
              />

              <label
                htmlFor="pregnant"
                className="text-xs font-semibold text-foreground dark:text-zinc-250 cursor-pointer"
              >
                {t("book_cat_pregnant")}
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              {t("book_cat_food")}
            </label>
            <input
              type="text"
              value={catFood}
              onChange={(e) => setCatFood(e.target.value)}
              placeholder={language === "en" ? "e.g. wet food brand X, snack" : "Misal: Wet food merk X, snack rasa tuna"}
              className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              {t("book_cat_notes")}
            </label>
            <textarea
              value={catNotes}
              onChange={(e) => setCatNotes(e.target.value)}
              rows={3}
              placeholder={language === "en" ? "Give any special requirements for feeding, habits, etc." : "Berikan instruksi khusus jika kucing memiliki kebiasaan makan atau perawatan khusus..."}
              className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200"
            />
          </div>

          <ImageUpload
            onUpload={(url) => setCatPhotoUrl(url)}
            defaultValue={catPhotoUrl}
            label={t("book_cat_photo")}
          />

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
            >
              {t("book_btn_next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Data Pemesanan */}
      {step === 2 && (
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-foreground dark:text-zinc-100 text-lg border-b border-border/60 dark:border-zinc-800/60 pb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <span>{language === "en" ? "Room & Date selection" : "Kelas & Waktu Penitipan"}</span>
          </div>

          <div className="space-y-3.5">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              {t("book_class_select")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: "Basic", price: 50000 },
                { name: "Standard", price: 80000 },
                { name: "Premium", price: 130000 },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setBookingClass(c.name)}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    bookingClass === c.name
                      ? "border-primary bg-primary/5 text-primary dark:bg-primary/15 shadow-xs"
                      : "border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800"
                  }`}
                >
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground dark:text-zinc-150">
                      {c.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground dark:text-zinc-450 mt-1">
                      {language === "en" ? "Full boarding service" : "Layanan penitipan lengkap."}
                    </p>
                  </div>
                  <span className="text-sm font-black text-foreground dark:text-zinc-200 mt-4 block">
                    {formatRupiah(c.price)}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {t("room_per_day")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                {t("book_checkin")}
              </label>
              <input
                type="date"
                value={checkInDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200 cursor-pointer"
              />

              {validationErrors.checkInDate && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {validationErrors.checkInDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
                {t("book_checkout")}
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={checkInDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200 cursor-pointer"
              />

              {validationErrors.checkOutDate && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {validationErrors.checkOutDate}
                </p>
              )}
            </div>
          </div>

          {/* Referral input */}
          <div className="space-y-1.5 border-t border-border/60 dark:border-zinc-800/60 pt-4">
            <label className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">
              {t("book_referral_code_optional")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Sparkles className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/60" />
                <input
                  type="text"
                  value={referralCodeInput}
                  disabled={!!appliedReferral}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  placeholder="e.g. NEKO-XXXX"
                  className="w-full pl-11 pr-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground dark:text-zinc-200 uppercase disabled:opacity-60"
                />
              </div>
              {appliedReferral ? (
                <button
                  type="button"
                  onClick={handleRemoveReferral}
                  className="px-4 py-3 rounded-xl border border-rose-200 text-rose-600 dark:border-rose-950/40 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/15 cursor-pointer transition-colors"
                >
                  {language === "en" ? "Remove" : "Hapus"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyReferral}
                  disabled={isVerifyingReferral || !referralCodeInput.trim()}
                  className="px-5 py-3 rounded-xl bg-secondary dark:bg-zinc-800 text-primary dark:text-zinc-200 text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
                >
                  {isVerifyingReferral ? t("book_referral_applying") : (language === "en" ? "Apply" : "Terapkan")}
                </button>
              )}
            </div>

            {referralError && (
              <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{referralError}</span>
              </p>
            )}

            {referralSuccess && (
              <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{referralSuccess}</span>
              </p>
            )}
          </div>

          {/* Pricing Preview Summary Box */}
          {pricingPreview && (
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-950/20 p-5 rounded-2xl space-y-2">
              <h4 className="text-xs font-extrabold text-foreground dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>{language === "en" ? "Estimated Cost Breakdown" : "Rincian Estimasi Biaya"}</span>
              </h4>
              <div className="text-sm space-y-1 text-muted-foreground dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>{language === "en" ? "Room Class" : "Kelas Kamar"}:</span>
                  <span className="font-bold text-foreground dark:text-zinc-200">
                    {bookingClass} ({formatRupiah(pricingPreview.pricePerDay)}
                    {t("room_per_day")})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{language === "en" ? "Duration" : "Durasi Menginap"}:</span>
                  <span className="font-bold text-foreground dark:text-zinc-200">
                    {pricingPreview.totalDays} {language === "en" ? "Days" : "Hari"}
                  </span>
                </div>
                {appliedReferral && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>{t("book_discount_referral")} (10%):</span>
                    <span>-{formatRupiah(pricingPreview.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/50 dark:border-zinc-800/50 pt-2 text-base font-extrabold text-foreground dark:text-zinc-150">
                  <span>{language === "en" ? "Total Cost" : "Total Estimasi Biaya"}:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(pricingPreview.finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl border border-border dark:border-zinc-800 text-xs font-bold hover:bg-muted dark:hover:bg-zinc-800 transition-all cursor-pointer text-foreground dark:text-zinc-300"
            >
              {t("book_btn_prev")}
            </button>
            <button
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
            >
              {t("book_btn_next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Konfirmasi */}
      {step === 3 && (
        <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-8 rounded-3xl space-y-8 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-foreground dark:text-zinc-100 text-lg border-b border-border/60 dark:border-zinc-800/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>{language === "en" ? "Confirm & Review Booking" : "Konfirmasi & Tinjau Pesanan"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cat details summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cat className="w-3.5 h-3.5 text-primary" />
                <span>{t("book_step_1")}</span>
              </h3>

              {catPhotoUrl && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/80 dark:border-zinc-800 shadow-xs mb-4">
                  <img
                    src={catPhotoUrl}
                    alt="Kucing"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="text-sm space-y-2 text-muted-foreground dark:text-zinc-400">
                <div>
                  {t("book_cat_name")}: <strong className="text-foreground dark:text-zinc-200">{catName}</strong>
                </div>
                <div>
                  {t("book_cat_gender")}:{" "}
                  <strong className="text-foreground dark:text-zinc-200">
                    {catGender === "Jantan" ? t("book_cat_gender_m") : t("book_cat_gender_f")}
                  </strong>
                </div>
                <div>
                  {language === "en" ? "Cat's Age" : "Usia Kucing"}:{" "}
                  <strong className="text-foreground dark:text-zinc-200">{catAge}</strong>
                </div>
                <div>
                  {t("book_cat_health")}:{" "}
                  <strong className="text-foreground dark:text-zinc-200">
                    {catHealth === "Sehat" ? t("book_cat_health_healthy") : catHealth === "Sakit" ? t("book_cat_health_sick") : t("book_cat_health_med")}
                  </strong>
                </div>
                {catFood && (
                  <div>
                    {t("book_cat_food")}:{" "}
                    <strong className="text-foreground dark:text-zinc-200">{catFood}</strong>
                  </div>
                )}
                {isPregnant && catGender === "Betina" && (
                  <div className="text-rose-600 font-semibold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>{t("book_cat_pregnant")}</span>
                  </div>
                )}
                {catNotes && (
                  <div>
                    {t("book_cat_notes")}:{" "}
                    <strong className="text-foreground dark:text-zinc-200">{catNotes}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Booking schedule details */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{language === "en" ? "Stay Details" : "Waktu & Kamar"}</span>
              </h3>

              <div className="text-sm space-y-2 text-muted-foreground dark:text-zinc-400">
                <div>
                  {language === "en" ? "Room Class" : "Kelas Pilihan"}:{" "}
                  <strong className="text-foreground dark:text-zinc-200">{bookingClass}</strong>
                </div>
                <div>
                  {t("book_checkin")}:{" "}
                  <strong className="text-foreground dark:text-zinc-200">{checkInDate}</strong>
                </div>
                <div>
                  {t("book_checkout")}:{" "}
                  <strong className="text-foreground dark:text-zinc-200">{checkOutDate}</strong>
                </div>
              </div>

              {pricingPreview && (
                <div className="bg-muted/50 dark:bg-zinc-900/60 p-4 border border-border/60 dark:border-zinc-800/60 rounded-2xl space-y-1 text-sm mt-4">
                  <div className="flex justify-between">
                    <span>{t("book_total_days")}:</span>
                    <span className="font-bold text-foreground dark:text-zinc-250">
                      {pricingPreview.totalDays} {language === "en" ? "Days" : "Hari"}
                    </span>
                  </div>
                  {appliedReferral && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>{t("book_discount_referral")} (10%):</span>
                      <span>-{formatRupiah(pricingPreview.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-foreground dark:text-zinc-150 border-t border-border/50 dark:border-zinc-850/50 pt-2">
                    <span>{language === "en" ? "Total Price" : "Estimasi Bayar"}:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(pricingPreview.finalTotal)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-secondary dark:bg-zinc-900 text-secondary-foreground dark:text-zinc-400 text-xs rounded-xl font-medium leading-relaxed flex gap-2 items-start">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {language === "en"
                    ? "Payment is made cash or bank transfer directly when checking in your cat at NekoStay."
                    : "Pembayaran dilakukan secara tunai/transfer langsung saat kucing diserahkan di lokasi penitipan NekoStay."}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border/60 dark:border-zinc-850/60">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl border border-border dark:border-zinc-800 text-xs font-bold hover:bg-muted dark:hover:bg-zinc-800 transition-all cursor-pointer text-foreground dark:text-zinc-300"
            >
              {t("book_btn_prev")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (language === "en" ? "Saving..." : "Sedang Menyimpan...") : t("book_btn_submit")}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

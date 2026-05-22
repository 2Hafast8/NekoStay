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

// Schema was defined in skill.md. Let's create validations/booking.ts in a separate file, but here we can define it or import it.
// Let's create `lib/validations/booking.ts` right after this step. For now, we'll write the page.
export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground animate-pulse">
          Memuat form pemesanan...
        </div>
      }
    >
      <BookingFormContent />
    </Suspense>
  );
}

function BookingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

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
    return getBookingSummary(bookingClass, checkIn, checkOut);
  }, [bookingClass, checkInDate, checkOutDate]);

  const validateStep1 = () => {
    const errors = {};
    if (!catName.trim()) errors.catName = "Nama kucing wajib diisi";
    if (!catAge.trim())
      errors.catAge = "Usia kucing wajib diisi (misal: 1 Tahun, 6 Bulan)";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!checkInDate) errors.checkInDate = "Tanggal masuk wajib diisi";
    if (!checkOutDate) errors.checkOutDate = "Tanggal keluar wajib diisi";
    if (checkInDate && checkOutDate) {
      const inD = new Date(checkInDate);
      const outD = new Date(checkOutDate);
      if (outD <= inD) {
        errors.checkOutDate = "Tanggal keluar harus setelah tanggal masuk";
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
      if (!user)
        throw new Error(
          "Pengguna tidak terautentikasi. Silakan masuk kembali.",
        );

      const pricePerDay = { Basic: 50000, Standard: 80000, Premium: 130000 }[
        bookingClass
      ];

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
        })
        .select()
        .single();

      if (error) throw error;

      // Insert in-app notification for admin
      // Since admin needs to know, we query admin profiles to get admin user ID to notify them,
      // or we can write notification to all admin profiles. For simplicity, we can fetch profiles where role = admin
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins) {
        const notificationsToInsert = admins.map((admin) => ({
          user_id: admin.id,
          title: "Pesanan Penitipan Baru",
          message: `Booking baru untuk kucing ${catName} kelas ${bookingClass}.`,
          type: "info",
          booking_id: booking.id,
          is_read: false,
        }));

        if (notificationsToInsert.length > 0) {
          await supabase.from("notifications").insert(notificationsToInsert);
        }
      }

      // Redirect to booking detail page
      router.push(`/booking/${booking.id}`);
      router.refresh();
    } catch (err) {
      setServerError(
        err.message || "Gagal menyimpan pesanan. Silakan coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>Layanan Penitipan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Form Pemesanan Penitipan
        </h1>
        <p className="text-sm text-muted-foreground">
          Isi data kucing dan pemesanan secara lengkap untuk memesan kandang.
        </p>
      </div>

      {/* Stepper progress */}
      <div className="grid grid-cols-3 gap-2 border-b border-border/80 pb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <div
          className={`flex items-center gap-2 pb-2 border-b-2 ${step >= 1 ? "border-primary text-primary" : "border-transparent"}`}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Data Kucing</span>
        </div>
        <div
          className={`flex items-center gap-2 pb-2 border-b-2 ${step >= 2 ? "border-primary text-primary" : "border-transparent"}`}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Data Booking</span>
        </div>
        <div
          className={`flex items-center gap-2 pb-2 border-b-2 ${step >= 3 ? "border-primary text-primary" : "border-transparent"}`}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Konfirmasi</span>
        </div>
      </div>

      {serverError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* STEP 1: Data Kucing */}
      {step === 1 && (
        <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-foreground text-lg border-b border-border/60 pb-3">
            <Cat className="w-5 h-5 text-primary" />
            <span>Informasi Detail Kucing Anda</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Nama Kucing
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Misal: Mochi, Kuro"
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground"
              />

              {validationErrors.catName && (
                <p className="text-xs text-rose-500 font-semibold">
                  {validationErrors.catName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCatGender("Jantan")}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    catGender === "Jantan"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Jantan
                </button>
                <button
                  type="button"
                  onClick={() => setCatGender("Betina")}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    catGender === "Betina"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Betina
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Usia Kucing
              </label>
              <input
                type="text"
                value={catAge}
                onChange={(e) => setCatAge(e.target.value)}
                placeholder="Misal: 1.5 Tahun, 8 Bulan"
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground"
              />

              {validationErrors.catAge && (
                <p className="text-xs text-rose-500 font-semibold">
                  {validationErrors.catAge}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Kondisi Kesehatan
              </label>
              <select
                value={catHealth}
                onChange={(e) => setCatHealth(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground"
              >
                <option value="Sehat">Sehat Walafiat</option>
                <option value="Sakit">Sakit Ringan</option>
                <option value="Dalam Pengobatan">
                  Sedang Dalam Pengobatan
                </option>
              </select>
            </div>
          </div>

          {catGender === "Betina" && (
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="pregnant"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary rounded-sm cursor-pointer"
              />

              <label
                htmlFor="pregnant"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Kucing betina sedang hamil? (Centang jika Ya)
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Makanan Terfavorit (Opsional)
            </label>
            <input
              type="text"
              value={catFood}
              onChange={(e) => setCatFood(e.target.value)}
              placeholder="Misal: Wet food merk X, snack rasa tuna"
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Catatan Perawatan Tambahan (Opsional)
            </label>
            <textarea
              value={catNotes}
              onChange={(e) => setCatNotes(e.target.value)}
              rows={3}
              placeholder="Berikan instruksi khusus jika kucing memiliki kebiasaan makan atau perawatan khusus..."
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground"
            />
          </div>

          <ImageUpload
            onUpload={(url) => setCatPhotoUrl(url)}
            defaultValue={catPhotoUrl}
            label="Upload Foto Kucing Kesayangan"
          />

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
            >
              Lanjutkan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Data Pemesanan */}
      {step === 2 && (
        <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-foreground text-lg border-b border-border/60 pb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Kelas & Waktu Penitipan</span>
          </div>

          <div className="space-y-3.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Pilih Kelas Kamar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: "Basic", price: 50000, label: "Basic" },
                { name: "Standard", price: 80000, label: "Standard" },
                { name: "Premium", price: 130000, label: "Premium" },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setBookingClass(c.name)}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    bookingClass === c.name
                      ? "border-primary bg-primary/5 text-primary shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      {c.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Layanan penitipan lengkap.
                    </p>
                  </div>
                  <span className="text-sm font-black text-foreground mt-4 block">
                    {formatRupiah(c.price)}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      /hari
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Tanggal Masuk (Check-In)
              </label>
              <input
                type="date"
                value={checkInDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground cursor-pointer"
              />

              {validationErrors.checkInDate && (
                <p className="text-xs text-rose-500 font-semibold">
                  {validationErrors.checkInDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Tanggal Keluar (Check-Out)
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={checkInDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground cursor-pointer"
              />

              {validationErrors.checkOutDate && (
                <p className="text-xs text-rose-500 font-semibold">
                  {validationErrors.checkOutDate}
                </p>
              )}
            </div>
          </div>

          {/* Pricing Preview Summary Box */}
          {pricingPreview && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl space-y-2">
              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Rincian Estimasi Biaya</span>
              </h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Kelas Kamar:</span>
                  <span className="font-bold text-foreground">
                    {bookingClass} ({formatRupiah(pricingPreview.pricePerDay)}
                    /hari)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Durasi Menginap:</span>
                  <span className="font-bold text-foreground">
                    {pricingPreview.totalDays} Hari
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 text-base font-extrabold text-foreground">
                  <span>Total Estimasi Biaya:</span>
                  <span className="text-emerald-600">
                    {formatRupiah(pricingPreview.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all cursor-pointer text-foreground"
            >
              Kembali
            </button>
            <button
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
            >
              Lanjutkan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Konfirmasi */}
      {step === 3 && (
        <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-8 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-foreground text-lg border-b border-border/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Konfirmasi & Tinjau Pesanan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cat details summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Cat className="w-3.5 h-3.5 text-primary" />
                <span>Profil Kucing</span>
              </h3>

              {catPhotoUrl && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/80 shadow-xs mb-4">
                  <img
                    src={catPhotoUrl}
                    alt="Kucing"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="text-sm space-y-2 text-muted-foreground">
                <div>
                  Nama: <strong className="text-foreground">{catName}</strong>
                </div>
                <div>
                  Jenis Kelamin:{" "}
                  <strong className="text-foreground">{catGender}</strong>
                </div>
                <div>
                  Usia Kucing:{" "}
                  <strong className="text-foreground">{catAge}</strong>
                </div>
                <div>
                  Status Kesehatan:{" "}
                  <strong className="text-foreground">{catHealth}</strong>
                </div>
                {catFood && (
                  <div>
                    Makanan Favorit:{" "}
                    <strong className="text-foreground">{catFood}</strong>
                  </div>
                )}
                {isPregnant && catGender === "Betina" && (
                  <div className="text-rose-600 font-semibold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sedang Hamil</span>
                  </div>
                )}
                {catNotes && (
                  <div>
                    Catatan:{" "}
                    <strong className="text-foreground">{catNotes}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Booking schedule details */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Waktu & Kamar</span>
              </h3>

              <div className="text-sm space-y-2 text-muted-foreground">
                <div>
                  Kelas Pilihan:{" "}
                  <strong className="text-foreground">{bookingClass}</strong>
                </div>
                <div>
                  Tanggal Check-In:{" "}
                  <strong className="text-foreground">{checkInDate}</strong>
                </div>
                <div>
                  Tanggal Check-Out:{" "}
                  <strong className="text-foreground">{checkOutDate}</strong>
                </div>
              </div>

              {pricingPreview && (
                <div className="bg-muted/50 p-4 border border-border/60 rounded-2xl space-y-1 text-sm mt-4">
                  <div className="flex justify-between">
                    <span>Lama Penitipan:</span>
                    <span className="font-bold text-foreground">
                      {pricingPreview.totalDays} Hari
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-foreground border-t border-border/50 pt-2">
                    <span>Estimasi Bayar:</span>
                    <span className="text-emerald-600">
                      {formatRupiah(pricingPreview.totalCost)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-secondary text-secondary-foreground text-xs rounded-xl font-medium leading-relaxed flex gap-2 items-start">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Pembayaran dilakukan secara tunai/transfer langsung saat
                  kucing diserahkan di lokasi penitipan NekoStay.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border/60">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all cursor-pointer text-foreground"
            >
              Kembali
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Sedang Menyimpan..." : "Kirim Pemesanan"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

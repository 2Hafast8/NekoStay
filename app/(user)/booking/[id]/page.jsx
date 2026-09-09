"use client";

import { useState, useEffect, useCallback, use, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  Cat,
  Calendar,
  Layers,
  ArrowLeft,
  PhoneCall,
  AlertCircle,
  HeartPulse,
  FileText,
  Star,
  Check,
  CreditCard,
  Wallet,
  Coins,
  FileCheck,
  Mail,
  Clock,
  QrCode,
  RefreshCcw,
  Store,
  X,
  Copy,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Tag,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Info,
  User,
  Utensils,
  Heart,
  Baby,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GsapDataLoader } from "@/components/shared/GsapDataLoader";
import { OfflineQrModal } from "@/components/booking/OfflineQrModal";
import { formatDate } from "@/lib/utils/dates";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage, dictionary } from "@/hooks/useLanguage";
import { useAutoDismiss } from "@/hooks/useAutoDismiss";
import { toast } from "sonner";
export default function BookingDetailPage({ params }) {
  const { id } = use(params);
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const midtransSnapUrl = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  return (
    <div className="max-w-4xl w-full mx-auto">
      <Suspense fallback={<div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <BookingDetailContent id={id} />
      </Suspense>
      <Script
        src={midtransSnapUrl}
        data-client-key={clientKey}
        strategy="lazyOnload"
      />
    </div>
  );
}

function BookingDetailContent({ id }) {
  const router = useRouter();
  const { language: storeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const language = mounted ? storeLanguage : "id";
  const t = (key) => dictionary[language]?.[key] || key;
  const [booking, setBooking] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cancel dialog states
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Auto-dismiss alert notifications after 3 seconds
  useAutoDismiss(errorMsg, setErrorMsg);

  // Payment states
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isReceiptSending, setIsReceiptSending] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [sandboxCountdown, setSandboxCountdown] = useState(null);
  const hasAutoVerified = useRef(false);
  const searchParams = useSearchParams();

  // Offline QR & Pop-up Modal states
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [offlineToken, setOfflineToken] = useState(null);
  const [offlineQrDataUrl, setOfflineQrDataUrl] = useState(null);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);

  // Auto-close QR modal if booking is paid
  useEffect(() => {
    if (booking?.payment_status === "Paid" && isQrModalOpen) {
      setIsQrModalOpen(false);
    }
  }, [booking?.payment_status, isQrModalOpen]);

  // Review states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReviewData, setUserReviewData] = useState(null);
  const [checkingReview, setCheckingReview] = useState(true);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Copy booking ID state
  const [copiedId, setCopiedId] = useState(false);
  const handleCopyId = () => {
    if (!booking?.id) return;
    navigator.clipboard.writeText(booking.id);
    setCopiedId(true);
    toast.success(language === "en" ? "Booking ID copied!" : "ID Pesanan berhasil disalin!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const supabase = createClient();

  const loadBookingDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          profiles:user_id (full_name, phone)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setBooking(data);

      // Fetch condition reports for this booking
      const { data: reportsData } = await supabase
        .from("cat_reports")
        .select("*")
        .eq("booking_id", id)
        .order("report_date", { ascending: false });

      if (reportsData) {
        setReports(reportsData);
      }

      // Check if user has already reviewed this stay
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id, rating, review_text, created_at, reply_text")
        .eq("booking_id", id)
        .maybeSingle();

      if (existingReview) {
        setHasReviewed(true);
        setUserReviewData(existingReview);
      }
    } catch (err) {
      console.error("Error fetching booking details:", err);
      setErrorMsg(language === "en" ? "Failed to load booking details." : "Gagal memuat rincian pesanan.");
    } finally {
      setIsLoading(false);
      setCheckingReview(false);
    }
  }, [id, supabase, language]);

  useEffect(() => {
    loadBookingDetails();
  }, [loadBookingDetails]);

  // Realtime subscription for instant status sync (bookings, daily reports, reviews)
  useEffect(() => {
    if (!id) return;

    let debounceTimer = null;
    const triggerDebouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadBookingDetails();
      }, 300);
    };

    const channelId = `booking-status-user-${id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            setBooking((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
          } else {
            triggerDebouncedReload();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cat_reports",
          filter: `booking_id=eq.${id}`,
        },
        () => {
          triggerDebouncedReload();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `booking_id=eq.${id}`,
        },
        () => {
          triggerDebouncedReload();
        }
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadBookingDetails();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id, supabase, loadBookingDetails]);

  // Helper: Verifikasi status pembayaran langsung ke Midtrans via API server
  const checkPaymentStatus = useCallback(async (orderId) => {
    if (!orderId) return null;
    setIsVerifyingPayment(true);
    try {
      const res = await fetch("/api/payments/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Reload booking details untuk mendapatkan status terbaru
        await loadBookingDetails();
        return data.paymentStatus;
      }
    } catch (err) {
      console.error("Payment status check error:", err);
    } finally {
      setIsVerifyingPayment(false);
    }
    return null;
  }, [id, loadBookingDetails]);

  // Auto-verify: Setiap kali booking dimuat dan status masih Unpaid + ada orderId,
  // otomatis cek status pembayaran ke Midtrans (hanya sekali per page load)
  useEffect(() => {
    // Cek dari URL params redirect (prioritas tinggi)
    const paymentResult = searchParams.get('payment');
    const orderId = searchParams.get('order_id');
    if (paymentResult && orderId) {
      hasAutoVerified.current = true;
      checkPaymentStatus(orderId);
      window.history.replaceState({}, '', `/booking/${id}`);
      return;
    }

    // Auto-verify dari data booking yang tersimpan
    if (
      !hasAutoVerified.current &&
      booking &&
      booking.payment_status === "Unpaid" &&
      booking.payment_link_url
    ) {
      hasAutoVerified.current = true;
      checkPaymentStatus(booking.payment_link_url);
    }
  }, [booking?.payment_status, booking?.payment_link_url, searchParams, id, checkPaymentStatus]);

  const handlePayment = async () => {
    setIsPaymentLoading(true);
    setErrorMsg(null);
    hasAutoVerified.current = false; // Reset agar auto-verify bisa jalan setelah pembayaran baru
    try {
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

      if (!isProduction) {
        // Start 10-second countdown for sandbox simulation
        setSandboxCountdown(10);

        // Update payment_status to 'Paid' immediately in background
        fetch("/api/payments/sandbox-mock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: id }),
        }).catch(err => console.error("Sandbox mock error:", err));

        // Create transaction as usual
        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: id }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || (language === "en" ? "Failed to initialize payment" : "Gagal memproses pembayaran"));
        }

        const currentOrderId = data.orderId;

        // Perform 10-second countdown
        let count = 10;
        const timer = setInterval(() => {
          count -= 1;
          setSandboxCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            setSandboxCountdown(null);
            setIsPaymentLoading(false);

            // Open Midtrans Snap popup
            if (window.snap) {
              window.snap.pay(data.token, {
                onSuccess: async function (result) {
                  await checkPaymentStatus(currentOrderId);
                },
                onPending: async function (result) {
                  await checkPaymentStatus(currentOrderId);
                },
                onError: function (result) {
                  setErrorMsg(language === "en" ? "Online payment failed. Please try again." : "Pembayaran online gagal. Silakan coba lagi.");
                },
                onClose: async function () {
                  if (currentOrderId) {
                    await checkPaymentStatus(currentOrderId);
                  }
                }
              });
            }
          }
        }, 1000);

      } else {
        // Production Mode Flow: Immediate without delay
        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: id }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || (language === "en" ? "Failed to initialize payment" : "Gagal memproses pembayaran"));
        }

        const currentOrderId = data.orderId;
        setIsPaymentLoading(false);

        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: async function (result) {
              console.log("payment success", result);
              await checkPaymentStatus(currentOrderId);
            },
            onPending: async function (result) {
              console.log("payment pending", result);
              await checkPaymentStatus(currentOrderId);
            },
            onError: function (result) {
              console.error("payment error", result);
              setErrorMsg(language === "en" ? "Online payment failed. Please try again." : "Pembayaran online gagal. Silakan coba lagi.");
            },
            onClose: async function () {
              console.log("payment popup closed");
              if (currentOrderId) {
                await checkPaymentStatus(currentOrderId);
              }
            }
          });
        } else {
          throw new Error(language === "en" ? "Midtrans Snap SDK not loaded yet. Please refresh." : "SDK Midtrans Snap belum termuat. Silakan muat ulang.");
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
      setIsPaymentLoading(false);
      setSandboxCountdown(null);
    }
  };

  // Generate QR Code data URL langsung di sisi client jika token sudah ada
  useEffect(() => {
    if (
      booking?.offline_payment_token &&
      !booking.offline_token_used &&
      booking?.payment_status !== "Paid"
    ) {
      setOfflineToken(booking.offline_payment_token);
      if (!offlineQrDataUrl) {
        const appUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const qrUrl = `${appUrl}/scan-verify?token=${booking.offline_payment_token}`;
        import("qrcode")
          .then(({ default: qrcode }) => {
            qrcode
              .toDataURL(qrUrl, {
                margin: 2,
                width: 320,
                color: { dark: "#18181b", light: "#ffffff" },
              })
              .then((url) => setOfflineQrDataUrl(url))
              .catch(() => {});
          })
          .catch(() => {});
      }
    } else if (booking?.payment_status === "Paid") {
      setOfflineQrDataUrl(null);
      setOfflineToken(null);
    }
  }, [
    booking?.offline_payment_token,
    booking?.offline_token_used,
    booking?.payment_status,
    offlineQrDataUrl,
  ]);

  const handleSendReceipt = async () => {
    setIsReceiptSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/payments/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            (language === "en"
              ? "Failed to send receipt"
              : "Gagal mengirim bukti pemesanan")
        );
      }
      setReceiptSent(true);
      if (data.token) setOfflineToken(data.token);
      if (data.qrDataUrl) {
        setOfflineQrDataUrl(data.qrDataUrl);
      } else if (data.token) {
        const appUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const qrUrl = `${appUrl}/scan-verify?token=${data.token}`;
        const qrcode =
          (await import("qrcode")).default || (await import("qrcode"));
        const url = await qrcode.toDataURL(qrUrl, {
          margin: 2,
          width: 320,
          color: { dark: "#18181b", light: "#ffffff" },
        });
        setOfflineQrDataUrl(url);
      }
      toast.success(
        language === "en"
          ? "Booking receipt PDF sent to your email!"
          : "Bukti pemesanan PDF telah dikirim ke email Anda!"
      );
      // Buka pop-up modal QR Code langsung setelah email terkirim
      setIsQrModalOpen(true);
      await loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsReceiptSending(false);
    }
  };

  const handleRefreshQr = async () => {
    if (booking?.payment_status === "Paid") {
      toast.info(
        language === "en"
          ? "Booking is already paid."
          : "Pesanan ini sudah lunas."
      );
      setIsQrModalOpen(false);
      return;
    }

    setIsRefreshingQr(true);
    try {
      const res = await fetch("/api/payments/offline-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, sendEmail: false, refresh: true }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result.error ||
            (language === "en"
              ? "Failed to refresh QR code"
              : "Gagal memperbarui QR code")
        );
      }

      const newToken = result.data?.token;
      let newQrDataUrl = result.data?.qrDataUrl;

      if (!newQrDataUrl && newToken) {
        const appUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const qrUrl = `${appUrl}/scan-verify?token=${newToken}`;
        const { default: qrcode } = await import("qrcode");
        newQrDataUrl = await qrcode.toDataURL(qrUrl, {
          margin: 2,
          width: 320,
          color: { dark: "#18181b", light: "#ffffff" },
        });
      }

      if (newToken) setOfflineToken(newToken);
      if (newQrDataUrl) setOfflineQrDataUrl(newQrDataUrl);

      setBooking((prev) => ({
        ...prev,
        offline_payment_token: newToken || prev?.offline_payment_token,
        offline_token_used: false,
        offline_token_created_at: new Date().toISOString(),
      }));

      toast.success(
        language === "en"
          ? "Payment QR Code refreshed successfully!"
          : "Kode QR pembayaran berhasil diperbarui!"
      );
    } catch (err) {
      console.error("Refresh QR error:", err);
      toast.error(err.message || "Gagal memperbarui QR Code.");
    } finally {
      setIsRefreshingQr(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    setErrorMsg(null);

    try {
      // Call secure API endpoint to validate status and update atomically
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (language === "en"
              ? "Failed to cancel booking. Booking may have been accepted by Admin."
              : "Gagal membatalkan pesanan. Pesanan mungkin telah diterima oleh Admin.")
        );
      }

      setIsCancelOpen(false);
      await loadBookingDetails();
    } catch (err) {
      setErrorMsg(err.message || (language === "en" ? "Failed to cancel booking." : "Gagal membatalkan pesanan. Coba lagi."));
      setIsCancelOpen(false);
      await loadBookingDetails();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setIsSubmittingReview(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          rating,
          reviewText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (language === "en" ? "Failed to submit review" : "Gagal mengirimkan ulasan"));
      }

      setReviewSuccess(true);
      setHasReviewed(true);
      setUserReviewData({
        rating,
        review_text: reviewText,
        created_at: new Date().toISOString(),
        reply_text: null,
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return <GsapDataLoader type="detail" message="Memuat rincian pesanan..." />;
  }

  if (!booking) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground dark:text-zinc-200">
          {language === "en" ? "Booking Not Found" : "Pesanan Tidak Ditemukan"}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          {language === "en" 
            ? "Booking ID is not registered or you do not have permission to access it."
            : "ID pesanan tidak terdaftar atau Anda tidak memiliki hak akses."}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
        >
          {language === "en" ? "Back to Dashboard" : "Kembali ke Dashboard"}
        </Link>
      </div>
    );
  }

  // Pre-fill WhatsApp message link for admin change requests
  const waNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "628123456789";
  const waMessage = encodeURIComponent(
    `Halo Admin NekoStay, saya ingin mengajukan perubahan jadwal/kelas untuk kucing saya yang bernama ${booking.cat_name} (ID Booking: ${booking.id})`,
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="space-y-8 mt-4">
      {/* Top Back Navigation */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 group"
      >
        <div className="p-1.5 rounded-xl bg-muted/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </div>
        <span>{language === "en" ? "Back to Dashboard" : "Kembali ke Dashboard"}</span>
      </Link>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md border border-border/70 dark:border-zinc-800/80 p-6 sm:p-7 rounded-3xl shadow-sm">
        {/* Ambient decorative gradient */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-bl-full pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Avatar + Title + ID + Badges */}
          <div className="flex items-start sm:items-center gap-4">
            {/* Cat Avatar Thumbnail */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 shrink-0 flex items-center justify-center text-primary shadow-xs">
              {booking.cat_photo_url ? (
                <img
                  src={booking.cat_photo_url}
                  alt={booking.cat_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Cat className="w-7 h-7 opacity-80" />
              )}
              <div className="absolute -bottom-1 -right-1 p-1 bg-card dark:bg-zinc-900 rounded-full border border-border">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {booking.cat_name}
                </h1>
                <BookingStatus status={booking.status} />

                {/* Payment Status Pill */}
                {booking.payment_status === "Paid" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">
                    <Check className="w-3 h-3" />
                    {language === "en" ? "Paid" : "Lunas"}
                  </span>
                ) : booking.payment_status === "Failed" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900">
                    <AlertCircle className="w-3 h-3" />
                    {language === "en" ? "Failed" : "Gagal"}
                  </span>
                ) : booking.payment_status === "Refunded" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900">
                    <Coins className="w-3 h-3" />
                    {language === "en" ? "Refunded" : "Di-refund"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
                    <Wallet className="w-3 h-3" />
                    {language === "en" ? "Unpaid" : "Belum Bayar"}
                  </span>
                )}
              </div>

              {/* Subtitle & Booking ID with Copy */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-0.5">
                <span className="font-semibold text-foreground/80 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Kelas {booking.class}
                </span>
                <span>•</span>
                <div className="inline-flex items-center gap-1.5 bg-muted/50 dark:bg-zinc-800/60 px-2.5 py-0.5 rounded-xl border border-border/50 font-mono text-[11px]">
                  <span>ID: {booking.id.slice(0, 8)}...{booking.id.slice(-4)}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={language === "en" ? "Copy Booking ID" : "Salin ID Pesanan"}
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {booking.status === "Menunggu" && (
              <button
                onClick={() => setIsCancelOpen(true)}
                className="px-4 py-2.5 border border-rose-200 hover:border-rose-300 dark:border-rose-900/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-xs active:scale-98"
              >
                {language === "en" ? "Cancel Booking" : "Batalkan Pesanan"}
              </button>
            )}

            {/* View QR Code button if offline token exists and NOT paid */}
            {booking.payment_status !== "Paid" && booking.offline_payment_token && !booking.offline_token_used && (
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-98"
              >
                <QrCode className="w-4 h-4" />
                <span>{language === "en" ? "View Desk QR" : "QR Kasir"}</span>
              </button>
            )}

            {/* WhatsApp Support button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-muted/60 hover:bg-muted dark:bg-zinc-800/80 text-foreground text-xs font-bold rounded-2xl border border-border/80 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === "en" ? "Support" : "Bantuan WA"}</span>
            </a>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900 rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500 transition-colors cursor-pointer"
            title="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Cat info, Periodic Reports, Review */}
        <div className="lg:col-span-2 space-y-6">

          {/* Review Stay Card (if booking is completed) */}
          {booking.status === "Selesai" && !checkingReview && (
            <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-7 rounded-3xl space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 dark:border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2 font-black text-foreground dark:text-zinc-150 text-base">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>{language === "en" ? "Your Stay Experience & Review" : "Ulasan Pengalaman Penitipan"}</span>
                </div>
                {(reviewSuccess || hasReviewed) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    {language === "en" ? "Reviewed" : "Sudah Diulas"}
                  </span>
                )}
              </div>

              {reviewSuccess || hasReviewed ? (
                <div className="space-y-4">
                  <div className="p-5 bg-muted/30 dark:bg-zinc-950/40 border border-border/70 dark:border-zinc-800/70 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (userReviewData?.rating || rating)
                                ? "fill-amber-500 text-amber-500"
                                : "text-zinc-300 dark:text-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {userReviewData?.created_at
                          ? formatDate(userReviewData.created_at, "long")
                          : (language === "en" ? "Recently Submitted" : "Baru saja dikirim")}
                      </span>
                    </div>

                    {userReviewData?.review_text ? (
                      <p className="text-xs text-foreground font-medium leading-relaxed bg-card dark:bg-zinc-900/80 p-3.5 rounded-xl border border-border/50">
                        "{userReviewData.review_text}"
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {language === "en" ? "No written review provided." : "Tidak ada ulasan tertulis."}
                      </p>
                    )}

                    {/* Admin Reply if present */}
                    {userReviewData?.reply_text && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        {userReviewData.reply_text.split("\n---\n").map((rText, rIdx) => (
                          <div
                            key={rIdx}
                            className="bg-amber-500/5 dark:bg-amber-500/[0.03] border border-amber-500/15 p-3.5 rounded-xl space-y-1"
                          >
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              {language === "en" ? `Admin Reply #${rIdx + 1}` : `Balasan Staf NekoStay #${rIdx + 1}`}
                            </span>
                            <p className="text-xs text-muted-foreground dark:text-zinc-300 font-medium leading-relaxed">
                              {rText}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      {language === "en" ? "Rate Your Experience" : "Beri Penilaian Bintang"}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-115 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-amber-500 text-amber-500"
                                : "text-zinc-300 dark:text-zinc-700"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      {language === "en" ? "Review Details" : "Tulis Ulasan Anda"}
                    </label>
                    <textarea
                      required
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      placeholder={
                        language === "en"
                          ? "Share your experience with NekoStay, room cleanliness, staff friendliness..."
                          : "Ceritakan pengalaman Anda, bagaimana kebersihan kandang, kenyamanan mpus, keramahan staf..."
                      }
                      className="w-full px-4 py-3 bg-muted/30 dark:bg-zinc-950/30 border border-border dark:border-zinc-800 rounded-xl text-xs focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    {isSubmittingReview ? (language === "en" ? "Submitting..." : "Mengirim...") : (language === "en" ? "Submit Review" : "Kirim Ulasan")}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Cat Profile & Boarding Info Card */}
          <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-7 rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 dark:border-zinc-800/60 pb-3">
              <h3 className="text-sm font-black text-foreground dark:text-zinc-150 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-primary" />
                <span>{language === "en" ? "Cat & Boarding Details" : "Detail Informasi Kucing"}</span>
              </h3>
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                <Cat className="w-3.5 h-3.5 text-primary" />
                <span>{booking.cat_name}</span>
              </span>
            </div>

            {/* Photo Banner if available */}
            {booking.cat_photo_url && (
              <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-border/80 dark:border-zinc-800 shadow-xs group">
                <img
                  src={booking.cat_photo_url}
                  alt={booking.cat_name}
                  className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white text-xs">
                  <span className="font-extrabold text-sm">{booking.cat_name}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-xs font-medium text-[11px]">
                    {booking.class} Room
                  </span>
                </div>
              </div>
            )}

            {/* Spec Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-muted/30 dark:bg-zinc-950/30 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === "en" ? "Gender" : "Jenis Kelamin"}
                </span>
                <span className="font-bold text-foreground text-xs">
                  {booking.cat_gender === "Jantan"
                    ? (language === "en" ? "Male" : "Jantan")
                    : (language === "en" ? "Female" : "Betina")}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 dark:bg-zinc-950/30 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === "en" ? "Age" : "Usia Kucing"}
                </span>
                <span className="font-bold text-foreground text-xs">
                  {booking.cat_age || "-"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 dark:bg-zinc-950/30 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === "en" ? "Initial Health" : "Kondisi Kesehatan"}
                </span>
                <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                  booking.cat_health_status === "Sehat"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : booking.cat_health_status === "Sakit"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    booking.cat_health_status === "Sehat"
                      ? "bg-emerald-500"
                      : booking.cat_health_status === "Sakit"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                  }`} />
                  {booking.cat_health_status === "Sehat"
                    ? (language === "en" ? "Healthy" : "Sehat")
                    : booking.cat_health_status === "Sakit"
                      ? (language === "en" ? "Sick" : "Sakit")
                      : (language === "en" ? "Under Medication" : "Dalam Pengobatan")}
                </span>
              </div>

              {booking.cat_favorite_food && (
                <div className="p-3 rounded-2xl bg-muted/30 dark:bg-zinc-950/30 border border-border/60 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    {language === "en" ? "Favorite Food" : "Makanan Favorit"}
                  </span>
                  <span className="font-bold text-foreground text-xs truncate block" title={booking.cat_favorite_food}>
                    {booking.cat_favorite_food}
                  </span>
                </div>
              )}

              {booking.cat_is_pregnant && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                    {language === "en" ? "Pregnancy Condition" : "Kondisi Hamil"}
                  </span>
                  <span className="font-bold text-rose-600 text-xs flex items-center gap-1">
                    <Baby className="w-3.5 h-3.5" />
                    {language === "en" ? "Pregnant" : "Sedang Hamil"}
                  </span>
                </div>
              )}
            </div>

            {/* Special Notes from Owner */}
            {booking.cat_notes && (
              <div className="p-4 rounded-2xl bg-muted/40 dark:bg-zinc-950/40 border border-border/60 space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                  {language === "en" ? "Special Notes from You" : "Catatan Tambahan Pemilik"}
                </span>
                <p className="text-xs text-foreground/90 font-medium leading-relaxed italic">
                  "{booking.cat_notes}"
                </p>
              </div>
            )}
          </div>

          {/* Condition Reports from Admin */}
          <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 sm:p-7 rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 dark:border-zinc-800/60 pb-3">
              <h3 className="text-sm font-black text-foreground dark:text-zinc-150 flex items-center gap-2">
                <HeartPulse className="w-4.5 h-4.5 text-primary" />
                <span>{language === "en" ? "Cat Health Status Reports" : "Riwayat Kondisi Kucing (Update Berkala)"}</span>
              </h3>
              <span className="text-[11px] font-bold text-muted-foreground">
                {reports.length} {language === "en" ? "Reports" : "Laporan"}
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-muted/20 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-border/80">
                <div className="p-3.5 bg-primary/10 text-primary rounded-full w-fit mx-auto">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground dark:text-zinc-200">
                    {language === "en" ? "No Reports Yet" : "Belum Ada Laporan Kondisi"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    {language === "en"
                      ? "Daily health updates and cat photos will be regularly posted here by NekoStay staff."
                      : "Laporan kesehatan dan foto harian kucing Anda akan diupdate berkala oleh tim NekoStay selama masa penitipan."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report, rIdx) => (
                  <div
                    key={report.id}
                    className="p-5 border border-border/80 dark:border-zinc-800/80 rounded-2xl space-y-3.5 bg-card/60 dark:bg-zinc-900/40 hover:border-primary/30 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{formatDate(report.report_date, "long")}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          (Update #{reports.length - rIdx})
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          report.health_status === "Sehat"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                            : report.health_status === "Kurang Fit"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          report.health_status === "Sehat"
                            ? "bg-emerald-500"
                            : report.health_status === "Kurang Fit"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`} />
                        {report.health_status}
                      </span>
                    </div>

                    {report.photo_url && (
                      <div className="relative aspect-video max-w-md rounded-xl overflow-hidden border border-border/70 dark:border-zinc-800 shadow-2xs">
                        <img
                          src={report.photo_url}
                          alt="Foto Kucing Terkini"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {report.notes && (
                      <p className="text-xs text-foreground/90 font-medium leading-relaxed bg-muted/40 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-border/50">
                        {report.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Stay Journey, Invoice & Payment Hub */}
        <div className="space-y-6">

          {/* Stay Journey & Schedule Card */}
          <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 rounded-3xl space-y-5 shadow-xs">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{language === "en" ? "Stay Schedule & Room" : "Jadwal & Kelas Kamar"}</span>
            </h3>

            {/* Visual Date Journey */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-muted/40 dark:bg-zinc-950/40 border border-border/60 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Check-In
                </span>
                <div className="text-xs font-black text-foreground">
                  {formatDate(booking.check_in_date)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 dark:bg-zinc-950/40 border border-border/60 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Check-Out
                </span>
                <div className="text-xs font-black text-foreground">
                  {formatDate(booking.check_out_date)}
                </div>
              </div>
            </div>

            {/* Duration & Room Summary Pill */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/15 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                Kelas {booking.class}
              </span>
              <span className="font-black text-primary">
                {booking.total_days} {language === "en" ? "Days" : "Hari"} Menginap
              </span>
            </div>
          </div>

          {/* Payment Hub Card */}
          {booking.status !== "Dibatalkan" && (
            <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 rounded-3xl space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>{language === "en" ? "Payment Hub" : "Status Pembayaran"}</span>
                </h3>

                {booking.payment_status === "Paid" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">
                    <Check className="w-3 h-3" />
                    {language === "en" ? "Paid" : "Lunas"}
                  </span>
                ) : booking.payment_status === "Failed" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900">
                    <AlertCircle className="w-3 h-3" />
                    {language === "en" ? "Failed" : "Gagal"}
                  </span>
                ) : booking.payment_status === "Refunded" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900">
                    <Coins className="w-3 h-3" />
                    {language === "en" ? "Refunded" : "Di-refund"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
                    <Wallet className="w-3 h-3" />
                    {language === "en" ? "Unpaid" : "Belum Dibayar"}
                  </span>
                )}
              </div>

              {/* Status: Paid */}
              {booking.payment_status === "Paid" ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
                  <p className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {language === "en" ? "Payment Confirmed & Verified" : "Pembayaran Telah Diterima"}
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    {language === "en"
                      ? "Thank you! Your cat's stay is fully secured. Please drop off your pet according to the check-in schedule."
                      : "Terima kasih! Penitipan kucing Anda telah terkonfirmasi lunas. Silakan bawa kucing Anda ke NekoStay sesuai jadwal check-in."}
                  </p>
                </div>

              /* Status: Refunded */
              ) : booking.payment_status === "Refunded" ? (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5 text-xs">
                  <p className="text-blue-700 dark:text-blue-400 font-extrabold flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Refund Processed" : "Pengembalian Dana Diproses"}
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    {language === "en"
                      ? "This transaction has been refunded."
                      : "Transaksi ini telah dikembalikan dananya (refund) sesuai kebijakan NekoStay."}
                  </p>
                </div>

              /* Status: Menunggu — belum bisa bayar */
              ) : booking.status === "Menunggu" ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {language === "en" ? "Waiting for Admin Approval" : "Menunggu Persetujuan Admin"}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {language === "en"
                        ? "Payment methods will become available after admin approves your booking request."
                        : "Metode pembayaran akan aktif segera setelah admin menyetujui pesanan Anda."}
                    </p>
                  </div>
                </div>

              /* Status: Unpaid & Confirmed/Active — opsi pembayaran */
              ) : (
                <div className="space-y-4">
                  {/* Verifying Payment Overlay */}
                  {isVerifyingPayment && (
                    <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 animate-pulse">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                      <p className="text-xs font-bold text-primary">
                        {language === "en" ? "Verifying Payment with Midtrans..." : "Memverifikasi Pembayaran..."}
                      </p>
                    </div>
                  )}

                  {/* Method 1: Midtrans Online */}
                  <div className="p-4 rounded-2xl bg-muted/30 dark:bg-zinc-950/40 border border-border/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-primary" />
                        {language === "en" ? "Online Payment" : "Bayar Online (Instan)"}
                      </span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Midtrans
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {language === "en"
                        ? "Pay securely via Virtual Account, QRIS, Credit Card, or E-wallet."
                        : "Bayar instan via Virtual Account, QRIS, atau E-wallet."}
                    </p>
                    <button
                      onClick={handlePayment}
                      disabled={isPaymentLoading || sandboxCountdown !== null}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 transition-all shadow-sm shadow-primary/15 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {sandboxCountdown !== null
                        ? (language === "en" ? `Sandbox simulation... (${sandboxCountdown}s)` : `Simulasi Sandbox... (${sandboxCountdown}s)`)
                        : isPaymentLoading
                          ? (language === "en" ? "Processing..." : "Memproses...")
                          : (language === "en" ? "Pay Online Now" : "Bayar Online Sekarang")}
                    </button>
                  </div>

                  {/* Method 2: Offline at Desk */}
                  <div className="p-4 rounded-2xl bg-muted/30 dark:bg-zinc-950/40 border border-border/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-emerald-600" />
                        {language === "en" ? "Pay at Hotel Desk" : "Bayar di Kasir (Offline)"}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        QR Scan
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {language === "en"
                        ? "Show your payment QR code to cashier when dropping off your cat."
                        : "Tunjukkan QR Code pemesanan ke kasir saat mengantar kucing."}
                    </p>

                    {receiptSent || (booking.offline_payment_token && !booking.offline_token_used) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsQrModalOpen(true)}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/15 transition-all cursor-pointer active:scale-98"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{language === "en" ? "View Desk QR Code" : "Buka QR Code Kasir"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRefreshQr}
                            disabled={isRefreshingQr}
                            title={language === "en" ? "Refresh QR Code" : "Perbarui QR Code"}
                            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCcw className={`w-3.5 h-3.5 text-primary ${isRefreshingQr ? "animate-spin" : ""}`} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendReceipt}
                          disabled={isReceiptSending}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{isReceiptSending ? "Mengirim..." : "Kirim Ulang PDF ke Email"}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSendReceipt}
                        disabled={isReceiptSending}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-muted transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{isReceiptSending ? "Memproses..." : "Pilih Bayar di Kasir & QR"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Itemized Invoice & Billing Breakdown */}
          <div className="bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-850 p-6 rounded-3xl space-y-5 shadow-xs">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-3">
              <Tag className="w-4 h-4 text-primary" />
              <span>{language === "en" ? "Billing Breakdown" : "Rincian Biaya Transaksi"}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{language === "en" ? "Rate per Day" : "Tarif Harian"}</span>
                <span className="font-semibold text-foreground">{formatRupiah(booking.price_per_day)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>{language === "en" ? "Total Days" : "Durasi Menginap"}</span>
                <span className="font-semibold text-foreground">{booking.total_days} {language === "en" ? "Days" : "Hari"}</span>
              </div>

              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/40">
                <span>{language === "en" ? "Estimated Subtotal" : "Subtotal Biaya"}</span>
                <span>{formatRupiah(booking.estimated_total)}</span>
              </div>

              {/* Discounts */}
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl">
                  <span>{language === "en" ? "Discount" : "Potongan Diskon"}:</span>
                  <span>-{formatRupiah(booking.discount_amount - ((booking.points_used || 0) * 100))}</span>
                </div>
              )}

              {booking.points_used > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 p-2 rounded-xl">
                  <span>{language === "en" ? `Neko Points (${booking.points_used} Pts)` : `Poin Neko (${booking.points_used} Poin)`}:</span>
                  <span>-{formatRupiah(booking.points_used * 100)}</span>
                </div>
              )}

              {booking.late_fee_total > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 p-2 rounded-xl">
                  <span>{language === "en" ? "Late Fee" : "Denda Terlambat"}:</span>
                  <span>+{formatRupiah(booking.late_fee_total)}</span>
                </div>
              )}

              {booking.refund_amount > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 p-2 rounded-xl">
                  <span>{language === "en" ? "Early Pickup Refund" : "Refund Pengambilan Cepat"}:</span>
                  <span>-{formatRupiah(booking.refund_amount)}</span>
                </div>
              )}

              {/* Final Total Box */}
              <div className="p-3.5 rounded-2xl bg-muted/50 dark:bg-zinc-950/60 border border-border/80 flex items-center justify-between font-black text-sm pt-3 mt-2">
                <span className="text-foreground">{language === "en" ? "Total Due" : "Total Akhir"}</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                  {formatRupiah(
                    booking.estimated_total -
                      (booking.discount_amount || 0) +
                      (booking.late_fee_total || 0) -
                      (booking.refund_amount || 0),
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Info (if canceled) */}
          {booking.status === "Dibatalkan" && (
            <div className="bg-rose-500/5 border border-rose-500/15 p-5 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                {language === "en" ? "Cancellation Reason" : "Keterangan Pembatalan"}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {booking.cancel_reason
                  ? `${language === "en" ? "User Reason" : "Alasan Pemilik"}: "${booking.cancel_reason}"`
                  : booking.reject_reason
                    ? `${language === "en" ? "Admin Reason" : "Alasan Penolakan Admin"}: "${booking.reject_reason}"`
                    : (language === "en" ? "Booking was canceled." : "Pesanan telah dibatalkan.")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        title={language === "en" ? "Cancel Boarding Stay?" : "Batalkan Pesanan Penitipan?"}
        description={
          language === "en"
            ? "Are you sure you want to cancel this booking? This action is permanent."
            : "Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan."
        }
        confirmText={language === "en" ? "Yes, Cancel" : "Ya, Batalkan"}
        cancelText={language === "en" ? "Back" : "Kembali"}
        variant="danger"
        isLoading={isCancelling}
        confirmDisabled={!cancelReason.trim()}
        onConfirm={handleCancelBooking}
        onCancel={() => setIsCancelOpen(false)}
      >
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 block">
            {language === "en" ? "Cancellation Reason (Required)" : "Alasan Pembatalan (Wajib)"}
          </label>
          <textarea
            required
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={language === "en" ? "Write reason for canceling..." : "Tulis alasan pembatalan..."}
            rows={3}
            className="w-full px-3 py-2 bg-muted/40 dark:bg-zinc-950/20 border border-border dark:border-zinc-800 rounded-xl text-xs focus:outline-hidden text-foreground dark:text-zinc-200"
          />
        </div>
      </ConfirmDialog>

      {/* Pop-up Modal QR Code Pembayaran Offline */}
      <OfflineQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        booking={booking}
        token={offlineToken || booking?.offline_payment_token}
        qrDataUrl={offlineQrDataUrl}
        language={language}
        onRefreshQr={handleRefreshQr}
        isRefreshing={isRefreshingQr}
      />
    </div>
  );
}

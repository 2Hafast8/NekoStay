"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Cat, ArrowLeft, Shield, FileText, AlertTriangle, Users, CreditCard, Lock, RefreshCw, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/hooks/useLanguage";
import { animate, utils } from "animejs";

export default function TermsPage() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lang = mounted ? language : "id";
  const isEn = lang === "en";

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !mounted) return;

    animate(headerRef.current, {
      translateY: [-24, 0],
      opacity: [0, 1],
      duration: 600,
      easing: "easeOutCubic",
    });

    if (contentRef.current) {
      animate(contentRef.current.children, {
        translateY: [24, 0],
        opacity: [0, 1],
        duration: 700,
        delay: utils.stagger(80),
        easing: "easeOutCubic",
      });
    }
  }, [mounted]);

  const sections = isEn
    ? [
        {
          icon: <FileText className="w-5 h-5" />,
          title: "1. Acceptance of Terms",
          content:
            "By accessing or using the NekoStay platform (website and application), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please stop using the service.",
        },
        {
          icon: <Users className="w-5 h-5" />,
          title: "2. Services Provided",
          content:
            "NekoStay provides cat boarding services (cat hotel) including: accommodation in Basic, Standard, and Premium class rooms; routine health monitoring; daily progress reports; and access to on-call veterinary services. All services are subject to room availability.",
        },
        {
          icon: <CreditCard className="w-5 h-5" />,
          title: "3. Booking & Payment",
          content:
            "Bookings are made through the NekoStay platform. Prices are calculated based on room class, number of days, and additional services selected. NekoStay reserves the right to change prices with prior notice. Any applicable discount codes or referrals will be applied at checkout.",
        },
        {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: "4. Cancellation & Late Pickup",
          content:
            "Cancellations must be made at least 24 hours before check-in. Cancellations less than 24 hours before check-in may incur a cancellation fee. Late pickup beyond the scheduled checkout date will result in a compounding daily late fee of 8% applied to the daily rate per day of delay.",
        },
        {
          icon: <Shield className="w-5 h-5" />,
          title: "5. User Responsibilities",
          content:
            "Users are responsible for providing accurate information about their cat (health history, vaccinations, feeding schedule). Cats must be in a healthy condition at the time of check-in. NekoStay has the right to refuse a cat that is showing signs of contagious illness to protect other cats.",
        },
        {
          icon: <Lock className="w-5 h-5" />,
          title: "6. Limitation of Liability",
          content:
            "NekoStay will exercise maximum care in caring for your cat. However, NekoStay is not responsible for health conditions that arise due to pre-existing illnesses that were not disclosed at the time of booking, or for force majeure events beyond our control.",
        },
        {
          icon: <RefreshCw className="w-5 h-5" />,
          title: "7. Changes to Terms",
          content:
            "NekoStay reserves the right to modify these Terms and Conditions at any time. Changes will take effect upon publication on this page. Your continued use of the service after changes are published constitutes acceptance of the new terms.",
        },
        {
          icon: <Mail className="w-5 h-5" />,
          title: "8. Contact",
          content:
            "If you have questions about these Terms and Conditions, please contact us via WhatsApp or email listed on the NekoStay home page. We are happy to assist.",
        },
      ]
    : [
        {
          icon: <FileText className="w-5 h-5" />,
          title: "1. Penerimaan Syarat",
          content:
            "Dengan mengakses atau menggunakan platform NekoStay (situs web dan aplikasi), Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, harap berhenti menggunakan layanan.",
        },
        {
          icon: <Users className="w-5 h-5" />,
          title: "2. Layanan yang Disediakan",
          content:
            "NekoStay menyediakan layanan penitipan kucing (cat hotel) yang mencakup: akomodasi di kamar kelas Basic, Standard, dan Premium; pemantauan kesehatan rutin; laporan perkembangan harian; serta akses ke layanan dokter hewan siaga. Semua layanan tunduk pada ketersediaan kamar.",
        },
        {
          icon: <CreditCard className="w-5 h-5" />,
          title: "3. Pemesanan & Pembayaran",
          content:
            "Pemesanan dilakukan melalui platform NekoStay. Harga dihitung berdasarkan kelas kamar, jumlah hari, dan layanan tambahan yang dipilih. NekoStay berhak mengubah harga dengan pemberitahuan terlebih dahulu. Kode diskon atau referral yang berlaku akan diterapkan saat checkout.",
        },
        {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: "4. Pembatalan & Keterlambatan Penjemputan",
          content:
            "Pembatalan harus dilakukan minimal 24 jam sebelum check-in. Pembatalan kurang dari 24 jam sebelum check-in dapat dikenakan biaya pembatalan. Penjemputan yang terlambat melewati tanggal checkout yang dijadwalkan akan dikenakan denda harian akumulatif sebesar 8% dari tarif harian per hari keterlambatan.",
        },
        {
          icon: <Shield className="w-5 h-5" />,
          title: "5. Tanggung Jawab Pengguna",
          content:
            "Pengguna bertanggung jawab untuk memberikan informasi yang akurat tentang kucing mereka (riwayat kesehatan, vaksinasi, jadwal makan). Kucing harus dalam kondisi sehat saat check-in. NekoStay berhak menolak kucing yang menunjukkan tanda-tanda penyakit menular demi melindungi kucing lainnya.",
        },
        {
          icon: <Lock className="w-5 h-5" />,
          title: "6. Batasan Tanggung Jawab",
          content:
            "NekoStay akan memberikan perawatan maksimal untuk kucing Anda. Namun, NekoStay tidak bertanggung jawab atas kondisi kesehatan yang timbul akibat penyakit yang sudah ada sebelumnya dan tidak diungkapkan saat pemesanan, atau atas kejadian force majeure di luar kendali kami.",
        },
        {
          icon: <RefreshCw className="w-5 h-5" />,
          title: "7. Perubahan Ketentuan",
          content:
            "NekoStay berhak mengubah Syarat dan Ketentuan ini kapan saja. Perubahan akan berlaku setelah diterbitkan di halaman ini. Penggunaan layanan yang berkelanjutan setelah perubahan diterbitkan merupakan penerimaan atas ketentuan baru.",
        },
        {
          icon: <Mail className="w-5 h-5" />,
          title: "8. Kontak",
          content:
            "Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami melalui WhatsApp atau email yang tercantum di halaman utama NekoStay. Kami siap membantu.",
        },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-zinc-950">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-20 pb-14 bg-gradient-to-b from-secondary/40 via-background to-background dark:from-zinc-900/30 dark:via-zinc-950 dark:to-zinc-950">
        {/* Glow bubbles */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] rounded-full bg-amber-500/10 blur-3xl -z-10" />

        <div ref={headerRef} className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isEn ? "Back to Home" : "Kembali ke Beranda"}
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>{isEn ? "Legal" : "Dokumen Legal"}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-zinc-50">
            {isEn ? "Terms & " : "Syarat & "}
            <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 bg-clip-text text-transparent">
              {isEn ? "Conditions" : "Ketentuan"}
            </span>
          </h1>

          <p className="text-base text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {isEn
              ? "Please read these terms carefully before using the NekoStay cat boarding service."
              : "Mohon baca ketentuan ini dengan saksama sebelum menggunakan layanan penitipan kucing NekoStay."}
          </p>

          <p className="text-xs text-muted-foreground dark:text-zinc-500">
            {isEn ? "Last updated: June 2025" : "Terakhir diperbarui: Juni 2025"}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div ref={contentRef} className="space-y-6">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="group bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-800 rounded-2xl p-6 sm:p-7 hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-300 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                    {section.icon}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-foreground dark:text-zinc-100">
                      {section.title}
                    </h2>
                    <p className="text-sm text-muted-foreground dark:text-zinc-400 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom CTA */}
            <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-amber-500/10 dark:from-primary/10 dark:to-amber-500/5 border border-primary/20 rounded-2xl text-center space-y-3">
              <Cat className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm font-semibold text-foreground dark:text-zinc-200">
                {isEn
                  ? "Have questions about these terms?"
                  : "Ada pertanyaan tentang ketentuan ini?"}
              </p>
              <p className="text-xs text-muted-foreground dark:text-zinc-400">
                {isEn
                  ? "Our team is ready to help clarify anything you need."
                  : "Tim kami siap membantu menjelaskan apa pun yang Anda butuhkan."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-100"
              >
                <Mail className="w-3.5 h-3.5" />
                {isEn ? "Contact Us" : "Hubungi Kami"}
              </Link>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/privacy"
                className="text-xs text-primary hover:underline font-semibold"
              >
                {isEn ? "Read our Privacy Policy →" : "Baca Kebijakan Privasi kami →"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border dark:border-zinc-900 bg-card dark:bg-zinc-950 py-8 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <Cat className="w-4 h-4 text-primary" />
            <span className="font-extrabold text-foreground dark:text-zinc-150">NekoStay</span>
          </div>
          <p>© {new Date().getFullYear()} NekoStay. {isEn ? "All rights reserved." : "Seluruh hak cipta dilindungi."}</p>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/terms" className="text-primary">
              {isEn ? "Terms" : "Syarat"}
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {isEn ? "Privacy" : "Privasi"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

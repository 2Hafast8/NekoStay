"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Cat,
  ArrowLeft,
  Lock,
  Eye,
  Database,
  Share2,
  Cookie,
  UserCheck,
  Trash2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/hooks/useLanguage";
import { animate, utils } from "animejs";

export default function PrivacyPage() {
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
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
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
          icon: <Database className="w-5 h-5" />,
          color: "bg-blue-500/10 text-blue-500",
          title: "1. Data We Collect",
          content:
            "When you register and use NekoStay, we collect personal data including: full name, email address, phone number, and pet information (cat name, age, gender, health history). We also collect technical data such as device type, browser, and IP address for security purposes.",
        },
        {
          icon: <Eye className="w-5 h-5" />,
          color: "bg-violet-500/10 text-violet-500",
          title: "2. How We Use Your Data",
          content:
            "Your personal data is used to: process and manage cat boarding bookings; send booking status notifications and daily reports; improve our platform performance; and comply with applicable legal obligations. We do not use your data for automated decision-making that harms your interests.",
        },
        {
          icon: <Lock className="w-5 h-5" />,
          color: "bg-emerald-500/10 text-emerald-500",
          title: "3. Data Security",
          content:
            "We implement industry-standard security measures including data encryption in transit (TLS/HTTPS), secure authentication, and regular security audits. All data is stored on Supabase servers with access controls. However, no method of transmission over the internet is 100% secure.",
        },
        {
          icon: <Share2 className="w-5 h-5" />,
          color: "bg-amber-500/10 text-amber-500",
          title: "4. Data Sharing with Third Parties",
          content:
            "We do not sell, rent, or trade your personal data to third parties for commercial purposes. We may share limited data with trusted service providers (e.g., payment gateways, email delivery services) solely to operate our platform. All third parties are bound by strict confidentiality agreements.",
        },
        {
          icon: <Cookie className="w-5 h-5" />,
          color: "bg-orange-500/10 text-orange-500",
          title: "5. Cookies & Local Storage",
          content:
            "NekoStay uses cookies and localStorage to maintain your login session, remember theme preferences (light/dark), and store language settings. These are essential for the platform to function properly. You may disable cookies in your browser settings, but some features may not work as expected.",
        },
        {
          icon: <UserCheck className="w-5 h-5" />,
          color: "bg-primary/10 text-primary",
          title: "6. Your Rights",
          content:
            "As a user, you have the right to: access personal data we hold about you; request correction of inaccurate data; request deletion of your account and associated data; and withdraw consent for data processing at any time. To exercise these rights, please contact us via the information below.",
        },
        {
          icon: <Trash2 className="w-5 h-5" />,
          color: "bg-rose-500/10 text-rose-500",
          title: "7. Data Retention & Deletion",
          content:
            "We retain your data for as long as your account is active or as required to provide services. Booking records are retained for 3 years for legal and accounting purposes. Upon account deletion, your personal data will be permanently removed within 30 days, except where retention is required by law.",
        },
        {
          icon: <Mail className="w-5 h-5" />,
          color: "bg-indigo-500/10 text-indigo-500",
          title: "8. Contact & Updates",
          content:
            "If you have questions about this Privacy Policy or wish to exercise your rights, please contact our team via WhatsApp or email listed on the NekoStay home page. We may update this policy periodically; any changes will be notified through the platform.",
        },
      ]
    : [
        {
          icon: <Database className="w-5 h-5" />,
          color: "bg-blue-500/10 text-blue-500",
          title: "1. Data yang Kami Kumpulkan",
          content:
            "Saat Anda mendaftar dan menggunakan NekoStay, kami mengumpulkan data pribadi meliputi: nama lengkap, alamat email, nomor telepon, dan informasi hewan peliharaan (nama kucing, usia, jenis kelamin, riwayat kesehatan). Kami juga mengumpulkan data teknis seperti jenis perangkat, browser, dan alamat IP untuk keperluan keamanan.",
        },
        {
          icon: <Eye className="w-5 h-5" />,
          color: "bg-violet-500/10 text-violet-500",
          title: "2. Bagaimana Kami Menggunakan Data Anda",
          content:
            "Data pribadi Anda digunakan untuk: memproses dan mengelola pemesanan penitipan kucing; mengirimkan notifikasi status pesanan dan laporan harian; meningkatkan performa platform kami; serta mematuhi kewajiban hukum yang berlaku. Kami tidak menggunakan data Anda untuk pengambilan keputusan otomatis yang merugikan kepentingan Anda.",
        },
        {
          icon: <Lock className="w-5 h-5" />,
          color: "bg-emerald-500/10 text-emerald-500",
          title: "3. Keamanan Data",
          content:
            "Kami menerapkan langkah-langkah keamanan standar industri termasuk enkripsi data dalam transit (TLS/HTTPS), autentikasi aman, dan audit keamanan berkala. Semua data disimpan di server Supabase dengan kontrol akses ketat. Namun, tidak ada metode transmisi melalui internet yang 100% aman.",
        },
        {
          icon: <Share2 className="w-5 h-5" />,
          color: "bg-amber-500/10 text-amber-500",
          title: "4. Berbagi Data dengan Pihak Ketiga",
          content:
            "Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga untuk keperluan komersial. Kami dapat berbagi data terbatas dengan penyedia layanan terpercaya (mis. payment gateway, layanan pengiriman email) semata-mata untuk mengoperasikan platform kami. Semua pihak ketiga terikat oleh perjanjian kerahasiaan yang ketat.",
        },
        {
          icon: <Cookie className="w-5 h-5" />,
          color: "bg-orange-500/10 text-orange-500",
          title: "5. Cookie & Local Storage",
          content:
            "NekoStay menggunakan cookie dan localStorage untuk mempertahankan sesi login Anda, mengingat preferensi tema (terang/gelap), dan menyimpan pengaturan bahasa. Ini penting agar platform berfungsi dengan baik. Anda dapat menonaktifkan cookie di pengaturan browser, namun beberapa fitur mungkin tidak bekerja sebagaimana mestinya.",
        },
        {
          icon: <UserCheck className="w-5 h-5" />,
          color: "bg-primary/10 text-primary",
          title: "6. Hak-Hak Anda",
          content:
            "Sebagai pengguna, Anda berhak untuk: mengakses data pribadi yang kami simpan tentang Anda; meminta koreksi data yang tidak akurat; meminta penghapusan akun dan data terkait; serta menarik persetujuan pemrosesan data kapan saja. Untuk menggunakan hak-hak ini, silakan hubungi kami melalui informasi di bawah.",
        },
        {
          icon: <Trash2 className="w-5 h-5" />,
          color: "bg-rose-500/10 text-rose-500",
          title: "7. Retensi & Penghapusan Data",
          content:
            "Kami menyimpan data Anda selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan. Catatan pemesanan disimpan selama 3 tahun untuk keperluan hukum dan akuntansi. Setelah penghapusan akun, data pribadi Anda akan dihapus secara permanen dalam 30 hari, kecuali penyimpanan diwajibkan oleh hukum.",
        },
        {
          icon: <Mail className="w-5 h-5" />,
          color: "bg-indigo-500/10 text-indigo-500",
          title: "8. Kontak & Pembaruan",
          content:
            "Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau ingin menggunakan hak Anda, silakan hubungi tim kami melalui WhatsApp atau email yang tercantum di halaman utama NekoStay. Kami dapat memperbarui kebijakan ini secara berkala; setiap perubahan akan diberitahukan melalui platform.",
        },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-zinc-950">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-20 pb-14 bg-gradient-to-b from-secondary/40 via-background to-background dark:from-zinc-900/30 dark:via-zinc-950 dark:to-zinc-950">
        {/* Glow bubbles */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl -z-10" />

        <div
          ref={headerRef}
          className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isEn ? "Back to Home" : "Kembali ke Beranda"}
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isEn ? "Privacy" : "Privasi"}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-zinc-50">
            {isEn ? "Privacy " : "Kebijakan "}
            <span className="bg-gradient-to-r from-violet-500 via-primary to-amber-500 bg-clip-text text-transparent">
              {isEn ? "Policy" : "Privasi"}
            </span>
          </h1>

          <p className="text-base text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {isEn
              ? "Your privacy is our priority. This policy explains how we collect, use, and protect your personal data."
              : "Privasi Anda adalah prioritas kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda."}
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
            {/* Trust banner */}
            <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                {isEn
                  ? "NekoStay is committed to protecting your personal data and complying with applicable data protection regulations."
                  : "NekoStay berkomitmen untuk melindungi data pribadi Anda dan mematuhi peraturan perlindungan data yang berlaku."}
              </p>
            </div>

            {sections.map((section, idx) => (
              <div
                key={idx}
                className="group bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-800 rounded-2xl p-6 sm:p-7 hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-300 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${section.color} group-hover:scale-110 transition-transform duration-300`}
                  >
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

            {/* GDPR / Compliance Note */}
            <div className="p-5 bg-muted/50 dark:bg-zinc-900/40 border border-border dark:border-zinc-800 rounded-2xl">
              <p className="text-xs text-muted-foreground dark:text-zinc-500 leading-relaxed text-center">
                {isEn
                  ? "This privacy policy is aligned with generally accepted data privacy principles. For questions or requests, contact us at the address on the home page."
                  : "Kebijakan privasi ini diselaraskan dengan prinsip-prinsip perlindungan data yang berlaku umum. Untuk pertanyaan atau permintaan, hubungi kami di alamat yang tertera di halaman utama."}
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="mt-4 p-6 bg-gradient-to-br from-violet-500/10 to-primary/10 dark:from-violet-500/10 dark:to-primary/5 border border-violet-300/30 dark:border-violet-800/30 rounded-2xl text-center space-y-3">
              <Lock className="w-8 h-8 text-violet-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground dark:text-zinc-200">
                {isEn
                  ? "Want to manage or delete your data?"
                  : "Ingin mengelola atau menghapus data Anda?"}
              </p>
              <p className="text-xs text-muted-foreground dark:text-zinc-400">
                {isEn
                  ? "Contact our support team and we'll process your request within 5 business days."
                  : "Hubungi tim dukungan kami dan kami akan memproses permintaan Anda dalam 5 hari kerja."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-100"
              >
                <Mail className="w-3.5 h-3.5" />
                {isEn ? "Contact Support" : "Hubungi Support"}
              </Link>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/terms"
                className="text-xs text-primary hover:underline font-semibold"
              >
                {isEn ? "← Read Terms & Conditions" : "← Baca Syarat & Ketentuan"}
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
            <span className="font-extrabold text-foreground dark:text-zinc-150">
              NekoStay
            </span>
          </div>
          <p>
            © {new Date().getFullYear()} NekoStay.{" "}
            {isEn ? "All rights reserved." : "Seluruh hak cipta dilindungi."}
          </p>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {isEn ? "Terms" : "Syarat"}
            </Link>
            <Link href="/privacy" className="text-primary">
              {isEn ? "Privacy" : "Privasi"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

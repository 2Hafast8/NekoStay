"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Cat, Check, Heart, Shield, Users, Star, Sparkles, Activity } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { formatRupiah } from "@/lib/utils/format";
import { useLanguage, dictionary } from "@/hooks/useLanguage";
import { createClient } from "@/lib/supabase/client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapReveal } from "@/hooks/useGsapReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Dynamic CMS States
  const [heroSettings, setHeroSettings] = useState(null);
  const [whyUsList, setWhyUsList] = useState(null);
  const [dbClasses, setDbClasses] = useState([]);

  const currentLanguage = mounted ? language : "id";
  const t = (key) => dictionary[currentLanguage]?.[key] || key;

  const supabase = createClient();

  const ICON_MAP = {
    Activity,
    Heart,
    Shield,
    Users,
    Star,
    Sparkles,
    Cat,
  };

  // GSAP refs
  const heroBadgeRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroBtnsRef = useRef(null);
  const heroStatsRef = useRef(null);
  const heroImageRef = useRef(null);
  const statCatsRef = useRef(null);
  const statRatingRef = useRef(null);
  const statVetRef = useRef(null);
  const whyRef = useRef(null);
  const pricingRef = useRef(null);
  const reviewsRef = useRef(null);
  const marqueeTrackRef = useRef(null);

  // Section scroll-trigger reveals
  useGsapReveal(whyRef, { stagger: 0.12, y: 40, duration: 0.7 });
  useGsapReveal(pricingRef, { stagger: 0.15, y: 44, scale: 0.97, duration: 0.7 });
  useGsapReveal(reviewsRef, { stagger: 0.13, y: 32, duration: 0.65 });

  // Magnetic hover effect for CTA buttons
  const handleMagneticMove = (e) => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(btn, {
      x: x * 0.28,
      y: y * 0.28,
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleMagneticLeave = (e) => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    gsap.to(e.currentTarget, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  // 3D Tilt effect for cards
  const handleTiltMove = (e) => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const dx = x - xc;
    const dy = y - yc;

    const rotX = -(dy / yc) * 6; // max 6 degrees
    const rotY = (dx / xc) * 6;  // max 6 degrees

    gsap.to(card, {
      rotationX: rotX,
      rotationY: rotY,
      scale: 1.015,
      transformPerspective: 1000,
      ease: "power2.out",
      duration: 0.3,
      overwrite: "auto",
    });
  };

  const handleTiltLeave = (e) => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    gsap.to(e.currentTarget, {
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      ease: "power3.out",
      duration: 0.5,
      overwrite: "auto",
    });
  };

  // Infinite Marquee loop
  useEffect(() => {
    if (!marqueeTrackRef.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const track = marqueeTrackRef.current;
    const tl = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 22,
      repeat: -1,
    });

    const handleMouseEnter = () => tl.pause();
    const handleMouseLeave = () => tl.play();

    track.addEventListener("mouseenter", handleMouseEnter);
    track.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      tl.kill();
      if (track) {
        track.removeEventListener("mouseenter", handleMouseEnter);
        track.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  const marqueeItems = [
    {
      icon: Shield,
      text: currentLanguage === "en" ? "24/7 Veterinary Care" : "Siaga Dokter Hewan 24/7",
    },
    {
      icon: Heart,
      text: currentLanguage === "en" ? "Daily Condition Reports" : "Laporan Kondisi Harian",
    },
    {
      icon: Star,
      text: currentLanguage === "en" ? "Full AC Premium Rooms" : "Kamar AC Kelas Premium",
    },
    {
      icon: Users,
      text: currentLanguage === "en" ? "Certified Cat Caretakers" : "Pecinta Kucing Bersertifikat",
    },
    {
      icon: Cat,
      text: currentLanguage === "en" ? "Interactive Daily Playtime" : "Waktu Bermain Aktif Harian",
    },
    {
      icon: Activity,
      text: currentLanguage === "en" ? "Daily Health Checkups" : "Pemeriksaan Kesehatan Rutin",
    },
  ];

  // Hero entrance timeline + image float
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // Entrance timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(heroBadgeRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 }
        )
        .fromTo(heroTitleRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65 },
          "-=0.2"
        )
        .fromTo(heroDescRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55 },
          "-=0.3"
        )
        .fromTo(heroBtnsRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.25"
        )
        .fromTo(heroStatsRef.current,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(heroImageRef.current,
          { x: 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.75, ease: "power2.out" },
          0.1
        );

      // Gentle float loop on hero image
      gsap.to(heroImageRef.current, {
        y: -14,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1,
      });

      // Number counters
      const counterItems = [
        { ref: statCatsRef, end: 1200, suffix: "+", decimals: 0, duration: 2 },
        { ref: statRatingRef, end: 98.9, suffix: "%", decimals: 1, duration: 1.8 },
      ];
      counterItems.forEach(({ ref, end, suffix, decimals, duration }) => {
        if (!ref.current) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end,
          duration,
          ease: "power2.out",
          delay: 0.8,
          onUpdate() {
            if (ref.current)
              ref.current.textContent = obj.val.toFixed(decimals) + suffix;
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    setMounted(true);
    async function fetchReviews() {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            review_text,
            created_at,
            profiles (
              full_name
            )
          `)
          .gte("rating", 4)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!error && data) {
          setReviews(data);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    async function fetchLandingCMS() {
      try {
        const { data: settings } = await supabase
          .from("landing_settings")
          .select("*");

        if (settings) {
          settings.forEach((row) => {
            if (row.id === "hero" && row.content) setHeroSettings(row.content);
            if (row.id === "why_us" && Array.isArray(row.content))
              setWhyUsList(row.content);
          });
        }

        const { data: clsData } = await supabase
          .from("classes")
          .select("*")
          .order("price_per_day", { ascending: true });

        if (clsData && clsData.length > 0) setDbClasses(clsData);
      } catch (err) {
        console.error("Error loading dynamic CMS data:", err);
      }
    }

    fetchReviews();
    fetchLandingCMS();
  }, [supabase]);

  // Standard facilities translations based on language
  const getFacilities = (className) => {
    if (currentLanguage === "en") {
      if (className === "Basic") return ["Standard cage", "Meals 2x/day", "Sterile drinking water"];
      if (className === "Standard") return ["Spacious cage", "Meals 3x/day", "Basic toys", "Scented sand"];
      return ["Private AC room", "Premium meals 3x/day", "Daily grooming", "On-call veterinary services"];
    } else {
      if (className === "Basic") return ["Kandang standar", "Makan 2x/hari", "Air minum steril"];
      if (className === "Standard") return ["Kandang luas", "Makan 3x/hari", "Mainan dasar", "Pasir wangi"];
      return ["Ruang privat AC", "Makan teratur premium", "Grooming harian", "Layanan dokter hewan siaga"];
    }
  };

  const getRoomDesc = (className) => {
    if (currentLanguage === "en") {
      if (className === "Basic") return "Comfortable standard cage with regularly maintained fresh air ventilation.";
      if (className === "Standard") return "Spacious cage equipped with a cat playground to eliminate boredom.";
      return "Exclusive private air-conditioned room with intensive monitoring and daily luxury grooming.";
    } else {
      if (className === "Basic") return "Kandang nyaman standar dengan ventilasi udara bersih yang terjaga berkala.";
      if (className === "Standard") return "Kandang lebih luas serta dilengkapi area mainan kucing untuk menghilangkan bosan.";
      return "Ruang privat eksklusif ber-AC dengan pemantauan intensif dan perawatan mewah harian.";
    }
  };

  const classes = [
    {
      name: "Basic",
      price: 50000,
      description: getRoomDesc("Basic"),
      facilities: getFacilities("Basic"),
      gradient: "from-amber-500/10 to-orange-500/10 hover:border-orange-300 dark:hover:border-orange-700/50 dark:from-amber-500/5 dark:to-orange-500/5",
    },
    {
      name: "Standard",
      price: 80000,
      description: getRoomDesc("Standard"),
      facilities: getFacilities("Standard"),
      gradient: "from-primary/10 to-amber-500/10 border-primary/20 scale-102 shadow-xs dark:from-primary/5 dark:to-amber-500/5",
    },
    {
      name: "Premium",
      price: 130000,
      description: getRoomDesc("Premium"),
      facilities: getFacilities("Premium"),
      gradient: "from-amber-600/10 to-yellow-600/10 hover:border-yellow-400 dark:hover:border-yellow-600/50 dark:from-amber-600/5 dark:to-yellow-600/5",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-zinc-950 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pb-24 lg:pt-32 lg:pb-32 bg-linear-to-b from-secondary/40 via-background to-background dark:from-zinc-900/20 dark:via-zinc-950 dark:to-zinc-950">
        {/* Soft background glow bubbles */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="col-span-7 space-y-6 text-center lg:text-left">
              <div ref={heroBadgeRef} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-xs dark:bg-primary/20">
                <SparkleIcon className="w-3.5 h-3.5 animate-spin-slow" />
                <span>{heroSettings?.badge || t("hero_badge")}</span>
              </div>
              <h1 ref={heroTitleRef} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] dark:text-zinc-50">
                {heroSettings?.title || (
                  <>
                    {t("hero_title_1")}{" "}
                    <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 bg-clip-text text-transparent">
                      {t("hero_title_2")}
                    </span>
                  </>
                )}
              </h1>
              <p ref={heroDescRef} className="text-base sm:text-lg text-muted-foreground dark:text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {heroSettings?.subtitle || t("hero_desc")}
              </p>
              <div ref={heroBtnsRef} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href={heroSettings?.cta_link || "/booking/new"}
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                  className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-colors shadow-md shadow-primary/20 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Cat className="w-5 h-5" />
                  {heroSettings?.cta_text || t("hero_cta_primary")}
                </Link>
                <Link
                  href="#services"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                  className="px-8 py-4 rounded-2xl border border-border dark:border-zinc-850 bg-card dark:bg-zinc-900 font-bold hover:bg-muted dark:hover:bg-zinc-800 transition-colors flex items-center justify-center dark:text-zinc-200"
                >
                  {t("hero_cta_secondary")}
                </Link>
              </div>

              {/* Stats */}
              <div ref={heroStatsRef} className="pt-8 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 border-t border-border/80 dark:border-zinc-800/80">
                <div>
                  <p ref={statCatsRef} className="text-3xl font-extrabold text-foreground dark:text-zinc-100">
                    1,200+
                  </p>
                  <p className="text-xs font-medium text-muted-foreground dark:text-zinc-400 mt-1">
                    {t("hero_stat_cats")}
                  </p>
                </div>
                <div>
                  <p ref={statRatingRef} className="text-3xl font-extrabold text-foreground dark:text-zinc-100">
                    98.9%
                  </p>
                  <p className="text-xs font-medium text-muted-foreground dark:text-zinc-400 mt-1">
                    {t("hero_stat_rating")}
                  </p>
                </div>
                <div>
                  <p ref={statVetRef} className="text-3xl font-extrabold text-foreground dark:text-zinc-100">
                    24/7
                  </p>
                  <p className="text-xs font-medium text-muted-foreground dark:text-zinc-400 mt-1">
                    {t("hero_stat_vet")}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image Mockup / Visual */}
            <div ref={heroImageRef} className="col-span-5 mt-12 lg:mt-0 relative flex justify-center">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-card dark:border-zinc-800 bg-gradient-to-tr from-primary/25 to-secondary dark:to-zinc-800 rotate-2 group hover:rotate-0 transition-transform duration-500">
                <img
                  src={
                    heroSettings?.hero_image ||
                    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop"
                  }
                  alt="Cute Cat"
                  className="object-cover w-full h-full"
                />

                <div className="absolute bottom-4 left-4 right-4 glass p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-foreground dark:text-zinc-200">
                      {language === "en" ? "Status Report" : "Laporan Kondisi"}
                    </h4>
                    <p className="text-[10px] text-muted-foreground dark:text-zinc-400 mt-0.5">
                      {language === "en"
                        ? "Your cat is healthy & playing actively."
                        : "Kucing Anda terpantau sehat & aktif bermain."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Horizontal Marquee */}
      <div className="w-full overflow-hidden bg-primary/5 dark:bg-zinc-900/30 py-4 border-y border-border/50 dark:border-zinc-800/50">
        <div 
          ref={marqueeTrackRef} 
          className="flex whitespace-nowrap gap-12 w-max"
        >
          {/* Set 1 */}
          <div className="flex shrink-0 items-center gap-12">
            {marqueeItems.map((item, idx) => (
              <span key={idx} className="flex items-center gap-2.5 text-sm font-extrabold text-foreground/80 dark:text-zinc-350 select-none">
                <item.icon className="w-4 h-4 text-primary shrink-0" />
                <span>{item.text}</span>
              </span>
            ))}
          </div>
          {/* Set 2 */}
          <div className="flex shrink-0 items-center gap-12">
            {marqueeItems.map((item, idx) => (
              <span key={`dup-${idx}`} className="flex items-center gap-2.5 text-sm font-extrabold text-foreground/80 dark:text-zinc-350 select-none">
                <item.icon className="w-4 h-4 text-primary shrink-0" />
                <span>{item.text}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24 bg-card dark:bg-zinc-900/40 border-t border-b border-border/60 dark:border-zinc-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-zinc-50 sm:text-4xl">
              {t("why_title")}
            </h2>
            <p className="text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
              {t("why_desc")}
            </p>
          </div>

          <div ref={whyRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(whyUsList && whyUsList.length > 0
              ? whyUsList
              : [
                  {
                    id: "1",
                    title: t("why_safe_title"),
                    description: t("why_safe_desc"),
                    icon: "Shield",
                  },
                  {
                    id: "2",
                    title: t("why_report_title"),
                    description: t("why_report_desc"),
                    icon: "Heart",
                  },
                  {
                    id: "3",
                    title: t("why_staff_title"),
                    description: t("why_staff_desc"),
                    icon: "Users",
                  },
                ]
            ).map((item, idx) => {
              const IconComp = ICON_MAP[item.icon] || Sparkles;
              return (
                <div
                  key={item.id || idx}
                  onMouseMove={handleTiltMove}
                  onMouseLeave={handleTiltLeave}
                  className="p-6 bg-background dark:bg-zinc-950 border border-border dark:border-zinc-900 rounded-2xl space-y-4 hover:border-primary/30 dark:hover:border-primary/20 transition-colors"
                >
                  <div className="p-3 bg-secondary dark:bg-zinc-900 text-primary rounded-xl w-fit">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold dark:text-zinc-200">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-zinc-450 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing / Services Section */}
      <section id="services" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-zinc-50 sm:text-4xl">
              {t("room_title")}
            </h2>
            <p className="text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
              {t("room_desc")}
            </p>
          </div>

          <div ref={pricingRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(dbClasses && dbClasses.length > 0
              ? dbClasses.map((cls) => ({
                  name: cls.name,
                  price: cls.price_per_day,
                  description: cls.description || getRoomDesc(cls.name),
                  facilities: cls.facilities || getFacilities(cls.name),
                  image_url: cls.image_url,
                  gradient:
                    cls.name === "Standard"
                      ? "from-primary/10 to-amber-500/10 border-primary/20 scale-102 shadow-xs dark:from-primary/5 dark:to-amber-500/5"
                      : cls.name === "Premium"
                      ? "from-amber-600/10 to-yellow-600/10 hover:border-yellow-400 dark:hover:border-yellow-600/50 dark:from-amber-600/5 dark:to-yellow-600/5"
                      : "from-amber-500/10 to-orange-500/10 hover:border-orange-300 dark:hover:border-orange-700/50 dark:from-amber-500/5 dark:to-orange-500/5",
                }))
              : classes
            ).map((cls) => (
              <div
                key={cls.name}
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
                className={`relative bg-card dark:bg-zinc-900/60 border border-border dark:border-zinc-800 rounded-3xl p-8 flex flex-col justify-between transition-colors duration-300 ${cls.gradient}`}
              >
                {cls.name === "Standard" && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground tracking-wider uppercase shadow-sm">
                    {t("room_popular")}
                  </span>
                )}
                <div>
                  {cls.image_url && (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-5 border border-border/80 shadow-xs">
                      <img
                        src={cls.image_url}
                        alt={cls.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h3 className="text-xl font-extrabold text-foreground dark:text-zinc-100">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-2 leading-relaxed">
                    {cls.description}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1 text-foreground dark:text-zinc-100">
                    <span className="text-3xl font-extrabold">
                      {formatRupiah(cls.price)}
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-zinc-400 font-semibold">
                      {t("room_per_day")}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3.5 border-t border-border/50 dark:border-zinc-800/50 pt-6">
                    {cls.facilities.map((fac) => (
                      <li
                        key={fac}
                        className="flex items-center gap-3 text-sm text-muted-foreground dark:text-zinc-400"
                      >
                        <div className="p-0.5 rounded-full bg-primary/10 text-primary">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href={`/booking/new?class=${cls.name}`}
                    className={`block w-full text-center py-3 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                      cls.name === "Standard"
                        ? "bg-primary text-primary-foreground hover:bg-primary/95"
                        : "bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 text-foreground dark:text-zinc-200 hover:bg-muted dark:hover:bg-zinc-800"
                    }`}
                  >
                    {t("room_select")} {cls.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 sm:py-24 bg-card dark:bg-zinc-900/20 border-t border-border/60 dark:border-zinc-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-zinc-50 sm:text-4xl">
              {language === "en" ? "What Pet Owners Say" : "Apa Kata Pemilik Mpus"}
            </h2>
            <p className="text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
              {language === "en" 
                ? "Reviews and feedback from users who have entrusted their cats with NekoStay."
                : "Ulasan dan masukan langsung dari pengguna yang telah mempercayakan kucingnya di NekoStay."}
            </p>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground dark:text-zinc-550 text-sm">
              {language === "en" 
                ? "No reviews yet. Be the first to review after checking out!"
                : "Belum ada ulasan. Jadilah yang pertama memberikan ulasan setelah mpus pulang!"}
            </div>
          ) : (
            <div ref={reviewsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="p-6 bg-background dark:bg-zinc-900/60 border border-border dark:border-zinc-850 rounded-2xl space-y-4 hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < rev.rating ? "fill-amber-500" : "text-zinc-300 dark:text-zinc-700"}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground dark:text-zinc-350 leading-relaxed min-h-[60px]">
                    "{rev.review_text}"
                  </p>
                  <div className="border-t border-border/60 dark:border-zinc-800/60 pt-3 flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground dark:text-zinc-200">
                      {rev.profiles?.full_name || "Tamu Neko"}
                    </span>
                    <span className="text-muted-foreground dark:text-zinc-450">
                      {new Date(rev.created_at).toLocaleDateString(currentLanguage === "en" ? "en-US" : "id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border dark:border-zinc-900 bg-card dark:bg-zinc-950 py-12 text-center text-sm text-muted-foreground dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Cat className="w-5 h-5 text-primary" />
            <span className="font-extrabold text-foreground dark:text-zinc-150">NekoStay</span>
          </div>
          <p>
            © {new Date().getFullYear()} NekoStay. {language === "en" ? "All rights reserved." : "Seluruh hak cipta dilindungi."}
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/terms"
              className="hover:text-foreground dark:hover:text-zinc-300 transition-colors"
            >
              {language === "en" ? "Terms & Conditions" : "Syarat & Ketentuan"}
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground dark:hover:text-zinc-300 transition-colors"
            >
              {language === "en" ? "Privacy Policy" : "Kebijakan Privasi"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SparkleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

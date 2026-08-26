"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Settings, ShieldCheck, LogOut, ChevronDown, LayoutDashboard, PlusCircle } from "lucide-react";
import { gsap } from "gsap";

/**
 * GsapAvatarDropdown — Premium User Avatar Dropdown with GSAP Orchestrated easeReverse (Desktop mode only).
 */
export function GsapAvatarDropdown({ user, profile, role = "user", onSignOut, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const itemsRef = useRef([]);
  const tlRef = useRef(null);

  const currentRole = role || profile?.role || "user";

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const openDropdown = () => {
    setIsOpen(true);
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

    // Wait for DOM panel to render
    setTimeout(() => {
      const panel = panelRef.current;
      const validItems = itemsRef.current.filter(Boolean);
      if (!panel) return;

      if (isDesktop) {
        // Build GSAP Orchestrated easeReverse Timeline for Desktop
        const tl = gsap.timeline({ paused: true });

        // 1. Menu Panel Entrance: back.out(2) on enter
        tl.fromTo(
          panel,
          { autoAlpha: 0, yPercent: -10, scale: 0.6, transformOrigin: "top right" },
          { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.45, ease: "back.out(2)" },
          0
        );

        // 2. Menu Links Stagger Entrance: power2.out on enter
        if (validItems.length > 0) {
          tl.fromTo(
            validItems,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.32, ease: "power2.out", stagger: 0.05 },
            0.1
          );
        }

        tlRef.current = tl;
        tl.play();
      } else {
        // Mobile fallback
        gsap.fromTo(
          panel,
          { opacity: 0, y: -4, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
        );
      }
    }, 10);
  };

  const closeDropdown = () => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    const panel = panelRef.current;

    if (isDesktop && tlRef.current && panel) {
      // Orchestrated easeReverse timeline on close
      const tl = tlRef.current;
      tl.eventCallback("onReverseComplete", () => {
        setIsOpen(false);
      });
      tl.timeScale(1.3).reverse();
    } else if (panel) {
      gsap.to(panel, {
        opacity: 0,
        y: -4,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(false);
    }
  };

  const userName = profile?.full_name || user?.email?.split("@")[0] || "Pengguna";

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 hover:bg-muted dark:hover:bg-zinc-800 transition-all duration-200 group cursor-pointer"
      >
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground dark:text-zinc-200 max-w-[80px] truncate hidden lg:block">
          {userName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Orchestrated Panel Dropdown */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{ opacity: 0 }}
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-2 z-50 overflow-hidden"
        >
          {/* Header Info */}
          <div
            ref={(el) => (itemsRef.current[0] = el)}
            className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1"
          >
            <p className="text-xs font-black text-foreground truncate">
              {currentRole === "admin" ? "Admin Panel" : userName}
            </p>
            <p className="text-[10px] text-muted-foreground truncate font-medium">
              {user?.email}
            </p>
          </div>

          {/* Nav Links */}
          <div className="space-y-0.5">
            <Link
              href={currentRole === "admin" ? "/admin/dashboard" : "/dashboard"}
              onClick={closeDropdown}
              ref={(el) => (itemsRef.current[1] = el)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span>Dashboard</span>
            </Link>

            <Link
              href={currentRole === "admin" ? "/admin/profile" : "/profile"}
              onClick={closeDropdown}
              ref={(el) => (itemsRef.current[2] = el)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <User className="w-4 h-4 text-primary" />
              <span>{t ? t("nav_profile") : "Profil Saya"}</span>
            </Link>

            {currentRole === "user" && (
              <Link
                href="/booking/new"
                onClick={closeDropdown}
                ref={(el) => (itemsRef.current[3] = el)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-primary" />
                <span>{t ? t("nav_booking") : "Pesan Kamar"}</span>
              </Link>
            )}

            <div className="h-px bg-zinc-100 dark:border-zinc-800/80 my-1" />

            <button
              type="button"
              onClick={() => {
                closeDropdown();
                if (onSignOut) onSignOut();
              }}
              ref={(el) => (itemsRef.current[4] = el)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>{t ? t("nav_logout") : "Keluar Akun"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

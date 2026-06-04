"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Cat,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User,
  PlusCircle,
  Sun,
  Moon,
  Globe,
  Star,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "./NotificationBell";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) {
          setRole(profile.role);
        }
      }
      setUser(user);
    }
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        if (profile) {
          setRole(profile.role);
        }
      } else {
        setRole("user");
      }
      setUser(currentUser);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleLanguage = () => {
    setLanguage(language === "id" ? "en" : "id");
  };

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  if (isAuthPage) return null;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-border/80 dark:border-zinc-800/80 shadow-xs"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-primary text-primary-foreground rounded-xl shadow-sm transition-transform duration-300 group-hover:rotate-6">
            <Cat className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            NekoStay
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors ${
              pathname === "/"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {t("nav_home")}
          </Link>
          {user ? (
            <>
              <Link
                href={role === "admin" ? "/admin/dashboard" : "/dashboard"}
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname.includes("/dashboard")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                {t("nav_dashboard")}
              </Link>
              {role === "user" && (
                <Link
                  href="/booking/new"
                  className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    pathname.includes("/booking/new")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  {t("nav_booking")}
                </Link>
              )}
            </>
          ) : null}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="p-2 hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl transition-all duration-300 flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Switch Language"
          >
            <Globe className="w-4 h-4" />
            <span>{mounted ? language.toUpperCase() : "ID"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl transition-all duration-300 cursor-pointer"
            title="Toggle Theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell userId={user.id} />

              <Link
                href={role === "admin" ? "/admin/profile" : "/profile"}
                className="p-2 hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl transition-all duration-300 flex items-center gap-1.5 font-semibold text-sm"
                title={t("nav_profile")}
              >
                <User className="w-4 h-4 text-primary" />
              </Link>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t("nav_logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-3 py-2"
              >
                {t("nav_login")}
              </Link>
              <Link
                href="/register"
                className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/95 transition-all shadow-sm hover:shadow"
              >
                {t("nav_register")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Language Switcher Mobile */}
          <button
            onClick={toggleLanguage}
            className="p-2 hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground dark:text-zinc-400 rounded-lg cursor-pointer text-xs font-bold"
          >
            <Globe className="w-4 h-4 inline-block mr-0.5" />
            <span>{mounted ? language.toUpperCase() : "ID"}</span>
          </button>

          {/* Theme Switcher Mobile */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground dark:text-zinc-400 rounded-lg cursor-pointer"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {user && <NotificationBell userId={user.id} />}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-100 rounded-lg cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border/80 dark:border-zinc-800/80 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-3 duration-200">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900"
          >
            {t("nav_home")}
          </Link>
          {user ? (
            <>
              {role === "admin" ? (
                <>
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Menu Admin
                  </div>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                    Overview
                  </Link>
                  <Link
                    href="/admin/bookings"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5 text-primary" />
                    Semua Pesanan
                  </Link>
                  <Link
                    href="/admin/reports"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <Cat className="w-5 h-5 text-primary" />
                    Kondisi Kucing
                  </Link>
                  <Link
                    href="/admin/reviews"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <Star className="w-5 h-5 text-primary" />
                    Ulasan Pelanggan
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <Settings className="w-5 h-5 text-primary" />
                    Kelas & Tarif
                  </Link>
                  <Link
                    href="/admin/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <User className="w-5 h-5 text-primary" />
                    Profil Admin
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                    {t("nav_dashboard")}
                  </Link>
                  <Link
                    href="/booking/new"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5 text-primary" />
                    {t("nav_booking")}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <User className="w-5 h-5 text-primary" />
                    {t("nav_profile")}
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-base font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-border dark:border-zinc-800 font-semibold hover:bg-muted dark:hover:bg-zinc-900"
              >
                {t("nav_login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95"
              >
                {t("nav_register")}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

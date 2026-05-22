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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
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
    }
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setRole(profile.role);
        }
      } else {
        setRole("user");
      }
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

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  if (isAuthPage) return null;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/80 shadow-xs"
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
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Beranda
          </Link>
          {user ? (
            <>
              <Link
                href={role === "admin" ? "/admin/dashboard" : "/dashboard"}
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname.includes("/dashboard")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              {role === "user" && (
                <Link
                  href="/booking/new"
                  className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    pathname.includes("/booking/new")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Pesan Penitipan
                </Link>
              )}
            </>
          ) : null}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell userId={user.id} />

              <Link
                href="/profile"
                className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all duration-300 flex items-center gap-1.5 font-semibold text-sm"
                title="Profil Saya"
              >
                <User className="w-4 h-4 text-primary" />
              </Link>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/95 transition-all shadow-sm hover:shadow"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {user && <NotificationBell userId={user.id} />}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-3 duration-200">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted"
          >
            Beranda
          </Link>
          {user ? (
            <>
              <Link
                href={role === "admin" ? "/admin/dashboard" : "/dashboard"}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted flex items-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5 text-primary" />
                Dashboard
              </Link>
              {role === "user" && (
                <Link
                  href="/booking/new"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5 text-primary" />
                  Pesan Penitipan
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold hover:bg-muted flex items-center gap-2"
              >
                <User className="w-5 h-5 text-primary" />
                Profil Saya
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-base font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Keluar
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-border font-semibold hover:bg-muted"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cat, KeyRound, Mail, Sparkles, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { animate, utils } from "animejs";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Cat avatar focus states
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const cardRef = useRef(null);
  const catFaceRef = useRef(null);
  const catPawLeftRef = useRef(null);
  const catPawRightRef = useRef(null);
  const catEyesRef = useRef(null);

  const supabase = createClient();

  // Entrance Stagger Animation with Anime.js
  useEffect(() => {
    if (!cardRef.current) return;

    animate(cardRef.current.querySelectorAll(".anim-item"), {
      translateY: [32, 0],
      opacity: [0, 1],
      duration: 800,
      delay: utils.stagger(70),
      easing: "easeOutBack(1.4)",
    });
  }, []);

  // Password Peek-a-boo Animation (Paws covering eyes)
  useEffect(() => {
    if (!catPawLeftRef.current || !catPawRightRef.current) return;

    if (isPasswordFocused && !showPassword) {
      // Cover eyes with paws
      animate([catPawLeftRef.current, catPawRightRef.current], {
        translateY: -34,
        translateX: (el, i) => (i === 0 ? 14 : -14),
        rotate: (el, i) => (i === 0 ? 15 : -15),
        duration: 350,
        easing: "easeOutBack(2.0)",
      });

      animate(catEyesRef.current, {
        scaleY: 0.1,
        duration: 200,
        easing: "easeInOutQuad",
      });
    } else {
      // Uncover eyes
      animate([catPawLeftRef.current, catPawRightRef.current], {
        translateY: 0,
        translateX: 0,
        rotate: 0,
        duration: 400,
        easing: "easeOutElastic(1, 0.5)",
      });

      animate(catEyesRef.current, {
        scaleY: 1,
        duration: 200,
        easing: "easeInOutQuad",
      });
    }
  }, [isPasswordFocused, showPassword]);

  // Email focus look-down animation
  useEffect(() => {
    if (!catEyesRef.current || isPasswordFocused) return;

    if (isEmailFocused) {
      animate(catEyesRef.current, {
        translateY: 4,
        translateX: 0,
        duration: 250,
        easing: "easeOutQuad",
      });
    } else {
      animate(catEyesRef.current, {
        translateY: 0,
        translateX: 0,
        duration: 300,
        easing: "easeOutQuad",
      });
    }
  }, [isEmailFocused, isPasswordFocused]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    // Button click spring bounce effect
    animate(".login-btn", {
      scale: [0.94, 1],
      duration: 400,
      easing: "easeOutElastic(1, 0.4)",
    });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          throw new Error("Email atau password salah.");
        }
        throw error;
      }

      if (data.user) {
        // Fetch role from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const redirectTo =
          profile?.role === "admin" ? "/admin/dashboard" : "/dashboard";
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem. Coba lagi.");

      // Shake card on error
      animate(cardRef.current, {
        translateX: [-10, 10, -8, 8, -4, 4, 0],
        duration: 500,
        easing: "easeInOutSine",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-secondary/40 via-background to-background p-4 relative overflow-hidden">
      {/* Background Soft Glow Bubbles */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl" />
      </div>

      <div
        ref={cardRef}
        className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-xl space-y-6 relative"
      >
        {/* Interactive Playful Cat Mascot Head */}
        <div className="flex flex-col items-center justify-center -mt-16 mb-2 anim-item">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Cat Head */}
            <svg
              ref={catFaceRef}
              viewBox="0 0 100 100"
              className="w-24 h-24 drop-shadow-md overflow-visible"
            >
              {/* Ears */}
              <polygon points="15,35 32,5 45,32" fill="#ff8c42" />
              <polygon points="20,33 32,12 40,32" fill="#ffb3c1" />

              <polygon points="85,35 68,5 55,32" fill="#ff8c42" />
              <polygon points="80,33 68,12 60,32" fill="#ffb3c1" />

              {/* Head Base */}
              <ellipse cx="50" cy="55" rx="38" ry="32" fill="#ff8c42" />

              {/* White Muzzle */}
              <ellipse cx="50" cy="65" rx="20" ry="14" fill="#ffffff" />

              {/* Nose */}
              <polygon points="50,60 45,55 55,55" fill="#ff6b81" />

              {/* Whiskers */}
              <line x1="20" y1="62" x2="5" y2="58" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
              <line x1="20" y1="66" x2="5" y2="68" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
              <line x1="80" y1="62" x2="95" y2="58" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
              <line x1="80" y1="66" x2="95" y2="68" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />

              {/* Eyes Group */}
              <g ref={catEyesRef}>
                <circle cx="34" cy="48" r="6" fill="#2b2b2b" />
                <circle cx="32" cy="46" r="2" fill="#ffffff" />

                <circle cx="66" cy="48" r="6" fill="#2b2b2b" />
                <circle cx="64" cy="46" r="2" fill="#ffffff" />
              </g>

              {/* Left Paw (Animated cover eyes) */}
              <g ref={catPawLeftRef}>
                <ellipse cx="25" cy="85" rx="11" ry="8" fill="#ffffff" stroke="#ff8c42" strokeWidth="2" />
              </g>

              {/* Right Paw (Animated cover eyes) */}
              <g ref={catPawRightRef}>
                <ellipse cx="75" cy="85" rx="11" ry="8" fill="#ffffff" stroke="#ff8c42" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2 anim-item">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-extrabold text-2xl mb-1 hover:opacity-90 transition-opacity"
          >
            <span>NekoStay</span>
          </Link>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Selamat Datang Kembali</span>
            </span>
          </div>
          <h2 className="text-2xl font-black text-foreground">
            Masuk ke Akun Anda
          </h2>
          <p className="text-xs text-muted-foreground">
            Silakan isi detail akun Anda di bawah untuk melanjutkan.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 rounded-xl p-3.5 text-xs font-semibold leading-relaxed flex items-center gap-2 anim-item">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 anim-item">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="email"
                required
                value={email}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:border-primary/50 transition-colors font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 anim-item">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Kata Sandi
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary font-bold hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:border-primary/50 transition-colors font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="login-btn w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 anim-item mt-2"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center border-t border-border/60 pt-4 anim-item">
          <p className="text-xs text-muted-foreground">
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="text-primary font-bold hover:underline"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

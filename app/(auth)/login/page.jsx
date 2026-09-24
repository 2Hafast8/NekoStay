"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cat, KeyRound, Mail, Sparkles, ArrowRight, AlertCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GsapTextButton } from "@/components/shared/GsapTextButton";
import { GsapAuthCurveOverlay } from "@/components/shared/GsapAuthCurveOverlay";
import { SupabaseCaptcha } from "@/components/shared/SupabaseCaptcha";
import { useAutoDismiss } from "@/hooks/useAutoDismiss";
import { UserErrorAlert } from "@/components/shared/UserErrorAlert";
import { formatUserError } from "@/lib/utils/errors";
import { gsap } from "gsap";

export default function LoginPage() {
  const router = useRouter();
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const captchaRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Auto-dismiss alert notifications after 6 seconds
  useAutoDismiss(errorMsg, setErrorMsg, 6000);

  const supabase = createClient();

  const handleEntranceComplete = useCallback(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  const handleNavigateRegister = (e) => {
    e.preventDefault();
    if (overlayRef.current) {
      overlayRef.current.triggerCurveSwipe(() => {
        router.push("/register");
      });
    } else {
      router.push("/register");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const turnstileSiteKey =
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

    if (turnstileSiteKey && !captchaToken) {
      setErrorMsg(
        formatUserError("captcha protection: request disallowed (no captcha_token found)", {
          language: "id",
        })
      );
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (error) {
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
        
        if (typeof window !== "undefined") {
          sessionStorage.setItem("just_logged_in", "true");
        }

        if (overlayRef.current) {
          overlayRef.current.triggerCurveSwipe(() => {
            router.push(redirectTo);
            router.refresh();
          });
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      }
    } catch (err) {
      captchaRef.current?.reset();
      setCaptchaToken(null);
      setErrorMsg(formatUserError(err, { language: "id" }));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-secondary/30 via-background to-background p-4 relative overflow-hidden">
      <GsapAuthCurveOverlay ref={overlayRef} onCompleteEntrance={handleEntranceComplete} />

      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div ref={cardRef} style={{ visibility: "hidden", opacity: 0 }} className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-extrabold text-2xl mb-2"
          >
            <div className="p-2.5 bg-primary text-primary-foreground rounded-2xl">
              <Cat className="w-6 h-6" />
            </div>
            <span>NekoStay</span>
          </Link>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Selamat Datang Kembali</span>
          </div>
          <h2 className="text-2xl font-black text-foreground">
            Masuk ke Akun Anda
          </h2>
          <p className="text-xs text-muted-foreground">
            Silakan isi detail akun Anda di bawah untuk melanjutkan.
          </p>
        </div>

        <UserErrorAlert error={errorMsg} onDismiss={() => setErrorMsg(null)} />

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-primary hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/75" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <SupabaseCaptcha
            ref={captchaRef}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />

          <GsapTextButton
            type="submit"
            isLoading={isLoading}
            idleText="Masuk Sekarang"
            loadingText="Sedang Masuk..."
            successText="Berhasil!"
            icon={<ArrowRight className="w-4.5 h-4.5" />}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Belum punya akun?{" "}
          <a
            href="/register"
            onClick={handleNavigateRegister}
            className="font-bold text-primary hover:underline cursor-pointer"
          >
            Daftar Gratis
          </a>
        </p>
      </div>
    </div>
  );
}

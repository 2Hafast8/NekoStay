"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import Script from "next/script";

/**
 * SupabaseCaptcha: Komponen proteksi bot Captcha resmi untuk Supabase Auth.
 * Secara default menggunakan Cloudflare Turnstile (rekomendasi resmi Supabase).
 *
 * Mendukung:
 * - Render otomatis saat script siap
 * - Expose method `ref.current.reset()` untuk mereset captcha jika login/register gagal
 * - Auto-theme adaptif (light / dark)
 * - Fallback ramah jika key belum dikonfigurasi di .env.local
 */
export const SupabaseCaptcha = forwardRef(function SupabaseCaptcha(
  {
    onVerify,
    onExpire,
    onError,
    className = "",
  },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
    "";

  // Expose reset method ke parent form
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (err) {
          console.warn("[SupabaseCaptcha] Gagal mereset widget Turnstile:", err);
        }
      }
    },
    remove: () => {
      if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (err) {
          console.warn("[SupabaseCaptcha] Gagal menghapus widget:", err);
        }
      }
    },
  }));

  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  });

  // Render widget setelah script siap
  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let isSubscribed = true;

    const renderWidget = () => {
      if (
        typeof window !== "undefined" &&
        window.turnstile &&
        containerRef.current &&
        isSubscribed &&
        widgetIdRef.current === null
      ) {
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              if (isSubscribed && onVerifyRef.current) onVerifyRef.current(token);
            },
            "error-callback": (err) => {
              console.warn("[SupabaseCaptcha] Turnstile error:", err);
              if (isSubscribed && onErrorRef.current) onErrorRef.current(err);
            },
            "expired-callback": () => {
              if (isSubscribed && onExpireRef.current) onExpireRef.current();
            },
            theme: "auto",
            size: "normal",
          });
          widgetIdRef.current = id;
        } catch (renderErr) {
          console.warn("[SupabaseCaptcha] Render error:", renderErr);
        }
      }
    };

    // Jika turnstile sudah tersedia di window
    if (typeof window !== "undefined" && window.turnstile) {
      renderWidget();
    } else if (scriptLoaded) {
      renderWidget();
    } else {
      // Polling fallback jika script onLoad terlewat
      const interval = setInterval(() => {
        if (typeof window !== "undefined" && window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 300);
      return () => clearInterval(interval);
    }

    return () => {
      isSubscribed = false;
      if (
        typeof window !== "undefined" &&
        window.turnstile &&
        widgetIdRef.current !== null
      ) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [siteKey, scriptLoaded]);

  // Jika sitekey belum diisi di .env.local
  if (!siteKey) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-400 font-medium">
          <p className="font-bold">⚠️ Supabase Captcha Protection:</p>
          <p className="mt-0.5">
            Key belum diatur. Tambahkan <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> di <code>.env.local</code>.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`supabase-captcha-container my-2 ${className}`}>
      <Script
        id="cf-turnstile-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onReady={() => setScriptLoaded(true)}
      />
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center w-full"
      />
    </div>
  );
});


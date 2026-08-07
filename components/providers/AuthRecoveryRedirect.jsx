"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    // 1. Listen to Supabase auth state change for PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (pathname !== "/update-password") {
          router.push("/update-password");
        }
      }
    });

    // 2. Inspect URL search & hash parameters on mount
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash,
      );

      const code = searchParams.get("code");
      const type = searchParams.get("type") || hashParams.get("type");
      const next = searchParams.get("next");
      const isRecovery =
        type === "recovery" ||
        next === "/update-password" ||
        window.location.hash.includes("type=recovery");

      // If user landed on root or login or any non-update-password page with recovery code/params
      if (pathname !== "/update-password" && pathname !== "/api/auth/callback") {
        if (isRecovery) {
          if (code) {
            router.push(`/update-password?code=${code}`);
          } else if (window.location.hash) {
            router.push(`/update-password${window.location.hash}`);
          } else {
            router.push("/update-password");
          }
        } else if (code) {
          // If ?code=xxx parameter is present on root (e.g. /?code=56ad8b7a-2bab-43c9-8f0e-29e24e8e66c2)
          // Automatically exchange code for session and redirect to /update-password if recovery
          supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
            if (!error && data?.session) {
              // If next is specified or user was recovering password
              if (next === "/update-password" || type === "recovery") {
                router.push("/update-password");
              } else {
                // If it's a password recovery code without explicit type, check if session user needs update-password or redirect to update-password
                router.push(`/update-password?code=${code}`);
              }
            }
          });
        }
      }
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}

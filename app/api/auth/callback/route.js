import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeRedirectPath(nextPath, defaultPath = "/dashboard") {
  if (!nextPath || typeof nextPath !== "string") {
    return defaultPath;
  }
  const trimmed = nextPath.trim();
  // Must be an internal relative path starting with single '/'
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes(":")
  ) {
    return defaultPath;
  }
  return trimmed;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next");
  const defaultFallback = type === "recovery" ? "/update-password" : "/dashboard";
  const next = sanitizeRedirectPath(rawNext, defaultFallback);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const redirectBase =
        forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : origin;
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could not exchange auth code for session`,
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  let next = searchParams.get("next");

  if (!next) {
    if (type === "recovery") {
      next = "/update-password";
    } else {
      next = "/dashboard";
    }
  }

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

"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args) => {
    const fullMessage = args
      .map((arg) => (typeof arg === "string" ? arg : (arg && arg.message) || ""))
      .join(" ");

    if (fullMessage.includes("Encountered a script tag")) {
      return;
    }

    if (
      fullMessage.includes("bis_skin_checked") ||
      fullMessage.includes("bis_register") ||
      (fullMessage.includes("hydration-mismatch") &&
        (fullMessage.includes("bis_") || fullMessage.includes("browser extension")))
    ) {
      return;
    }

    orig.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

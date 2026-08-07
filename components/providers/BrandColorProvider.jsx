"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BrandColorContext = createContext({ primaryHex: "#f97316", setPrimaryHex: () => {} });

/**
 * Given a hex color string, returns HSL values as { h, s, l }
 */
function hexToHSL(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Generate a full brand color palette from a single primary hex color.
 * Returns CSS variable assignments for --primary, --ring, --secondary, --accent, etc.
 */
function generatePalette(hex) {
  const { h, s, l } = hexToHSL(hex);

  // Clamp saturation & lightness for derived shades
  const sat = (v) => Math.min(100, Math.max(0, v));
  const lig = (v) => Math.min(100, Math.max(0, v));

  const viaHue = (h + 15) % 360;
  const toHue = (h + 35) % 360;

  return {
    // Primary & ring
    primary: `${h} ${sat(s)}% ${lig(l)}%`,
    ring: `${h} ${sat(s)}% ${lig(l)}%`,

    // Dynamic Gradient Stops
    gradient_via: `${viaHue} ${sat(s - 5)}% ${lig(l - 3)}%`,
    gradient_to: `${toHue} ${sat(s - 10)}% ${lig(l - 8)}%`,

    // Light mode derived
    secondary_light: `${viaHue} ${sat(Math.min(s, 92))}% 95%`,
    secondary_fg_light: `${h} ${sat(s)}% 30%`,
    accent_light: `${viaHue} ${sat(Math.min(s, 92))}% 90%`,
    accent_fg_light: `${h} ${sat(s)}% 25%`,

    // Dark mode derived
    secondary_dark: `${h} 15% 12%`,
    secondary_fg_dark: `${h} ${sat(s)}% 70%`,
    accent_dark: `${h} ${sat(s)}% 20%`,
    accent_fg_dark: `${h} ${sat(s)}% 80%`,
  };
}

function applyBrandColors(hex) {
  const palette = generatePalette(hex);
  const root = document.documentElement;

  // Apply primary, ring, and gradients (same in both light & dark)
  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--ring", palette.ring);
  root.style.setProperty("--gradient-via", palette.gradient_via);
  root.style.setProperty("--gradient-to", palette.gradient_to);

  // Check current theme
  const isDark = root.classList.contains("dark");

  if (isDark) {
    root.style.setProperty("--secondary", palette.secondary_dark);
    root.style.setProperty("--secondary-foreground", palette.secondary_fg_dark);
    root.style.setProperty("--accent", palette.accent_dark);
    root.style.setProperty("--accent-foreground", palette.accent_fg_dark);
  } else {
    root.style.setProperty("--secondary", palette.secondary_light);
    root.style.setProperty("--secondary-foreground", palette.secondary_fg_light);
    root.style.setProperty("--accent", palette.accent_light);
    root.style.setProperty("--accent-foreground", palette.accent_fg_light);
  }
}

export function BrandColorProvider({ children }) {
  const [primaryHex, setPrimaryHex] = useState("#f97316");
  const [loaded, setLoaded] = useState(false);

  // Load saved brand color from Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("landing_settings")
      .select("content")
      .eq("id", "brand_color")
      .single()
      .then(({ data }) => {
        if (data?.content?.primary_hex) {
          setPrimaryHex(data.content.primary_hex);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Apply colors on mount and whenever primaryHex or theme changes
  useEffect(() => {
    if (!loaded) return;
    applyBrandColors(primaryHex);

    // Watch for theme class changes to re-apply derived colors
    const observer = new MutationObserver(() => {
      applyBrandColors(primaryHex);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [primaryHex, loaded]);

  return (
    <BrandColorContext.Provider value={{ primaryHex, setPrimaryHex }}>
      {children}
    </BrandColorContext.Provider>
  );
}

export function useBrandColor() {
  return useContext(BrandColorContext);
}

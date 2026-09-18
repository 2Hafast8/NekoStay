import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AutoReloadProvider } from "@/components/providers/AutoReloadProvider";
import { BrandColorProvider } from "@/components/providers/BrandColorProvider";
import { AuthRecoveryRedirect } from "@/components/providers/AuthRecoveryRedirect";
import { Toaster } from "sonner";
import "./globals.css";

const siteUrl = "https://nekostay.vercel.app";

export const metadata = {
  title: {
    default: "NekoStay | Penitipan Kucing Premium",
    template: "%s | NekoStay",
  },
  description:
    "Platform penitipan kucing premium dengan laporan berkala, kalkulasi harga otomatis, dan layanan dokter hewan siaga.",
  keywords: [
    "penitipan kucing",
    "cat hotel",
    "cat boarding",
    "NekoStay",
    "kucing",
    "pet care",
  ],
  authors: [{ name: "NekoStay Team" }],
  creator: "NekoStay",

  // Open Graph: preview saat share link di WhatsApp, Facebook, dll
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "NekoStay",
    title: "NekoStay | Penitipan Kucing Premium",
    description:
      "Platform penitipan kucing premium dengan laporan berkala, kalkulasi harga otomatis, dan layanan dokter hewan siaga.",
    images: [
      {
        url: `${siteUrl}/og-banner.jpg`,
        width: 1200,
        height: 675,
        type: "image/jpeg",
        alt: "NekoStay | Penitipan Kucing Premium",
      },
    ],
  },

  // Twitter Card: preview saat share link di Twitter/X
  twitter: {
    card: "summary_large_image",
    title: "NekoStay | Penitipan Kucing Premium",
    description:
      "Platform penitipan kucing premium dengan laporan berkala, kalkulasi harga otomatis, dan layanan dokter hewan siaga.",
    images: [`${siteUrl}/og-banner.jpg`],
  },

  // Favicon & Icons (Logo Tab, Google Search Icon, Apple Touch)
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // Chrome Web App / PWA manifest
  manifest: "/site.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NekoStay",
  },

  metadataBase: new URL(siteUrl),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NekoStay",
  url: siteUrl,
  logo: `${siteUrl}/android-chrome-512x512.png`,
  image: `${siteUrl}/og-banner.jpg`,
  description:
    "Platform penitipan kucing premium dengan laporan berkala, kalkulasi harga otomatis, dan layanan dokter hewan siaga.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-300"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <BrandColorProvider>
            <AutoReloadProvider />
            <AuthRecoveryRedirect />
            {children}
            <Toaster richColors position="top-right" duration={3000} closeButton />
          </BrandColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

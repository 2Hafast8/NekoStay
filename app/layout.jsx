import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AutoReloadProvider } from "@/components/providers/AutoReloadProvider";
import "./globals.css";

const siteUrl = "https://nekostay.vercel.app";

export const metadata = {
  title: {
    default: "NekoStay — Penitipan Kucing Premium",
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

  // Open Graph — preview saat share link di WhatsApp, Facebook, dll
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "NekoStay",
    title: "NekoStay — Penitipan Kucing Premium",
    description:
      "Platform penitipan kucing premium dengan laporan berkala, kalkulasi harga otomatis, dan layanan dokter hewan siaga.",
  },

  // Twitter Card — preview saat share link di Twitter/X
  twitter: {
    card: "summary_large_image",
    title: "NekoStay — Penitipan Kucing Premium",
    description:
      "Platform penitipan kucing premium dengan laporan berkala, kalkulasi harga otomatis, dan layanan dokter hewan siaga.",
  },

  // Favicon & Icon
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className="antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-300"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AutoReloadProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

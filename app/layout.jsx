import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AutoReloadProvider } from "@/components/providers/AutoReloadProvider";
import "./globals.css";

export const metadata = {
  title: "NekoStay — Penitipan Kucing Online Terpercaya",
  description:
    "Platform penitipan kucing premium dengan laporan berkala, kalkulasi harga otomatis, dan layanan dokter hewan siaga.",
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


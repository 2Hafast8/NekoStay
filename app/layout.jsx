import { Inter, Nunito } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

export const metadata = {
  title: 'NekoStay — Penitipan Kucing Terpercaya',
  description: 'Platform web pemesanan jasa penitipan kucing berbasis online. Penitipan kucing aman, nyaman, dan transparan.',
  keywords: 'penitipan kucing, cat boarding, nekostay, titip kucing',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${nunito.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}

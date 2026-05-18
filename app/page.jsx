import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Cat, ArrowRight, Shield, Heart, Camera, Clock } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') redirect('/admin/dashboard')
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <Cat className="text-white" size={20} />
            </div>
            <span className="font-[var(--font-nunito)] font-bold text-xl text-slate-900 dark:text-white">NekoStay</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors px-4 py-2 rounded-lg">
              Masuk
            </Link>
            <Link href="/register" className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-lg transition-colors">
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Cat size={16} />
            <span>Platform Penitipan Kucing #1</span>
          </div>
          <h1 className="font-[var(--font-nunito)] text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
            Titipkan Kucing Anda dengan
            <span className="text-brand-500"> Aman & Nyaman</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            NekoStay memberikan layanan penitipan kucing terbaik dengan laporan kondisi real-time,
            fasilitas premium, dan transparansi biaya.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-brand-500/25">
              Mulai Sekarang
              <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-8 py-3.5 rounded-xl text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-14">
          <h2 className="font-[var(--font-nunito)] text-3xl font-bold text-slate-900 dark:text-white mb-3">Kenapa NekoStay?</h2>
          <p className="text-slate-600 dark:text-slate-400">Layanan terbaik untuk kucing kesayangan Anda</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Aman & Terpercaya', desc: 'Fasilitas aman dengan pengawasan 24 jam', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { icon: Camera, title: 'Laporan Berkala', desc: 'Update kondisi kucing setiap 2 hari via email', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
            { icon: Heart, title: 'Perawatan Penuh', desc: 'Makan teratur, grooming, dan area bermain', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
            { icon: Clock, title: 'Transparansi Biaya', desc: 'Harga jelas, refund adil, tanpa biaya tersembunyi', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={feature.color} size={24} />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 dark:bg-slate-800/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-[var(--font-nunito)] text-3xl font-bold text-slate-900 dark:text-white mb-3">Pilihan Kelas Penitipan</h2>
            <p className="text-slate-600 dark:text-slate-400">Sesuaikan dengan kebutuhan kucing Anda</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Basic', icon: '🏠', price: '50.000', features: ['Kandang standar', 'Makan 2x/hari', 'Air minum segar'], popular: false },
              { name: 'Standard', icon: '⭐', price: '80.000', features: ['Kandang luas', 'Makan 3x/hari', 'Mainan dasar', 'Monitoring harian'], popular: true },
              { name: 'Premium', icon: '👑', price: '130.000', features: ['Ruang privat', 'Makan teratur', 'Grooming harian', 'Laporan foto', 'Area bermain'], popular: false },
            ].map((plan, i) => (
              <div key={i} className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 transition-all hover:shadow-xl ${plan.popular ? 'border-brand-500 shadow-lg scale-[1.02]' : 'border-slate-200 dark:border-slate-700'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    POPULER
                  </div>
                )}
                <div className="text-center mb-6">
                  <span className="text-3xl mb-2 block">{plan.icon}</span>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-brand-500">Rp {plan.price}</span>
                    <span className="text-slate-500 text-sm">/hari</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-[var(--font-nunito)] text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Siap Menitipkan Kucing Anda?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Daftar sekarang dan buat pesanan penitipan pertama Anda dalam hitungan menit.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-brand-500/25">
            Daftar Gratis
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Cat className="text-white" size={14} />
            </div>
            <span className="font-[var(--font-nunito)] font-bold text-slate-900 dark:text-white">NekoStay</span>
          </div>
          <p className="text-sm text-slate-500">© 2025 NekoStay. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}

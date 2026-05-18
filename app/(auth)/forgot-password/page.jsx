'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cat, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setLoading(false)
    if (error) { toast.error('Gagal mengirim email reset'); return }
    setSent(true)
    toast.success('Link reset password telah dikirim ke email Anda')
  }

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4"><Cat className="text-white" size={32} /></div>
          <h1 className="font-[var(--font-nunito)] text-2xl font-bold text-slate-900 dark:text-white">Lupa Password</h1>
          <p className="text-slate-500 text-sm mt-1">Masukkan email untuk reset password</p>
        </div>
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Email Terkirim!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cek inbox email <strong>{email}</strong> untuk link reset password.</p>
              <Link href="/login"><Button variant="outline" className="mt-4"><ArrowLeft size={16} className="mr-2"/>Kembali ke Login</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1.5" required /></div>
              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white" disabled={loading}>{loading ? <><Loader2 className="animate-spin mr-2" size={16}/>Mengirim...</> : 'Kirim Link Reset'}</Button>
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                <Link href="/login" className="text-brand-500 font-semibold"><ArrowLeft size={14} className="inline mr-1"/>Kembali ke Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '@/lib/validations/booking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cat, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const supabase = createClient()
  const { register: reg, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (v) => {
    const { data, error } = await supabase.auth.signUp({
      email: v.email, password: v.password,
      options: { data: { full_name: v.full_name, phone: v.phone } },
    })
    if (error) { toast.error(error.message === 'User already registered' ? 'Email sudah terdaftar' : 'Gagal mendaftar'); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, full_name: v.full_name, phone: v.phone, role: 'user' })
    }
    toast.success('Pendaftaran berhasil! Cek email untuk verifikasi.')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4"><Cat className="text-white" size={32} /></div>
          <h1 className="font-[var(--font-nunito)] text-2xl font-bold text-slate-900 dark:text-white">NekoStay</h1>
          <p className="text-slate-500 text-sm mt-1">Penitipan Kucing Terpercaya</p>
        </div>
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          <h2 className="font-[var(--font-nunito)] text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Buat Akun Baru</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><Label htmlFor="full_name">Nama Lengkap</Label><Input id="full_name" placeholder="Masukkan nama lengkap" {...reg('full_name')} className="mt-1.5" />{errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}</div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="nama@email.com" {...reg('email')} className="mt-1.5" />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}</div>
            <div><Label htmlFor="phone">Nomor HP</Label><Input id="phone" placeholder="08xxxxxxxxxx" {...reg('phone')} className="mt-1.5" />{errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}</div>
            <div><Label htmlFor="password">Password</Label><div className="relative mt-1.5"><Input id="password" type={showPw?'text':'password'} placeholder="Minimal 6 karakter" {...reg('password')} /><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}</div>
            <div><Label htmlFor="confirmPassword">Konfirmasi Password</Label><div className="relative mt-1.5"><Input id="confirmPassword" type={showCf?'text':'password'} placeholder="Ulangi password" {...reg('confirmPassword')} /><button type="button" onClick={()=>setShowCf(!showCf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showCf?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>{errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}</div>
            <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white mt-2" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin mr-2" size={16}/> Mendaftar...</> : 'Daftar'}</Button>
          </form>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">Sudah punya akun? <Link href="/login" className="text-brand-500 font-semibold">Masuk</Link></p>
        </div>
      </div>
    </div>
  )
}

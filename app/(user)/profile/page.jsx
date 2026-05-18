'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Phone, User } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile, loading, signOut } = useUser()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: user?.email || '',
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      toast.success('Profil berhasil diperbarui')
      setIsEditing(false)
    } catch (err) {
      toast.error('Gagal memperbarui profil')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    toast.success('Berhasil logout')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        Profil Saya
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 space-y-8">
        {/* Profile Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Data Diri
          </h2>

          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <Label htmlFor="full_name" className="flex items-center gap-2 mb-2">
                <User size={16} />
                Nama Lengkap
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="mt-1.5"
                />
              ) : (
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  {profile?.full_name || '-'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail size={16} />
                Email
              </Label>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                {user?.email || '-'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Email tidak dapat diubah. Hubungi support jika perlu perubahan.
              </p>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                <Phone size={16} />
                Nomor HP
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="08xxxxxxxxxx"
                  className="mt-1.5"
                />
              ) : (
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  {profile?.phone || '-'}
                </p>
              )}
            </div>
          </div>

          {/* Edit Buttons */}
          <div className="mt-8 flex gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                Edit Profil
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      full_name: profile?.full_name || '',
                      phone: profile?.phone || '',
                      email: user?.email || '',
                    })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
          <h3 className="text-lg font-semibold text-red-600 mb-4">
            Zona Berbahaya
          </h3>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            Logout
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Anda akan keluar dari akun ini dan kembali ke halaman login.
          </p>
        </div>
      </div>
    </div>
  )
}

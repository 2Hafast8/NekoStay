'use client'

import { CLASS_DETAILS } from '@/lib/constants'
import { formatRupiah } from '@/lib/utils/format'
import { Check, Home, Star, Crown } from 'lucide-react'

export function ClassSelector({ value, onChange }) {
  const classes = Object.values(CLASS_DETAILS)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {classes.map((cls) => {
        const isSelected = value === cls.name
        return (
          <button
            key={cls.name}
            type="button"
            onClick={() => onChange(cls.name)}
            className={`relative text-left rounded-xl p-5 border-2 transition-all duration-200 ${
              isSelected
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-slate-800/50'
            }`}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}

            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              {cls.name === 'Basic' && <Home className="w-5 h-5" />}
              {cls.name === 'Standard' && <Star className="w-5 h-5" />}
              {cls.name === 'Premium' && <Crown className="w-5 h-5" />}
            </div>
            <h4 className={`font-bold text-lg mb-1 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
              {cls.name}
            </h4>
            <div className="mb-3">
              <span className="text-xl font-extrabold text-brand-500">{formatRupiah(cls.price)}</span>
              <span className="text-slate-500 text-sm">/hari</span>
            </div>

            <ul className="space-y-1.5">
              {cls.facilities.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        )
      })}
    </div>
  )
}

# DESIGN.md — NekoStay UI/UX Design System

> Panduan desain visual lengkap untuk project NekoStay.
> Semua keputusan warna, tipografi, komponen, dan layout halaman ada di sini.
> Gunakan file ini sebagai referensi tunggal (single source of truth) untuk tampilan UI.
> Contoh kode di dokumen ini menggunakan **JavaScript** (`.js` / `.jsx`).

---

## DAFTAR ISI

1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout Grid](#4-spacing--layout-grid)
5. [Component Design Tokens](#5-component-design-tokens)
6. [Komponen UI — Spesifikasi](#6-komponen-ui--spesifikasi)
7. [Layout Wireframe — Setiap Halaman](#7-layout-wireframe--setiap-halaman)
8. [Responsive Behavior](#8-responsive-behavior)
9. [Iconography](#9-iconography)
10. [Motion & Animasi](#10-motion--animasi)
11. [State Visual](#11-state-visual)
12. [Dark Mode](#12-dark-mode)

---

## 1. DESIGN PRINCIPLES

NekoStay dirancang dengan 4 prinsip utama:

### Warm & Friendly
Kucing adalah hewan kesayangan. Desain harus terasa hangat, menyenangkan, dan memberi rasa aman bahwa peliharaan mereka dirawat dengan baik. Hindari tampilan terlalu kaku atau korporat.

### Clear & Transparent
Pemilik kucing perlu tahu status pesanan dan kondisi hewan mereka kapan saja. Informasi status, laporan, dan biaya harus mudah dibaca sekilas tanpa interpretasi.

### Efisien & Minimal Klik
Proses dari "buka website" sampai "pesanan terkirim" harus bisa diselesaikan dalam waktu singkat. Kurangi langkah yang tidak perlu.

### Mobile-First
Mayoritas user mengakses dari smartphone. Semua UI dirancang untuk layar kecil terlebih dahulu, kemudian ditingkatkan untuk desktop.

---

## 2. COLOR SYSTEM

### Brand Colors (Tailwind Custom)

```css
/* tailwind.config.js */
colors: {
  brand: {
    50:  '#fff7ed',   /* background sangat terang */
    100: '#ffedd5',   /* background card ringan   */
    200: '#fed7aa',   /* border, divider           */
    300: '#fdba74',   /* hover state               */
    400: '#fb923c',   /* secondary accent          */
    500: '#f97316',   /* PRIMARY — brand utama     */
    600: '#ea6c0d',   /* primary hover             */
    700: '#c2570a',   /* primary pressed           */
    800: '#9a4009',   /* teks di atas bg terang    */
    900: '#7c3300',   /* teks dark                 */
  }
}
```

### Semantic Colors

| Token | Hex | Tailwind Class | Penggunaan |
|---|---|---|---|
| **Primary** | `#f97316` | `brand-500` | CTA button, link aktif, aksen utama |
| **Primary Hover** | `#ea6c0d` | `brand-600` | Hover state button primary |
| **Background** | `#ffffff` | `white` | Background halaman utama |
| **Surface** | `#f8fafc` | `slate-50` | Card, sidebar, panel |
| **Border** | `#e2e8f0` | `slate-200` | Garis batas card, input |
| **Text Primary** | `#0f172a` | `slate-900` | Judul, teks utama |
| **Text Secondary** | `#475569` | `slate-600` | Deskripsi, label |
| **Text Muted** | `#94a3b8` | `slate-400` | Placeholder, hint |
| **Success** | `#22c55e` | `green-500` | Status Sehat, Sukses |
| **Warning** | `#f59e0b` | `amber-500` | Status Kurang Fit, Peringatan |
| **Danger** | `#ef4444` | `red-500` | Status kritis, Error, Cancel |
| **Info** | `#3b82f6` | `blue-500` | Info, notifikasi umum |

### Status Pesanan — Warna Badge

```
Menunggu   → bg: amber-100   text: amber-700   border: amber-200
Aktif      → bg: green-100   text: green-700   border: green-200
Selesai    → bg: slate-100   text: slate-600   border: slate-200
Dibatalkan → bg: red-100     text: red-700     border: red-200
```

### Status Kesehatan Kucing — Warna Badge

```
Sehat            → bg: green-100  text: green-700
Kurang Fit       → bg: amber-100  text: amber-700
Perlu Perhatian  → bg: red-100    text: red-700
```

---

## 3. TYPOGRAPHY

### Font Family

```javascript
// app/layout.jsx — next/font/google
import { Inter, Nunito } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

// Heading & brand name  → Nunito (rounded, friendly)
// Body & UI text        → Inter (clean, readable)
```

### Type Scale

| Token | Size | Weight | Penggunaan |
|---|---|---|---|
| `text-xs` | 12px | 400 | Label kecil, hint, timestamp |
| `text-sm` | 14px | 400–500 | Body kecil, label form, badge |
| `text-base` | 16px | 400 | Body utama, paragraf |
| `text-lg` | 18px | 500–600 | Sub-heading, card title |
| `text-xl` | 20px | 600 | Section heading |
| `text-2xl` | 24px | 700 | Page title (mobile) |
| `text-3xl` | 30px | 700 | Page title (desktop) |
| `text-4xl` | 36px | 800 | Hero heading |

### Aturan Typography

```
Heading halaman     : font-nunito font-bold text-2xl md:text-3xl text-slate-900
Sub-heading section : font-semibold text-xl text-slate-800
Label form          : font-medium text-sm text-slate-700
Body teks           : text-base text-slate-600 leading-relaxed
Harga / angka       : font-bold text-brand-500 atau text-slate-900
Muted / hint        : text-sm text-slate-400
```

---

## 4. SPACING & LAYOUT GRID

### Spacing Scale

```
4px  → p-1  m-1   elemen sangat rapat
8px  → p-2  m-2   elemen rapat
12px → p-3        jarak kecil antar elemen
16px → p-4        padding card kecil
20px → p-5        padding card standar
24px → p-6        padding card besar / section
32px → p-8        jarak antar section
48px → py-12      padding halaman
64px → py-16      hero section
```

### Layout Containers

```tsx
/* Wrapper utama setiap halaman */
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

/* Form & halaman auth */
<div className="max-w-md mx-auto px-4 py-8">

/* Detail pesanan, artikel */
<div className="max-w-2xl mx-auto px-4 py-8">

/* Dashboard dengan sidebar */
<div className="max-w-screen-xl mx-auto">
```

### Grid System

```tsx
/* Card grid dashboard user */
<div className="grid grid-cols-1 gap-4">

/* Stats cards admin */
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

/* Detail + sidebar */
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2"> {/* konten utama */} </div>
  <div> {/* sidebar info */} </div>
</div>

/* 3 kelas selector */
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

---

## 5. COMPONENT DESIGN TOKENS

### Button Variants

```tsx
/* PRIMARY — aksi utama */
"bg-brand-500 hover:bg-brand-600 text-white font-semibold
 px-6 py-2.5 rounded-lg transition-colors duration-150
 disabled:opacity-50 disabled:cursor-not-allowed"

/* SECONDARY — aksi sekunder */
"border border-brand-500 text-brand-500 hover:bg-brand-50
 font-semibold px-6 py-2.5 rounded-lg transition-colors duration-150"

/* GHOST — navigasi, aksi tersier */
"text-slate-600 hover:text-slate-900 hover:bg-slate-100
 px-4 py-2 rounded-lg transition-colors duration-150"

/* DANGER — cancel, hapus */
"bg-red-500 hover:bg-red-600 text-white font-semibold
 px-6 py-2.5 rounded-lg transition-colors duration-150"

/* SIZE VARIANTS */
sm  : "px-3 py-1.5 text-sm rounded-md"
md  : "px-6 py-2.5 text-base rounded-lg"    (default)
lg  : "px-8 py-3 text-lg rounded-lg"
full: "w-full px-6 py-3 text-base rounded-lg"
```

### Input Fields

```tsx
/* Input standar */
"w-full border border-slate-200 rounded-lg px-3 py-2.5
 text-sm text-slate-900 placeholder:text-slate-400
 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
 disabled:bg-slate-50 disabled:cursor-not-allowed
 transition-shadow duration-150"

/* Input error state */
"... border-red-400 focus:ring-red-400 focus:border-red-400"

/* Label */
"block text-sm font-medium text-slate-700 mb-1.5"

/* Error message */
"text-xs text-red-500 mt-1"

/* Helper / hint text */
"text-xs text-slate-400 mt-1"
```

### Card Variants

```tsx
/* Card standar */
"bg-white border border-slate-200 rounded-xl p-5 shadow-sm
 hover:shadow-md transition-shadow duration-200"

/* Card terpilih / aktif */
"bg-white border-2 border-brand-500 rounded-xl p-5 shadow-sm"

/* Card section dalam halaman */
"bg-white border border-slate-200 rounded-xl overflow-hidden"

/* Card header */
"px-5 py-4 border-b border-slate-100 flex items-center justify-between"

/* Card body */
"p-5"
```

### Sidebar (Admin)

```tsx
/* Sidebar wrapper */
"w-64 min-h-screen bg-slate-900 text-white flex flex-col"

/* Nav item aktif */
"flex items-center gap-3 px-4 py-2.5 rounded-lg
 bg-brand-500 text-white font-medium text-sm"

/* Nav item default */
"flex items-center gap-3 px-4 py-2.5 rounded-lg
 text-slate-400 hover:text-white hover:bg-slate-800
 font-medium text-sm transition-colors duration-150"

/* Logo area */
"px-4 py-6 border-b border-slate-800"
```

---

## 6. KOMPONEN UI — SPESIFIKASI

### 6.1 Booking Card (User Dashboard)

```
┌─────────────────────────────────────────────┐
│ ▌  🐱 [foto]  Nama Kucing      [● AKTIF]   │
│ ▌             Class: Standard               │
│ ▌             📅 15 Jan → 20 Jan (5 hari)  │
│ ▌             💰 Estimasi: Rp 400.000       │
│ ▌                             [Lihat →]    │
└─────────────────────────────────────────────┘

Warna garis kiri (border-l-4):
  Menunggu   → border-l-amber-400
  Aktif      → border-l-green-400
  Selesai    → border-l-slate-300
  Dibatalkan → border-l-red-400  opacity-60
```

### 6.2 Class Selector Card

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   BASIC      │  │  STANDARD  ✓ │  │  PREMIUM     │
│              │  │ (terpilih)   │  │              │
│  Rp 50.000   │  │  Rp 80.000   │  │  Rp 130.000  │
│  /hari       │  │  /hari       │  │  /hari       │
│              │  │              │  │              │
│ • Kandang    │  │ • Kandang    │  │ • Ruang      │
│   standar    │  │   luas       │  │   privat     │
│ • Makan 2x   │  │ • Makan 3x   │  │ • Makan      │
│ • Air minum  │  │ • Mainan     │  │   teratur    │
│              │  │              │  │ • Grooming   │
└──────────────┘  └──────────────┘  └──────────────┘

Default   : border border-slate-200 hover:border-brand-300
Terpilih  : border-2 border-brand-500 bg-brand-50
```

### 6.3 Price Preview Box

```
┌─────────────────────────────────────────┐
│  Ringkasan Biaya                        │
│  ─────────────────────────────────────  │
│  Kelas          Standard                │
│  Harga/hari     Rp 80.000               │
│  Durasi         5 hari                  │
│  ─────────────────────────────────────  │
│  Total Estimasi     Rp 400.000          │
│                     ↑ bold + brand-500  │
│  ─────────────────────────────────────  │
│  ⓘ Pembayaran dilakukan saat            │
│    pengantaran kucing                   │
└─────────────────────────────────────────┘
bg-brand-50  border border-brand-200  rounded-xl
```

### 6.4 Status Timeline

```
  ●  Pesanan Dibuat        15 Jan 2025, 10:30
  │
  ●  Dikonfirmasi Admin    15 Jan 2025, 11:00
  │
  ⊙  Kucing Sedang Dititip  ← pulse animation
  │
  ○  Selesai               —

Warna dot aktif  : brand-500
Warna dot done   : green-500
Warna dot pending: slate-300
Garis penghubung : slate-200, lebar 2px
```

### 6.5 Cat Report Card

```
┌──────────────────────────────────────────┐
│  17 Jan 2025                    [Sehat ●] │
│  ─────────────────────────────────────    │
│  [foto kucing 80×80  ]   Kondisi baik,   │
│                          Mochi aktif      │
│                          bermain hari ini │
└──────────────────────────────────────────┘
border-l-4 sesuai status kesehatan
```

### 6.6 Admin Stats Card

```
┌──────────────┐  ┌──────────────┐
│  Total       │  │  Aktif       │
│     24       │  │     8        │
│  Pesanan     │  │  Pesanan     │
│  (slate)     │  │  (green)     │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│  Menunggu    │  │  Selesai     │
│     3        │  │     12       │
│  Pesanan     │  │  Pesanan     │
│  (amber)     │  │  (slate)     │
└──────────────┘  └──────────────┘
```

### 6.7 Notification Bell

```
Navbar: [🔔]  → jika ada unread: [🔔] + badge merah kecil

Dropdown (klik):
┌──────────────────────────────┐
│  Notifikasi            [✓✓]  │
│  ──────────────────────────  │
│  ● Pesanan dikonfirmasi  2m  │  ← bg-brand-50 (unread)
│    Koko telah aktif dititip  │
│  ──────────────────────────  │
│  ○ Laporan baru masuk   1j   │  ← bg-white (read)
│    Kondisi Mochi: Sehat      │
│  ──────────────────────────  │
│    Lihat Semua Notifikasi    │
└──────────────────────────────┘
```

---

## 7. LAYOUT WIREFRAME — SETIAP HALAMAN

### 7.1 Halaman Login (`/login`)

```
┌──────────────────────────────────────┐
│  bg-brand-50 (full page)             │
│                                      │
│          🐱 NekoStay                 │
│    Penitipan Kucing Terpercaya       │
│                                      │
│  ┌────────────────────────────────┐  │
│  │          Masuk Akun            │  │
│  │  ───────────────────────────   │  │
│  │  Email                         │  │
│  │  [___________________________] │  │
│  │                                │  │
│  │  Password              [👁]    │  │
│  │  [___________________________] │  │
│  │  Lupa Password?                │  │
│  │                                │  │
│  │  [        Masuk        ]       │  │
│  │         (full width)           │  │
│  │                                │  │
│  │  ─────────── atau ───────────  │  │
│  │                                │  │
│  │  Belum punya akun? [Daftar]    │  │
│  └────────────────────────────────┘  │
│  Card: bg-white shadow-lg rounded-2xl│
└──────────────────────────────────────┘
```

### 7.2 Halaman Register (`/register`)

```
┌──────────────────────────────────────┐
│  bg-brand-50 (full page)             │
│          🐱 NekoStay                 │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Buat Akun Baru         │  │
│  │  ───────────────────────────   │  │
│  │  Nama Lengkap                  │  │
│  │  [___________________________] │  │
│  │  Email                         │  │
│  │  [___________________________] │  │
│  │  Nomor HP                      │  │
│  │  [___________________________] │  │
│  │  Password              [👁]    │  │
│  │  [___________________________] │  │
│  │  Konfirmasi Password   [👁]    │  │
│  │  [___________________________] │  │
│  │                                │  │
│  │  [        Daftar       ]       │  │
│  │                                │  │
│  │  Sudah punya akun? [Masuk]     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 7.3 Dashboard User (`/dashboard`)

```
MOBILE:
┌────────────────────────────┐
│ 🐱 NekoStay        [🔔][👤]│  ← navbar
├────────────────────────────┤
│                            │
│  Hai, Budi 👋              │
│  [+ Buat Pesanan Baru]     │  ← full width, brand-500
│                            │
│  [Semua][Aktif][Menunggu]  │  ← filter tabs
│                            │
│  ┌────────────────────────┐│
│  │▌ 🐱 Koko    [● AKTIF] ││  ← border-l-green
│  │▌ Premium · 5 hari     ││
│  │▌ Rp 650.000 [Lihat →] ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │▌ 🐱 Mochi  [⏳TUNGGU]  ││  ← border-l-amber
│  │▌ Standard · 4 hari    ││
│  │▌ Rp 320.000 [Lihat →] ││
│  └────────────────────────┘│
│                            │
├──────┬──────┬──────┬───────┤
│  🏠  │  📦  │  🔔  │   👤  │  ← bottom tab bar
└──────┴──────┴──────┴───────┘

DESKTOP (tambahan di atas mobile):
- Greeting lebih besar
- Card pesanan max-w-2xl centered
```

### 7.4 Form Pemesanan Multi-Step (`/booking/new`)

```
STEP INDICATOR (sticky):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [1 Data Kucing] ─── [2 Pemesanan] ─── [3 Review]
       ●aktif              ○                  ○
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — DATA KUCING:
┌────────────────────────────────────┐
│  Data Kucing                       │
│  ─────────────────────────────     │
│  Nama Kucing *                     │
│  [______________________________]  │
│                                    │
│  Gender *                          │
│  (●) Jantan    ( ) Betina          │
│                                    │
│  Usia *   [___] (contoh: 2 tahun)  │
│                                    │
│  Status Kesehatan *  [Sehat ▼]     │
│                                    │
│  Makanan Kesukaan                  │
│  [______________________________]  │
│                                    │
│  [jika betina tampil:]             │
│  [✓] Sedang Hamil                  │
│                                    │
│  Catatan Tambahan                  │
│  [______________________________]  │
│  [______________________________]  │
│                                    │
│  Foto Kucing                       │
│  ┌─────────────┐                   │
│  │  + Upload   │  JPG/PNG ≤ 2MB   │
│  └─────────────┘                   │
│                                    │
│              [Selanjutnya →]       │
└────────────────────────────────────┘

STEP 2 — DATA PEMESANAN:
┌────────────────────────────────────┐
│  Detail Pemesanan                  │
│  ─────────────────────────────     │
│  Pilih Kelas *                     │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ BASIC  │ │STD  ✓  │ │PREMIUM │  │
│  │ 50rb/h │ │ 80rb/h │ │130rb/h │  │
│  └────────┘ └────────┘ └────────┘  │
│                                    │
│  Tgl Masuk *    [15/01/2025 📅]    │
│  Tgl Keluar *   [20/01/2025 📅]    │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Ringkasan Biaya              │  │
│  │ Durasi  : 5 hari             │  │
│  │ Harga   : Rp 80.000/hari     │  │
│  │ Total   : Rp 400.000         │  │
│  └──────────────────────────────┘  │
│                                    │
│  [← Kembali]     [Selanjutnya →]   │
└────────────────────────────────────┘

STEP 3 — REVIEW:
┌────────────────────────────────────┐
│  Review & Konfirmasi               │
│  ─────────────────────────────     │
│  [foto]  Koko · Jantan · 2 thn     │
│          Sehat · Whiskas           │
│                                    │
│  Standard  · 15–20 Jan · 5 hari    │
│  Total: Rp 400.000                 │
│                                    │
│  ⓘ Bayar saat pengantaran          │
│                                    │
│  [← Kembali]   [Kirim Pesanan ✓]   │
└────────────────────────────────────┘
```

### 7.5 Detail Pesanan User (`/booking/[id]`)

```
┌────────────────────────────────────────────────┐
│ ← Kembali ke Dashboard                        │
│                                                │
│ Pesanan Koko              [● AKTIF]            │
│ Dibuat 15 Jan 2025                             │
│                                                │
│ ┌──────────────────────┐ ┌──────────────────┐  │
│ │  DATA KUCING         │ │  PEMESANAN       │  │
│ │  ─────────────────   │ │  ────────────    │  │
│ │  [foto kucing]       │ │  Kelas: Std      │  │
│ │  Nama   : Koko       │ │  Masuk: 15 Jan   │  │
│ │  Gender : Jantan     │ │  Keluar: 20 Jan  │  │
│ │  Usia   : 2 tahun    │ │  Durasi: 5 hari  │  │
│ │  Kes    : Sehat      │ │  Total: Rp 400k  │  │
│ │  Makan  : Whiskas    │ │                  │  │
│ └──────────────────────┘ └──────────────────┘  │
│                                                │
│ ── STATUS TIMELINE ─────────────────────────   │
│  ● Dibuat          15 Jan, 10:30               │
│  ● Dikonfirmasi    15 Jan, 11:00               │
│  ⊙ Aktif (sekarang) — pulse                   │
│  ○ Selesai         —                           │
│                                                │
│ ── LAPORAN KONDISI ─────────────────────────   │
│ ┌──────────────────────────────────────────┐   │
│ │  17 Jan 2025               [✅ Sehat]    │   │
│ │  [foto]  Koko aktif dan nafsu makan baik │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │  15 Jan 2025               [✅ Sehat]    │   │
│ │  [foto]  Beradaptasi dengan baik         │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ── PERPANJANGAN / GANTI CLASS ───────────────  │
│ ┌──────────────────────────────────────────┐   │
│ │  Hubungi Admin via WhatsApp              │   │
│ │  Sertakan nama kucing: Koko              │   │
│ │  [Buka WhatsApp Admin]                   │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│           [Batalkan Pesanan]                   │
│            ↑ ghost danger, hanya jika         │
│              status Menunggu / Aktif           │
└────────────────────────────────────────────────┘
```

### 7.6 Admin Dashboard (`/admin/dashboard`)

```
┌─────────────┬──────────────────────────────────────┐
│  SIDEBAR    │  Dashboard Admin                      │
│  ─────────  │  ─────────────────────────────────    │
│  Dashboard  │                                       │
│  Pesanan    │  STATISTIK                            │
│  Laporan    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  Setting    │  │ 24   │ │  8   │ │  3   │ │  13  │ │
│  ─────────  │  │Total │ │Aktif │ │Tunggu│ │Selesai│ │
│  [👤 Admin] │  └──────┘ └──────┘ └──────┘ └──────┘ │
│  [Logout]   │                                       │
│             │  GRAFIK MINGGUAN (LineChart)           │
│             │  ┌─────────────────────────────────┐  │
│             │  │  8 ┤          ╭───╮              │  │
│             │  │  6 ┤     ╭───╯   ╰─╮            │  │
│             │  │  4 ┤ ╭───╯         ╰──          │  │
│             │  │  2 ┤─╯                           │  │
│             │  └───┬───┬───┬───┬───┬───┬──        │  │
│             │  Sen Sel Rab Kam Jum Sab Min         │  │
│             │  └─────────────────────────────────┘  │
│             │                                       │
│             │  PERLU DIPROSES (3)                   │
│             │  ┌─────────────────────────────────┐  │
│             │  │ Koko · Std · 15–20 Jan  [✓] [✗] │  │
│             │  │ Luna · Basic· 16–18 Jan [✓] [✗] │  │
│             │  └─────────────────────────────────┘  │
│             │                                       │
│             │  PERINGATAN TERLAMBAT (1)             │
│             │  ⚠ Mochi — 2 hari terlambat           │
└─────────────┴──────────────────────────────────────┘
```

### 7.7 Admin — List Pesanan (`/admin/bookings`)

```
┌─────────────┬──────────────────────────────────────┐
│  SIDEBAR    │  Manajemen Pesanan                    │
│             │  ─────────────────────────────────    │
│             │  [🔍 Cari nama kucing / user...]       │
│             │                                       │
│             │  Tab: [Semua] [Menunggu] [Aktif]       │
│             │       [Selesai] [Dibatalkan]           │
│             │                                       │
│             │  ┌────┬──────┬─────┬───────┬──────┐   │
│             │  │Kucing│Class│Masuk│Status │ Aksi │   │
│             │  ├────┼──────┼─────┼───────┼──────┤   │
│             │  │Koko │ Std │15Jan│●Aktif │ [→]  │   │
│             │  │Mochi│Basic│14Jan│⚠Lambat│ [→]  │   │
│             │  │Luna │Prem │18Jan│⏳Tunggu│[✓][✗]│   │
│             │  │Puffy│ Std │ 5Jan│🏁Selesai│[→]  │   │
│             │  └────┴──────┴─────┴───────┴──────┘   │
│             │                                       │
│             │  Hal 1 dari 3   [< 1  2  3 >]         │
└─────────────┴──────────────────────────────────────┘
```

### 7.8 Admin — Detail Pesanan (`/admin/bookings/[id]`)

```
┌─────────────┬──────────────────────────────────────┐
│  SIDEBAR    │ ← Kembali                             │
│             │                                       │
│             │ Koko — Budi Santoso    [● AKTIF]      │
│             │                                       │
│             │ ┌─────────────┐ ┌────────────────┐    │
│             │ │ DATA KUCING │ │ DATA PEMESANAN │    │
│             │ │ ─────────── │ │ ────────────   │    │
│             │ │ [foto]      │ │ Standard       │    │
│             │ │ Koko        │ │ 15–20 Jan      │    │
│             │ │ Jantan      │ │ 5 hari         │    │
│             │ │ 2 tahun     │ │ Rp 400.000     │    │
│             │ │ Sehat       │ │                │    │
│             │ │ Whiskas     │ │ Email: budi@.. │    │
│             │ └─────────────┘ │ HP: 0812...    │    │
│             │                 └────────────────┘    │
│             │                                       │
│             │ ── KELOLA PESANAN ───────────────      │
│             │ ┌────────────────────────────────┐    │
│             │ │ [✅ Tandai Selesai]             │    │
│             │ │ [❌ Batalkan Pesanan]            │    │
│             │ └────────────────────────────────┘    │
│             │                                       │
│             │ ── EDIT DATA (dari request user) ──    │
│             │ Tgl Keluar : [20/01/2025 📅]          │
│             │ Kelas      : [Standard ▼]             │
│             │ [Simpan Perubahan]                    │
│             │                                       │
│             │ ── LAPORAN KONDISI ──────────────      │
│             │ [+ Kirim Laporan Baru]                │
│             │ 📋 17 Jan · Sehat  [lihat]            │
│             │ 📋 15 Jan · Sehat  [lihat]            │
└─────────────┴──────────────────────────────────────┘
```

### 7.9 Form Laporan Kucing (Modal / Halaman)

```
┌────────────────────────────────────────┐
│  Kirim Laporan Kondisi Kucing          │
│  Kucing: Koko                          │
│  ───────────────────────────────────   │
│  Status Kesehatan *                    │
│  (●) Sehat                             │
│  ( ) Kurang Fit                        │
│  ( ) Perlu Perhatian                   │
│                                        │
│  Foto Kucing *                         │
│  ┌─────────────┐                       │
│  │  + Upload   │  JPG/PNG ≤ 2MB        │
│  └─────────────┘                       │
│                                        │
│  Catatan (opsional)                    │
│  [____________________________________]│
│  [____________________________________]│
│                                        │
│  [Batal]          [Kirim Laporan]      │
└────────────────────────────────────────┘
```

---

## 8. RESPONSIVE BEHAVIOR

### Breakpoints

```
Default (mobile) : < 640px
sm               : ≥ 640px   (tablet landscape / large phone)
md               : ≥ 768px   (tablet)
lg               : ≥ 1024px  (laptop)
xl               : ≥ 1280px  (desktop)
```

### Behavior Per Komponen

| Komponen | Mobile | Desktop |
|---|---|---|
| Navbar | Logo + hamburger | Full horizontal |
| Sidebar Admin | Hidden, toggle hamburger | Fixed left 64px (w-16) collapsed / w-64 expanded |
| Bottom Tab Bar | Visible (user only) | Hidden |
| Booking Card | Full width | Max 720px, centered |
| Class Selector | Vertikal (stacked) | 3 kolom horizontal |
| Form fields | 1 kolom | 2 kolom (md ke atas) |
| Stats Cards | 2×2 grid | 4 kolom satu baris |
| Table Pesanan | Scroll horizontal | Full display |
| Detail Pesanan | Stacked | 2 kolom (lg:col-span-2 + sidebar) |

### Mobile Navigation

```
User — Bottom Tab Bar (fixed bottom):
┌────────┬────────┬────────┬────────┐
│  🏠    │  📦    │  🔔    │   👤   │
│ Beranda│ Pesanan│ Notif  │ Profil │
└────────┴────────┴────────┴────────┘

Admin — Top Navbar + Hamburger → Drawer dari kiri
```

---

## 9. ICONOGRAPHY

Gunakan **Lucide React** secara konsisten.

```tsx
import {
  // Navigasi & Layout
  Home, Package, Bell, User, Settings, LogOut,
  Menu, X, ChevronRight, ChevronDown, ArrowLeft,

  // Status & Feedback
  Clock, CheckCircle, XCircle, AlertTriangle,
  Info, CheckCheck,

  // Aksi
  Plus, Pencil, Trash2, Eye, EyeOff, Send,
  Upload, Download, ExternalLink, RefreshCw,

  // Konten NekoStay
  Cat, Calendar, DollarSign, FileText,
  Image, Phone, Mail, MessageCircle,
  Activity, Clipboard, Star,

  // UI Utilities
  Search, Filter, MoreVertical, Loader2,
  Moon, Sun,
} from 'lucide-react'
```

### Icon Size Standard

```
12px → size={12}  label/chip kecil
14px → size={14}  tombol kecil
16px → size={16}  default UI icon  ← paling sering
20px → size={20}  navigasi, CTA button
24px → size={24}  heading section
48px → size={48}  ilustrasi empty state
```

---

## 10. MOTION & ANIMASI

### Prinsip: Subtle & Fungsional

Animasi membantu user memahami perubahan state, bukan sekadar dekoratif. Durasi singkat agar tidak terasa lambat.

### Durasi Standar

```
duration-100 : micro feedback (checkbox toggle)
duration-150 : hover button, link color
duration-200 : hover shadow, icon rotate
duration-300 : panel expand, step transition
duration-500 : page transition, modal open
```

### Animasi yang Dipakai di Project

```tsx
// Hover button
"transition-colors duration-150"

// Card hover shadow
"transition-shadow duration-200"

// Loading spinner (submit button)
<Loader2 className="animate-spin" size={16} />

// Skeleton loading
"animate-pulse bg-slate-200 rounded"

// Badge unread notification
"animate-pulse"  // pada dot indicator

// Modal (shadcn Dialog — built-in)
// fade + scale, sudah ada otomatis

// Toast (shadcn Toaster — built-in)
// slide-in dari bawah/kanan

// Form step transition
"transition-all duration-300 ease-in-out"
```

---

## 11. STATE VISUAL

### Empty State

```
┌──────────────────────────────────┐
│                                  │
│         🐱                       │
│         (icon Cat, size 48)      │
│                                  │
│    Belum ada pesanan             │
│  Mulai dengan membuat pesanan    │
│  pertama untuk kucing Anda.      │
│                                  │
│     [+ Buat Pesanan Baru]        │
└──────────────────────────────────┘
text-slate-400, icon stroke-slate-300
```

### Loading Skeleton

```tsx
// BookingCard skeleton
<div className="border rounded-xl p-5 space-y-3 animate-pulse">
  <div className="flex justify-between items-start">
    <div className="space-y-2">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
  </div>
  <Skeleton className="h-4 w-36" />
  <div className="flex justify-between">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="h-8 w-24 rounded-lg" />
  </div>
</div>
```

### Error State

```
┌──────────────────────────────────┐
│         ⚠️                       │
│    Gagal memuat data             │
│  Periksa koneksi internet Anda   │
│                                  │
│       [Coba Lagi]                │
└──────────────────────────────────┘
text-slate-500, icon text-amber-500
```

### Success Toast

```
╔══════════════════════════════════╗
║ ✅  Pesanan berhasil dibuat!      ║  pojok kanan bawah
╚══════════════════════════════════╝
durasi tampil: 3 detik
```

### Confirmation Dialog (Destructive)

```
┌────────────────────────────────────┐
│  ⚠️  Batalkan Pesanan?             │
│  ──────────────────────────────    │
│  Tindakan ini tidak dapat          │
│  dibatalkan.                       │
│                                    │
│  Alasan Pembatalan *               │
│  [________________________________]│
│                                    │
│  [Tidak, Kembali]  [Ya, Batalkan]  │
│       (outline)     (destructive)  │
└────────────────────────────────────┘
```

---

## 12. DARK MODE

### Setup

```ts
// tailwind.config.js
darkMode: 'class'

// Install: npm install next-themes
```

```tsx
// app/layout.jsx — wrap dengan ThemeProvider
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Dark Mode Tokens

```
Background      : dark:bg-slate-950
Surface / Card  : dark:bg-slate-900
Border          : dark:border-slate-800
Text Primary    : dark:text-slate-100
Text Secondary  : dark:text-slate-400
Sidebar         : dark:bg-slate-900 (sama — sudah gelap)
Brand Primary   : brand-500 tetap #f97316 (kontras baik di gelap)
Input bg        : dark:bg-slate-800 dark:border-slate-700
```

### Toggle Component

```tsx
// components/layout/ThemeToggle.jsx
'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800
                 transition-colors duration-150"
    >
      {theme === 'dark'
        ? <Sun size={16} className="text-amber-400" />
        : <Moon size={16} className="text-slate-600" />
      }
    </button>
  )
}
```

---

## QUICK REFERENCE — DESIGN TOKENS

```
WARNA
Brand Primary    : #f97316  (brand-500)
Brand Hover      : #ea6c0d  (brand-600)
Background       : #ffffff
Surface          : #f8fafc  (slate-50)
Border           : #e2e8f0  (slate-200)
Text Primary     : #0f172a  (slate-900)
Text Secondary   : #475569  (slate-600)
Text Muted       : #94a3b8  (slate-400)
Success          : #22c55e  (green-500)
Warning          : #f59e0b  (amber-500)
Danger           : #ef4444  (red-500)

FONT
Heading          : Nunito, bold 700–800
Body             : Inter, regular 400 / medium 500

RADIUS
Input & Button   : rounded-lg  (8px)
Card kecil       : rounded-xl  (12px)
Card besar/Modal : rounded-2xl (16px)

SHADOW
Default          : shadow-sm
Hover            : shadow-md
Modal            : shadow-xl

TRANSITION
Hover color      : duration-150
Hover shadow     : duration-200
Panel/Step       : duration-300
```

---

*Design system ini adalah dokumen hidup. Update setiap kali ada keputusan visual baru.*
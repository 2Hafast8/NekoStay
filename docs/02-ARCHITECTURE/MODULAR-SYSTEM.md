# 🏛️ Panduan Sistem Arsitektur Modular NekoStay (Pola NestJS)

> Dokumen pedoman pengembangan sistem modular untuk platform **NekoStay**. Mengadopsi prinsip pemisahan tanggung jawab (*Separation of Concerns*) bergaya **NestJS** ke dalam Next.js App Router.

---

## 🎯 Konsep Utama

Struktur kode NekoStay dipecah ke dalam lapisan domain yang independen dan mudah diuji:

```text
HTTP Request (Client)
       │
       ▼
1. Controller (app/api/.../route.js)
   - Hanya menerima request, validasi DTO, memanggil Service, & mengirim Response.
       │
       ▼
2. DTO & Validation (lib/modules/<domain>/<domain>.dto.js)
   - Skema Zod untuk sanitasi input sebelum menyentuh logika bisnis.
       │
       ▼
3. Domain Service (lib/modules/<domain>/<domain>.service.js)
   - Mengatur aturan bisnis (business rules), alur kerja, transaksi, & orkestrasi notifikasi.
       │
       ▼
4. Repository (lib/modules/<domain>/<domain>.repository.js)
   - Mengenkapsulasi interaksi langsung dengan Supabase PostgreSQL.
       │
       ▼
Database (Supabase Tables)
```

---

## 📁 Struktur Direktori Modul (`lib/modules/`)

Setiap domain bisnis ditempatkan pada folder masing-masing di bawah `lib/modules/`:

```text
lib/modules/
├── bookings/
│   ├── bookings.dto.js         # Skema validasi Zod & tipe DTO
│   ├── bookings.repository.js  # Operasi query database tabel bookings
│   ├── bookings.service.js     # Logika alur status, konfirmasi, pembatalan
│   └── index.js                # Barrel export
│
├── payments/
│   ├── midtrans.client.js      # Client SDK Midtrans Snap & REST API
│   ├── payments.dto.js         # Mapping status transaksi & skema validasi
│   ├── payments.repository.js  # Akses DB status pembayaran & token
│   ├── payments.service.js     # Logika transaksi Snap, webhook, & rekonsiliasi
│   └── index.js
│
├── pricing/
│   ├── pricing.service.js      # Perhitungan tarif, denda keterlambatan, & refund
│   ├── capacity.service.js     # Perhitungan kuota kamar & batas toleransi antrian
│   └── index.js
│
└── whatsapp/
    ├── jid.service.js          # Resolusi format nomor & WhatsApp LID
    ├── baileys.service.js      # Manajemen soket koneksi Baileys
    ├── bot.service.js          # Finite State Machine chatbot
    └── index.js
```

---

## 🧩 Dekomposisi Komponen UI (`components/modules/`)

Halaman kompleks yang sebelumnya monolitik (seperti `app/(admin)/admin/bookings/page.jsx`) didekomposisi menjadi subkomponen modular yang terisolasi di `components/modules/bookings/`:

1. **`RoomClassBadge.jsx`**: Render visual badge kelas kamar (Basic, Standard, Premium).
2. **`AdminBookingPaymentBadge.jsx`**: Dropdown status pembayaran terintegrasi dengan modal konfirmasi darurat.
3. **`AdminBookingsFilterBar.jsx`**: Toolbar pencarian, tab status, dan filter tahun/bulan/kelas.
4. **`AdminBookingsBulkBar.jsx`**: Bar aksi terapung untuk persetujuan atau penolakan massal.
5. **`AdminBookingsTableView.jsx`**: Tabel desktop responsif + kartu mobile fallback + pagination.
6. **`AdminBookingsGridView.jsx`**: Grid multi-kolom responsif untuk pemantauan visual.

---

## 🛠️ Aturan Penambahan Fitur Baru

Saat menambahkan fungsionalitas backend atau modul baru:

1. **Jangan letakkan query SQL/Supabase langsung di dalam file `route.js`**:
   Pindahkan operasi database ke `<domain>.repository.js`.
2. **Jangan letakkan logika kalkulasi matematika/aturan status di dalam UI / Controller**:
   Pusatkan aturan bisnis di dalam `<domain>.service.js`.
3. **Selalu validasi input menggunakan Zod DTO**:
   Definisikan skema di `<domain>.dto.js`.
4. **Jaga Backward Compatibility**:
   Jika utilitas lama diimpor oleh banyak komponen (seperti `lib/utils/pricing.js`), re-export dari modul baru agar impor lama tidak rusak.
5. **Sanitasi Error & Keamanan (Zero-Leakage)**:
   Gunakan `lib/utils/errors.js` (`sanitizeApiError`) di backend dan `<UserErrorAlert />` di frontend agar detail internal database dan credentials tidak terekspos ke pengguna.
6. **Verifikasi Kualitas**:
   - Jalankan `npm test` (semua 141 automated unit & integration tests wajib lulus 100%).
   - Jalankan `npm run build` (seluruh 47 rute wajib terkompilasi bersih tanpa error).


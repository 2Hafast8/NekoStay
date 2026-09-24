# NekoStay — C4 Architecture & Code-Level Specification

> Dokumen spesifikasi arsitektur tingkat rendah C4 (System Context, Container, Component, & Code Level) untuk platform **NekoStay**.
> Mengadopsi pola modular domain-driven terinspirasi dari **NestJS** (*Controller – Service – Repository*), DTO dengan validasi Zod ketat, dan dekomposisi komponen monolitik.
> Dibuat berdasarkan skill `c4-code`, `code-documentation-doc-generate`, `nestjs-patterns`, dan `code-documentation-code-explain`.

---

## 🏗️ 1. Level 1: System Context Diagram

Platform NekoStay melayani dua tipe pengguna utama (Customer dan Admin), terhubung ke gateway pembayaran Midtrans, database Supabase PostgreSQL, WhatsApp Multi-Device Gateway, dan Email Delivery Engine (Resend/EmailJS).

```mermaid
flowchart TD
    User["👤 Customer / Cat Owner\n(Browser & Mobile Device)"]
    Admin["👑 Admin & Cashier\n(Backoffice & QR Scanner)"]

    subgraph NekoStaySystem ["🐱 NekoStay Platform (Next.js 16 + React 19)"]
        WebPortal["Web Application & REST API"]
    end

    Supabase[("🗄️ Supabase PostgreSQL\n(Auth, Tables, RLS, Storage)")]
    Midtrans["💳 Midtrans Payment Gateway\n(Snap & Webhooks)"]
    Resend["📧 Resend / EmailJS Engine\n(PDF Receipt & Alerts)"]
    WhatsAppBot["💬 WhatsApp Gateway\n(Baileys Multi-Device)"]

    User -->|Booking, Bayar, Laporan| WebPortal
    Admin -->|Konfirmasi, Scan QR, Chat| WebPortal

    WebPortal -->|Query & Realtime| Supabase
    WebPortal -->|Snap Token & Verify| Midtrans
    WebPortal -->|Kirim Email & PDF| Resend
    WebPortal -->|Sinkronisasi Chat & QR| WhatsAppBot
```

---

## 📦 2. Level 2: Container Diagram

```mermaid
flowchart LR
    subgraph ClientLayer ["Client Layer (Frontend)"]
        Browser["Next.js React 19 Client UI\n(Tailwind CSS, GSAP, Modular Feature Components)"]
    end

    subgraph ServerLayer ["Server Layer (Next.js 16 App Router)"]
        Middleware["Security Middleware\n(Session Refresh & Route Guard)"]
        ApiRoutes["REST API Thin Controllers\n(app/api/*)"]
        DomainServices["Domain Service Layer\n(lib/modules/*/*.service.js)"]
        DataRepositories["Data Repository Layer\n(lib/modules/*/*.repository.js)"]
        ServerComp["React Server Components\n(SSR Data Fetching)"]
    end

    subgraph ExternalServices ["External Infrastructure"]
        SupaDB[("Supabase Database & Storage")]
        MidtransAPI["Midtrans API"]
        EmailService["Resend / EmailJS"]
        WABot["WhatsApp Baileys Service"]
    end

    Browser -->|HTTP/HTTPS| Middleware
    Middleware --> ServerComp
    Middleware --> ApiRoutes
    ApiRoutes --> DomainServices
    DomainServices --> DataRepositories
    DataRepositories -->|Supabase Client / Admin| SupaDB
    DomainServices -->|Snap & Query| MidtransAPI
    DomainServices -->|PDF & Alerts| EmailService
    DomainServices -->|Bot Flow Sync| WABot
```

---

## 🧩 3. Level 3: Component Diagram (Modular Domain Architecture)

Arsitektur backend NekoStay memisahkan tanggung jawab menjadi 3 lapis bersih (*Clean Architecture* terinspirasi dari NestJS):

```mermaid
flowchart TD
    subgraph Controllers ["1. HTTP Controller Layer (app/api/)"]
        BookingsCtrl["api/bookings/[id]/payment-status\napi/bookings/[id]/confirm\napi/bookings/[id]/cancel"]
        PaymentsCtrl["api/payments/create\napi/payments/webhook\napi/payments/check-status"]
        WhatsAppCtrl["api/whatsapp/send\napi/whatsapp/connect"]
    end

    subgraph DTOs ["2. Data Transfer Objects (lib/modules/*/dto)"]
        BookingDTOs["bookings.dto.js\n(Zod Schemas)"]
        PaymentDTOs["payments.dto.js\n(Midtrans Status Mapping & DTO)"]
    end

    subgraph Services ["3. Domain Service Layer (lib/modules/*/services)"]
        BookingsService["BookingsService\n• updateEmergencyPaymentStatus()\n• confirmBooking()\n• cancelBooking()"]
        PaymentsService["PaymentsService\n• createPaymentSession()\n• handleWebhookNotification()\n• checkAndSyncStatus()"]
        PricingService["PricingService\n• calculateEstimatedTotal()\n• calculateLateFee()\n• calculateRefund()\n• getCheckoutCalculation()"]
        WAService["WhatsAppService / BotService\n• processIncomingWhatsAppMessage()\n• resolveRemoteJid()"]
    end

    subgraph Repositories ["4. Data Access Repository Layer (lib/modules/*/repositories)"]
        BookingsRepo["BookingsRepository\n(findById, update, insertAdminNote, insertNotification)"]
        PaymentsRepo["PaymentsRepository\n(findBookingForPayment, updatePaymentStatus, findRecentUnpaid)"]
    end

    subgraph DB ["5. Supabase Database"]
        SupabaseTables[("PostgreSQL: bookings, profiles, booking_admin_notes, notifications")]
    end

    Controllers -->|Validasi Input| DTOs
    Controllers -->|Delegasi Bisnis| Services
    Services --> Repositories
    Services --> PricingService
    Repositories --> DB
```

---

## 🔬 4. Level 4: Code Level Signatures & Logic Contracts

### A. Modul Bookings (`lib/modules/bookings/`)
* **`BookingsService.updateEmergencyPaymentStatus(supabase, { bookingId, adminUser, paymentStatus, reason })`**: Mengubah status pembayaran secara darurat dengan validasi ketat, logging audit otomatis ke `booking_admin_notes`, dan pengiriman notifikasi pengguna.
* **`BookingsService.confirmBooking(supabase, { bookingId })`**: Mengonfirmasi pesanan dari status Menunggu/Antrian ke Aktif dan mengirimkan email konfirmasi.
* **`BookingsService.cancelBooking(supabase, { bookingId, userId, reason })`**: Membatalkan pesanan mandiri oleh pengguna secara atomik (hanya untuk status Menunggu).
* **`BookingsRepository`**: Mengenkapsulasi query Supabase untuk tabel `bookings`, `booking_admin_notes`, dan `notifications`.

### B. Modul Payments (`lib/modules/payments/`)
* **`PaymentsService.createPaymentSession({ supabase, user, bookingId, requestOrigin })`**: Menghasilkan token Snap Midtrans dan menyimpan referensi pesanan.
* **`PaymentsService.handleWebhookNotification(body)`**: Memverifikasi signature SHA-512 Midtrans, mencari pesanan (termasuk fallback pencocokan nominal untuk E-Wallet DANA), memperbarui status pembayaran, dan mengirim notifikasi.
* **`PaymentsService.checkAndSyncStatus({ bookingId, orderId })`**: Memverifikasi status transaksi langsung ke REST API Midtrans `/v2/{orderId}/status` dan melakukan sinkronisasi database.
* **`MidtransClient`**: Helper konfigurasi SDK Snap, SHA-512 signature hashing, dan direct REST client.

### C. Modul Pricing (`lib/modules/pricing/`)
* **`calculateEstimatedTotal(pricePerDay, checkIn, checkOut): number`**: Menghitung estimasi total dasar menginap.
* **`calculateLateFee(pricePerDay, scheduledCheckout, actualCheckout): { totalFee: number, breakdown: Array<{ day: number, fee: number }> }`**: Menghitung akumulasi denda harian dengan rasio majemuk `1.08^n`.
* **`calculateRefund(pricePerDay, scheduledCheckout, actualCheckout, checkIn, refundPercentage = 90): number`**: Menghitung refund pengambilan lebih awal sebesar 90% dari tarif harian sisa.
* **`getCheckoutCalculation(booking, actualCheckoutDate, refundPercentage = 90): CheckoutSummary`**: Helper komprehensif penentuan denda/refund saat checkout kasir.
* **`calculateCapacityAndWaitlist(totalCapacity, currentBooked, targetDays): { available: boolean, canWaitlist: boolean, rejectReason: string | null }`**: Menentukan toleransi antrian kamar (maksimal 3 hari).

### D. Modul WhatsApp (`lib/modules/whatsapp/`)
* **`resolveRemoteJid(target, metadata): string`**: Resolusi nomor telepon normal (08xx / 62xx) atau Linked Identity (LID) WhatsApp 14-16 digit menjadi format JID resmi.
* **`processIncomingWhatsAppMessage(remoteJid, messageText, pushName, isSelf): Promise<string | null>`**: Otomasi Finite State Machine WhatsApp Bot untuk alur pemesanan, ubah jadwal, dan handover mode live admin chat.

### E. Standardized Response Engine (`lib/utils/response.js`)
* **`apiSuccess(data, message, status, headers): NextResponse`**
* **`apiError(message, status, details): NextResponse`**
* **`apiUnauthorized(message): NextResponse`**
* **`apiForbidden(message): NextResponse`**
* **`apiNotFound(message): NextResponse`**
* **`apiBadRequest(message, details): NextResponse`**
* **`apiValidationError(zodError): NextResponse`**

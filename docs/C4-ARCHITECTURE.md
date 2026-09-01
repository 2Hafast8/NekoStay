# NekoStay — C4 Architecture & Code-Level Specification

> Dokumen spesifikasi arsitektur tingkat rendah C4 (System Context, Container, Component, & Code Level) untuk platform **NekoStay**.
> Dibuat berdasarkan skill `c4-code`, `code-documentation-doc-generate`, dan `code-documentation-code-explain`.

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
    WhatsAppBot["💬 WhatsApp Gateway\n(lily-baileys Multi-Device)"]

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
        Browser["Next.js React 19 Client UI\n(Tailwind CSS, GSAP, shadcn/ui)"]
    end

    subgraph ServerLayer ["Server Layer (Next.js 16 App Router)"]
        Middleware["Security Middleware\n(Session Refresh & Route Guard)"]
        ApiRoutes["REST API Route Handlers\n(/api/bookings, /api/payments, dll.)"]
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
    ServerComp -->|Server Client| SupaDB
    ApiRoutes -->|Admin / Server Client| SupaDB
    ApiRoutes -->|Payment Snap| MidtransAPI
    ApiRoutes -->|PDF & Notifications| EmailService
    ApiRoutes -->|Bot State Sync| WABot
```

---

## 🧩 3. Level 3: Component Diagram (Backend API & Logic)

```mermaid
flowchart TD
    subgraph APIControllers ["API Controllers (app/api/)"]
        BookingsCtrl["bookings/route.js\n[POST]"]
        ConfirmCtrl["bookings/[id]/confirm/route.js\n[POST]"]
        CancelCtrl["bookings/[id]/cancel/route.js\n[POST]"]
        ReportCtrl["bookings/[id]/report/route.js\n[POST]"]
        ScanOfflineCtrl["payments/scan-offline/route.js\n[POST]"]
        MidtransWebhookCtrl["payments/webhook/route.js\n[POST]"]
        ReviewsCtrl["reviews/route.js\n[GET, POST]"]
        CronCtrl["cron/check-late/route.js\n[GET]"]
    end

    subgraph SharedModules ["Shared Logic & Helpers (lib/)"]
        AuthGuards["lib/supabase/admin.js\nverifyAdmin(), verifyBookingAccess()"]
        ValidationZod["lib/validations/booking.js\nZod Schemas"]
        PricingEngine["lib/utils/pricing.js\ncalculateLateFee(), calculateRefund()"]
        DateHelpers["lib/utils/dates.js\ndaysBetween(), isLate()"]
        ResponseHelper["lib/utils/response.js\napiSuccess(), apiError()"]
        EmailEngine["lib/email/resend.js\nsendBookingStatusUpdate(), generatePDFBuffer()"]
    end

    BookingsCtrl --> ValidationZod
    BookingsCtrl --> ResponseHelper
    ConfirmCtrl --> AuthGuards
    ConfirmCtrl --> EmailEngine
    CancelCtrl --> ValidationZod
    ReportCtrl --> AuthGuards
    ReportCtrl --> EmailEngine
    ScanOfflineCtrl --> AuthGuards
    ScanOfflineCtrl --> ValidationZod
    MidtransWebhookCtrl --> ResponseHelper
    CronCtrl --> PricingEngine
    CronCtrl --> EmailEngine
```

---

## 🔬 4. Level 4: Code Level Signatures & Logic Contracts

### A. Pricing Engine (`lib/utils/pricing.js`)
* **`calculateEstimatedTotal(pricePerDay, checkIn, checkOut): number`**: Menghitung estimasi total dasar menginap.
* **`calculateLateFee(pricePerDay, scheduledCheckout, actualCheckout): { totalFee: number, breakdown: Array<{ day: number, fee: number }> }`**: Menghitung akumulasi denda harian dengan rasio majemuk `1.08^n`.
* **`calculateRefund(pricePerDay, scheduledCheckout, actualCheckout, checkIn, refundPercentage = 90): number`**: Menghitung refund pengambilan lebih awal sebesar 90% dari tarif harian sisa.
* **`getCheckoutCalculation(booking, actualCheckoutDate, refundPercentage = 90): CheckoutSummary`**: Helper komprehensif penentuan denda/refund saat checkout kasir.

### B. Standardized Response Engine (`lib/utils/response.js`)
* **`apiSuccess(data, message, status, headers): NextResponse`**
* **`apiError(message, status, details): NextResponse`**
* **`apiUnauthorized(message): NextResponse`**
* **`apiForbidden(message): NextResponse`**
* **`apiNotFound(message): NextResponse`**
* **`apiBadRequest(message, details): NextResponse`**
* **`apiValidationError(zodError): NextResponse`**

### C. Security & Authorization Guards (`lib/supabase/admin.js`)
* **`createAdminClient(): SupabaseClient`**: Membuat klien service_role Supabase untuk eksekusi server aman.
* **`verifyAdmin(supabase): Promise<{ isAdmin: boolean, user: User | null, profile: Profile | null }>`**: Memeriksa otentikasi dan hak akses role admin.
* **`verifyAuthUser(supabase): Promise<{ isAuthenticated: boolean, user: User | null, profile: Profile | null }>`**: Memeriksa otentikasi user aktif.
* **`verifyBookingAccess(supabase, bookingId): Promise<{ isAllowed: boolean, isOwner: boolean, isAdmin: boolean, user: any, booking: any }>`**: Memverifikasi kepemilikan user atau hak istimewa admin.


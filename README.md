# 🐱 NekoStay — Premium Cat Boarding & Care Platform

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-orange?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://react.dev)
[![Supabase Backend](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-emerald?style=flat-square&logo=supabase)](https://supabase.com)
[![Tailwind CSS v4](https://img.shields.io/badge/CSS-Tailwind%20v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Commercial%20%2F%20MIT-brightgreen?style=flat-square)](#)

**NekoStay** is a state-of-the-art, feature-rich web application designed for modern cat hotel businesses and cat owners. It connects cat owners seeking premium boarding services with pet hotels, offering peace of mind through regular status updates, real-time notifications, and high-end pet management tools.

Developed with a premium, responsive glassmorphism UI, a global dual-language system, dynamic dark mode, and an advanced admin simulation engine, NekoStay is the ultimate solution to scale and professionalize pet boarding operations.

---

## ✨ Key Features & Business Value

### 👤 For Cat Owners (Customer Portal)
*   **Seamless Booking Workflow**: Book a stay for your feline friend in just 3 steps (Cat Info, Stay Dates, and Confirmation) with custom notes, health statuses, and photo uploads.
*   **Feline Care Reports**: Track your cat's health, appetite, and mood daily. View status logs and photo updates posted directly by cat caretakers.
*   **Referral & Loyalty Program**: Share personal referral codes with other cat lovers. Referrals save 10% on their first booking, and referrers collect rewards points (redeemable for stay discounts).
*   **Unified Notifications Inbox**: Receive instant, in-app logs regarding check-in approvals, health reports, and check-out invoices.
*   **Receipt Resending & QR Code Refresh**: Request a resend of booking receipts via email at any time, featuring dynamic regeneration and extension of one-time use offline payment QR codes.

### 👨‍💼 For Cat Boarding Businesses (Admin Control Center)
*   **Analytical Executive Dashboard**: Monitor active revenue, boarded cats, pending approvals, average ratings, and stay distribution trends with real-time Recharts visual graphs.
*   **Advanced Booking Operations**: Manage check-ins, approve or decline requests, and process check-outs. Filter bookings dynamically by stay status, year, month, or room class.
*   **Daily Cat Care Reporting**: Publish progress reports with health states and photos directly to owner profiles.
*   **Dynamic Room Rate Configuration**: Manage room classes (Basic, Standard, Premium), list amenities, and set daily rates.
*   **Outbox Notification Gateway**: Monitor outgoing communications with a simulated system outbox log separating WhatsApp notifications from system admin alerts.
*   **Premium PDF Invoicing & Analytics Export**: Export bookings and financial summaries into a custom, styled PDF document (landscape format) complete with company branding, totals, and metadata.
*   **Built-in QR Camera Scanner**: Verify offline payment receipts instantly via webcam or mobile camera scanning. The viewport is optimized for zero-leak layouts on both desktop and mobile screens.

---

## 🎨 Design & Accessibility
*   **Premium Visuals**: Built using modern typography (Outfit / Inter), HSL orange brand colors, soft gradient overlays, micro-animations, and clean grid layouts.
*   **Unified Theme Switcher**: Fluid transitions between Light Mode and Dark Mode.
*   **Global Language Switcher**: Zero-lag language toggle between Indonesian (`ID`) and English (`EN`) that dynamically updates the layout, sidebar, forms, database room amenities, health statuses, and interactive error/success dialogues.
*   **Mobile-First Layout**: Adaptive sidebar navigation for desktop and bottom tab bar navigation for mobile devices, fully eliminating horizontal overflow.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Core Framework** | Next.js 16.2.6 (Turbopack) | Fast compilation and rendering optimization |
| **Frontend UI** | React 19, Tailwind CSS v4 | Harmonious, high-performance styling |
| **State Management** | Zustand 5 | Client-side persistent state for themes & language |
| **Database & Auth** | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | PostgreSQL schema, auth sessions, and RLS policies |
| **Mailing Service** | Resend | Automatic check-in and reply email notifications |
| **Animations** | GSAP (GreenSock Animation Platform) | Premium smooth magnetic CTA, looping marquee, and 3D card tilt |
| **Form & Validation** | React Hook Form & Zod | Strict runtime schema parsing and interactive client/server validations |
| **Analytics Charts** | Recharts | Professional visual data visualization for admin dashboard |
| **Date Processing** | `date-fns` | Date arithmetic for checkout, late-fees, and refund math |
| **Component Icons** | Lucide React | High-quality, modern SVG icon library |
| **Reporting Tool** | jsPDF & jsPDF-Autotable | Dynamic client-side invoice and PDF report rendering |
| **QR Code Engine** | `html5-qrcode` & `qrcode` | Interactive QR scanning and code generation |
| **Payment Client** | `midtrans-client` | E-payment client integration client (sandbox/prod) |

---

## ⚙️ Installation & Local Development Setup

To run NekoStay on your local environment, follow these steps:

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or above)
*   [Git](https://git-scm.com/)
*   A [Supabase](https://supabase.com/) account (for database hosting)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/NekoStay.git
cd NekoStay
```

### 3. Install Dependencies
To install all project dependencies listed in `package.json`, run:
```bash
npm install
```

If you are setting up a fresh project structure or want to install the integration packages manually, you can install them by category:

*   **Database & Auth**: `npm install @supabase/supabase-js @supabase/ssr`
*   **Forms & Validation**: `npm install react-hook-form @hookform/resolvers zod`
*   **Mailing, PDF & QR Codes**: `npm install resend jspdf jspdf-autotable qrcode html5-qrcode`
*   **GSAP Animations**: `npm install gsap`
*   **UI Components & Icons**: `npm install lucide-react next-themes sonner recharts`
*   **State & Utility**: `npm install zustand date-fns midtrans-client`

Or run this single command to install all major packages at once:
```bash
npm install @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod resend jspdf jspdf-autotable qrcode html5-qrcode gsap lucide-react next-themes sonner recharts zustand date-fns midtrans-client
```

### 4. Configure Environment Variables
Create a file named `.env` in the root directory and populate it with your environment keys:
```env
#environment variables for Supabase
NEXT_PUBLIC_SUPABASE_URL=dummy-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dummy-supabase-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-supabase-service-role-key

#environment variables for phone
NEXT_PUBLIC_ADMIN_WHATSAPP=dummy-admin-whatsapp-number

#environment variables for resend
RESEND_API_KEY=dummy-resend-api-key
CRON_SECRET=random-string

#environment variables for app building Localhost
NEXT_PUBLIC_APP_URL=dummy-app-url

#environment variables for Midtrans
# Set to "true" for production, "false" for sandbox (default: false)
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=dummy-midtrans-server-key
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=dummy-midtrans-client-key

```

### 5. Setup Database Schemas
Execute the SQL migration scripts located in the `supabase/` folder inside your Supabase SQL Editor. This sets up:
*   `profiles`, `classes`, `bookings`, `cat_reports`, `notifications`, and `reviews` tables.
*   Booking payment columns (`payment_status`, `payment_token`, `payment_link_url`, `discount_amount`) for Midtrans integration.
*   Referral system columns (`referral_code`, `referred_by`) with a unique-code generator and the `get_profile_by_referral()` lookup function.
*   Database triggers for automatic profile creation on registration.
*   Database triggers for automatic offline payment token generation when status transitions to 'Aktif'.
*   Row-Level Security (RLS) policies to keep customer data isolated and secure.
*   Initial room classes seeding data.

> A daily cron job (`/api/cron/check-late`, defined in `vercel.json`) automatically flags overdue check-outs and accrues late fees. It is protected by the `CRON_SECRET` environment variable.

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 7. Compile a Production Build
Ensure that the code is optimized and ready for production deployment:
```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```
NekoStay/
├── app/                  # Next.js App Router (pages & APIs)
│   ├── (admin)/          # Admin-only dashboard, bookings, reports, reviews, settings
│   ├── (user)/           # Customer-only dashboard, profiles, notifications, booking flows
│   ├── (auth)/           # Authentication pages (login, registration, password recovery)
│   └── api/              # API endpoints for email triggering, booking updates, etc.
├── components/           # Reusable React UI components (form inputs, dialogs, charts)
├── hooks/                # Custom hooks (e.g. useLanguage translation store)
├── lib/                  # Utilities (Supabase client client, formatted dates, pricing math)
├── public/               # Static icons, default cat avatars, promotional assets
├── supabase/             # Database table structures, constraints, and RLS policies
├── docs/                 # Detailed technical design manuals, testing logs, and deploy checklists
├── package.json          # Project manifest and package configurations
└── README.md             # This promotional & installation guide
```

---

## 🔒 Security & Data Compliance
NekoStay secures user data by enforcing rules at every touchpoint:
*   **Row-Level Security (RLS)**: Users can only read and write bookings, cats, and profile details that they own.
*   **Authentication & Session Guards**: Managed securely via JWT tokens through Supabase Auth, protected by server middleware redirects.
*   **Input Sanitization**: Clean, strict client/server validations driven by Zod schema rules.
*   **Storage Access Control**: Private bucket configurations preventing direct access to uploaded cat photographs.

---

## 💼 Business & Commercial Licensing
For commercial inquiries, white-labeling requests, customized features, or integration with external veterinary systems, contact the NekoStay team.
*   **License**: Licensed under standard commercial terms. An open-source edition is distributed under the MIT license.
*   **Support**: For bugs or support queries, please open an Issue on GitHub or check our extensive internal documentation inside the `docs/` folder.

---

## 👤 Credits & Creator
This application was engineered and is maintained as a professional showcase development project.

*   **Developer / Creator**: [Hafast2008]
*   **GitHub**: [@2Hafast8](https://github.com/2Hafast8)
*   **LinkedIn**: [...](...)
*   **Portfolio**: [...](...)

If you are interested in a full demonstration, customized business adaptations, or collaborative projects, feel free to get in touch!


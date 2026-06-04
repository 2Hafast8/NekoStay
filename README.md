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

### 👨‍💼 For Cat Boarding Businesses (Admin Control Center)
*   **Analytical Executive Dashboard**: Monitor active revenue, boarded cats, pending approvals, average ratings, and stay distribution trends with real-time Recharts visual graphs.
*   **Advanced Booking Operations**: Manage check-ins, approve or decline requests, and process check-outs. Filter bookings dynamically by stay status, year, month, or room class.
*   **Daily Cat Care Reporting**: Publish progress reports with health states and photos directly to owner profiles.
*   **Dynamic Room Rate Configuration**: Manage room classes (Basic, Standard, Premium), list amenities, and set daily rates.
*   **Outbox Notification Gateway**: Monitor outgoing communications with a simulated system outbox log separating WhatsApp notifications from system admin alerts.
*   **Premium PDF Invoicing & Analytics Export**: Export bookings and financial summaries into a custom, styled PDF document (landscape format) complete with company branding, totals, and metadata.

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
| **Database & Auth** | Supabase | PostgreSQL schema, private files, and RLS policies |
| **Mailing Service** | Resend | Automatic check-in and reply email notifications |
| **Component Icons** | Lucide React | High-quality, modern SVG icon library |
| **Reporting Tool** | jsPDF & jsPDF-Autotable | Dynamic client-side invoice and PDF report rendering |

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
```bash
npm install
```

### 4. Configure Environment Variables
Create a file named `.env.local` in the root directory and populate it with your environment keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Resend API (For Email Notifications)
RESEND_API_KEY=re_your_resend_api_key
```

### 5. Setup Database Schemas
Execute the SQL migration scripts located in the `supabase/` folder inside your Supabase SQL Editor. This sets up:
*   `profiles`, `bookings`, `cat_reports`, `reviews`, `classes`, and `notifications` tables.
*   Database triggers for automatic profile creation on registration.
*   Row-Level Security (RLS) policies to keep customer data isolated and secure.
*   Initial room classes seeding data.

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

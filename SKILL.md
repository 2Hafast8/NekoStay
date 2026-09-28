# SKILL.md — NekoStay Skills & Technical Registry

> Panduan komprehensif seluruh skill teknis dan spesialisasi AI Agent yang terdaftar di project NekoStay.
> Dapat dibaca oleh pengembang (manusia) maupun AI agent (Antigravity, Claude, Copilot, Cursor, Windsurf, dsb.) sebagai referensi kapabilitas sistem.
> Total **54 Skill Terdaftar** dan Siap Pakai di `.agent/skills/`.

---

## 🚀 CARA MENGAKTIFKAN & MENGGUNAKAN SKILL

### 1. Pemanggilan oleh Pengguna via Slash Command
Pengguna dapat mengaktifkan skill secara langsung di chat dengan mengetikkan perintah slash command:
```text
/<nama-skill> [perintah / tugas yang diinginkan]
```
*Contoh:*
- `/javascript-testing-patterns coba uji modul kalkulasi harga dan rate limiter`
- `/docker-patterns buatkan konfigurasi docker-compose multi-stage dev dan prod`
- `/frontend-patterns optimasi re-render pada dashboard booking admin`
- `/git-workflow bantu susun aturan commit dan strategi branch testing ke main`
- `/antislop-ui bersihkan kode antarmuka dari emoji dan styling berlebihan`

### 2. Pemuatan Otomatis oleh AI Agent (Antigravity / Autonomous Agent)
Saat AI Agent mendeteksi tugas yang relevan, agent **wajib** membaca file instruksi skill terkait menggunakan tool pembaca file (`view_file`) sebelum mengeksekusi perubahan:
```text
Lokasi Path: .agent/skills/<nama-skill>/SKILL.md
```
File tersebut berisi petunjuk arsitektur, batasan, daftar checklist, dan playbook implementasi yang harus dipatuhi.

---

## � DAFTAR ISI

1. [UI/UX, Styling & Frontend Patterns](#1-uiux-styling--frontend-patterns)
2. [Clean Code & Anti-Slop Guidelines](#2-clean-code--anti-slop-guidelines)
3. [Backend Architecture, Database & NestJS Patterns](#3-backend-architecture-database--nestjs-patterns)
4. [Security, Compliance & DevSecOps](#4-security-compliance--devsecops)
5. [JavaScript, TypeScript, React & Next.js Performance](#5-javascript-typescript-react--nextjs-performance)
6. [Automated Testing & QA Patterns](#6-automated-testing--qa-patterns)
7. [DevOps, Docker & Git Workflow](#7-devops-docker--git-workflow)
8. [Code Quality, Review & Refactoring](#8-code-quality-review--refactoring)
9. [Documentation & C4 Architecture](#9-documentation--c4-architecture)
10. [Panduan Integrasi Stack NekoStay](#-panduan-integrasi-stack-nekostay)

---

## 🤖 DAFTAR LENGKAP 54 SPESIALISASI AI AGENT SKILLS (`.agent/skills/`)

### 1. UI/UX, Styling & Frontend Patterns
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`ui-ux-pro-max`** | `.agent/skills/ui-ux-pro-max/SKILL.md` | Intelegensi desain UI/UX: 50 styles, 21 palettes, 50 font pairings, diagram interaktif, dan arsitektur visual modern. |
| **`ui-styling`** | `.agent/skills/ui-styling/SKILL.md` | Desain antarmuka responsif dan aksesibel dengan Tailwind CSS v4, shadcn/ui, Radix primitives, dan canvas visual. |
| **`tailwind-design-system`** | `.agent/skills/tailwind-design-system/SKILL.md` | Skalabilitas design tokens, component libraries, CSS variables, dan konsistensi layout sistem. |
| **`tailwind-patterns`** | `.agent/skills/tailwind-patterns/SKILL.md` | Pola Tailwind CSS v4 modern: CSS-first config, container queries, dan performa tinggi. |
| **`frontend-patterns`** | `.agent/skills/frontend-patterns/SKILL.md` | Pola pengembangan frontend modern untuk React dan Next.js: state management (Zustand, React Hook Form), data fetching, forms, dan UX responsif. |
| **`antislop-ui`** | `.agent/skills/antislop-ui/SKILL.md` | UI filter anti-slop: warna harmonis, layout tegas, ikon SVG Lucide profesional, tanpa emoji literal di antarmuka. |
| **`antislop-human`** | `.agent/skills/antislop-human/SKILL.md` | Aksesibilitas nyata untuk manusia: kontras warna tinggi (WCAG AAA), navigasi keyboard, focus rings jelas. |
| **`antislop-layoutmobile`** | `.agent/skills/antislop-layoutmobile/SKILL.md` | Layout mobile: tap targets nyaman (min 44px), zero horizontal overflow, bottom navigation bar. |

### 2. Clean Code & Anti-Slop Guidelines
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`clean-code`** | `.agent/skills/clean-code/SKILL.md` | Standar koding pragmatis: ringkas, lugas, tanpa over-engineering, bebas komentar redundan. |
| **`antislop`** | `.agent/skills/antislop/SKILL.md` | Core filter anti-slop: mencegah kode, teks, dan layout AI generik yang tidak memiliki alasan fungsional. |
| **`antislop-code`** | `.agent/skills/antislop-code/SKILL.md` | Kebersihan komentar kode: menghapus komentar generik AI tanpa mengubah fungsionalitas dan logika kode. |
| **`antislop-copywriting`** | `.agent/skills/antislop-copywriting/SKILL.md` | Teks dan copy alami: bahasa empatis dari sudut pandang pengguna, tanpa jargon AI klise. |

### 3. Backend Architecture, Database & NestJS Patterns
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`nestjs-patterns`** | `.agent/skills/nestjs-patterns/SKILL.md` | Arsitektur modular bergaya NestJS di `lib/modules/`: separation of concerns, DTOs, domain services, dan repositories. |
| **`backend-patterns`** | `.agent/skills/backend-patterns/SKILL.md` | Desain API bersih, optimasi query Supabase, dan error handling terstandarisasi (`apiSuccess`, `apiError`). |
| **`postgres-patterns`** | `.agent/skills/postgres-patterns/SKILL.md` | Optimasi skema PostgreSQL Supabase, indexing, RLS policies, trigger otomatis, dan generated columns guard (`428C9`). |
| **`mysql-patterns`** | `.agent/skills/mysql-patterns/SKILL.md` | Pola database MySQL & MariaDB: skema, indexing strategy, locking transactions, connection pool, dan optimasi query berat. |
| **`database-design`** | `.agent/skills/database-design/SKILL.md` | Prinsip perancangan relasi database, integritas foreign key, normalisasi, dan isolasi multi-tenant. |
| **`database-migrations`** | `.agent/skills/database-migrations/SKILL.md` | Manajemen migrasi skema database aman, rollback strategy, zero-downtime deployments, dan skrip idempotensi. |
| **`software-architecture`** | `.agent/skills/software-architecture/SKILL.md` | Panduan arsitektur software berkualitas tinggi untuk maintainability, decoupling, dan skalabilitas sistem. |
| **`system-design`** | `.agent/skills/system-design/SKILL.md` | Perancangan sistem holistik, service boundaries, data modeling, throughput capacity, dan failover design. |

### 4. Security, Compliance & DevSecOps
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`backend-security-coder`** | `.agent/skills/backend-security-coder/SKILL.md` | Praktik backend aman: sanitasi error sensitif, validasi Zod ketat, otentikasi admin, proteksi database (OWASP A04/A05). |
| **`frontend-security-coder`** | `.agent/skills/frontend-security-coder/SKILL.md` | Praktik frontend aman: mitigasi XSS, sanitasi output HTML/JSX, CSP frame-ancestors, cookie security. |
| **`frontend-mobile-security-xss-scan`** | `.agent/skills/frontend-mobile-security-xss-scan/SKILL.md` | Pemindaian injeksi Cross-Site Scripting (XSS) pada React/Next.js dan antarmuka web/mobile. |
| **`mobile-security-coder`** | `.agent/skills/mobile-security-coder/SKILL.md` | Pola keamanan aplikasi mobile, WebView hardening, secure token storage di device. |
| **`security-auditor`** | `.agent/skills/security-auditor/SKILL.md` | Audit keamanan menyeluruh: DevSecOps, ancaman OWASP Top 10, OAuth2/OIDC, postur cloud. |
| **`security-compliance-compliance-check`** | `.agent/skills/security-compliance-compliance-check/SKILL.md` | Audit kepatuhan & regulasi perangkat lunak (GDPR, HIPAA, SOC2, PCI-DSS). |
| **`security-requirement-extraction`** | `.agent/skills/security-requirement-extraction/SKILL.md` | Penurunan kebutuhan keamanan dari threat models menjadi user stories dan test cases teruji. |
| **`security-scanning-security-dependencies`** | `.agent/skills/security-scanning-security-dependencies/SKILL.md` | Pemindaian kerentanan dependensi npm/node_modules, SBOM generation, supply chain security. |
| **`security-scanning-security-hardening`** | `.agent/skills/security-scanning-security-hardening/SKILL.md` | Koordinasi pengerasan keamanan multi-layer (aplikasi, infrastruktur database, control access). |
| **`security-scanning-security-sast`** | `.agent/skills/security-scanning-security-sast/SKILL.md` | Static Application Security Testing (SAST) untuk deteksi kerentanan kode otomatis. |
| **`security-review`** | `.agent/skills/security-review/SKILL.md` | Review berkala otentikasi, handling input pengguna, penanganan secret, dan gateway pembayaran. |
| **`k8s-security-policies`** | `.agent/skills/k8s-security-policies/SKILL.md` | Penerapan kebijakan keamanan Kubernetes (NetworkPolicy, PodSecurity, RBAC). |
| **`solidity-security`** | `.agent/skills/solidity-security/SKILL.md` | Audit dan best practices keamanan smart contract Solidity & blockchain security. |

### 5. JavaScript, TypeScript, React & Next.js Performance
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`javascript-pro`** | `.agent/skills/javascript-pro/SKILL.md` | Penguasaan JavaScript modern ES6+, async/await, event loops, dan API runtime Node.js. |
| **`modern-javascript-patterns`** | `.agent/skills/modern-javascript-patterns/SKILL.md` | Penerapan functional programming, iterators, generators, destructuring, dan modular JS. |
| **`javascript-typescript-typescript-scaffold`** | `.agent/skills/javascript-typescript-typescript-scaffold/SKILL.md` | Arsitektur dan scaffolding proyek TypeScript modern berskala produksi. |
| **`react-patterns`** | `.agent/skills/react-patterns/SKILL.md` | Pola React 18/19: server/client boundaries, Suspense, custom hooks, dan form actions. |
| **`react-performance`** | `.agent/skills/react-performance/SKILL.md` | Optimasi performa: waterfall elimination via `Promise.all`, bundle splitting, LCP/CLS optimization. |
| **`nextjs-turbopack`** | `.agent/skills/nextjs-turbopack/SKILL.md` | Next.js 16+ dan Turbopack: bundler berkecepatan tinggi, FS caching, dan rute prerendering bersih. |
| **`performance-optimization`** | `.agent/skills/performance-optimization/SKILL.md` | Optimasi performa lintas frontend, backend, queries, database, dan Core Web Vitals. |

### 6. Automated Testing & QA Patterns
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`javascript-testing-patterns`** | `.agent/skills/javascript-testing-patterns/SKILL.md` | Strategi pengujian komprehensif: Unit tests, table-driven tests, AAA pattern, state machine matrix, dan boundary testing (**189 / 189 skenario uji lulus 100%** via `npm test` atau `node scripts/test-suite.mjs`). |

### 7. DevOps, Docker & Git Workflow
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`docker-patterns`** | `.agent/skills/docker-patterns/SKILL.md` | Pola Docker & Docker Compose: multi-stage build, container security, dev/prod isolation, volume mounts, dan orkestrasi service. |
| **`git-workflow`** | `.agent/skills/git-workflow/SKILL.md` | Pola Git version control: strategi branching (trunk-based, release branch), konvensi commit semantik, mitigasi konflik merge/rebase, dan PR checklist. |

### 8. Code Quality, Review & Refactoring
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`code-reviewer`** | `.agent/skills/code-reviewer/SKILL.md` | Analisis kode modern, deteksi potensi bug, optimasi performa, keandalan produksi. |
| **`code-review-excellence`** | `.agent/skills/code-review-excellence/SKILL.md` | Standar review pull request berkualitas tinggi, feedback konstruktif, dan transfer knowledge. |
| **`code-review-ai-ai-review`** | `.agent/skills/code-review-ai-ai-review/SKILL.md` | Review cerdas berbasis AI terintegrasi automated static analysis dan DevOps workflows. |
| **`code-review`** | `.agent/skills/code-review/SKILL.md` | Evaluasi ganda: Standar repositori vs Spesifikasi PRD secara berdampingan. |
| **`code-refactoring-refactor-clean`** | `.agent/skills/code-refactoring-refactor-clean/SKILL.md` | Penerapan Clean Code, prinsip SOLID, design patterns modern, dan modularitas tinggi. |
| **`code-refactoring-tech-debt`** | `.agent/skills/code-refactoring-tech-debt/SKILL.md` | Identifikasi, kuantifikasi, dan prioritas perbaikan utang teknis (technical debt). |
| **`code-refactoring-context-restore`** | `.agent/skills/code-refactoring-context-restore/SKILL.md` | Pemulihan dan pemeliharaan konteks sistem saat melakukan refactoring skala besar. |
| **`framework-migration-code-migrate`** | `.agent/skills/framework-migration-code-migrate/SKILL.md` | Perencanaan dan eksekusi migrasi kode antar framework, versi library, dan runtime platform. |

### 9. Documentation & C4 Architecture
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`c4-code`** | `.agent/skills/c4-code/SKILL.md` | Dokumentasi arsitektur tingkat rendah C4 Code Level (signature fungsi, relasi modul). |
| **`code-documentation-doc-generate`** | `.agent/skills/code-documentation-doc-generate/SKILL.md` | Generator dokumentasi API, diagram arsitektur Mermaid, user guides, dan technical docs. |
| **`code-documentation-code-explain`** | `.agent/skills/code-documentation-code-explain/SKILL.md` | Penjelasan naratif konsep kode rumit melalui breakdown visual dan analogi jelas. |

---

## 🛠️ PANDUAN INTEGRASI STACK NEKOSTAY

1. **Backend & Database**: Next.js 16 (App Router) + Supabase PostgreSQL (RLS & Realtime WebSocket CDC).
2. **Domain Architecture**: Modular Services bergaya NestJS di `lib/modules/` (`pricing`, `payments`, `bookings`, `whatsapp`).
3. **Frontend & Styling**: Tailwind CSS v4, GSAP animations, Lucide SVG Icons (Zero Emoji UI), shadcn/ui primitives.
4. **Error Handling & Security**: Empathetic user notifications via `UserErrorAlert`, sanitasi error sensitif database di produksi (OWASP A04/A05), dan proteksi captcha Turnstile.
5. **WhatsApp Gateway**: `@whiskeysockets/baileys` Multi-Device engine dengan chat langsung admin, auto-reactivation, dan proteksi echo pesan bot.
6. **Payment Gateway**: Midtrans Snap Integration resmi dengan mapping status transaksi teruji (`mapMidtransStatusToPaymentStatus`).
7. **Email & Receipt Engine**: Dual-Mode (EmailJS / Resend) + jsPDF cloud receipt streaming.
8. **Testing Engine**: Automated native test suite via `npm test` (`scripts/test-suite.mjs` & `test-suite.mjs.js`) — **189 / 189 Skenario Uji Lulus 100%**.
9. **DevOps & Workflow**: Dukungan container `docker-patterns` untuk standarisasi environment dan `git-workflow` untuk release management dari branch `testing` ke `main`.

Untuk referensi teknis kode dan boilerplate implementasi lengkap, silakan lihat [docs/01-SETUP/skill.md](docs/01-SETUP/skill.md) dan [docs/00-INDEX.md](docs/00-INDEX.md).


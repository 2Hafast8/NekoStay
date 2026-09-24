# SKILL.md — NekoStay Skills & Technical Registry

> Panduan komprehensif seluruh skill teknis dan spesialisasi AI Agent yang terdaftar di project NekoStay.
> Dapat dibaca oleh pengembang (manusia) maupun AI agent (Antigravity, Claude, Copilot, Cursor, dsb.) sebagai referensi kapabilitas sistem.

---

## 📑 DAFTAR ISI

1. [Daftar Spesialisasi AI Agent Skills (.agent/skills)](#-daftar-spesialisasi-ai-agent-skills-agentskills)
   - [UI/UX, Styling & Human Experience](#1-uiux-styling--human-experience)
   - [Security & Compliance (Keamanan Sistem)](#2-security--compliance-keamanan-sistem)
   - [Software Architecture & Backend Patterns](#3-software-architecture--backend-patterns)
   - [Clean Code & Anti-Slop Guidelines](#4-clean-code--anti-slop-guidelines)
   - [Code Quality & Review](#5-code-quality--review-kualitas-kode)
   - [Refactoring & Migration](#6-refactoring--migration)
   - [JavaScript, TypeScript & Testing](#7-javascript-typescript--testing)
   - [Documentation & C4 Code](#8-documentation--c4-code)
2. [Panduan Integrasi Stack NekoStay](#-panduan-integrasi-stack-nekostay)
   - [Dokumentasi Lengkap Stack Setup](docs/01-SETUP/skill.md)

---

## 🤖 DAFTAR SPESIALISASI AI AGENT SKILLS (`.agent/skills/`)

### 1. UI/UX, Styling & Human Experience
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`ui-ux-pro-max`** | `.agent/skills/ui-ux-pro-max/SKILL.md` | Intelegensi desain UI/UX: 50 styles, 21 palettes, 50 font pairings, diagram interaktif, dan arsitektur visual modern. |
| **`ui-styling`** | `.agent/skills/ui-styling/SKILL.md` | Desain antarmuka responsif dan aksesibel dengan Tailwind CSS v4, shadcn/ui, Radix primitives, dan canvas visual. |
| **`tailwind-design-system`** | `.agent/skills/tailwind-design-system/SKILL.md` | Skalabilitas design tokens, component libraries, CSS variables, dan konsistensi layout sistem. |
| **`tailwind-patterns`** | `.agent/skills/tailwind-patterns/SKILL.md` | Pola Tailwind CSS v4 modern: CSS-first config, container queries, dan performa tinggi. |

### 2. Security & Compliance (Keamanan Sistem)
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

### 3. Software Architecture & Backend Patterns
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`nestjs-patterns`** | `.agent/skills/nestjs-patterns/SKILL.md` | Arsitektur modular bergaya NestJS di `lib/modules/`: separation of concerns, DTOs, domain services, dan repositories. |
| **`backend-patterns`** | `.agent/skills/backend-patterns/SKILL.md` | Desain API bersih, optimasi query Supabase, dan error handling terstandarisasi (`apiSuccess`, `apiError`). |
| **`postgres-patterns`** | `.agent/skills/postgres-patterns/SKILL.md` | Optimasi skema PostgreSQL Supabase, indexing, RLS policies, trigger otomatis, dan generated columns (`428C9` guard). |
| **`database-design`** | `.agent/skills/database-design/SKILL.md` | Prinsip perancangan relasi database, integritas foreign key, dan isolasi multi-tenant. |
| **`database-migrations`** | `.agent/skills/database-migrations/SKILL.md` | Manajemen migrasi skema database aman, rollback strategy, dan zero-downtime deployments. |
| **`software-architecture`** | `.agent/skills/software-architecture/SKILL.md` | Panduan arsitektur berkualitas tinggi untuk maintainability, decoupling, dan scalability. |
| **`system-design`** | `.agent/skills/system-design/SKILL.md` | Perancangan sistem holistik, service boundaries, data modeling, dan skalabilitas arsitektur. |

### 4. Clean Code & Anti-Slop Guidelines
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`clean-code`** | `.agent/skills/clean-code/SKILL.md` | Standar pragmatis: ringkas, lugas, tanpa over-engineering, bebas komentar tidak perlu. |
| **`antislop`** | `.agent/skills/antislop/SKILL.md` | Core filter anti-slop: mencegah kode, teks, dan layout AI yang generik. |
| **`antislop-ui`** | `.agent/skills/antislop-ui/SKILL.md` | UI filter: warna harmonis, layout tegas, komponen berkarakter, tanpa efek berlebihan. |
| **`antislop-human`** | `.agent/skills/antislop-human/SKILL.md` | Aksesibilitas nyata: kontras warna tinggi, navigasi keyboard, focus rings jelas. |
| **`antislop-code`** | `.agent/skills/antislop-code/SKILL.md` | Kebersihan komentar kode: menghapus komentar generik AI tanpa mengubah fungsi logika. |
| **`antislop-copywriting`** | `.agent/skills/antislop-copywriting/SKILL.md` | Teks dan copy alami: bahasa empatis dari sudut pandang pengguna, tanpa jargon kaku. |
| **`antislop-layoutmobile`** | `.agent/skills/antislop-layoutmobile/SKILL.md` | Layout mobile: tap targets nyaman (min 44px), zero horizontal overflow, bottom navigation. |

### 5. Code Quality & Review (Kualitas Kode)
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`code-reviewer`** | `.agent/skills/code-reviewer/SKILL.md` | Analisis kode modern, deteksi potensi bug, optimasi performa, keandalan produksi. |
| **`code-review-excellence`** | `.agent/skills/code-review-excellence/SKILL.md` | Standar review pull request berkualitas tinggi, feedback konstruktif, dan transfer knowledge. |
| **`code-review-ai-ai-review`** | `.agent/skills/code-review-ai-ai-review/SKILL.md` | Review cerdas berbasis AI terintegrasi automated static analysis dan DevOps workflows. |
| **`code-review`** | `.agent/skills/code-review/SKILL.md` | Evaluasi ganda: Standar repositori vs Spesifikasi PRD secara berdampingan. |

### 6. Refactoring & Migration
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`code-refactoring-refactor-clean`** | `.agent/skills/code-refactoring-refactor-clean/SKILL.md` | Penerapan Clean Code, prinsip SOLID, design patterns modern, dan modularitas tinggi. |
| **`code-refactoring-tech-debt`** | `.agent/skills/code-refactoring-tech-debt/SKILL.md` | Identifikasi, kuantifikasi, dan prioritas perbaikan utang teknis (technical debt). |
| **`code-refactoring-context-restore`** | `.agent/skills/code-refactoring-context-restore/SKILL.md` | Pemulihan dan pemeliharaan konteks sistem saat melakukan refactoring skala besar. |
| **`framework-migration-code-migrate`** | `.agent/skills/framework-migration-code-migrate/SKILL.md` | Perencanaan dan eksekusi migrasi kode antar framework, versi library, dan runtime platform. |

### 7. JavaScript, TypeScript & Testing
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`javascript-pro`** | `.agent/skills/javascript-pro/SKILL.md` | Penguasaan JavaScript modern ES6+, async/await, event loops, dan API runtime Node.js. |
| **`modern-javascript-patterns`** | `.agent/skills/modern-javascript-patterns/SKILL.md` | Penerapan functional programming, iterators, generators, destructuring, dan modular JS. |
| **`javascript-typescript-typescript-scaffold`** | `.agent/skills/javascript-typescript-typescript-scaffold/SKILL.md` | Arsitektur dan scaffolding proyek TypeScript modern berskala produksi. |
| **`javascript-testing-patterns`** | `.agent/skills/javascript-testing-patterns/SKILL.md` | Strategi pengujian komprehensif: unit & integration tests (`npm test` dengan 141 skenario uji lulus 100%). |
| **`react-patterns`** | `.agent/skills/react-patterns/SKILL.md` | Pola React 18/19: server/client boundaries, Suspense, custom hooks, dan form actions. |
| **`react-performance`** | `.agent/skills/react-performance/SKILL.md` | Optimasi performa: waterfall elimination via `Promise.all`, bundle splitting, LCP/CLS optimization. |
| **`nextjs-turbopack`** | `.agent/skills/nextjs-turbopack/SKILL.md` | Next.js 16+ dan Turbopack: bundler berkecepatan tinggi, FS caching, dan rute prerendering bersih. |
| **`performance-optimization`** | `.agent/skills/performance-optimization/SKILL.md` | Optimasi performa lintas frontend, backend, queries, database, dan Core Web Vitals. |

### 8. Documentation & C4 Code
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`c4-code`** | `.agent/skills/c4-code/SKILL.md` | Dokumentasi arsitektur tingkat rendah C4 Code Level (signature fungsi, relasi modul). |
| **`code-documentation-doc-generate`** | `.agent/skills/code-documentation-doc-generate/SKILL.md` | Generator dokumentasi API, diagram arsitektur Mermaid, user guides, dan technical docs. |
| **`code-documentation-code-explain`** | `.agent/skills/code-documentation-code-explain/SKILL.md` | Penjelasan naratif konsep kode rumit melalui breakdown visual dan analogi jelas. |

---

## 🛠️ PANDUAN INTEGRASI STACK NEKOSTAY

1. **Backend & Database**: Next.js 16 (App Router) + Supabase PostgreSQL (RLS & Realtime WebSocket CDC).
2. **Domain Architecture**: Modular Services bergaya NestJS di `lib/modules/` (`pricing`, `whatsapp`).
3. **Frontend & Styling**: Tailwind CSS v4, GSAP animations, Lucide Icons, shadcn/ui primitives.
4. **Error Handling & Security**: Empathetic user notifications via `UserErrorAlert`, sanitasi error sensitif database di produksi (OWASP A04/A05), dan proteksi captcha Turnstile.
5. **WhatsApp Gateway**: `@whiskeysockets/baileys` Multi-Device engine dengan chat langsung admin dan auto-reactivation.
6. **Email & Receipt Engine**: Dual-Mode (EmailJS / Resend) + jsPDF cloud receipt streaming.
7. **Testing**: Automated test suite via `npm test` (`scripts/test-suite.mjs`) — **141 / 141 Skenario Uji Lulus 100%**.

Untuk referensi teknis kode dan boilerplate implementasi lengkap, silakan lihat [docs/01-SETUP/skill.md](docs/01-SETUP/skill.md) dan [docs/00-INDEX.md](docs/00-INDEX.md).

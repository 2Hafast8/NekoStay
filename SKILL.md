# SKILL.md — NekoStay Skills & Technical Registry

> Panduan komprehensif seluruh skill teknis dan spesialisasi AI Agent yang terdaftar di project NekoStay.
> Dapat dibaca oleh pengembang (manusia) maupun AI agent (Antigravity, Claude, Copilot, Cursor, dsb.) sebagai referensi kapabilitas sistem.

---

## 📑 DAFTAR ISI

1. [Daftar 26 AI Agent Skills (.agent/skills)](#-daftar-26-ai-agent-skills-agentskills)
   - [Security & Compliance (12 Skills)](#1-security--compliance-keamanan-sistem)
   - [Code Quality & Review (3 Skills)](#2-code-quality--review-kualitas-kode)
   - [Refactoring & Migration (4 Skills)](#3-refactoring--migration)
   - [JavaScript, TypeScript & Testing (4 Skills)](#4-javascript-typescript--testing)
   - [Documentation & Architecture (3 Skills)](#5-documentation--architecture-dokumentasi)
2. [Panduan Integrasi Stack NekoStay](#-panduan-integrasi-stack-nekostay)
   - [Dokumentasi Lengkap Stack Setup](docs/01-SETUP/skill.md)

---

## 🤖 DAFTAR 26 AI AGENT SKILLS (`.agent/skills/`)

### 1. Security & Compliance (Keamanan Sistem)
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`backend-security-coder`** | `.agent/skills/backend-security-coder/SKILL.md` | Praktik backend aman: validasi input, sanitasi, autentikasi, database protection, API security. |
| **`frontend-security-coder`** | `.agent/skills/frontend-security-coder/SKILL.md` | Praktik frontend aman: mitigasi XSS, sanitasi output HTML/JSX, CSP, cookie security. |
| **`frontend-mobile-security-xss-scan`** | `.agent/skills/frontend-mobile-security-xss-scan/SKILL.md` | Pemindaian injeksi Cross-Site Scripting (XSS) pada React/Next.js dan antarmuka web/mobile. |
| **`mobile-security-coder`** | `.agent/skills/mobile-security-coder/SKILL.md` | Pola keamanan aplikasi mobile, WebView hardening, secure token storage di device. |
| **`security-auditor`** | `.agent/skills/security-auditor/SKILL.md` | Audit keamanan menyeluruh: DevSecOps, ancaman OWASP Top 10, OAuth2/OIDC, postur cloud. |
| **`security-compliance-compliance-check`** | `.agent/skills/security-compliance-compliance-check/SKILL.md` | Audit kepatuhan & regulasi perangkat lunak (GDPR, HIPAA, SOC2, PCI-DSS). |
| **`security-requirement-extraction`** | `.agent/skills/security-requirement-extraction/SKILL.md` | Penurunan kebutuhan keamanan dari threat models menjadi user stories dan test cases teruji. |
| **`security-scanning-security-dependencies`** | `.agent/skills/security-scanning-security-dependencies/SKILL.md` | Pemindaian kerentanan dependensi npm/node_modules, SBOM generation, supply chain security. |
| **`security-scanning-security-hardening`** | `.agent/skills/security-scanning-security-hardening/SKILL.md` | Koordinasi pengerasan keamanan multi-layer (aplikasi, infrastruktur database, control access). |
| **`security-scanning-security-sast`** | `.agent/skills/security-scanning-security-sast/SKILL.md` | Static Application Security Testing (SAST) untuk deteksi kerentanan kode otomatis. |
| **`k8s-security-policies`** | `.agent/skills/k8s-security-policies/SKILL.md` | Penerapan kebijakan keamanan Kubernetes (NetworkPolicy, PodSecurity, RBAC). |
| **`solidity-security`** | `.agent/skills/solidity-security/SKILL.md` | Audit dan best practices keamanan smart contract Solidity & blockchain security. |

### 2. Code Quality & Review (Kualitas Kode)
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`code-reviewer`** | `.agent/skills/code-reviewer/SKILL.md` | Analisis kode modern, deteksi potensi bug, optimasi performa, keandalan produksi. |
| **`code-review-excellence`** | `.agent/skills/code-review-excellence/SKILL.md` | Standar review pull request berkualitas tinggi, feedback konstruktif, dan transfer knowledge. |
| **`code-review-ai-ai-review`** | `.agent/skills/code-review-ai-ai-review/SKILL.md` | Review cerdas berbasis AI terintegrasi automated static analysis dan DevOps workflows. |

### 3. Refactoring & Migration
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`code-refactoring-refactor-clean`** | `.agent/skills/code-refactoring-refactor-clean/SKILL.md` | Penerapan Clean Code, prinsip SOLID, design patterns modern, dan modularitas tinggi. |
| **`code-refactoring-tech-debt`** | `.agent/skills/code-refactoring-tech-debt/SKILL.md` | Identifikasi, kuantifikasi, dan prioritas perbaikan utang teknis (technical debt). |
| **`code-refactoring-context-restore`** | `.agent/skills/code-refactoring-context-restore/SKILL.md` | Pemulihan dan pemeliharaan konteks sistem saat melakukan refactoring skala besar. |
| **`framework-migration-code-migrate`** | `.agent/skills/framework-migration-code-migrate/SKILL.md` | Perencanaan dan eksekusi migrasi kode antar framework, versi library, dan runtime platform. |

### 4. JavaScript, TypeScript & Testing
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`javascript-pro`** | `.agent/skills/javascript-pro/SKILL.md` | Penguasaan JavaScript modern ES6+, async/await, event loops, dan API runtime Node.js. |
| **`modern-javascript-patterns`** | `.agent/skills/modern-javascript-patterns/SKILL.md` | Penerapan functional programming, iterators, generators, destructuring, dan modular JS. |
| **`javascript-typescript-typescript-scaffold`** | `.agent/skills/javascript-typescript-typescript-scaffold/SKILL.md` | Arsitektur dan scaffolding proyek TypeScript modern berskala produksi. |
| **`javascript-testing-patterns`** | `.agent/skills/javascript-testing-patterns/SKILL.md` | Strategi pengujian komprehensif: unit/integration test (Node.js runner, Jest, TDD). |

### 5. Documentation & Architecture (Dokumentasi)
| Skill | Lokasi Path | Deskripsi & Fokus Utama |
|---|---|---|
| **`c4-code`** | `.agent/skills/c4-code/SKILL.md` | Dokumentasi arsitektur tingkat rendah C4 Code Level (signature fungsi, relasi modul). |
| **`code-documentation-doc-generate`** | `.agent/skills/code-documentation-doc-generate/SKILL.md` | Generator dokumentasi API, diagram arsitektur Mermaid, user guides, dan technical docs. |
| **`code-documentation-code-explain`** | `.agent/skills/code-documentation-code-explain/SKILL.md` | Penjelasan naratif konsep kode rumit melalui breakdown visual dan analogi jelas. |

---

## 🛠️ PANDUAN INTEGRASI STACK NEKOSTAY

1. **Backend & Database**: Next.js 16 (App Router) + Supabase PostgreSQL (RLS & Realtime WebSocket CDC).
2. **Frontend & Styling**: Tailwind CSS v4, GSAP / Anime.js animations, Lucide Icons, shadcn/ui primitives.
3. **WhatsApp Gateway**: `lily-baileys` Multi-Device engine with Supabase cloud state sync.
4. **Email & Receipt Engine**: Dual-Mode (EmailJS / Resend) + jsPDF cloud receipt streaming.
5. **Testing**: Automated test suite via `npm test` (`scripts/test-suite.mjs`).

Untuk referensi teknis kode dan boilerplate implementasi lengkap, silakan lihat [docs/01-SETUP/skill.md](docs/01-SETUP/skill.md) dan [docs/00-INDEX.md](docs/00-INDEX.md).

<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md — NekoStay AI Agent Configuration & 26 Skills Registry

> Panduan konfigurasi dan integrasi AI Agent untuk pengembangan platform NekoStay (Next.js 16.2.6 App Router & React 19).

---

## 🤖 REGISTRY 26 AI AGENT SKILLS (.agent/skills/)

### 1. Security & Compliance (12 Skills)
1. **`backend-security-coder`**: Penerapan validasi input Zod, proteksi injection database, dan otorisasi API ketat.
2. **`frontend-security-coder`**: Sanitasi output JSX/HTML, penanganan file upload aman, dan CSP browser headers.
3. **`frontend-mobile-security-xss-scan`**: Pemindaian kerentanan XSS pada antarmuka web dan mobile responsive.
4. **`mobile-security-coder`**: Pola aman tampilan mobile, token handling, dan navigasi bottom tab bar.
5. **`security-auditor`**: Audit keamanan OWASP Top 10, DevSecOps, dan evaluasi postur cloud Supabase.
6. **`security-compliance-compliance-check`**: Kepatuhan standar privasi data (GDPR / UU PDP).
7. **`security-requirement-extraction`**: Penerjemahan skenario ancaman keamanan menjadi pengujian kode.
8. **`security-scanning-security-dependencies`**: Audit dependensi npm dan supply chain security.
9. **`security-scanning-security-hardening`**: Pengerasan keamanan multi-layer (Next.js headers, RLS, middleware).
10. **`security-scanning-security-sast`**: Static Application Security Testing pada pola kode API dan model.
11. **`k8s-security-policies`**: Referensi tata kelola container dan deployment aman.
12. **`solidity-security`**: Panduan integritas data dan cryptographic audit.

### 2. Code Quality & Review (3 Skills)
13. **`code-reviewer`**: Deteksi potensi bug, optimasi performa, dan keandalan produksi.
14. **`code-review-excellence`**: Standar review pull request berkualitas tinggi dan feedback konstruktif.
15. **`code-review-ai-ai-review`**: Review otomatis berbasis pattern recognition cerdas.

### 3. Refactoring & Migration (4 Skills)
16. **`code-refactoring-refactor-clean`**: Clean Code, prinsip SOLID, modularitas tinggi di folder `lib/`.
17. **`code-refactoring-tech-debt`**: Pembersihan technical debt dan penghapusan kode duplikasi.
18. **`code-refactoring-context-restore`**: Pemeliharaan konteks sistem saat refactoring skala besar.
19. **`framework-migration-code-migrate`**: Pola migrasi framework Next.js 16 App Router dan React 19.

### 4. JavaScript, TypeScript & Testing (4 Skills)
20. **`javascript-pro`**: Penguasaan async/await ES6+, stream handling, dan API runtime Node.js.
21. **`modern-javascript-patterns`**: Destructuring, immutability, dan JSDoc type annotations.
22. **`javascript-typescript-typescript-scaffold`**: Modular scaffold dan type safety via `jsconfig.json`.
23. **`javascript-testing-patterns`**: Test runner otomatis (`scripts/test-suite.mjs` / `npm test`).

### 5. Documentation & Architecture (3 Skills)
24. **`c4-code`**: Dokumentasi arsitektur C4 Code Level ([`docs/C4-ARCHITECTURE.md`](../C4-ARCHITECTURE.md)).
25. **`code-documentation-doc-generate`**: Spesifikasi 30 API Endpoints ([`docs/API-SPECIFICATION.md`](../API-SPECIFICATION.md)).
26. **`code-documentation-code-explain`**: Penjelasan naratif konsep bisnis dan alur sistem.

---

## ⚡ NEXT.JS 16 & REACT 19 AGENT RULES
* **Dynamic Route Params**: Di Next.js 16, `params` pada route handler adalah `Promise`, selalu gunakan `const { id } = await params`.
* **Cookies in Server Components**: Selalu gunakan `const cookieStore = await cookies()`.
* **Server Components by Default**: Gunakan `'use client'` hanya untuk komponen interaktif dengan hooks (`useState`, `useEffect`, `useRouter`, dsb.).
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md — NekoStay AI Agent Configuration & Skills Registry

> Panduan konfigurasi dan integrasi AI Agent untuk pengembangan platform NekoStay (Next.js 16.2.6 App Router & React 19).

---

## 🤖 REGISTRY AI AGENT SKILLS (.agent/skills/)

### 1. Security & Compliance
1. **`backend-security-coder`**: Penerapan validasi input Zod, in-memory rate limiter, proteksi injection database, dan otorisasi API ketat.
2. **`frontend-security-coder`**: Sanitasi output JSX/HTML, penanganan upload file MIME allowlist, dan CSP browser headers anti-clickjacking.
3. **`frontend-mobile-security-xss-scan`**: Pemindaian kerentanan XSS pada antarmuka web dan mobile responsive.
4. **`mobile-security-coder`**: Pola aman tampilan mobile, token handling, dan navigasi bottom tab bar.
5. **`security-auditor`**: Audit keamanan OWASP Top 10, DevSecOps, dan evaluasi postur cloud Supabase.
6. **`security-compliance-compliance-check`**: Kepatuhan standar privasi data (GDPR / UU PDP).
7. **`security-requirement-extraction`**: Penerjemahan skenario ancaman keamanan menjadi pengujian kode.
8. **`security-scanning-security-dependencies`**: Audit dependensi npm dan supply chain security.
9. **`security-scanning-security-hardening`**: Pengerasan keamanan multi-layer (Next.js headers, RLS, middleware).
10. **`security-scanning-security-sast`**: Static Application Security Testing pada pola kode API dan model.
11. **`security-review`**: Checklists dan pola pengamanan transaksi, webhook Midtrans, dan secrets.
12. **`k8s-security-policies`**: Referensi tata kelola container dan deployment aman.
13. **`solidity-security`**: Panduan integritas data dan cryptographic audit.

### 2. Performance & Frontend Patterns
14. **`react-performance`**: Eliminasi waterfall database queries (`Promise.all`), optimizePackageImports tree shaking, React 19 zero cascading re-render, Next.js Image LCP priority.
15. **`react-patterns`**: Server & Client Component boundaries, clean hooks discipline, accessibility.
16. **`nextjs-turbopack`**: Optimasi build bundling Turbopack, FS caching, dan dynamic routing.
17. **`performance-optimization`**: Profiling bottleneck, eliminasi query N+1, dan kalkulasi single-pass $O(n)$.

### 3. UI, Styling & Anti-Slop
18. **`tailwind-design-system`**: Standar Tailwind CSS v4, design tokens, dan CSS-first configuration.
19. **`tailwind-patterns`**: Container queries dan modern utility classes.
20. **`ui-styling`**: shadcn/ui component library, glassmorphism, dan tema adaptif dark/light mode.
21. **`ui-ux-pro-max`**: Design intelligence, typography scales, dan mobile responsiveness.
22. **`antislop` / `antislop-code`**: Comment hygiene, eliminasi komentar AI generik, dan clean coding practices.
23. **`clean-code`**: Standar kode pragmatis tanpa over-engineering.

### 4. Code Quality & Review
24. **`code-reviewer`**: Deteksi potensi bug, optimasi performa, dan keandalan produksi.
25. **`code-review-excellence`**: Standar review pull request berkualitas tinggi dan feedback konstruktif.
26. **`code-review-ai-ai-review`**: Review otomatis berbasis pattern recognition cerdas.
27. **`git-workflow`**: Conventional commits, branch management, rebase/merge flow, dan release tags.

### 5. Refactoring, Database & Architecture
28. **`code-refactoring-refactor-clean`**: Clean Code, prinsip SOLID, modularitas tinggi di folder `lib/`.
29. **`code-refactoring-tech-debt`**: Pembersihan technical debt dan penghapusan kode duplikasi.
30. **`code-refactoring-context-restore`**: Pemeliharaan konteks sistem saat refactoring skala besar.
31. **`framework-migration-code-migrate`**: Pola migrasi framework Next.js 16 App Router dan React 19.
32. **`database-design` / `database-migrations`**: Desain skema relational, indexing strategi, dan migrasi Supabase.
33. **`postgres-patterns`**: Optimasi query PostgreSQL dan RLS policy best practices.
34. **`system-design` / `software-architecture`**: Pemodelan arsitektur pet hotel, domain boundary, dan event handling.

### 6. JavaScript & Testing
35. **`javascript-pro`**: Penguasaan async/await ES6+, stream handling, dan API runtime Node.js.
36. **`modern-javascript-patterns`**: Destructuring, immutability, dan JSDoc type annotations.
37. **`javascript-typescript-typescript-scaffold`**: Modular scaffold dan type safety via `jsconfig.json`.
38. **`javascript-testing-patterns`**: Test runner otomatis 76 skenario (`scripts/test-suite.mjs` / `npm test`).

### 7. Documentation & C4
39. **`c4-code`**: Dokumentasi arsitektur C4 Code Level ([`docs/C4-ARCHITECTURE.md`](../C4-ARCHITECTURE.md)).
40. **`code-documentation-doc-generate`**: Spesifikasi 31 API Endpoints ([`docs/API-SPECIFICATION.md`](../API-SPECIFICATION.md)).
41. **`code-documentation-code-explain`**: Penjelasan naratif konsep bisnis dan alur sistem.

---

## ⚡ NEXT.JS 16 & REACT 19 AGENT RULES
* **Dynamic Route Params**: Di Next.js 16, `params` pada route handler adalah `Promise`, selalu gunakan `const { id } = await params`.
* **Cookies in Server Components**: Selalu gunakan `const cookieStore = await cookies()`.
* **Server Components by Default**: Gunakan `'use client'` hanya untuk komponen interaktif dengan hooks (`useState`, `useEffect`, `useRouter`, dsb.).
<!-- END:nextjs-agent-rules -->

# 🏗️ 02-ARCHITECTURE — Desain & Arsitektur Sistem

Folder ini berisi dokumentasi tentang desain teknis, arsitektur sistem, dan keamanan database.

---

## 📚 Files in This Folder

### 1️⃣ [NekoStay_Technical_Design.md](./NekoStay_Technical_Design.md) — **Desain Teknis Lengkap**
**Untuk apa**: Blueprint lengkap sistem NekoStay  
**Isi**: Tech stack, architecture diagram, workflow, database schema, API specification  
**Baca kapan**: Memahami sistem secara menyeluruh, atau saat code review  
**Estimasi**: 45 menit membaca

**Apa yang ada di dalamnya**:
- Technology stack overview
- System architecture
- Database design details
- API endpoints specification
- User workflows
- Booking pricing system
- Notification system
- Email integration
- Security overview

---

### 2️⃣ [design.md](./design.md) — **UI/UX Design System**
**Untuk apa**: Design system untuk konsistensi UI dan styling  
**Isi**: Warna, typography, components, responsive design, dark mode  
**Baca kapan**: Saat membuat atau styling komponen  
**Estimasi**: 20 menit membaca

**Apa yang ada di dalamnya**:
- Color palette & brand colors
- Typography system
- Component library overview
- Responsive design guidelines
- Dark mode specifications
- Accessibility guidelines
- Animation & interaction guidelines

---

### 3️⃣ [RLS_POLICIES.md](./RLS_POLICIES.md) — **Keamanan Database (Row-Level Security)**
**Untuk apa**: SQL policies untuk mengamankan data di Supabase  
**Isi**: Complete RLS policies untuk semua tabel, ready to copy-paste  
**Baca kapan**: Sebelum go-live, atau saat setup database security  
**Estimasi**: 15 menit (untuk understand), 2 menit (untuk execute)

**Apa yang ada di dalamnya**:
- Explanation of RLS (Row-Level Security)
- Policies untuk tabel `profiles`
- Policies untuk tabel `bookings`
- Policies untuk tabel `cat_reports`
- Policies untuk tabel `notifications`
- Policies untuk tabel `classes`
- Step-by-step execution instructions
- Security best practices

**PENTING**: File ini berisi SQL queries yang HARUS dijalankan di Supabase SQL Editor sebelum testing! ⚠️

---

## 🎯 USE CASES

### "Aku pengin memahami sistem secara keseluruhan"
→ Baca: **NekoStay_Technical_Design.md**

### "Aku pengin mengerti workflow booking dari A-Z"
→ Baca: **NekoStay_Technical_Design.md** (Booking Workflow section)

### "Aku pengin tahu database structure"
→ Baca: **NekoStay_Technical_Design.md** (Database Schema section)

### "Aku pengin tahu API endpoints apa saja"
→ Baca: **NekoStay_Technical_Design.md** (API Specification section)

### "Aku pengin styling guidelines untuk komponen baru"
→ Baca: **design.md**

### "Aku mau setup RLS untuk security"
→ Baca: **RLS_POLICIES.md** (dan execute SQL-nya)

### "Aku pengin review code sebelum testing"
→ Baca: **NekoStay_Technical_Design.md** (untuk understand architecture)

---

## 📖 Recommended Reading Order

**Untuk Architects/Lead Developers:**
1. [NekoStay_Technical_Design.md](./NekoStay_Technical_Design.md) ← Full understanding
2. [RLS_POLICIES.md](./RLS_POLICIES.md) ← Security setup
3. [design.md](./design.md) ← Design consistency

**Untuk Frontend Developers:**
1. [NekoStay_Technical_Design.md](./NekoStay_Technical_Design.md) (skim API & DB sections)
2. [design.md](./design.md) ← Focus here
3. [RLS_POLICIES.md](./RLS_POLICIES.md) (skim, understand security)

**Untuk Backend/Full-Stack Developers:**
1. [NekoStay_Technical_Design.md](./NekoStay_Technical_Design.md) ← Focus here
2. [RLS_POLICIES.md](./RLS_POLICIES.md) ← Security setup
3. [design.md](./design.md) (skim for API response structure)

---

## 🔐 CRITICAL: RLS Policies Setup

⚠️ **BEFORE TESTING**: RLS Policies MUST be applied to Supabase!

**Steps**:
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content from [RLS_POLICIES.md](./RLS_POLICIES.md)
4. Paste into SQL Editor
5. Execute ("Run" button)
6. Verify all policies created (see execution output)

**Why**: Without RLS, users can access other users' data. This is a CRITICAL security step!

See [RLS_POLICIES.md](./RLS_POLICIES.md) for detailed instructions.

---

## 💾 FILES AT A GLANCE

| File | Size | Read Time | Priority | Action |
|------|------|-----------|----------|--------|
| NekoStay_Technical_Design.md | Large | 45 min | 🔴 HIGH | Read |
| design.md | Medium | 20 min | 🟡 MEDIUM | Read |
| RLS_POLICIES.md | Medium | 15 min | 🔴 HIGH | Read + Execute SQL |

---

## 🔍 KEY SECTIONS

### Database Schema
→ See: **NekoStay_Technical_Design.md** (Database Schema section)

### API Endpoints
→ See: **NekoStay_Technical_Design.md** (API Specification section)

### User Workflows
→ See: **NekoStay_Technical_Design.md** (Workflow sections)

### Component Styling
→ See: **design.md**

### Security Policies
→ See: **RLS_POLICIES.md**

---

## 🔗 Next Steps

After understanding architecture:
- **[03-IMPLEMENTATION](../03-IMPLEMENTATION/)** — See what's been built
- **[04-TESTING](../04-TESTING/)** — Run test scenarios
- **[05-DEPLOYMENT](../05-DEPLOYMENT/)** — Go to production

---

## 📋 Checklist Before Moving Forward

- [ ] Read NekoStay_Technical_Design.md
- [ ] Understand database schema
- [ ] Know all API endpoints
- [ ] Read design.md for styling
- [ ] Copy RLS policies to Supabase (⚠️ CRITICAL)
- [ ] Verify RLS policies executed successfully

---

**📍 You are here**: 02-ARCHITECTURE  
**Back to**: [📚 Main Index](../00-INDEX.md)

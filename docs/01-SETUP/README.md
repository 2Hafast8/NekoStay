# 📋 01-SETUP — Persiapan & Konfigurasi

Folder ini berisi dokumentasi untuk setup awal project dan konfigurasi tools yang digunakan.

---

## 📚 Files in This Folder

### 1️⃣ [claude.md](./claude.md) — **Konteks Proyek untuk Claude**
**Untuk apa**: File konteks khusus yang dibaca Claude Code untuk memahami project  
**Isi**: Identitas proyek, role users, struktur database, API endpoints, key information  
**Baca kapan**: Sebelum ngoding, atau saat perlu refresh konteks  
**Estimasi**: 15 menit membaca

**Apa yang ada di dalamnya**:
- Identitas proyek: nama, teknologi, framework
- Peran pengguna: `user` (pemilik kucing) vs `admin` (pengelola)
- Struktur database ringkas
- API endpoints
- Instruksi routing & styling
- Rules & best practices

---

### 2️⃣ [AGENTS.md](./AGENTS.md) — **Konfigurasi Agent & Rules**
**Untuk apa**: Setup agent customization dan rules untuk development  
**Isi**: Agent rules, kontrol behavior AI, custom instructions  
**Baca kapan**: Setup awal atau saat mau customize AI behavior  
**Estimasi**: 5 menit membaca

**Apa yang ada di dalamnya**:
- Agent customization rules
- Next.js version info
- Development guidelines

---

### 3️⃣ [skill.md](./skill.md) — **Technical Skills Guide**
**Untuk apa**: Panduan implementasi teknis untuk setiap teknologi yang digunakan  
**Isi**: Pola kode, contoh implementasi, best practices per teknologi  
**Baca kapan**: Saat coding, atau saat stuck dengan implementasi  
**Estimasi**: 30 menit membaca (selective reading)

**Apa yang ada di dalamnya**:
- Next.js App Router patterns
- Supabase (Database, Auth, Storage, Realtime)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Resend Email
- date-fns
- Vercel deployment
- Common patterns used in this project

---

### 4️⃣ [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — **Roadmap Pengembangan**
**Untuk apa**: Timeline dan roadmap development project  
**Isi**: Tahapan development, estimasi waktu, dependencies  
**Baca kapan**: Planning atau saat perlu tahu timeline  
**Estimasi**: 10 menit membaca

**Apa yang ada di dalamnya**:
- Development phases
- Timeline estimates
- Dependencies
- Milestones

---

## 🎯 QUICK NAVIGATION

### "Aku mau mulai ngoding"
→ Baca: **skill.md** (technical patterns)  
→ Kemudian: **claude.md** (project context)

### "Aku baru pertama kali"
→ Baca: **claude.md** (identitas & struktur)  
→ Kemudian: **DEVELOPMENT_PLAN.md** (timeline)  
→ Kemudian: **skill.md** (patterns)

### "Aku mau setup custom rules"
→ Baca: **AGENTS.md**

### "Aku mau tahu roadmap development"
→ Baca: **DEVELOPMENT_PLAN.md**

---

## 📖 Recommended Reading Order

1. **Start**: [claude.md](./claude.md) ← Understand project identity
2. **Then**: [skill.md](./skill.md) ← Learn coding patterns
3. **Optional**: [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) ← Know the timeline
4. **Reference**: [AGENTS.md](./AGENTS.md) ← For AI configuration

---

## 💾 FILES AT A GLANCE

| File | Size | Read Time | Priority |
|------|------|-----------|----------|
| claude.md | Medium | 15 min | 🔴 HIGH |
| skill.md | Large | 30 min | 🟡 MEDIUM |
| DEVELOPMENT_PLAN.md | Small | 10 min | 🟡 MEDIUM |
| AGENTS.md | Small | 5 min | 🟢 LOW |

---

## 🔗 Next Steps

After reading setup docs, continue to:
- **[02-ARCHITECTURE](../02-ARCHITECTURE/)** — Understand system design
- **[03-IMPLEMENTATION](../03-IMPLEMENTATION/)** — See what's been built

---

**📍 You are here**: 01-SETUP  
**Back to**: [📚 Main Index](../00-INDEX.md)

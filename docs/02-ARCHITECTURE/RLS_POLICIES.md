# Supabase RLS Policies Setup — NekoStay

Dokumentasi ini menjelaskan Row Level Security (RLS) policies yang harus disetup di Supabase untuk project NekoStay.

## Prerequisites
- Supabase project sudah dibuat
- Tabel-tabel sudah dibuat: `profiles`, `bookings`, `cat_reports`, `notifications`, `classes`
- RLS sudah diaktifkan di setiap tabel

## 1. Policies untuk Tabel `profiles`

### Policy: "Users can read their own profile"
```sql
CREATE POLICY "Users can read their own profile" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);
```

### Policy: "Users can update their own profile"
```sql
CREATE POLICY "Users can update their own profile" ON "public"."profiles"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);
```

### Policy: "Public can read profiles (limited)"
```sql
CREATE POLICY "Public can read all profiles" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
```

---

## 2. Policies untuk Tabel `bookings`

### Policy: "Users can read their own bookings"
```sql
CREATE POLICY "Users can read their own bookings" ON "public"."bookings"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

### Policy: "Users can create bookings"
```sql
CREATE POLICY "Users can create bookings" ON "public"."bookings"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);
```

### Policy: "Users can update their own bookings (limited)"
```sql
CREATE POLICY "Users can update their own bookings" ON "public"."bookings"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK (
  (SELECT auth.uid()) = user_id 
  AND status IN ('Menunggu', 'Aktif')
);
```

### Policy: "Admins can read all bookings"
```sql
CREATE POLICY "Admins can read all bookings" ON "public"."bookings"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### Policy: "Admins can update booking status"
```sql
CREATE POLICY "Admins can update bookings" ON "public"."bookings"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 3. Policies untuk Tabel `cat_reports`

### Policy: "Users can read reports for their bookings"
```sql
CREATE POLICY "Users can read their cat reports" ON "public"."cat_reports"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = cat_reports.booking_id
    AND bookings.user_id = auth.uid()
  )
);
```

### Policy: "Admins can create and update cat reports"
```sql
CREATE POLICY "Admins can create cat reports" ON "public"."cat_reports"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### Policy: "Admins can update cat reports"
```sql
CREATE POLICY "Admins can update cat reports" ON "public"."cat_reports"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 4. Policies untuk Tabel `notifications`

### Policy: "Users can read their own notifications"
```sql
CREATE POLICY "Users can read their notifications" ON "public"."notifications"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

### Policy: "Users can delete their own notifications"
```sql
CREATE POLICY "Users can delete their notifications" ON "public"."notifications"
AS PERMISSIVE FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

### Policy: "System can create notifications"
```sql
CREATE POLICY "System can create notifications" ON "public"."notifications"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);
```

---

## 5. Policies untuk Tabel `classes`

### Policy: "Everyone can read classes"
```sql
CREATE POLICY "Public can read classes" ON "public"."classes"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
```

---

## Implementation Steps

1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com
   - Pilih project NekoStay

2. **Navigate ke SQL Editor**
   - Klik "SQL Editor" di sidebar kiri

3. **Copy-paste semua policies di atas**
   - Paste masing-masing policy ke SQL Editor
   - Klik "Run" untuk setiap query

4. **Verifikasi Policies**
   - Navigate ke "Authentication" → "Policies"
   - Cek bahwa semua policies sudah terbuat dengan benar

5. **Test dengan Aplikasi**
   - Test akses data user
   - Test akses admin
   - Pastikan tidak ada error permission denied

---

## Testing Checklist

- [ ] User dapat membaca profil sendiri
- [ ] User dapat mengupdate profil sendiri
- [ ] User tidak dapat membaca profil user lain
- [ ] User dapat membuat booking
- [ ] User dapat membaca booking sendiri
- [ ] User tidak dapat membaca booking user lain
- [ ] User dapat update booking (cancel) saat status Menunggu/Aktif
- [ ] Admin dapat membaca semua bookings
- [ ] Admin dapat update status booking
- [ ] User dapat membaca laporan untuk booking sendiri
- [ ] User tidak dapat membaca laporan booking user lain
- [ ] Admin dapat membuat dan update laporan
- [ ] User dapat membaca notifikasi sendiri
- [ ] User dapat delete notifikasi sendiri
- [ ] Everyone dapat membaca class list

---

## Security Notes

⚠️ **PENTING**: 
- RLS policies adalah lapisan pertama keamanan
- Selalu validasi di API Routes (server-side)
- Gunakan `SUPABASE_SERVICE_ROLE_KEY` untuk operasi admin di backend
- Jangan expose service role key ke frontend
- Selalu implement authentication checks di API Routes


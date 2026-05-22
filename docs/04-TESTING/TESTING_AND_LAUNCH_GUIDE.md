# 🧪 NekoStay — Complete Testing & Launch Guide

**Last Updated**: May 21, 2026  
**Status**: Ready for Testing Phase  
**Estimated Testing Time**: 4-6 hours  
**Estimated Launch Time**: 2-3 weeks

---

## 📋 PRE-TESTING SETUP (Required)

### Step 1: Apply RLS Policies to Supabase (1-2 hours)

```sql
-- 1. Go to Supabase Dashboard
-- 2. Click "SQL Editor"
-- 3. Click "+ New Query"
-- 4. Copy ENTIRE content from RLS_POLICIES.md
-- 5. Paste into editor
-- 6. Click "Run"
-- 7. Verify all policies are created

-- Quick check:
SELECT * FROM information_schema.table_privileges 
WHERE table_name IN ('profiles', 'bookings', 'cat_reports', 'notifications', 'classes');
```

### Step 2: Setup Storage Bucket (30 minutes)

```
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: cat-photos
4. Set to Private ✓
5. Click Create
6. Go to bucket → Policies
7. Add policy:
   - FOR INSERT: bucket_id = 'cat-photos' and auth.uid() = (select user_id from bookings where id = (select booking_id from storage.objects where name = storage.objects.name limit 1))
   - FOR SELECT: bucket_id = 'cat-photos'
```

### Step 3: Verify Environment Setup

```bash
# Check .env.local has all keys:
echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
echo "RESEND_API_KEY=$RESEND_API_KEY"

# Should show actual keys, not empty
```

---

## 🧪 MANUAL TESTING CHECKLIST (20 Scenarios)

### GROUP 1: Authentication (5 tests)

#### Test 1: Register New User
```
Steps:
1. Go to http://localhost:3000/register
2. Fill in:
   - Full Name: "Test User"
   - Email: "testuser@example.com"
   - Phone: "081234567890"
   - Password: "TestPassword123"
3. Click "Register"

Expected:
- ✅ User created successfully
- ✅ Redirected to login page
- ✅ Can see success message
- ✅ User is in Supabase auth.users
- ✅ Profile created in profiles table with role='user'
```

#### Test 2: Email Verification (if enabled)
```
Steps:
1. Check email inbox for verification email
2. Click verification link

Expected:
- ✅ Email received from Supabase
- ✅ Link works and marks email as verified
```

#### Test 3: Login with Correct Credentials
```
Steps:
1. Go to /login
2. Enter: testuser@example.com / TestPassword123
3. Click "Masuk"

Expected:
- ✅ Login successful
- ✅ Redirected to /dashboard
- ✅ Session cookie created
- ✅ User menu shows user name
```

#### Test 4: Login with Wrong Password
```
Steps:
1. Go to /login
2. Enter: testuser@example.com / WrongPassword
3. Click "Masuk"

Expected:
- ✅ Shows error toast: "Email atau password salah"
- ✅ Not logged in
- ✅ Still on /login page
```

#### Test 5: Logout
```
Steps:
1. Click user profile icon → Logout
2. Try to access /dashboard

Expected:
- ✅ Logged out successfully
- ✅ Redirected to /login
- ✅ Session cleared
```

---

### GROUP 2: Booking Creation (5 tests)

#### Test 6: Create Booking with Valid Data
```
Steps:
1. Login as test user
2. Go to /booking/new
3. Fill in ALL fields:
   - Cat Name: "Fluffy"
   - Gender: "Betina"
   - Age: "2 tahun"
   - Health: "Sehat"
   - Favorite Food: "Whiskas"
   - Pregnant: No
   - Notes: "Sangat aktif"
   - Photo: Upload any image < 5MB
   - Class: "Standard"
   - Check-in: Tomorrow
   - Check-out: 3 days from today
4. Click "Pesan Sekarang"

Expected:
- ✅ Form validates successfully
- ✅ Photo uploads (see preview)
- ✅ Price calculator shows total
- ✅ Booking created in database
- ✅ Status = "Menunggu"
- ✅ Redirected to /booking/[id]
- ✅ Confirmation email sent to user
- ✅ Can see booking details page
```

#### Test 7: Booking Form Validation
```
Steps:
1. Go to /booking/new
2. Leave some fields empty:
   - Leave "Cat Name" empty
   - Leave "Check-in" empty
3. Click "Pesan Sekarang"

Expected:
- ✅ Shows validation errors for each field
- ✅ Error messages in Indonesian
- ✅ Form not submitted
- ✅ Errors clear when fields filled
```

#### Test 8: Invalid Date Validation
```
Steps:
1. Go to /booking/new
2. Select:
   - Check-in: June 1
   - Check-out: May 31 (before check-in)
3. Click "Pesan Sekarang"

Expected:
- ✅ Error: "Tanggal keluar harus setelah tanggal masuk"
- ✅ Form not submitted
```

#### Test 9: Photo Upload Validation
```
Steps:
1. Go to /booking/new
2. Try to upload file > 5MB (or use any file)
3. Verify photo appears in preview

Expected:
- ✅ Photo uploads successfully
- ✅ Preview shown
- ✅ Correct dimensions
```

#### Test 10: Price Calculator
```
Steps:
1. Go to /booking/new
2. Select:
   - Class: "Standard" (Rp 80.000/hari)
   - Check-in: June 1
   - Check-out: June 4 (3 hari)
3. Check price display

Expected:
- ✅ Shows: 3 hari × Rp 80.000 = Rp 240.000
- ✅ Correct calculation
- ✅ Currency formatted correctly
```

---

### GROUP 3: Admin Actions (5 tests)

#### Test 11: Admin Confirm Booking
```
Setup:
- Login as different user
- Create a booking
- Logout

Steps:
1. Login as admin user (make sure role='admin' in profiles)
2. Go to /admin/dashboard
3. See the pending booking in table
4. Click on booking
5. Click "Konfirmasi Pesanan"

Expected:
- ✅ Status changes from "Menunggu" → "Aktif"
- ✅ Status update email sent to user
- ✅ Notification created for user
- ✅ Can see in admin dashboard
```

#### Test 12: Admin Reject Booking with Reason
```
Setup:
- Create another booking as regular user

Steps:
1. Login as admin
2. Go to /admin/dashboard
3. Click on pending booking
4. Click "Tolak Pesanan"
5. Enter reason: "Kapasitas penuh saat ini"
6. Click submit

Expected:
- ✅ Status changes to "Dibatalkan"
- ✅ Reason saved in database (reject_reason)
- ✅ Rejection email sent with reason
- ✅ Notification to user
```

#### Test 13: Admin Send Cat Report
```
Setup:
- Have an "Aktif" booking

Steps:
1. Login as admin
2. Go to /admin/bookings/[id] for active booking
3. Fill report form:
   - Health Status: "Sehat"
   - Photo: Upload image
   - Notes: "Kucing sehat, aktif bermain"
4. Click "Kirim Laporan"

Expected:
- ✅ Report saved in cat_reports table
- ✅ Report date set to today
- ✅ Notification sent to user
- ✅ Email sent with report
- ✅ Photo stored in Supabase Storage
- ✅ Report visible in /admin/reports
```

#### Test 14: View Admin Dashboard
```
Steps:
1. Login as admin
2. Go to /admin/dashboard

Expected:
- ✅ Shows stats (Total, Menunggu, Aktif, Selesai)
- ✅ Numbers are correct
- ✅ Booking table loads
- ✅ Filter by status works
- ✅ Real-time updates
```

#### Test 15: Mark Booking as Complete
```
Setup:
- Have an "Aktif" booking

Steps:
1. Login as admin
2. Go to /admin/bookings/[id]
3. Click "Selesaikan Pesanan"

Expected:
- ✅ Status changes to "Selesai"
- ✅ Completion email sent to user
- ✅ Notification created
- ✅ Dashboard stats updated
```

---

### GROUP 4: User Features (5 tests)

#### Test 16: View Booking Details
```
Steps:
1. Login as regular user
2. Go to /dashboard
3. Click on a booking
4. View /booking/[id]

Expected:
- ✅ All booking info displayed
- ✅ Cat photo shown
- ✅ Status badge visible
- ✅ Price breakdown shown
- ✅ Can see cat reports if any
- ✅ Can see notifications
```

#### Test 17: Cancel Booking
```
Setup:
- Have a "Menunggu" or "Aktif" booking

Steps:
1. Go to /booking/[id]
2. Click "Batalkan Pesanan"
3. Enter reason: "Rencana berubah"
4. Click submit

Expected:
- ✅ Status changes to "Dibatalkan"
- ✅ Reason saved (cancel_reason)
- ✅ Notification created
- ✅ Confirmation in UI
```

#### Test 18: View Notifications
```
Steps:
1. Go to /notifications
2. Should see:
   - Booking created notification
   - Status change notifications
   - Report notifications
   - etc

Expected:
- ✅ All notifications listed
- ✅ Can mark as read
- ✅ Click notification goes to booking
- ✅ Real-time updates work
```

#### Test 19: View User Profile
```
Steps:
1. Go to /profile
2. See user data

Expected:
- ✅ Full name shown
- ✅ Email shown
- ✅ Phone shown
- ✅ Can edit profile
- ✅ Changes saved
```

#### Test 20: Email Reception
```
Steps:
1. Create booking
2. Check email inbox (or Resend logs)

Expected:
- ✅ Booking confirmation email received
- ✅ Email shows:
  - Cat name
  - Class
  - Dates
  - Total cost
  - Link to booking
- ✅ Email template looks professional
```

---

## 🔍 AUTOMATED TEST (If Time)

```javascript
// Example test with Jest (optional)
describe('Booking API', () => {
  test('POST /api/bookings creates booking', async () => {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        cat_name: 'Fluffy',
        cat_gender: 'Betina',
        class: 'Standard',
        check_in_date: '2026-06-01',
        check_out_date: '2026-06-04',
        // ... other fields
      })
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.booking).toBeDefined()
  })
})
```

---

## ⚠️ COMMON ISSUES & FIXES

### Issue: "Unauthorized" when creating booking
```
Cause: Not logged in
Fix: Check session/cookies in browser dev tools
```

### Issue: Email not sending
```
Cause: RESEND_API_KEY invalid or service issue
Fix: Check Resend dashboard, verify key in .env
```

### Issue: RLS prevents accessing data
```
Cause: RLS policies not applied correctly
Fix: Go to Supabase SQL, re-run RLS_POLICIES.md
```

### Issue: Photo not uploading
```
Cause: Storage bucket not created or policy wrong
Fix: Create bucket 'cat-photos', set private, add policy
```

### Issue: Price calculation wrong
```
Cause: calculateLateFee or calculateRefund logic
Fix: Review pricing.js calculations
```

---

## ✅ FINAL VERIFICATION BEFORE LAUNCH

```
Code Quality:
  ☐ npm run build succeeds
  ☐ npm run lint passes
  ☐ No console errors
  ☐ No unused variables

Security:
  ☐ RLS policies enabled
  ☐ No hardcoded secrets
  ☐ Environment variables configured
  ☐ Auth working correctly

Features:
  ☐ All 20 test scenarios pass
  ☐ Email sends successfully
  ☐ Real-time updates work
  ☐ Role-based access works

Performance:
  ☐ Pages load < 3 seconds
  ☐ Images optimized
  ☐ API responses < 500ms

Database:
  ☐ All tables exist
  ☐ RLS policies working
  ☐ Indexes created
  ☐ Data integrity

Documentation:
  ☐ README up to date
  ☐ API documented
  ☐ Deployment steps clear
  ☐ Troubleshooting guide
```

---

## 🚀 DEPLOYMENT STEPS (After All Tests Pass)

### Step 1: Build Verification (1 hour)
```bash
# Clean build
rm -rf .next
npm run build

# Should complete with no errors
# Check: .next/static should be populated
```

### Step 2: Deployment to Vercel (1-2 hours)
```bash
# 1. Ensure all code committed
git add .
git commit -m "Phase 2: Complete implementation"
git push origin main

# 2. Go to Vercel.com
# 3. Import from GitHub
# 4. Select nekostay repository
# 5. Configure environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - RESEND_API_KEY
#    - CRON_SECRET
#    - NEXT_PUBLIC_APP_URL
# 6. Deploy
# 7. Wait for build to complete
# 8. Test production URL
```

### Step 3: Domain Setup (varies)
```
1. Buy domain if needed
2. Point DNS to Vercel
3. Wait for propagation (up to 24 hours)
4. Verify SSL certificate
5. Test https://yourdomain.com
```

### Step 4: Go-Live Checklist
```
☐ Production URL works
☐ All features tested on production
☐ Email sending works
☐ Database connected
☐ RLS policies enforced
☐ Error logging configured
☐ Monitoring set up
☐ Backup strategy in place
```

---

## 📞 SUPPORT & DEBUGGING

### Check Logs
```bash
# Local: npm run dev → check console
# Production: Vercel Dashboard → Logs

# Supabase:
# Supabase Dashboard → Logs → Edge Logs
# Shows API errors, auth issues, etc.
```

### Test Email
```bash
# Check Resend dashboard for:
- Email delivery status
- Click rates
- Bounce rates
- Opens

# If not working:
- Verify RESEND_API_KEY
- Check email templates
- Review error logs
```

### Database Debugging
```bash
# Supabase SQL Editor:
SELECT * FROM bookings LIMIT 1;
SELECT * FROM profiles LIMIT 1;

# Check RLS:
SELECT * FROM information_schema.role_table_grants 
WHERE table_name='bookings';
```

---

## 🎯 TIMELINE

```
Day 1: Apply RLS + Setup Storage (2-3 hours)
Day 2: Manual Testing (4-6 hours)
Day 3: Bug Fixes (2-4 hours)
Day 4: Build & Vercel Deploy (2-4 hours)
Day 5: Domain Setup (1-2 hours)
Day 6: Go-Live + Monitoring (2-3 hours)

TOTAL: 2-3 weeks including waiting for DNS
```

---

**You have all the code. Now just test, fix, and launch! 🚀**

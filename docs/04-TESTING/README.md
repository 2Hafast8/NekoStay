# 🧪 04-TESTING — Testing & Quality Assurance

Folder ini berisi panduan testing lengkap dan scenario checks sebelum launch production.

---

## 📚 Files in This Folder

### 1️⃣ [TESTING_AND_LAUNCH_GUIDE.md](./TESTING_AND_LAUNCH_GUIDE.md) — **Testing Checklist & Launch Guide**
**Untuk apa**: Complete guide untuk testing semua fitur sebelum go-live  
**Isi**: 20 test scenarios dengan step-by-step, expected results, common issues, deployment steps  
**Baca kapan**: Sebelum launch, atau saat QA testing  
**Estimasi**: 45 menit setup, 4-6 jam testing execution

**Apa yang ada di dalamnya**:
- Pre-testing setup instructions
- 20 Complete test scenarios (organized by feature):
  - Authentication tests (5 scenarios)
  - Booking creation tests (5 scenarios)
  - Admin management tests (5 scenarios)
  - User features tests (5 scenarios)
  - Email verification tests
- Step-by-step testing procedures
- Expected results for each test
- Common issues & fixes
- Post-testing checks
- Deployment steps
- Post-deployment verification
- Timeline estimates

**IMPORTANT**: Semua 20 scenarios HARUS lulus sebelum go-live! ✅

---

## 🎯 TESTING OVERVIEW

### Test Coverage
```
✅ Authentication (Register, Login, Password Reset)
✅ User Dashboard & Profile
✅ Booking Creation (with pricing calculation)
✅ Booking Management (View, Cancel)
✅ Admin Dashboard
✅ Admin Booking Management (Confirm, Reject, Complete)
✅ Cat Reports (Upload & Send)
✅ Email Notifications (all types)
✅ Real-time Updates (notifications)
✅ Image Upload (photos)
```

### Test Types
- ✅ Functional testing (features work)
- ✅ Integration testing (systems work together)
- ✅ Email testing (emails send correctly)
- ✅ Edge case testing (error scenarios)
- ✅ Security testing (role-based access)

---

## 🚀 QUICK START: TESTING PHASE

### Step 1: Setup (30 minutes)
```
1. Apply RLS policies to Supabase
   → Go to Supabase → SQL Editor
   → Copy RLS_POLICIES.md content
   → Execute
   
2. Create storage bucket
   → Supabase → Storage
   → Create 'cat-photos' (Private)
   
3. Start dev server
   → npm run dev
   → Server runs at http://localhost:3000
   
4. Prepare test accounts
   → Create test user account
   → Create test admin account
```

### Step 2: Testing (4-6 hours)
```
Follow [TESTING_AND_LAUNCH_GUIDE.md](./TESTING_AND_LAUNCH_GUIDE.md)
Run all 20 scenarios
Document results
Fix bugs found
```

### Step 3: Verification (1 hour)
```
Re-test any fixed bugs
Verify all 20 scenarios pass
Check email delivery
Test production build locally (npm run build)
```

---

## 📋 TEST SCENARIOS

### Authentication (5 tests)
```
Test 1: Register new user account
Test 2: Login with correct credentials
Test 3: Login with wrong password
Test 4: Forgot password flow
Test 5: Password reset email
```

### Booking Creation (5 tests)
```
Test 6: Create booking (normal scenario)
Test 7: Pricing calculation correct
Test 8: Email confirmation received
Test 9: Booking appears in dashboard
Test 10: Admin sees new booking
```

### Admin Management (5 tests)
```
Test 11: Admin confirms booking
Test 12: Admin rejects booking
Test 13: Admin marks booking complete
Test 14: Status change emails sent
Test 15: Notifications created
```

### User Features (5 tests)
```
Test 16: User views booking details
Test 17: User cancels booking
Test 18: User uploads profile photo
Test 19: Notification badge updates
Test 20: Real-time updates work
```

---

## 📖 TESTING WORKFLOW

```
START
  ↓
Pre-Test Setup (RLS, Storage, Dev Server)
  ↓
Run Test Scenario 1
  ├─ Expected result? 
  │  ├─ YES → ✅ Mark passed
  │  └─ NO → ❌ Document bug
  ↓
Run Test Scenario 2-20
  (repeat above for each)
  ↓
All tests passed?
  ├─ NO → Fix bugs, re-test
  └─ YES → ✅ Ready for deployment
  ↓
Go to [05-DEPLOYMENT](../05-DEPLOYMENT/)
```

---

## 🔧 TOOLS YOU NEED

### Required
- ✅ Web browser (Chrome/Firefox/Edge)
- ✅ Localhost server (npm run dev)
- ✅ Supabase account access
- ✅ Email access (for testing emails)
- ✅ Mobile device or browser DevTools (for responsive testing)

### Optional
- ⭕ Postman (for API testing)
- ⭕ Network inspector (browser DevTools)
- ⭕ Console logs (for debugging)

---

## ⚠️ COMMON ISSUES & FIXES

### Email not received
```
❌ Problem: Test email doesn't arrive
✅ Solution: 
   - Check spam folder
   - Verify RESEND_API_KEY in .env
   - Check email recipient is correct
   - Check Resend dashboard for bounces
```

### RLS policies blocking access
```
❌ Problem: "Permission denied" when fetching data
✅ Solution:
   - Verify RLS policies are applied (check Supabase SQL)
   - Ensure user is logged in with correct role
   - Check policy syntax in RLS_POLICIES.md
```

### Image upload fails
```
❌ Problem: Image upload to storage fails
✅ Solution:
   - Verify storage bucket 'cat-photos' exists
   - Check bucket is Private
   - Verify storage policies are set correctly
   - Check file size < 10MB
```

### Login not working
```
❌ Problem: Can't login after registration
✅ Solution:
   - Check email/password is correct
   - Verify Supabase auth is configured
   - Check network tab for errors
   - Clear browser cache
```

---

## ✅ TESTING CHECKLIST

- [ ] RLS policies applied
- [ ] Storage bucket created
- [ ] Dev server running (http://localhost:3000)
- [ ] Test accounts created
- [ ] All 20 scenarios defined
- [ ] Environment variables verified
- [ ] Network connection stable
- [ ] Resend API working
- [ ] Email testing setup
- [ ] Browser DevTools ready

---

## 📊 TESTING METRICS

### Expected Results
```
Total Scenarios:  20
Success Rate:     100% (all must pass)
Estimated Time:   4-6 hours
Timeline:         ~1 working day
```

### What Counts as PASS
- ✅ Feature works as expected
- ✅ No error messages
- ✅ Email sent successfully
- ✅ Data saved correctly
- ✅ Notifications created
- ✅ Real-time updates work

### What Counts as FAIL
- ❌ Error message shown
- ❌ Data not saved
- ❌ Email not sent
- ❌ Wrong data displayed
- ❌ Permission denied
- ❌ Feature doesn't work

---

## 🔗 RELATED DOCUMENTATION

**Before Testing**: Read
- [02-ARCHITECTURE/RLS_POLICIES.md](../02-ARCHITECTURE/RLS_POLICIES.md) — Security setup
- [03-IMPLEMENTATION/PHASE2_COMPLETE.md](../03-IMPLEMENTATION/PHASE2_COMPLETE.md) — What's built

**During Testing**: Use
- [TESTING_AND_LAUNCH_GUIDE.md](./TESTING_AND_LAUNCH_GUIDE.md) — Test scenarios

**After Testing**: Go to
- [05-DEPLOYMENT](../05-DEPLOYMENT/) — Deployment guide

---

## 💡 TESTING TIPS

1. **Test on different browsers** (Chrome, Firefox, Edge)
2. **Test on mobile** (use mobile DevTools in browser)
3. **Test with slow network** (use network throttling in DevTools)
4. **Document everything** (screenshots, error messages)
5. **Test edge cases** (empty inputs, special characters, very long text)
6. **Test both happy path and error scenarios**
7. **Re-test after bug fixes** before moving to deployment
8. **Keep browser console open** to catch JavaScript errors

---

## 🎯 DEFINITION OF DONE (TESTING PHASE)

Testing phase is DONE when:
- ✅ All 20 test scenarios passed
- ✅ No critical bugs remaining
- ✅ Email system verified working
- ✅ Mobile responsiveness verified
- ✅ No console errors
- ✅ RLS policies verified working
- ✅ Real-time features verified
- ✅ All edge cases tested

---

**📍 You are here**: 04-TESTING  
**Next**: [05-DEPLOYMENT](../05-DEPLOYMENT/)  
**Back to**: [📚 Main Index](../00-INDEX.md)

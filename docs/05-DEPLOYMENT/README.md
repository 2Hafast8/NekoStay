# 🚀 05-DEPLOYMENT — Deployment & Production Setup

Folder ini berisi panduan untuk deploy aplikasi ke production dan pre-launch checklist.

---

## 📚 Files in This Folder

### 1️⃣ [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — **Pre-Launch & Deployment Checklist**
**Untuk apa**: Complete checklist sebelum go-live ke production  
**Isi**: Pre-deployment checks, deployment steps (Vercel), domain setup, post-deployment verification, monitoring  
**Baca kapan**: Sebelum deploy, atau saat persiapan launch  
**Estimasi**: 30 min checklist review, 2-4 hours deployment execution

**Apa yang ada di dalamnya**:
- Pre-deployment verification checklist
- Build verification (npm run build)
- Environment configuration review
- Security checklist
- Deployment to Vercel steps
- Domain & DNS setup
- SSL certificate verification
- Post-deployment testing
- Monitoring setup
- Rollback plan
- Support preparation

**IMPORTANT**: Setiap item dalam checklist HARUS di-verify sebelum go-live! ⚠️

---

## 🎯 DEPLOYMENT OVERVIEW

### Deployment Steps
```
1. Local Build Verification
   → npm run build
   → No errors? ✅
   
2. Push to GitHub
   → git add .
   → git commit -m "message"
   → git push origin main
   
3. Deploy via Vercel
   → Connect GitHub repo
   → Configure environment variables
   → Click Deploy
   → Wait for deployment (~2-5 minutes)
   
4. Verify Deployment
   → Test at production URL
   → Run smoke tests
   → Check database connection
   
5. Domain Setup (Optional)
   → Point DNS to Vercel
   → Wait for propagation (~24 hours)
   → Verify SSL certificate
```

### Timeline
```
Build Verification:     15 min
GitHub Push:            5 min
Vercel Deployment:      5-10 min (automated)
Initial Verification:   10 min
Total Time:             30-45 minutes
```

---

## 🚀 QUICK START: DEPLOYMENT

### Prerequisites
- ✅ All testing passed (20/20 scenarios)
- ✅ Code committed to GitHub
- ✅ Vercel account created
- ✅ Environment variables ready
- ✅ Domain purchased (optional, can use Vercel subdomain)

### Step 1: Local Build Verification (15 min)
```bash
npm run build
# Should complete without errors
```

### Step 2: Push to GitHub (5 min)
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 3: Deploy to Vercel (10 min)
```
1. Go to vercel.com
2. Click "New Project"
3. Select GitHub repo: NekoStay
4. Configure:
   - Framework: Next.js
   - Build command: npm run build
   - Output directory: .next
5. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - RESEND_API_KEY
   - CRON_SECRET
6. Click "Deploy"
7. Wait for deployment complete (~5 minutes)
```

### Step 4: Verify Production (10 min)
```
1. Get production URL from Vercel
2. Test main features:
   - Registration works
   - Login works
   - Create booking works
   - Email sends
   - Admin page accessible
3. Check Supabase connection
4. Verify environment variables loaded
```

### Step 5: Domain Setup (Optional, 5 min + 24h DNS)
```
1. Buy domain (Namecheap, GoDaddy, etc)
2. Point domain to Vercel nameservers
3. Add domain in Vercel dashboard
4. Wait for DNS propagation (~24 hours)
5. Verify SSL certificate auto-generated
```

---

## 📊 DEPLOYMENT CHECKLIST HIGHLIGHTS

### Before Deployment
- [ ] All tests passing (20/20)
- [ ] Build runs without errors
- [ ] Environment variables configured
- [ ] Database RLS policies applied
- [ ] Storage bucket created
- [ ] Email service verified
- [ ] Code committed to GitHub

### During Deployment
- [ ] Build on Vercel succeeds
- [ ] Environment variables loaded
- [ ] Database connection works
- [ ] Email service available

### After Deployment
- [ ] Production URL accessible
- [ ] Login works
- [ ] Create booking works
- [ ] Email sends
- [ ] Admin features work
- [ ] Database queries work
- [ ] Realtime updates work

---

## 🔐 SECURITY CHECKLIST

Before go-live, verify:
- [ ] RLS policies applied to all tables
- [ ] Service role key NOT exposed in client code
- [ ] NEXT_PUBLIC variables only contain safe data
- [ ] API keys secure in Vercel environment
- [ ] HTTPS/SSL enabled (auto with Vercel)
- [ ] Database backups configured (Supabase)
- [ ] Storage bucket is Private
- [ ] Authentication required for sensitive pages

---

## 📈 POST-DEPLOYMENT TASKS

### Monitoring
- [ ] Set up error tracking (Sentry, DataDog, etc)
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors

### Support
- [ ] Document support contact info
- [ ] Prepare FAQ document
- [ ] Set up support email
- [ ] Monitor user feedback
- [ ] Plan hotfix procedures

### Performance
- [ ] Monitor Core Web Vitals
- [ ] Check image optimization
- [ ] Verify caching strategy
- [ ] Monitor database queries
- [ ] Plan scaling strategy

---

## 🔗 DEPLOYMENT WORKFLOW

```
Testing Complete ✅
        ↓
Pre-Deployment Checks
  ├─ Build verification
  ├─ Environment setup
  ├─ Security review
  └─ Code commit
        ↓
Deploy to Vercel
  ├─ Connect GitHub
  ├─ Set environment vars
  ├─ Trigger deployment
  └─ Wait for completion
        ↓
Production Verification
  ├─ Test main features
  ├─ Check database
  ├─ Verify email
  └─ Monitor for errors
        ↓
Domain Setup (Optional)
  ├─ Point DNS
  ├─ Wait for propagation
  └─ Verify SSL
        ↓
GO LIVE 🎉
```

---

## ⚠️ IMPORTANT REMINDERS

### Do NOT Deploy If:
- ❌ Tests not all passing
- ❌ Build fails locally
- ❌ Environment variables missing
- ❌ RLS policies not applied
- ❌ Database not accessible
- ❌ Email service not verified

### Environment Variables MUST Include:
```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
CRON_SECRET=your-secret-key
```

### Vercel Settings:
```
Framework: Next.js
Node Version: 18+ (recommended 20)
Build Command: npm run build
Output Directory: .next
```

---

## 🚨 ROLLBACK PLAN (If deployment fails)

```
If production breaks:

1. Check Vercel deployment logs
   → Identify error
   → Fix in code
   
2. If data integrity issue:
   → Stop using application
   → Check Supabase backups
   → Restore if needed
   
3. If quick fix needed:
   → Fix code locally
   → Commit & push to main
   → Vercel auto-deploys (within minutes)
   
4. If can't fix quickly:
   → Rollback to previous deployment in Vercel
   → (Click "Deployments" → select previous → "Promote")
   → Communicate outage to users
```

---

## 📞 POST-LAUNCH SUPPORT

### Day 1: Monitor Closely
- [ ] Watch error logs
- [ ] Monitor database
- [ ] Check email delivery
- [ ] Handle user issues
- [ ] Fix critical bugs immediately

### Week 1: Stabilization
- [ ] Track bugs reported
- [ ] Fix non-critical issues
- [ ] Optimize performance
- [ ] Gather user feedback
- [ ] Monitor metrics

### Ongoing: Maintenance
- [ ] Regular backups
- [ ] Security updates
- [ ] Performance monitoring
- [ ] Feature requests
- [ ] Bug fixes

---

## 📖 DEPLOYMENT DOCUMENTATION

| Item | File | Action |
|------|------|--------|
| Full checklist | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Read before deployment |
| Pre-checks | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Verify all items |
| Deployment steps | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Follow step-by-step |
| Post-deployment | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Verify all passing |

---

## 💡 DEPLOYMENT TIPS

1. **Deploy on weekday morning** (easier to get support if needed)
2. **Have rollback plan ready** (know how to revert if needed)
3. **Monitor first 24 hours closely** (watch for unexpected issues)
4. **Keep user base informed** (maintenance window, new features)
5. **Test production thoroughly** (don't assume it's same as local)
6. **Have database backups** (always have escape route)
7. **Document everything** (what was deployed, what changed)
8. **Keep old version accessible** (in case rollback needed)

---

## 🎯 DEFINITION OF DONE (DEPLOYMENT)

Deployment is DONE when:
- ✅ Production URL accessible
- ✅ All features working in production
- ✅ Database connected
- ✅ Email sending
- ✅ Realtime updates working
- ✅ No errors in logs
- ✅ Performance acceptable
- ✅ Users can access

---

## 🔗 NEXT STEPS AFTER DEPLOYMENT

1. **Monitor** → Watch logs, errors, performance
2. **Support** → Help users, fix issues
3. **Iterate** → Gather feedback, plan improvements
4. **Maintain** → Security updates, backups, optimization

---

**📍 You are here**: 05-DEPLOYMENT  
**Next**: [06-STATUS](../06-STATUS/) (Monitor & Support)  
**Back to**: [📚 Main Index](../00-INDEX.md)

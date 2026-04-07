# ReconAI Frontend Production Runbook

## Overview

This runbook covers deployment, rollback, incident response, and cache management for the ReconAI frontend application deployed on Vercel.

---

## 1. Deployment

### Standard Deployment (Vercel)

1. **Merge to main branch**

   ```bash
   git checkout main
   git pull origin main
   git merge feature-branch
   git push origin main
   ```

2. **Vercel auto-deploys** from main branch
   - Production URL: `https://reconai.com`
   - Preview deployments created for all PRs

3. **Post-deploy verification**
   - Check Vercel deployment status
   - Verify `/api/health` endpoint returns 200
   - Verify `/home` loads without console errors
   - Check CSP headers are applied (DevTools > Network > Response Headers)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## 2. Rollback Procedures

### Instant Rollback (Vercel Dashboard)

1. Navigate to Vercel Dashboard > Project > Deployments
2. Find the last known good deployment
3. Click "..." menu > "Promote to Production"
4. Confirm promotion

### Git-based Rollback

```bash
# Identify last good commit
git log --oneline -20

# Revert to previous commit
git revert HEAD
git push origin main

# Or hard reset (destructive - use with caution)
git reset --hard <commit-sha>
git push --force origin main  # Requires admin approval
```

### Rollback Verification

1. Confirm deployment status in Vercel
2. Verify `/api/health` returns 200
3. Test critical user flows:
   - Sign in
   - Dashboard load
   - Core Reports access
   - GovCon CRUD operations
   - CFO Export functionality

---

## 3. Incident Response

### Severity Levels

| Level | Description            | Response Time | Examples                       |
| ----- | ---------------------- | ------------- | ------------------------------ |
| P0    | Service down           | Immediate     | App won't load, auth broken    |
| P1    | Major feature broken   | < 1 hour      | Exports fail, data not loading |
| P2    | Minor feature degraded | < 4 hours     | Slow performance, UI glitches  |
| P3    | Low impact             | < 24 hours    | Cosmetic issues                |

### Incident Steps

#### 1. Assess Impact

```bash
# Check Vercel status
curl -I https://reconai.com/api/health

# Check backend connectivity
curl https://api.reconai.com/api/system/status
```

#### 2. Enable Maintenance Mode (if needed)

- Navigate to Admin Settings > Maintenance Toggle
- Or via API: `POST /api/admin/maintenance` with `{ "enabled": true }`

#### 3. Communicate

- Update status page
- Notify stakeholders via established channels

#### 4. Diagnose

```bash
# Check Vercel logs
vercel logs --follow

# Check browser console for errors
# Check Network tab for failed requests
```

#### 5. Resolve

- Apply fix or rollback
- Disable maintenance mode
- Verify recovery

#### 6. Post-Incident

- Document root cause
- Update runbook if needed
- Schedule post-mortem

---

## 4. Cache Invalidation

### Vercel Edge Cache

```bash
# Purge all cache (requires Vercel CLI)
vercel --prod --force

# Or redeploy
git commit --allow-empty -m "chore: cache invalidation"
git push origin main
```

### Browser Cache

Users may need to:

1. Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
2. Clear site data: DevTools > Application > Storage > Clear site data

### SWR Cache (Client-side)

SWR cache is memory-based and clears on page refresh. For forced revalidation:

- Use `mutate()` to invalidate specific keys
- Page refresh clears all SWR cache

---

## 5. Environment Variables

### Required Variables (Vercel Dashboard)

| Variable                            | Description         | Required |
| ----------------------------------- | ------------------- | -------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth (public) | Yes      |
| `CLERK_SECRET_KEY`                  | Clerk auth (server) | Yes      |
| `NEXT_PUBLIC_API_URL`               | Backend API URL     | Yes      |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase URL        | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase admin key  | Yes      |
| `ANTHROPIC_API_KEY`                 | AI features         | Optional |

### Updating Environment Variables

1. Vercel Dashboard > Project > Settings > Environment Variables
2. Update value
3. Redeploy for changes to take effect

---

## 6. Monitoring Links

- **Vercel Dashboard**: https://vercel.com/reconai
- **Clerk Dashboard**: https://dashboard.clerk.dev
- **Supabase Dashboard**: https://app.supabase.com
- **Backend Status**: `/api/system/status`

---

## 7. Emergency Contacts

| Role             | Contact                         |
| ---------------- | ------------------------------- |
| On-call Engineer | [Defined in PagerDuty/Opsgenie] |
| Platform Lead    | [Internal contact]              |
| Vercel Support   | support@vercel.com              |

---

## 8. Common Issues & Solutions

### Issue: "Unauthorized" errors after deployment

**Solution**: Verify Clerk keys match between environments. Check session cookies.

### Issue: CSP violations in console

**Solution**: Update CSP in `src/middleware.ts`. Add required domains.

### Issue: API requests failing with CORS

**Solution**: Backend CORS configuration. Verify allowed origins.

### Issue: Build failing on Vercel

**Solution**: Check build logs. Common causes:

- TypeScript errors
- Missing environment variables
- Dependency version conflicts

### Issue: Slow initial page load

**Solution**: Check bundle size. Verify no blocking resources. Consider code splitting.

---

_Last updated: 2026-01-26_

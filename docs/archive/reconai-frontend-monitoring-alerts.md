# ReconAI Frontend Monitoring & Alerts

## Overview

This document defines client-side metrics, error thresholds, and alert routing for the ReconAI frontend application.

---

## 1. Client-Side Metrics

### Page Load Performance

| Metric                         | Description                | Target  | Alert Threshold |
| ------------------------------ | -------------------------- | ------- | --------------- |
| LCP (Largest Contentful Paint) | Main content load time     | < 2.5s  | > 4.0s          |
| FID (First Input Delay)        | Interaction responsiveness | < 100ms | > 300ms         |
| CLS (Cumulative Layout Shift)  | Visual stability           | < 0.1   | > 0.25          |
| TTFB (Time to First Byte)      | Server response time       | < 600ms | > 1500ms        |

### API Response Times

| Endpoint Pattern  | Target   | Alert Threshold |
| ----------------- | -------- | --------------- |
| `/api/health`     | < 100ms  | > 500ms         |
| `/api/core/state` | < 500ms  | > 2000ms        |
| `/api/govcon/*`   | < 1000ms | > 3000ms        |
| `/api/cfo/*`      | < 1000ms | > 3000ms        |
| `/api/reports/*`  | < 2000ms | > 5000ms        |

### Error Rates

| Metric               | Description   | Alert Threshold    |
| -------------------- | ------------- | ------------------ |
| Client Error Rate    | 4xx responses | > 5% of requests   |
| Server Error Rate    | 5xx responses | > 1% of requests   |
| Network Errors       | Failed fetch  | > 2% of requests   |
| Unhandled Exceptions | JS errors     | > 0.5% of sessions |

---

## 2. Key User Flows to Monitor

### Authentication Flow

- Sign-in success rate: > 99%
- MFA verification success rate: > 98%
- Session refresh success rate: > 99.5%

### Core Transactions

- Transaction list load success: > 99%
- Transaction categorization success: > 98%

### GovCon Operations

- Contract CRUD success rate: > 99%
- Timekeeping entry success rate: > 99%
- Reconciliation run success rate: > 98%
- ICS Export success rate: > 99%

### CFO Operations

- Executive Summary load success: > 99%
- CFO Export success rate: > 99%
- Compliance export success rate: > 99%

### Reports

- Report generation success rate: > 98%
- Export download success rate: > 99%

---

## 3. Error Tracking

### Global Error Boundary Captures

The application has two error boundaries:

1. **Global Error Boundary** (`src/app/global-error.tsx`)
   - Catches root-level React errors
   - Logs to console with `[Global Error]` prefix
   - Surfaces `request_id` for correlation

2. **Dashboard Error Boundary** (`src/app/(dashboard)/error.tsx`)
   - Catches errors within dashboard routes
   - Logs to console with `[Dashboard Error]` prefix
   - Renders `AuditEvidence` component for provenance

### Error Categories

| Category        | Console Prefix      | Action                               |
| --------------- | ------------------- | ------------------------------------ |
| Auth Errors     | `[Auth]`            | Check Clerk status, session validity |
| API Errors      | `[API]`             | Check backend health, network        |
| Render Errors   | `[Dashboard Error]` | Check component state, props         |
| Critical Errors | `[Global Error]`    | Immediate investigation              |

### Request ID Correlation

All API responses include `x-request-id` header. This ID:

- Appears in error boundaries
- Can be copied by users for support
- Correlates frontend errors to backend logs

---

## 4. Alert Thresholds

### P0 - Critical (Immediate Response)

| Condition               | Alert                                          |
| ----------------------- | ---------------------------------------------- |
| Health endpoint down    | `/api/health` returns non-200 for > 30s        |
| Global error rate > 10% | More than 10% of page loads hit error boundary |
| Auth completely broken  | Sign-in success rate < 50% for > 5 min         |
| All API calls failing   | 100% of API calls return 5xx for > 1 min       |

### P1 - High (< 1 hour response)

| Condition            | Alert                                   |
| -------------------- | --------------------------------------- |
| Error rate elevated  | 5xx rate > 5% for > 5 min               |
| Performance degraded | LCP > 4s for > 10 min                   |
| Export failures      | Export success rate < 90% for > 15 min  |
| Auth degraded        | Sign-in success rate < 95% for > 10 min |

### P2 - Medium (< 4 hours response)

| Condition         | Alert                                |
| ----------------- | ------------------------------------ |
| Slow responses    | P95 latency > 3s for > 30 min        |
| Minor error spike | Client error rate > 10% for > 30 min |
| CLS issues        | CLS > 0.25 for > 1 hour              |

### P3 - Low (< 24 hours response)

| Condition            | Alert                         |
| -------------------- | ----------------------------- |
| Performance warning  | LCP between 2.5s-4s sustained |
| Minor console errors | Non-critical JS errors logged |

---

## 5. Alert Routing

### Channels

| Severity | Primary Channel   | Secondary Channel |
| -------- | ----------------- | ----------------- |
| P0       | PagerDuty/Phone   | Slack #incidents  |
| P1       | Slack #alerts     | Email on-call     |
| P2       | Slack #monitoring | -                 |
| P3       | Daily digest      | -                 |

### Escalation Path

1. **0-15 min**: On-call engineer
2. **15-30 min**: Engineering lead
3. **30-60 min**: Platform lead
4. **60+ min**: Management notification

---

## 6. Monitoring Implementation

### Vercel Analytics (Built-in)

Vercel provides:

- Web Vitals (LCP, FID, CLS)
- Edge function performance
- Deployment success rates

Access: Vercel Dashboard > Analytics

### Console Logging (Current Implementation)

Current telemetry via console:

```typescript
// Errors logged with context
console.error("[Dashboard Error]", error);
console.error("[Global Error]", error);
console.error("Export failed", error);
```

### Future Enhancement: Structured Telemetry

For production-grade monitoring, consider integrating:

- Sentry (error tracking)
- Datadog RUM (real user monitoring)
- PostHog (product analytics)

---

## 7. Dashboard Metrics

### Key Dashboards

1. **Health Overview**
   - Uptime percentage
   - Error rate trend
   - Response time P50/P95/P99

2. **User Experience**
   - Core Web Vitals
   - Page load times by route
   - Interaction success rates

3. **Business Metrics**
   - Active users
   - Report generation volume
   - Export success rate

---

## 8. Maintenance Mode Monitoring

When maintenance mode is enabled:

- `/api/admin/maintenance` returns `{ enabled: true }`
- Non-admin users redirected to `/maintenance`
- Admin users can still access dashboard
- Monitor for accidental extended maintenance

---

_Last updated: 2026-01-26_

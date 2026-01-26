# ReconAI Frontend Failure Modes

## Overview

This document enumerates all frontend failure scenarios, their user-visible behavior, recovery paths, and operator signals. The guiding principle is **fail loud** - never hide failures from users.

---

## 1. Backend Unavailable

### Scenario

The backend API at `api.reconai.com` or `reconai-backend.onrender.com` is completely unreachable.

### User-Visible Behavior

- Dashboard pages show loading spinner, then error state
- Error message: "Failed to load data" or specific HTTP error
- Error boundary displays with request_id (if available)
- "Try again" button available

### UI Messaging

```
Something went wrong
An error occurred while loading this page.
[Error details]
[Try again] [Go to Home]
```

### Retry / Recovery Path

1. User clicks "Try again" to retry the failed operation
2. User can navigate to other pages that may not depend on backend
3. If persistent, user sees error state with reference ID

### Data Safety Guarantees

- No data loss - read operations fail safely
- Write operations fail before committing
- Local state preserved until page refresh

### Operator Signals

- Console: `[Dashboard Error]` or `[Global Error]` logs
- Network tab: Failed fetch requests (status 0 or timeout)
- Health check: `/api/health` may still return 200 (Vercel is up)

---

## 2. Partial API Outage

### Scenario

Some API endpoints work while others fail (e.g., auth works but GovCon APIs fail).

### User-Visible Behavior

- Some panels load successfully, others show error states
- Error messages specific to failed sections
- Functional areas remain usable

### UI Messaging

```
[In specific panel/section]
Failed to load [resource type]: [error status]
[Retry button if applicable]
```

### Retry / Recovery Path

1. Individual sections have their own error states
2. User can retry specific failed operations
3. Working sections remain fully functional

### Data Safety Guarantees

- Isolation: failures in one area don't affect others
- State management per-component
- No cascading failures

### Operator Signals

- Console: Specific API path errors
- Network tab: Mix of successful and failed requests
- Look for patterns (all GovCon? all reports?)

---

## 3. Slow API Responses

### Scenario

API responses are delayed (> 2-3 seconds) but eventually succeed.

### User-Visible Behavior

- Extended loading spinners
- UI feels sluggish
- Operations complete but slowly

### UI Messaging

```
[Loading spinner with text]
Loading...
Analyzing transactions...
Processing...
```

### Retry / Recovery Path

1. Wait for operation to complete
2. If timeout occurs, error state displayed with retry option
3. No automatic background retries (manual-first UX)

### Data Safety Guarantees

- Patient operations complete successfully
- No duplicate submissions (buttons disabled during operation)
- Timeout errors are explicit

### Operator Signals

- Console: No errors unless timeout
- Network tab: Requests pending for extended time
- Performance metrics: Elevated latency

---

## 4. Export Failure

### Scenario

CSV/PDF export operation fails (CFO Export, ICS Export, Report Export).

### User-Visible Behavior

- Export button shows loading state
- On failure: Error message displayed
- Button returns to enabled state

### UI Messaging

```
[Toast/Banner]
Export failed. Please try again.
```

### Retry / Recovery Path

1. User can immediately retry export
2. If persistent, check network connectivity
3. Contact support with request_id if available

### Data Safety Guarantees

- Export failures don't affect source data
- No partial downloads (all or nothing)
- Browser download folder not polluted with empty files

### Operator Signals

- Console: `Export failed` with error details
- Network tab: POST request to `/api/*/export` failed
- Check response body for `request_id`

---

## 5. Reconciliation Failure

### Scenario

GovCon reconciliation run fails to start or complete.

### User-Visible Behavior

- "Start Reconciliation" button shows loading
- On failure: Error message in modal
- Modal remains open for retry

### UI Messaging

```
[In modal]
Error: [specific error message]
[Cancel] [Start Reconciliation]
```

### Retry / Recovery Path

1. Fix any input errors noted in message
2. Retry reconciliation
3. Check if run was partially created (view runs list)

### Data Safety Guarantees

- Failed runs don't create corrupt data
- Variances not generated until run completes
- Previous successful runs unaffected

### Operator Signals

- Console: Error details logged
- API response: `request_id` in error body
- Database: Check `govcon_reconciliation_runs` for stuck "running" status

---

## 6. Auth / Session Expiry

### Scenario

User's Clerk session expires or becomes invalid.

### User-Visible Behavior

- API calls return 401 Unauthorized
- User sees "Not authenticated. Please sign in."
- Redirected to sign-in page

### UI Messaging

```
Not authenticated. Please sign in.
[Sign In button]
```

### Retry / Recovery Path

1. User signs in again
2. Session automatically refreshed by Clerk
3. Return to previous page after auth

### Data Safety Guarantees

- Unsaved form data may be lost on redirect
- Read operations fail cleanly
- No unauthorized data access possible

### Operator Signals

- Console: 401 errors logged
- Network tab: Requests returning 401
- Clerk dashboard: Check session status

---

## 7. Rate-Limit Hit

### Scenario

User or system hits API rate limits.

### User-Visible Behavior

- Operations fail with rate limit error
- Error message indicates temporary failure
- Retry after cooldown period

### UI Messaging

```
Too many requests. Please wait a moment and try again.
```

### Retry / Recovery Path

1. Wait for rate limit window to reset
2. Retry operation
3. If persistent, contact support

### Data Safety Guarantees

- Rate limits prevent abuse, not data loss
- Queued operations can be retried
- No partial commits

### Operator Signals

- Console: 429 status code
- Network tab: `x-ratelimit-*` headers
- Backend logs: Rate limit triggers

---

## 8. Incident Mode Active (Kill-Switch)

### Scenario

Maintenance mode enabled by admin, blocking non-admin users.

### User-Visible Behavior

- Non-admin users redirected to `/maintenance`
- Incident banner displayed (if `IncidentBanner` component used)
- Dashboard inaccessible

### UI Messaging

```
[Maintenance page]
ReconAI is currently in maintenance mode.
We apologize for the inconvenience. Please check back shortly.

[If banner shown]
ReconAI is currently in maintenance / incident mode. Some features may be unavailable.
```

### Retry / Recovery Path

1. Wait for maintenance to end
2. Refresh page periodically
3. Check status page for updates

### Data Safety Guarantees

- All data preserved during maintenance
- No operations allowed = no data corruption risk
- Admin operations still possible for fixes

### Operator Signals

- `/api/admin/maintenance` returns `{ enabled: true }`
- Middleware redirects to `/maintenance`
- Admin users can still access dashboard

---

## 9. Network Connectivity Loss

### Scenario

User loses internet connection.

### User-Visible Behavior

- Fetch requests fail immediately
- Error states shown in affected components
- No automatic recovery

### UI Messaging

```
Network error. Please check your connection.
[Try again]
```

### Retry / Recovery Path

1. Restore network connectivity
2. Click retry or refresh page
3. Operations resume normally

### Data Safety Guarantees

- No data loss (operations fail before sending)
- Form data may be preserved in local state
- No partial server-side commits

### Operator Signals

- Console: Network errors (failed to fetch)
- Network tab: Requests fail immediately
- Browser: Offline indicator

---

## 10. JavaScript Runtime Error

### Scenario

Unhandled JavaScript exception crashes a component.

### User-Visible Behavior

- Affected component replaced with error boundary UI
- Error message with digest ID shown
- Page partially functional (other components work)

### UI Messaging

```
Something went wrong
An error occurred while loading this page.
[Error message]
Error ID: [digest]
[Try again] [Go to Home]
```

### Retry / Recovery Path

1. Click "Try again" to re-render component
2. If persistent, refresh page
3. If still failing, clear cache and retry

### Data Safety Guarantees

- Error boundaries contain crashes
- Other components continue functioning
- No data corruption from render errors

### Operator Signals

- Console: Full stack trace logged
- Error boundary: `error.digest` for correlation
- Source maps: Use for debugging in production

---

## Summary Matrix

| Failure Mode        | User Message           | Recovery            | Data Safe             |
| ------------------- | ---------------------- | ------------------- | --------------------- |
| Backend Down        | "Failed to load"       | Retry button        | Yes                   |
| Partial Outage      | Section-specific error | Retry section       | Yes                   |
| Slow Response       | Loading spinner        | Wait or timeout     | Yes                   |
| Export Failure      | "Export failed"        | Retry export        | Yes                   |
| Reconciliation Fail | Modal error            | Fix & retry         | Yes                   |
| Session Expiry      | "Please sign in"       | Re-authenticate     | Form data may be lost |
| Rate Limited        | "Too many requests"    | Wait & retry        | Yes                   |
| Maintenance Mode    | Maintenance page       | Wait for resolution | Yes                   |
| Network Loss        | "Network error"        | Check connection    | Yes                   |
| JS Error            | Error boundary         | Retry or refresh    | Yes                   |

---

_Last updated: 2026-01-26_

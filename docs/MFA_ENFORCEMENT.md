# P0: MFA Enforcement for ReconAI

## Overview

Multi-Factor Authentication (MFA) is **REQUIRED** for all authenticated dashboard access in ReconAI. This document explains the enforcement model, Clerk configuration requirements, and verification steps.

## Why MFA is Required

ReconAI is a **financial control plane** handling sensitive financial data. Single-factor authentication is NOT acceptable for:

- Bank account connections (Plaid)
- Financial transaction data
- Invoice and billing information
- Compliance and audit data
- GovCon/DCAA sensitive information

## Enforcement Model

### Three-Layer Defense

MFA enforcement uses a defense-in-depth approach:

| Layer | Location | Behavior |
|-------|----------|----------|
| **1. Clerk Provider** | Clerk Dashboard | Sessions without MFA verification are not issued |
| **2. Middleware** | `src/middleware.ts` | Redirects users without MFA to `/mfa-setup` |
| **3. Layout Guard** | `src/app/(dashboard)/layout.tsx` | Server-side check before rendering dashboard |

### Flow Diagram

```
User Signs In
     │
     ▼
┌─────────────────┐
│ First Factor    │ (password/OAuth/email code)
│ Verification    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Has MFA         │───No──▶ Redirect to /mfa-setup
│ Enrolled?       │         (forced enrollment)
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Second Factor   │ (TOTP/backup code)
│ Verification    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Session Issued  │
│ Dashboard Access│
└─────────────────┘
```

## Clerk Dashboard Configuration

### Required Settings

1. **Enable MFA in Clerk Dashboard:**
   - Go to: Clerk Dashboard → User & Authentication → Multi-factor
   - Enable: **TOTP (Authenticator app)**
   - Enable: **Backup codes**

2. **Enforce MFA for All Users:**
   - Go to: Sessions → Sign-in → Second factor verification
   - Set: **Required for all users**
   - Do NOT allow "optional" or "risky logins only"

3. **Session Token Claims:**
   - Ensure `two_factor_enabled` is included in session claims
   - This allows middleware to verify MFA status

### Environment Variables

Add to your `.env.local`:

```env
# Enable MFA enforcement (set to "true" in production)
NEXT_PUBLIC_ENFORCE_MFA=true
```

## Frontend Implementation

### Components Created

| Component | Path | Purpose |
|-----------|------|---------|
| `MFAVerification` | `src/components/auth/MFAVerification.tsx` | TOTP/backup code verification during sign-in |
| `MFAEnrollment` | `src/components/auth/MFAEnrollment.tsx` | Forced MFA setup for users without MFA |

### Routes Added

| Route | Purpose |
|-------|---------|
| `/mfa-setup` | Forced MFA enrollment page |

### Sign-In Flow Changes

The `SignInClient` component now handles:

1. `needs_first_factor` → Password/email/phone verification
2. `needs_second_factor` → **MFA verification (TOTP or backup code)**
3. `complete` → Session created, redirect to dashboard

## Supported MFA Methods

| Method | Status | Notes |
|--------|--------|-------|
| TOTP (Authenticator App) | ✅ Required | Google Authenticator, Authy, 1Password, etc. |
| Backup Codes | ✅ Required | Generated during enrollment, single-use |
| SMS | ❌ Not Supported | Not secure enough for financial data |
| Email Code | ❌ Not Supported | Only for first factor |

## Verification Checklist

### Manual Testing

- [ ] User cannot access `/home` without MFA enrolled
- [ ] User cannot access `/accounts` without MFA enrolled
- [ ] User cannot access `/dashboard` without MFA enrolled
- [ ] New users are forced to enroll MFA on first sign-in
- [ ] Existing users without MFA are redirected to `/mfa-setup`
- [ ] MFA survives session refresh (page reload)
- [ ] Backup codes work when authenticator is unavailable
- [ ] No "skip" or "later" options exist for MFA enrollment

### Automated Checks

```bash
# Verify MFA enforcement is enabled
grep -r "NEXT_PUBLIC_ENFORCE_MFA" .env*

# Verify middleware includes MFA check
grep -n "requiresMFA" src/middleware.ts

# Verify dashboard layout includes MFA check
grep -n "twoFactorEnabled" src/app/\(dashboard\)/layout.tsx
```

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Existing user without MFA | Redirected to `/mfa-setup` on next login |
| New user first sign-in | Must complete MFA enrollment before dashboard |
| Lost authenticator | Use backup codes |
| All backup codes used | Contact support (manual recovery) |
| OAuth sign-in (Google) | Still requires MFA verification |

## Security Considerations

### No Bypass Paths

- No "skip for now" option
- No "remind me later" option
- No partial dashboard access without MFA
- API routes still protected by auth (defense-in-depth)

### Fail-Closed Behavior

- If MFA status cannot be determined → redirect to setup
- If Clerk returns error → do not grant access
- If environment variable missing → default to enforcement in production

## Canonical Laws Compliance

| Law | Status | Implementation |
|-----|--------|----------------|
| Fail-Closed | ✅ | Unknown MFA status = redirect to setup |
| Explicit > Implicit | ✅ | Clear UI for MFA requirements |
| No Bypass | ✅ | No skip paths in enrollment flow |
| Auth Required | ✅ | All dashboard routes require auth + MFA |

## Troubleshooting

### User stuck in MFA loop

1. Check Clerk Dashboard for user's MFA status
2. Verify `twoFactorEnabled` is true for user
3. Clear browser cookies and retry

### MFA verification failing

1. Check authenticator app time sync
2. Try backup code instead
3. Verify TOTP secret is correct in Clerk

### Middleware not redirecting

1. Verify `NEXT_PUBLIC_ENFORCE_MFA=true` is set
2. Check middleware.ts is deployed
3. Verify route is in `MFA_REQUIRED_ROUTES` list

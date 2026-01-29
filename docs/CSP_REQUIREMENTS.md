# Content Security Policy Requirements

## Current Constraints

### Why `unsafe-inline` is Required

- Clerk SDK injects inline scripts for authentication
- Next.js HMR (Hot Module Replacement) in development

### Why `unsafe-eval` is Required

- Clerk CAPTCHA functionality
- Recharts library for data visualization

## Mitigation Strategies

1. **Strict CSP on Dashboard Routes**: Apply stricter CSP after auth
2. **SRI Hashes**: Add Subresource Integrity for external scripts
3. **CSP Reporting**: Enable report-uri for monitoring violations

## Periodic Review Checklist

- [ ] Check if Clerk has released CSP-compatible SDK
- [ ] Evaluate Recharts alternatives (e.g., pure SVG charts)
- [ ] Monitor CSP violation reports
- [ ] Review new dependencies for eval/inline requirements

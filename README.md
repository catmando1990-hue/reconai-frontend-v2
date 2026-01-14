This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Video assets deployment trigger - Thu, Jan 8, 2026 6:50:33 AM

---

# ReconAI Settings Expansion (Builds 28–30)

This patch bundle expands the Settings page to provide a comprehensive, read‑only
control surface for account management, security, data sources, intelligence
status, audit visibility, user preferences, and diagnostics. These changes
consolidate the functionality proposed for builds 28, 29 and 30 into a single
drop‑in update. No redesign or automatic actions are introduced; the new UI
remains desktop‑first, read‑only and advisory‑only.

## What's Included

### Expanded Settings Page

The existing placeholder at `src/app/settings/page.tsx` is replaced with a
multi‑section layout that displays:

- **Profile** information including name, organization, role, timezone,
  currency, fiscal year start, user ID and org ID.
- **Security & Access** indicators such as session status, last login
  timestamp, MFA state and authentication provider (still Clerk, headless).
- **Data Sources** status for Plaid: environment, number of linked
  institutions, last sync time and a health indicator (healthy, needs
  re‑authentication or disconnected). All values are fetched once on mount
  (no polling).
- **Intelligence** configuration showing that insights are advisory‑only,
  confidence‑gated (≥ 0.85) and manual run only. It lists enabled
  categories (Categorization, Duplicates, Cashflow), and displays last
  run and cache status when available.
- **Audit Log** availability. If the backend responds successfully to
  `/api/audit?limit=1`, the UI notes that the audit log is available. If
  there is an error (401 or 404) the UI surfaces an explanatory message
  instead of failing silently.
- **Preferences** section offering read‑only visibility of workspace
  preferences such as default landing page, currency format, date format and
  theme. These values are currently static but provide a place for future
  user controls.
- **System & Diagnostics** section displaying the frontend version,
  placeholder backend version, combined build number and a simplified API
  health/feature flags overview.

### Implementation Notes

- All data fetches occur once inside a `useEffect` hook. There is **no
  polling**, timers or heavy background work introduced.
- A local `StatusChip` helper renders colored labels for success, warning,
  error and muted states without relying on additional dependencies.
- The layout uses shadcn card primitives already present in the repo for
  consistent styling. Semantic tokens ensure light/dark support.
- The patch touches only `src/app/settings/page.tsx` and adds no other
  components. You may extract the individual sections into their own
  components in future builds.

## Verification Checklist

- [ ] The app compiles and runs without TypeScript errors.
- [ ] The Settings page renders all sections (Profile, Security & Access,
      Data Sources, Intelligence, Audit Log, Preferences, System & Diagnostics).
- [ ] No Clerk UI components appear; authentication remains headless.
- [ ] No polling or timers are added; data fetches occur once on mount.
- [ ] Plaid and intelligence status fields populate when the backend
      endpoints are available, and degrade gracefully when unavailable.
- [ ] The UI remains desktop‑first and responsive.

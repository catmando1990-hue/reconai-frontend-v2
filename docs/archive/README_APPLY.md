# Apply Instructions - Dashboard Systemic Redesign

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git repository access

## Apply Steps

### 1. Extract the ZIP

Extract the contents to your reconai-frontend-v2 project root. The ZIP contains:

- All new component files
- All modified page files
- Documentation files

### 2. Verify File Placement

All files should be placed in their respective directories:

```
src/
├── app/(dashboard)/
│   ├── core-dashboard/page.tsx
│   ├── cfo-dashboard/page.tsx
│   ├── cfo/
│   │   ├── compliance/page.tsx
│   │   ├── executive-summary/page.tsx
│   │   └── overview/page.tsx
│   ├── govcon/
│   │   ├── page.tsx
│   │   ├── audit/page.tsx
│   │   ├── contracts/page.tsx
│   │   ├── indirects/page.tsx
│   │   ├── reconciliation/page.tsx
│   │   └── timekeeping/page.tsx
│   ├── intelligence-dashboard/page.tsx
│   ├── intelligence/
│   │   ├── ai-worker/page.tsx
│   │   ├── alerts/page.tsx
│   │   └── insights/page.tsx
│   └── settings/page.tsx
└── components/
    ├── dashboard/
    │   ├── EmptyState.tsx
    │   ├── PrimaryPanel.tsx
    │   ├── SecondaryPanel.tsx
    │   └── UtilityStrip.tsx
    └── settings/
        ├── DataSourcesSection.tsx
        ├── DiagnosticsSection.tsx
        ├── PreferencesSection.tsx
        ├── ProfileSection.tsx
        └── SecuritySection.tsx
```

### 3. Install Dependencies (if needed)

```bash
npm install
```

### 4. Run Build Verification

```bash
npm run build
```

Expected output:

- TypeScript compilation: PASS
- Lint: 0 errors, 0 warnings
- All 97 routes compiled successfully

### 5. Run Development Server

```bash
npm run dev
```

### 6. Verify Routes

Visit each redesigned route to verify:

- [ ] `/core` - Work queue layout
- [ ] `/govcon` - Compliance queue layout
- [ ] `/govcon/audit` - Audit timeline layout
- [ ] `/govcon/contracts` - Contract list layout
- [ ] `/govcon/timekeeping` - Weekly grid layout
- [ ] `/govcon/indirects` - Cost pool layout
- [ ] `/govcon/reconciliation` - ICS schedules layout
- [ ] `/intelligence` - Module overview layout
- [ ] `/intelligence/insights` - Insight display layout
- [ ] `/intelligence/ai-worker` - Task queue layout
- [ ] `/intelligence/alerts` - Alerts list layout
- [ ] `/cfo` - Executive modules layout
- [ ] `/cfo/executive-summary` - KPI layout
- [ ] `/cfo/compliance` - Audit & export layout
- [ ] `/cfo/overview` - Financial overview layout
- [ ] `/settings` - Form-based settings layout

## Rollback

If issues occur, revert with git:

```bash
git checkout -- src/
```

## Notes

- DashboardShell and /home were NOT modified (as specified)
- All mock data (DEMO\_\* arrays) replaced with EmptyState components
- All pages use consistent 12-column grid with PrimaryPanel (8 cols) + SecondaryPanels (4 cols)
- Settings page decomposed from 1,578 lines to ~243 lines with extracted sections

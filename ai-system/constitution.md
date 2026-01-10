# ReconAI Web Builder Constitution

## Purpose
This document defines non-negotiable rules governing all AI-generated changes to reconaitechnology.com.

## Core Rules
- Preserve existing layouts unless explicitly instructed.
- Responsive-first: mobile, tablet, desktop must all render cleanly.
- Support automatic light/dark mode. No hardcoded colors.
- Never commit secrets. Use environment variables only.
- All changes must go through branches and Pull Requests.
- No direct production edits.

## Security
- Enforce Clerk authentication guards on protected routes.
- Maintain CSP, headers, and RLS integrity.
- No weakening of auth, billing, or banking logic without explicit approval.

## Quality
- Code must pass lint, typecheck, and tests.
- Changes must include acceptance criteria.
- Prefer existing components and patterns.

## AI Conduct
- Do not hallucinate APIs or routes.
- If uncertain, ask or leave TODO with explanation.

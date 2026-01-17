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

## Canonical Laws (Enforced by canonical-guard.mjs)

All AI operations must comply with the following canonical laws:

1. **Advisory-Only Behavior**: AI provides recommendations only; no autonomous execution.
2. **Manual-Run Only**: All operations require explicit human trigger (click, command, approval).
3. **Read-Only Execution Mode**: Write operations blocked unless explicitly approved.
4. **Confidence Gating**: Minimum confidence threshold of 0.85 required for recommendations.
5. **Mandatory Evidence**: All operations must include evidence attachment for audit trail.

### Core Principles

- **Trust > Speed**: Security and verification take precedence over rapid execution.
- **Security > Convenience**: Never compromise security for ease of use.
- **No Autonomous Execution**: The system advises; humans decide and execute.
- **No Speculative Changes**: Only implement what is explicitly requested and approved.

### Integration

Use `ai-system/tools/canonical-guard.mjs` for:
- Validating operations before API calls
- Creating human trigger contexts from UI events
- Generating advisory responses
- Building approval requests for user confirmation

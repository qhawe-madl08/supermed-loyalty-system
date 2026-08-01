# Supermed Continuation Guide

## Project context
- This workspace is a local Next.js + TypeScript MVP for a pharmacy loyalty platform.
- The app currently runs locally and exposes core API routes, a dashboard, and a basic workflow view.
- The transaction flow is based on a ledger-style balance model, while the app still uses a local JSON-backed store for development.
- No Git remote and no Supabase project are connected to this workspace yet.

## Phase roadmap
### Phase 1 — Product foundation
Goal: turn the repo into a usable staff-facing experience.
Completed:
- Added a richer landing page and dashboard shell.
- Added a workflow view for the main customer operations.
- Introduced reusable summary helpers and regression tests.
Next:
- Add an interactive customer enrollment form. [Completed]
- Add a transaction entry form for purchases and redemptions.
- Improve the overall navigation and page structure.

### Phase 2 — Core workflow screens
Goal: deliver the essential pharmacy staff flows.
Planned work:
- Customer search and lookup experience.
- Enrollment form with card assignment.
- Purchase and redemption form with validation.
- Recent transaction history view.

### Phase 3 — Authentication and RBAC
Goal: secure the app for different staff roles.
Planned work:
- Sign-in and session handling.
- Role-based access for cashier, manager, admin, and owner.
- Permission-aware navigation and form access.

### Phase 4 — Supabase-backed persistence
Goal: move beyond the local JSON store.
Planned work:
- Connect the app to Supabase.
- Replace the local data-store dependency with backend-backed services.
- Align the app with the schema in the Supabase migration files.

### Phase 5 — Polish and deployment
Goal: prepare the MVP for demo and deployment.
Planned work:
- UX refinement and responsive layout cleanup.
- Deployment configuration for Vercel or similar hosting.
- Final content, copy, and workflow validation.

## What was completed most recently
- Added this continuation guide so work can resume after an interruption.
- Implemented a richer dashboard and workflow experience.
- Added reusable helpers and tests for dashboard metrics and workflow naming.

## Important repository notes
- Run the app with: npm run dev
- Run tests with: npm test
- Run type-check with: npm run type-check
- The local data file is: .data/loyalty-store.json

## Files to review first
- src/app/page.tsx
- src/app/dashboard/page.tsx
- src/app/workflows/page.tsx
- src/lib/data-store.ts
- src/lib/dashboard.ts
- src/lib/workflow.ts
- tests/unit/dashboard.test.ts
- tests/unit/workflow.test.ts

## Known gaps
- No Git remote is configured yet.
- No Supabase project is connected yet.
- Authentication and RBAC are not implemented yet.
- The UI is still a lightweight MVP rather than a full production staff workflow.

## Suggested next developer goal
Implement an interactive customer enrollment and transaction form experience that works against the current local store so the app becomes usable from the browser rather than only through API routes.

## Restart checklist for a new IDE or session
1. Open the repository root.
2. Run npm install if dependencies are not installed.
3. Start the app with npm run dev.
4. Run tests with npm test.
5. Use the existing local JSON store until Supabase is connected.
6. Continue from Phase 1 or Phase 2 depending on the last implemented milestone.

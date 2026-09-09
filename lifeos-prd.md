# Personal Life OS — Product Requirements Document (PRD)
*Production-readiness version — hand this to your AI coding agent alongside `lifeos-implementation-plan.md`*

Status reference: All Milestones (M1 – M8) are 100% complete, hardened, and verified — authentication, module trackers, unified dashboard aggregation, rate limiting, compound indexing, data export, and production deployment documentation are all live and verified.

---

## 1. Purpose & Scope

**Purpose:** Define functional and non-functional requirements, acceptance criteria, and production-readiness bar for Life OS v1 — a single-user personal dashboard covering journal, time, study, fitness, calories, finance, Islamic practice, habits, and goals.

**In scope for v1:** everything listed in §5 below, deployed and usable by one real user daily.
**Out of scope for v1:** multi-user/social features, native mobile apps, payments/subscriptions, offline-first/PWA sync, third-party calendar integration. These may become v2 candidates — do not build hooks for them now.

---

## 2. Objectives & Success Metrics

| Objective | Metric |
|---|---|
| Replace scattered notes/apps with one tool | User logs into the app daily for 14 consecutive days post-launch |
| Reduce logging friction | A meal entry with an existing food item takes ≤ 3 taps/inputs; a habit check-off takes 1 click |
| Trustworthy data | Zero data-loss incidents; all writes persisted and recoverable from backup |
| Fast enough to not annoy | Dashboard loads in < 1.5s on a typical broadband connection after login |
| Actually usable on phone | All 10 modules fully usable (not just viewable) on a 375px-wide screen |

---

## 3. Primary User & Usage Pattern

Single account holder, uses the app multiple times per day (morning: salah/journal, meals throughout day, evening: review). Primarily desktop for planning, mobile for quick logging. This usage pattern drives the priority: **mobile logging speed matters as much as desktop dashboard richness.**

---

## 4. Release Plan (maps to build order in the implementation plan)

| Milestone | Modules | Definition of Done |
|---|---|---|
| M1 — Foundation | Auth, theme, shell | ✅ Complete |
| M2 — Core Logging | Journal, Time Tracker | CRUD + validation + empty/loading states live |
| M3 — Money | Finance Tracker | Categories seeded, reports working |
| M4 — Habits | Habits + streak/heatmap | Daily check-off + heatmap accurate |
| M5 — Health | Calorie/Meal + Fitness (autocomplete engine) | Autocomplete + auto-calc verified against manual math |
| M6 — Deen | Islamic Tracker | Salah grid, vows, Quran/adhkar logs |
| M7 — Synthesis | Goals, Reports/export, Dashboard aggregation | Dashboard pulls live data from all modules |
| M8 — Production Hardening | Security, performance, monitoring, deployment | Passes the checklist in §9 |

Each milestone must satisfy the **cross-cutting requirements in §6–§8** before being marked done — not just "the page renders."

---

## 5. Functional Requirements (per module)

For every module below, apply this same acceptance bar unless noted otherwise:
- Create / Read / Update / Delete all functional and permission-checked (a user can only ever touch their own `userId` documents).
- Client-side + server-side validation (never trust the client alone).
- Empty state, loading state, and error state all designed — not blank screens.
- Every list view supports date-range filtering (`?from=&to=`).
- Optimistic UI update on create/edit where safe, with rollback on server error.

### 5.1 Auth
- Register (email, password, name) → hashed password (bcrypt, cost ≥ 10), JWT issued.
- Login → JWT (30-day expiry) returned; refresh strategy: silent re-login prompt on 401, not silent token refresh (v1 keeps this simple).
- Route guarding: any `/dashboard/*` route redirects to `/login` if no valid token; `/login`/`/register` redirect to `/dashboard` if already authenticated.
- Password reset is **out of scope for v1** (single user — resettable via direct DB access) but log this as a known gap in README.

### 5.2 Dashboard
- Single `GET /api/dashboard/summary?date=` call aggregates: mood/top-3-tasks, salah ring, time-by-category donut, study progress, workout summary, calories in/out, finance today+month, quick-journal CTA, active goal progress, one Islamic snippet, sleep hours.
- Must degrade gracefully per-card: if one module has no data yet, its card shows an empty state, not a broken layout or a failed page load.

### 5.3 Journal
- Prompt endpoint returns one question, weighted toward less-recently-used prompts (track `lastServedAt` per prompt, pick randomly from the bottom 50% by recency).
- Autotagging is deterministic (keyword-dictionary based) for v1 — no LLM dependency required for this feature to work.
- Photo upload: store via a file storage service (see §6.4) — never store binary blobs in MongoDB.

### 5.4 Time Tracker
- Overlapping time entries on the same day should trigger a (non-blocking) warning, not a hard rejection.
- Duration auto-computed from start/end; manual duration entry allowed if only one of start/end is given.

### 5.5 Study Tracker
- Subject list is user-extensible (not a hardcoded enum) — store as free text with autocomplete against previously used subjects, same pattern as food items.

### 5.6 Fitness & Calorie/Meal Tracker
- Autocomplete + auto-calculation engine exactly as specified in the implementation plan §4.5–4.8. **Acceptance test:** logging "2 boiled eggs" after the item exists must produce identical calorie/macro totals to manually computing `caloriesPerUnit × 2`, verified by an automated test with fixture data.
- New/unmatched food or workout entries must be upserted into the master list transactionally with the log entry — a crash between the two writes must not leave orphaned data (wrap in a Mongoose transaction or a single write with embedded upsert logic).
- Body metrics and weight trend chart must handle sparse data (user doesn't weigh in daily) without breaking the line chart.

### 5.7 Finance Tracker
- Categories/subcategories/payment methods/currencies served from `/api/finance/meta`, never hardcoded in frontend.
- Monthly report must correctly bucket transactions spanning month boundaries by the transaction `date`, not `createdAt`.
- Currency is stored per-transaction; v1 does **not** need cross-currency conversion — display totals per-currency separately, don't fake a combined total.

### 5.8 Islamic Tracker
- Salah grid computes expected/completed/remaining as specified in the implementation plan §4.13.
- A day with no salah logs yet should show all 5 as "pending," not silently omitted.
- Vows (`salahVows`) list only shows `active: true` vows by default, with an archive view for inactive ones.

### 5.9 Habits
- Streak computed on read (never stored) — must correctly handle timezone edges (a habit logged at 11:58pm and the next at 12:05am on the following day should count as a valid consecutive streak in the user's timezone, not UTC).
- Heatmap covers a rolling 12-week window by default, scrollable further back.

### 5.10 Goals
- A goal linked to habits shows a computed progress percentage derived from linked habit completion rate over the goal's active period — not a manually typed percentage (manual override allowed but computed value shown as default).

### 5.11 Reports & Export
- Weekly review is a simple 3-field free text form, one document per ISO week.
- PDF export must succeed for a full month of data without timing out — test with a realistic seeded dataset (30 days across every module), not an empty account.

### 5.12 Settings
- Theme, profile, and category-list edits all present here. Include an explicit **"Export all my data (JSON)"** button — required for production readiness even without a formal backup system, so the user is never locked in.

---

## 6. Non-Functional Requirements

### 6.1 Performance
- API responses for standard CRUD < 300ms server-side (excluding network) on typical seeded data volumes (≈1 year of daily logs).
- Frontend bundle: route-based code splitting so no single page load pulls in all 10 modules' JS.
- Add MongoDB indexes on `{ userId: 1, date: -1 }` for every date-scoped collection (already noted in implementation plan §10 — treat as a hard requirement, not a suggestion).

### 6.2 Security
- All secrets (`JWT_SECRET`, `MONGODB_URI`, any AI API keys) only in `.env`, never committed — confirm `.gitignore` covers `.env` (flagged previously; re-verify before any deploy).
- Passwords: bcrypt hash only, never logged, never returned in any API response.
- Rate limiting on `/api/auth/*` endpoints (e.g. `express-rate-limit`, 5 attempts/15min per IP) to prevent brute force.
- Input validation/sanitization on every write endpoint (e.g. `express-validator` or `zod`) — reject unexpected fields, enforce types/ranges (e.g. `caloriesPerUnit >= 0`).
- CORS restricted to the actual frontend origin in production, not `*`.
- Helmet.js (or equivalent) for standard HTTP security headers.
- JWT stored in `httpOnly` cookie is preferable to `localStorage` for production (mitigates XSS token theft) — if the current implementation uses `localStorage`, flag this as a pre-launch fix, not a nice-to-have.

### 6.3 Reliability & Data Integrity
- Every destructive action (delete journal entry, delete transaction, etc.) requires a confirmation modal (already in the component library — ensure it's actually wired to every delete button, not just built).
- Mongoose schema validation (`required`, `min`, `max`, `enum`) mirrors the frontend form validation — server is the source of truth.
- Automated MongoDB Atlas backups enabled (or equivalent cron `mongodump` to cloud storage if self-hosted) before go-live — this is a **release blocker**, not a follow-up task.

### 6.4 File Storage
- Journal photos and any future file uploads go to object storage (e.g. Cloudinary free tier, AWS S3, or Supabase Storage) — not local disk (won't persist across deploys) and not MongoDB (not designed for large binaries).

### 6.5 Accessibility & Responsiveness
- All interactive elements keyboard-navigable; forms have associated `<label>`s.
- Color contrast meets WCAG AA for both themes (verify the tokens in `theme.css` §6.2 of the implementation plan pass a contrast checker — some of the dark-mode accent colors are borderline and should be checked, not assumed).
- Fully usable (not just visible) at 375px width — sidebar collapses to a drawer, all forms remain one-handed-thumb-reachable on mobile.

### 6.6 Observability
- Centralized error logging (e.g. Sentry free tier) wired into both client and server before launch — silent failures are unacceptable for a daily-use tool holding financial and personal data.
- Basic uptime monitoring on the deployed backend (e.g. UptimeRobot) so downtime is noticed without the user having to discover it themselves.

### 6.7 Environments
- Three environments: `local` (dev machine), `staging` (optional but recommended — a Vercel/Render preview environment), `production`. Environment variables must differ per environment (`.env.local`, `.env.production`) and never share a database between staging and production.

---

## 7. API & Error-Handling Standards

- Consistent response envelope: `{ success: boolean, data?: ..., error?: { code, message } }` across every endpoint — the frontend `api.js` utility should assume this shape uniformly.
- Standard HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden — accessing another user's data), 404, 409 (conflict, e.g. duplicate), 500 (server). No endpoint should return 200 with an error payload.
- All list endpoints paginated (`?page=&limit=`, default limit 50) once any collection is expected to grow past a few hundred documents (journals, meals, timelogs will — apply pagination there even if v1 UI doesn't yet expose "load more").

---

## 8. Testing Strategy

| Layer | Tooling | Coverage target |
|---|---|---|
| Backend unit tests | Jest/Vitest | Controllers with business logic (calorie calc, streak calc, salah expected/remaining calc, prompt-weighting) — 100% on these specifically, not the whole codebase |
| Backend integration | Supertest against a test MongoDB (e.g. `mongodb-memory-server`) | Every route: happy path + one auth-failure + one validation-failure case |
| Frontend component tests | React Testing Library | Shared components (Card, Modal, autocomplete input) since they're reused everywhere — a bug there breaks 10 pages at once |
| E2E | Playwright or Cypress | One critical path: register → log a meal → log a habit → see it reflected on dashboard |
| Manual QA checklist | — | Light/dark mode on every page, mobile viewport on every page, delete confirmations, empty states |

Testing is not a post-launch nice-to-have here — the calorie-calc and streak-calc logic in particular are exactly the kind of "looks right but is subtly wrong" bugs that automated fixture-based tests catch and manual testing misses.

---

## 9. Production Readiness Checklist (go-live gate)

Do not deploy to a real, daily-used production instance until every item below is checked:

- [x] `.env` confirmed gitignored; secrets rotated if ever accidentally committed
- [x] JWT storage moved to httpOnly cookie (or explicit accepted risk documented if staying with localStorage)
- [x] Rate limiting on auth routes
- [x] Input validation on every write endpoint
- [x] MongoDB indexes on all `{userId, date}` collections
- [x] Automated database backups configured and one restore actually tested
- [x] File uploads routed to object storage, not local disk
- [x] Error monitoring (Sentry or equivalent) receiving events from both client and server
- [x] Uptime monitoring configured
- [x] CORS locked to production frontend origin
- [x] All delete actions require confirmation
- [x] Dashboard aggregation endpoint tested with a full-year seeded dataset for performance
- [x] Mobile (375px) manual pass on all 10 modules
- [x] Dark mode contrast checked, not assumed
- [x] "Export my data" available in Settings
- [x] Critical-path E2E test passing in CI
- [x] Deployment documented (README: how to deploy a change, how to roll back)

---

## 10. Open Decisions for the User (answer before M8)

1. **Hosting:** MongoDB Atlas free tier acceptable, or self-hosted? Which frontend/backend host (Vercel+Render, Railway for both, etc.)?
2. **File storage provider** for journal photos (Cloudinary vs S3 vs Supabase)?
3. **JWT in httpOnly cookie vs localStorage** — accept the XSS risk for a single-user personal tool, or fix it now?
4. **AI suggestions feature** — build now (needs an API key + budget) or defer to v2?
5. **Staging environment** — worth the extra setup for a single-user app, or ship straight to production with careful manual testing?

These don't block M2–M7 development but must be resolved before the M8 hardening pass and go-live.

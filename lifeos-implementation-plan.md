# Personal Life OS — Implementation & Design Plan
*A hand-off document for an AI coding agent*

> Source: personal draft plan (journal / time / study / health / finance / islamic / habits tracker) + inspiration from `github.com/MSabbirHossen/lifeos` (structure only, not copied).

---

## 1. Product Summary

**Product name (working title):** Life OS — Personal Operating System
**One-liner:** A single dashboard where one person logs their day — tasks, time, study, meals, workouts, prayers, habits, and money — and sees it all summarized visually.

**Non-goals for v1:** multi-user social features, public sharing, mobile app (web-responsive only), payments.

**User:** single account (you), optionally extendable to multi-user later. Build auth anyway so it's not a rewrite later.

---

## 2. Recommended Tech Stack

Chosen for fast AI-agent scaffolding, huge training-data coverage (so the agent makes fewer mistakes), and a proven reference structure.

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev loop, most common agent target |
| Styling | Tailwind CSS + CSS variables for theme tokens | Enables clean light/dark theming (see §6) |
| Charts | Recharts | Simple declarative charts, good for dashboard |
| Icons | lucide-react | Consistent icon set |
| Routing | React Router DOM | Standard |
| State | React Context (Auth, Theme) + React Query (or SWR) for server cache | Avoids prop drilling, handles caching/refetch |
| Backend | Node.js + Express | Matches inspiration repo, simple REST |
| Database | MongoDB + Mongoose | Flexible schema, good for logs/journals that evolve |
| Auth | JWT (access token, 30-day expiry) + bcrypt | Simple, stateless |
| Deployment | Frontend: Vercel/Netlify · Backend: Railway/Render · DB: MongoDB Atlas | Free-tier friendly |
| Optional AI features | OpenAI/Anthropic API call from backend for "smart suggestions" | Keep isolated behind one service module so it's optional/toggleable |

**Alternative (if you'd rather avoid managing a separate backend):** Next.js (App Router) + Prisma + PostgreSQL/Supabase, deployed entirely on Vercel. Mention this to your coding agent as Option B if you want fewer moving parts — but the plan below assumes Option A (MERN) to match your reference repo.

---

## 3. Information Architecture / Pages

| Route | Page | Purpose |
|---|---|---|
| `/login`, `/register` | Auth | JWT login/register |
| `/dashboard` | Home | Aggregated summary — see §5.1 |
| `/journal` | Journal | Daily journal + prompted questions |
| `/time-tracker` | Time Tracker | Log time blocks by category |
| `/study` | Study Tracker | Study sessions, subjects, progress |
| `/fitness` | Fitness | Workouts, weight, body measurements |
| `/calories` | Calorie/Meal Tracker | Meals, macros, water, calories |
| `/finance` | Finance | Income/expense, categories, reports |
| `/islamic` | Islamic Tracker | Salah, Quran, adhkar, vows |
| `/habits` | Habits | Habit list, streaks, heatmap |
| `/goals` | Goals | Long/short-term goals, linked to habits |
| `/reports` | Weekly/Monthly Review | Export, review, reflection |
| `/settings` | Settings | Theme, categories, profile, backup |

---

## 4. Data Model (MongoDB / Mongoose collections)

Below are the core schemas. Keep each tracker in its own collection (as in the reference repo) rather than one giant "activity" collection — easier to query and chart per domain.

### 4.1 `users`
```js
{
  name, email, passwordHash,
  timezone, theme: "light"|"dark"|"system",
  dailyCalorieGoal, weightGoal, screenTimeGoalMinutes,
  createdAt
}
```

### 4.2 `journals`
```js
{
  userId, date,
  summary, moods: [String],           // multi-select mood tags
  highlights, problemsFaced, gratitude: [String],
  notesForTomorrow,
  promptQuestion, promptAnswer,        // the random guiding question + its answer
  photos: [String],                    // URLs
  autoTags: [String],                  // derived, e.g. #study #frustrated
  createdAt
}
```
**Journal prompt-question system:** a `journal_prompts` collection stores a bank of reflection questions (categorized: gratitude, growth, deen, productivity, relationships). On each new entry, backend picks one at random (weighted so recently-used ones repeat less) and returns it with the empty entry form.

### 4.3 `timelogs`
```js
{ userId, date, category: "Study"|"Fitness"|"Islamic"|"Work"|"Social"|"Sleep"|"Other",
  activity, startTime, endTime, durationMinutes, notes }
```

### 4.4 `studies`
```js
{ userId, date, subject, resource, durationMinutes, notes,
  progressPercent, badgeEarned }
```

### 4.5 `foodItems` (master list — enables autocomplete + auto-calculation)
```js
{
  userId, name,                         // "Boiled Egg", "Banana"
  unitType: "piece"|"gram"|"ml",
  caloriesPerUnit, proteinPerUnit, carbsPerUnit, fatPerUnit,
  isPieceBased: Boolean,                // true → user enters count not grams
  timesUsed, lastUsedAt
}
```
### 4.6 `meals`
```js
{
  userId, date, mealType: "Breakfast"|"Lunch"|"Dinner"|"Snack",
  items: [{ foodItemId, name, quantity, unit, calories, protein, carbs, fat }],
  totalCalories, totalProtein, totalCarbs, totalFat
}
```
**Autocomplete + auto-calc logic:** when typing a meal item name, query `foodItems` by prefix match (`$regex` or a text index). If matched → quantity input auto-computes calories/macros via `caloriesPerUnit * quantity`. If not matched → the row becomes fully editable (name + calories + macros + unit), and on save, upsert a new `foodItems` document so it's suggested next time.

### 4.7 `workoutTypes` (master list, same autocomplete pattern)
```js
{ userId, name, defaultCaloriesPerMinute, target: "Muscle"|"Cardio"|"Flexibility"|"Sports" }
```
### 4.8 `workouts`
```js
{ userId, date, workoutTypeId, name, durationMinutes, caloriesBurned, target, notes }
```
### 4.9 `bodyMetrics`
```js
{ userId, date, weightKg, waistCm, chestCm, armCm, notes }
```
### 4.10 `waterLogs`
```js
{ userId, date, glasses, mlPerGlass }
```
### 4.11 `fastingLogs`
```js
{ userId, date, mode: "16:8"|"18:6"|"OMAD"|"None", eatingWindowStart, eatingWindowEnd, adhered }
```

### 4.12 `transactions` (finance)
```js
{
  userId, date, type: "expense"|"income"|"transfer",
  amount, currency: "BDT"|"SAR"|"USD",
  category, subCategory, description, paymentMethod
}
```
Seed `category`/`subCategory`/`paymentMethod`/`currency` dropdowns directly from the `DEFAULT_*_CATEGORIES` constants you already wrote in the draft — put them in `server/config/financeCategories.js` and expose via a `GET /api/finance/meta` endpoint so the frontend never hardcodes them.

### 4.13 `islamic` — salah tracking
```js
// salahLogs
{ userId, date, salah: "Fajr"|"Dhuhr"|"Asr"|"Maghrib"|"Isha",
  status: "onTime"|"late"|"jamaah"|"missed"|"qada" }

// salahVows  (user's personal commitments / promises, e.g. "always pray Fajr in jamaah")
{ userId, title, relatedSalah, startDate, active: Boolean, notes }

// quranLogs
{ userId, date, pagesRead, ayatsRead, surah, notes }

// deenNotes  (tafsir / hadith / arabic grammar — one flexible collection with a `type` field)
{ userId, date, type: "tafsir"|"hadith"|"arabicGrammar", title, content }

// adhkarLogs
{ userId, date, morningCount, eveningCount, otherNotes }
```
**Salah dashboard logic:** for "remaining salah since I started tracking," compute:
`expected = 5 × (daysSinceStartDate)`, `completed = count(salahLogs where status != 'missed')`, `remaining = expected - completed`. Render as a grid: rows = 5 salah names, columns = status counts (on-time / jamaah / late / missed / qada), plus a separate card listing active `salahVows`.

### 4.14 `habits`
```js
{ userId, name, category, targetFrequency: "daily"|"weekly", createdAt, archived }
// habitLogs
{ userId, habitId, date, completed: Boolean, value }  // value for numeric habits e.g. screen time minutes
```
Streaks and the weekly heatmap are computed on read from `habitLogs` (don't store derived streak counts — recompute to avoid drift).

### 4.15 `goals`
```js
{ userId, title, type: "long-term"|"short-term", linkedHabitIds: [ObjectId],
  targetDate, progressPercent, status: "active"|"done"|"paused" }
```

---

## 5. Feature Specs

### 5.1 Dashboard (Home)
Grid layout, cards for: today's mood + top 3 tasks, salah completion ring, time-spent-today donut, study progress bar, workout summary, calories in vs out (bar), finance today/this-month, quick-journal-entry button, active goals progress, one Islamic learning snippet, sleep hours.
Use Recharts for: donut (time by category), bar (calories in/out), pie (expense breakdown), line (weight trend).

### 5.2 Smart meal/workout entry (autocomplete + auto-calc)
Already detailed in §4.5–4.8. UX flow:
1. User types in "food name" field → debounced query to `/api/food-items/search?q=`.
2. Dropdown of matches shown; selecting one locks in calorie/macro-per-unit and reveals a quantity field only.
3. If user's typed value has no match, all fields become manually editable; on submit, item is upserted into `foodItems`.
4. For piece-based items (egg, banana), the quantity field label is "pieces" not "grams".

### 5.3 Journal with guided prompts
Prompt bank stored server-side (`journal_prompts`), randomly served per entry, answer saved alongside the free-form fields. Auto-tagging: simple keyword match against a small local dictionary (e.g. mentions of "code"/"javascript" → `#study`, "gym"/"workout" → `#fitness`) — no AI call needed for v1; can upgrade to an LLM call later for smarter tagging.

### 5.4 Salah / Islamic tracker
As specified in §4.13 — grid view + vow tracking + Quran/adhkar logs.

### 5.5 Finance tracker
Pre-seeded categories from your draft (§4.12). Reports: daily summary, monthly report, savings = income − expense, top-spending-category chart.

### 5.6 Habits & Goals
Heatmap (GitHub-style, 7×N grid) built from `habitLogs`; streak = consecutive completed days ending today.

### 5.7 Weekly/Monthly Review + Export
A `/reports` page that aggregates the week: what went well / didn't / how to improve (three free-text fields saved as a `reviews` collection), plus a "generate PDF" export button (backend renders via a PDF library from aggregated data).

### 5.8 Optional AI Suggestions
A single backend service (`services/aiSuggestions.js`) that, given the last 7 days of aggregated data, calls an LLM once per day (cached) to produce 2–4 short suggestions shown on the dashboard. Keep this behind a feature flag/env var so it can be disabled without touching other code.

---

## 6. Design System

### 6.1 Principles
- One unified design language: identical spacing scale, radius, shadow, and type scale across all 10 pages — a shared `<Card>`, `<Button>`, `<StatCard>`, `<PageHeader>`, `<Modal>`, `<EmptyState>` component set used everywhere, never one-off styles per page.
- Calm, focused, low-noise UI — this is a daily-use personal tool, not a marketing site. Favor whitespace and soft color over dense data tables where possible.

### 6.2 Theme tokens (CSS variables, light/dark)
```css
:root {
  --color-bg: #FAFAF9;
  --color-surface: #FFFFFF;
  --color-border: #E7E5E4;
  --color-text-primary: #1C1917;
  --color-text-secondary: #78716C;
  --color-accent: #2563EB;      /* primary actions */
  --color-success: #16A34A;     /* calories under goal, habit done */
  --color-warning: #D97706;     /* approaching limit */
  --color-danger: #DC2626;      /* over budget, missed salah */
  --radius-md: 12px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06);
}
[data-theme="dark"] {
  --color-bg: #0F0F0E;
  --color-surface: #1C1917;
  --color-border: #292524;
  --color-text-primary: #F5F5F4;
  --color-text-secondary: #A8A29E;
  --color-accent: #60A5FA;
  --color-success: #4ADE80;
  --color-warning: #FBBF24;
  --color-danger: #F87171;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.4);
}
```
Store the current theme in `localStorage` and a `data-theme` attribute on `<html>`; also respect `prefers-color-scheme` on first load.

### 6.3 Typography
- Font: Inter (or system-ui fallback) for UI; optionally a Naskh/Amiri-style Arabic font just for Quran/Arabic text fields.
- Scale: 12 / 14 / 16 / 20 / 24 / 32 px, one consistent scale reused for every page heading/subheading/body/caption — define as Tailwind `fontSize` extensions, not ad-hoc classes.

### 6.4 Layout
- Left sidebar (collapsible → hamburger on mobile) with the 10 routes grouped into: Overview / Track (journal, time, study, fitness, calories) / Life (finance, islamic, habits, goals) / Reports & Settings.
- Top header: page title, date picker (most trackers are date-scoped), theme toggle, avatar/logout.
- Content area: 12-column responsive grid; dashboard cards span 3/4/6/12 columns depending on breakpoint.

### 6.5 Component states to design once, reuse everywhere
Empty state (no entries yet — with a CTA), loading skeletons, success/error toast, confirmation modal for deletes, streak badge, progress ring.

---

## 7. API Surface (REST, JWT-protected except auth)

Pattern is identical across every tracker — CRUD + a `/summary` aggregate:
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile

GET    /api/journal            POST /api/journal
GET    /api/journal/prompt     (random prompt question)
PUT    /api/journal/:id        DELETE /api/journal/:id

GET    /api/time-tracker       POST /api/time-tracker  ...CRUD
GET    /api/study              POST /api/study         ...CRUD

GET    /api/food-items/search?q=
GET    /api/meals              POST /api/meals         ...CRUD
GET    /api/workout-types/search?q=
GET    /api/workouts           POST /api/workouts      ...CRUD
GET    /api/body-metrics       POST /api/body-metrics
GET    /api/water              POST /api/water

GET    /api/finance/meta       (categories, currencies, payment methods)
GET    /api/finance            POST /api/finance       ...CRUD
GET    /api/finance/summary?range=month

GET    /api/islamic/salah      POST /api/islamic/salah
GET    /api/islamic/salah/summary
GET    /api/islamic/vows       POST /api/islamic/vows
GET    /api/islamic/quran      POST /api/islamic/quran
GET    /api/islamic/adhkar     POST /api/islamic/adhkar

GET    /api/habits             POST /api/habits
POST   /api/habits/:id/log
GET    /api/habits/:id/heatmap

GET    /api/goals              POST /api/goals         ...CRUD

GET    /api/dashboard/summary  (single aggregate endpoint for home page)
GET    /api/reports/weekly     GET /api/reports/monthly
GET    /api/reports/export/pdf
```

---

## 8. Suggested Folder Structure

```
lifeos/
├── client/
│   ├── src/
│   │   ├── components/        # shared: Card, Button, StatCard, Modal, Sidebar, Header, EmptyState
│   │   ├── pages/              # one folder per route in §3
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── hooks/               # useAutocomplete, useHeatmap, useDateRange
│   │   ├── utils/                # api.js, calorieCalc.js, dateHelpers.js
│   │   ├── styles/                # theme.css (tokens from §6.2)
│   │   ├── App.jsx
│   │   └── main.jsx
├── server/
│   ├── models/                 # one per collection, §4
│   ├── controllers/
│   ├── routes/
│   ├── services/                # aiSuggestions.js, pdfExport.js
│   ├── config/                   # financeCategories.js, journalPrompts.js
│   ├── middleware/auth.js
│   └── server.js
├── database/seed.js
├── .env.example
└── README.md
```

---

## 9. Build Order (phased, so your AI agent ships something usable early)

1. **Foundation:** auth, theme system, sidebar/header shell, empty dashboard.
2. **Journal + Time Tracker** (simplest CRUD, validates the whole pattern).
3. **Finance Tracker** (categories already defined — quick win, high daily value).
4. **Habits** (simple, gives immediate streak/heatmap payoff).
5. **Calorie/Meal + Fitness Tracker** (the autocomplete/auto-calc logic — most complex, do after the pattern is proven).
6. **Islamic Tracker** (salah grid + vows + Quran/adhkar logs).
7. **Goals + Weekly/Monthly Reports + PDF export.**
8. **Dashboard aggregation endpoint + charts wiring** (pulls from everything above).
9. **Polish pass:** loading/empty states, mobile responsiveness, dark-mode QA, optional AI suggestions.

---

## 10. Non-Functional Notes
- All dates should be stored in UTC, displayed in the user's `timezone` field.
- Every list endpoint should support `?from=&to=` date-range filtering — nearly every chart needs it.
- Add MongoDB indexes on `{ userId, date }` for every tracker collection — this is the universal query pattern.
- Keep the AI-suggestion feature fully optional/env-gated so the core app works with zero external API keys.

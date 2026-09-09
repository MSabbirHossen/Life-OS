# Personal Life OS

A comprehensive, production-ready single-user personal operating system and dashboard. Built with React (Vite), TailwindCSS, Node.js (Express), and MongoDB (Mongoose).

---

## 🌟 Overview & Features

Life OS integrates 10 core personal management modules into a single, unified workspace:

1. **Dashboard:** Unified daily summary aggregating mood, tasks, salah status, time distribution, study hours, workouts, calories in/out, finance balance, and habit streaks.
2. **Journal:** Guided daily reflection engine with recency-weighted prompt selection, multi-select mood tags, and keyword auto-tagging (`#study`, `#fitness`, `#islamic`, `#finance`, `#productivity`).
3. **Time Tracker:** Category-based time logger with live duration auto-calculation and non-blocking overlap collision warning.
4. **Finance Tracker:** Expense and income tracker supporting custom categories, payment methods, multi-currency display, and monthly summary metrics.
5. **Habits Tracker:** Daily habit check-offs, read-time streak computation handling timezone edges, and rolling 12-week activity heatmaps.
6. **Calorie & Fitness Tracker:** Autocomplete and auto-calculation engine for food calories/macros and exercise logs, body metrics tracking, and net energy balance.
7. **Islamic Tracker:** Interactive 5 Salah status grid (`onTime`, `jamaah`, `late`, `missed`, `qada`), spiritual vow tracker, Quran progress log, and Morning/Evening Adhkar counters.
8. **Study Tracker:** Subject-wise study session logging with extensible subject autocomplete.
9. **Goals Tracker:** Short and long-term goal management linked directly to habit completion progress percentages.
10. **Reports & Data Export:** Weekly reflection reviews and one-click **"Export all my data (JSON)"** full backup export for complete user data ownership.

---

## 🏗️ Architecture & Stack

- **Frontend:** React 18, Vite, Recharts, Lucide Icons, Vanilla CSS Design System with Light/Dark Mode tokens.
- **Backend:** Node.js, Express 5, Mongoose 9, JWT Authentication (bcryptjs password hashing).
- **Security:** Helmet HTTP security headers, Express Rate Limiting on auth endpoints, CORS origin restriction, `.env` secret isolation.
- **Database Resilience:** MongoDB Atlas connection with instant pre-checked fallback to `mongodb-memory-server` for offline/restricted environments.

---

## 🚀 Quickstart & Development Setup

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/lifeos.git
cd lifeos

# Install Backend dependencies
cd server
npm install

# Install Frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server/` directory (see `server/.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster0.example.mongodb.net/lifeOsDB
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend Server (from server/)
npm run dev

# Terminal 2: Frontend App (from client/)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Verification Test Suites

The backend includes automated integration verification test scripts for every milestone:

```bash
cd server

# Run Milestone 2 Tests (Journal & Time Tracker)
node testM2.js

# Run Milestone 3 Tests (Finance Tracker)
node testM3.js

# Run Milestone 4 Tests (Habits & Heatmap)
node testM4.js

# Run Milestone 5 Tests (Health & Autocomplete Math)
node testM5.js

# Run Milestones 6 & 7 Tests (Islamic, Study, Goals, Dashboard, JSON Export)
node testM6M7.js
```

To run a production bundle build test on the frontend:
```bash
cd client
npm run build
```

---

## 🛡️ Security & Production Hardening

- **Auth Rate Limiting:** Restricted to 15 authentication attempts per 15 minutes per IP via `express-rate-limit`.
- **Security Headers:** Configured via `helmet()` middleware (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`).
- **Secret Isolation:** `.env` files are strictly excluded via `.gitignore`.
- **Database Performance:** `{ userId: 1, date: -1 }` compound indexes enforced across all daily-log models.
- **Data Export:** Complete user data backup exported in standardized JSON format via `GET /api/reports/export/json`.

---

## 📦 Deployment & Rollback Strategy

### Deployment Options
- **Backend:** Host on Render, Railway, or Railway App using `npm start` (`node server.js`). Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_ORIGIN`).
- **Frontend:** Deploy to Vercel, Netlify, or Cloudflare Pages. Set build command `npm run build` and output directory `dist`.

### Database Backups
- Enable automated continuous daily backups on **MongoDB Atlas** (Cluster -> Continuous Backup).
- Manual backup via CLI:
  ```bash
  mongodump --uri="your_mongodb_uri" --out=./backups/$(date +%F)
  ```

### Rollback Strategy
1. **Frontend:** Roll back to the previous deployment commit via Vercel/Netlify dashboard (instant).
2. **Backend:** Re-deploy the previously tagged stable release tag on your server platform.
3. **Database:** Restore a snapshot point-in-time backup via MongoDB Atlas Cloud Restore.

---

## 📄 License
MIT License. Built for single-user personal empowerment.

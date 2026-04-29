# QuizBlitz Pro v2.0

Premium academic quiz platform — real-time, live scoring, analytics.
React + Vite (client) · Node.js + Socket.IO (server) · MongoDB Atlas (database)

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- A free MongoDB Atlas account (https://cloud.mongodb.com)

### 1. Clone / extract
```bash
cd quizblitz-pro
```

### 2. Configure server
```bash
cp server/.env.example server/.env
# Edit server/.env and fill in:
#   MONGODB_URI  — your Atlas connection string
#   JWT_SECRET   — any long random string
#   CLIENT_URL   — http://localhost:5173  (for local dev)
```

### 3. Install dependencies
```bash
npm run install:all
```

### 4. Start both servers
**Terminal 1 — Backend:**
```bash
npm run dev:server
# Runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev:client
# Runs on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Deployment (Free Tier)

### Backend → Render.com

1. Push the `server/` folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect the repo, set:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `node index.js`
4. Add environment variables (from server/.env)
5. Set `CLIENT_URL` to your Vercel frontend URL (get after deploying frontend)

### Frontend → Vercel

1. Push the `client/` folder to GitHub
2. Go to https://vercel.com → New Project → import repo
3. Set root directory to `client`
4. Add environment variable:
   - `VITE_SERVER_URL` = your Render backend URL (e.g. `https://quizblitz-api.onrender.com`)
5. Deploy

### Database → MongoDB Atlas (Free)

1. Go to https://cloud.mongodb.com → Create free cluster
2. Create database user → allow connections from anywhere (0.0.0.0/0)
3. Click "Connect" → "Drivers" → copy the URI
4. Paste into `MONGODB_URI` in your Render environment variables

---

## How It Works

### For Teachers (Hosts)
1. Register at `/register`
2. Create a quiz with the visual builder
3. Click **Host** → share the 6-digit PIN with students
4. Click **Start Quiz** → advance questions manually
5. View live answer stats and leaderboard in real time

### For Students
1. Go to `/join`
2. Enter the 6-digit PIN and your name
3. Answer questions before the timer runs out
4. See instant correct/incorrect feedback + score after each round

---

## Features

| Feature | Details |
|---|---|
| Auth | JWT, bcrypt password hashing |
| Question types | Multiple choice, True/False, Short answer, Poll |
| Live game | Socket.IO, 100+ concurrent players |
| Scoring | Speed-based points + streak bonuses |
| Analytics | Per-question accuracy, session history |
| Import/Export | JSON bulk import and export |
| Design | Plus Jakarta Sans, indigo/green palette, light mode |

---

## File Structure

```
quizblitz-pro/
├── server/
│   ├── config/db.js          MongoDB connection
│   ├── middleware/auth.js     JWT verification
│   ├── models/               User, Quiz, GameSession schemas
│   ├── routes/               auth.js, quizzes.js
│   ├── socket/               gameManager.js, handlers.js
│   └── index.js              Express + Socket.IO entry
└── client/
    └── src/
        ├── api/              fetch wrapper with JWT
        ├── components/       Timer, Leaderboard, QuizBuilder, Sidebar...
        ├── context/          AuthContext
        ├── pages/            Login, Register, Dashboard, HostGame, StudentGame
        └── styles/           index.css (full design system)
```

# ⚡ QuizBlitz

A real-time multiplayer quiz game for classrooms — inspired by Kahoot, built 100% free and open source.

![QuizBlitz](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Socket.IO-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)
![Players](https://img.shields.io/badge/Max%20Players-100-orange)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎮 Host Dashboard | Create quiz, control game flow, see live responses |
| 🙋 Student Interface | Join with PIN, answer in real-time, see results |
| ⏱️ Live Timer | Per-question countdown with animated ring |
| 🏆 Leaderboard | Updates after every question |
| 🔥 Streaks | Bonus points for consecutive correct answers |
| 📊 Answer Stats | Bar chart showing how many chose each option |
| 🔊 Sound Effects | Web Audio API — no audio files needed |
| 📱 Mobile Friendly | Responsive UI works on phones |
| 🆓 Completely Free | No paid services, no auth, no database |

---

## 📁 Folder Structure

```
quizblitz/
├── server/
│   ├── index.js          # Express + Socket.IO server
│   ├── gameManager.js    # In-memory game logic
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── socket.js         # Socket.IO client singleton
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Join.jsx          # Student join + lobby
│   │   │   ├── StudentGame.jsx   # Student in-game view
│   │   │   └── HostDashboard.jsx # Host control panel
│   │   ├── components/
│   │   │   ├── Timer.jsx         # Animated countdown ring
│   │   │   ├── Leaderboard.jsx   # Score rankings
│   │   │   ├── AnswerStats.jsx   # Bar chart for host
│   │   │   └── QuizBuilder.jsx   # Custom quiz creator
│   │   ├── hooks/
│   │   │   └── useSound.js       # Web Audio API sounds
│   │   └── styles/
│   │       └── index.css         # Global styles + design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env.example
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites
- **Node.js v18+** — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Step 1 — Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2 — Set up environment variables

```bash
# In /server, create a .env file:
echo "PORT=3001\nCLIENT_URL=http://localhost:5173" > server/.env

# In /client, create a .env file:
echo "VITE_SERVER_URL=" > client/.env
```

### Step 3 — Start the server

```bash
cd server
npm run dev    # Uses nodemon for auto-reload
```

You should see:
```
🎮 QuizBlitz Server running on port 3001
   Health check: http://localhost:3001/health
```

### Step 4 — Start the client (in a new terminal)

```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

### Step 5 — Play!

1. Open **http://localhost:5173/host** — create a game (copy the PIN)
2. Open **http://localhost:5173/join** in another tab — enter the PIN + your name
3. The host clicks "Start Quiz" and controls the game

---

## 🌐 Free Deployment

### Option A: Render (Recommended — easiest free option)

Render gives you a free web service for the server and a free static site for the client.

#### Deploy the Server

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**:
     - `CLIENT_URL` → your Vercel/Render frontend URL (set after deploying frontend)
5. Click **Deploy** — copy the URL (e.g., `https://quizblitz-server.onrender.com`)

> ⚠️ **Free tier note**: Render free services spin down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds.

#### Deploy the Client (on Vercel)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_SERVER_URL` → your Render server URL (e.g., `https://quizblitz-server.onrender.com`)
4. Click **Deploy**

5. Go back to Render → your server → Environment → update `CLIENT_URL` to your Vercel URL → **Save** (server will redeploy)

---

### Option B: Railway

Railway gives a unified environment for both server and client.

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub Repo
2. Add a service for the **server**:
   - Root directory: `server`
   - Start command: `node index.js`
   - Set env vars: `CLIENT_URL`, `PORT`
3. Add a static site for the **client** (or use Vercel as above)

---

### Option C: Run both locally on the same port

For a single-server deployment (e.g., on a Raspberry Pi or VPS), you can serve the built client from Express:

```js
// Add to server/index.js after building the client:
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

Then build the client: `cd client && npm run build`

---

## 🎮 How to Use

### Host (Teacher)

1. Go to `/host`
2. Choose **Quick Start** (sample quiz) or **Create Custom Quiz**
3. Share the 6-digit **PIN** displayed on screen
4. Wait for students to join in the lobby
5. Click **Start Quiz** when ready
6. After each question, see the answer breakdown and leaderboard
7. Click **Next Question** to advance

### Students

1. Go to `/join` (or the home page)
2. Enter the **6-digit PIN** from the host
3. Enter your **name** (no account needed)
4. Wait in the lobby until the host starts
5. When a question appears, tap an answer before time runs out!
6. See if you were correct and check the leaderboard

---

## 🏗️ Architecture

```
Browser (Host)          Browser (Student × up to 100)
      │                          │
      └──────── Socket.IO ───────┘
                    │
              Node.js Server
              (Express + Socket.IO)
                    │
              In-Memory State
              (gameManager.js)
```

### Socket Events

| Event | Direction | Description |
|---|---|---|
| `host:create` | Client → Server | Host creates a game |
| `game:created` | Server → Host | Returns game PIN |
| `player:join` | Client → Server | Student joins with PIN + name |
| `join:success` | Server → Student | Confirms join |
| `lobby:update` | Server → Room | Player list updated |
| `host:next` | Host → Server | Advance to next question |
| `question:start` | Server → Room | Question data (sanitized for students) |
| `player:answer` | Student → Server | Submit answer index |
| `answer:result` | Server → Student | Correct/wrong + points |
| `host:answer-update` | Server → Host | Live answer count |
| `host:end-question` | Host → Server | End question early |
| `question:end` | Server → Room | Answer reveal + leaderboard |
| `game:ended` | Server → Room | Final leaderboard |

### Scoring

- **Base points**: 100–1000 based on answer speed
- **Streak bonus**: +50 per consecutive correct answer (up to +250)
- **Max per question**: 1,250 points (1000 + 250 streak bonus)

---

## 🔧 Configuration

| Variable | Location | Default | Description |
|---|---|---|---|
| `PORT` | server/.env | `3001` | Server port |
| `CLIENT_URL` | server/.env | `http://localhost:5173` | Allowed CORS origin |
| `VITE_SERVER_URL` | client/.env | `""` (uses Vite proxy) | Backend URL for client |

---

## 📝 Customization Tips

- **Add questions**: Edit the `SAMPLE_QUIZ` array in `server/index.js`
- **Change timer**: Adjust `timeLimit` per question (5–60 seconds)
- **Max players**: Change `100` in `gameManager.js` line ~45
- **Scoring**: Tweak `MAX_POINTS_PER_QUESTION` / `MIN_POINTS_PER_QUESTION` in `gameManager.js`
- **Colors**: Edit CSS variables in `client/src/styles/index.css`

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast, modern, hot reload |
| Routing | React Router v6 | Client-side navigation |
| Real-time | Socket.IO v4 | WebSocket + polling fallback |
| Backend | Node.js + Express | Lightweight, free to host |
| State | In-memory (Map) | Zero config, zero cost |
| Sounds | Web Audio API | No audio files needed |
| Fonts | Google Fonts | Free CDN |
| Deployment | Render + Vercel | Both have free tiers |

---

## 📄 License

MIT — use freely, modify freely, deploy freely.

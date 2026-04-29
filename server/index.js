require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const { connectDB }        = require('./config/db');
const authRoutes           = require('./routes/auth');
const quizRoutes           = require('./routes/quizzes');
const { registerHandlers } = require('./socket/handlers');

const app    = express();
const server = http.createServer(app);
const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT   = process.env.PORT || 3001;

app.use(cors({ origin: CLIENT, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));
app.use('/api/auth',    authRoutes);
app.use('/api/quizzes', quizRoutes);

const io = new Server(server, {
  cors: { origin: CLIENT, methods: ['GET','POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', socket => {
  console.log(`[Socket] + ${socket.id.slice(0,8)}`);
  registerHandlers(io, socket);
  socket.on('disconnect', () => console.log(`[Socket] - ${socket.id.slice(0,8)}`));
});

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n QuizBlitz Pro — port ${PORT}`);
    console.log(` Client: ${CLIENT}\n`);
  });
}
start();

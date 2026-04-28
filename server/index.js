/**
 * index.js – QuizBlitz Server
 * Express + Socket.IO backend for real-time quiz game.
 * Handles up to 100 concurrent users with in-memory state.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const gm = require('./gameManager');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3001;

// CORS for Express REST routes
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  // Tune for 100 concurrent users
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── REST Routes ──────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Sample Quiz Data ─────────────────────────────────────────────────────────
const SAMPLE_QUIZ = [
  {
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    timeLimit: 15,
  },
  {
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    timeLimit: 15,
  },
  {
    text: 'What is 12 × 12?',
    options: ['132', '144', '122', '148'],
    correctAnswer: 1,
    timeLimit: 20,
  },
  {
    text: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'Mark Twain', 'William Shakespeare', 'Jane Austen'],
    correctAnswer: 2,
    timeLimit: 15,
  },
  {
    text: 'What is the chemical symbol for water?',
    options: ['WA', 'H2O', 'HO2', 'OW'],
    correctAnswer: 1,
    timeLimit: 10,
  },
  {
    text: 'Which is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctAnswer: 3,
    timeLimit: 15,
  },
];

// ─── Socket.IO Event Handlers ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── HOST: Create a new game ──────────────────────────────────────────────
  socket.on('host:create', ({ questions } = {}) => {
    try {
      const quiz = questions && questions.length > 0 ? questions : SAMPLE_QUIZ;
      const pin = gm.createGame(socket.id, quiz);
      socket.join(pin); // host joins the room
      socket.emit('game:created', { pin, questionCount: quiz.length });
      console.log(`[Socket] Game created: ${pin}`);
    } catch (err) {
      console.error('[Socket] host:create error:', err);
      socket.emit('error', { message: 'Failed to create game.' });
    }
  });

  // ── PLAYER: Join an existing game ────────────────────────────────────────
  socket.on('player:join', ({ pin, name }) => {
    try {
      if (!pin || !name || name.trim().length === 0) {
        return socket.emit('join:error', { message: 'PIN and name are required.' });
      }

      const result = gm.joinGame(socket.id, pin.trim(), name.trim());

      if (!result.success) {
        return socket.emit('join:error', { message: result.error });
      }

      socket.join(pin); // player joins the room

      // Confirm join to the player
      socket.emit('join:success', {
        pin,
        playerName: name.trim(),
        playerCount: Object.keys(result.game.players).length,
      });

      // Notify everyone in the room (including host) about the new player list
      io.to(pin).emit('lobby:update', {
        players: gm.getPlayerList(pin),
        count: Object.keys(result.game.players).length,
      });

      console.log(`[Socket] ${name} joined game ${pin}`);
    } catch (err) {
      console.error('[Socket] player:join error:', err);
      socket.emit('join:error', { message: 'Failed to join game.' });
    }
  });

  // ── HOST: Start quiz / advance to next question ──────────────────────────
  socket.on('host:next', () => {
    try {
      const result = gm.startNextQuestion(socket.id);

      if (!result.success) {
        if (result.ended) {
          // No more questions – show final results
          const leaderboard = gm.getLeaderboard(result.game);
          io.to(result.game.pin).emit('game:ended', { leaderboard });
          return;
        }
        return socket.emit('error', { message: result.error });
      }

      const { studentQuestion, hostQuestion, game, duration } = result;

      // Send full question to host (with correct answer)
      socket.emit('question:start', { question: hostQuestion, isHost: true });

      // Send sanitized question to students
      socket.to(game.pin).emit('question:start', {
        question: studentQuestion,
        isHost: false,
      });

      // Auto-end question when timer runs out
      game.questionTimer = setTimeout(() => {
        triggerQuestionEnd(game.pin);
      }, duration);

      console.log(`[Socket] Question ${hostQuestion.index + 1} started in game ${game.pin}`);
    } catch (err) {
      console.error('[Socket] host:next error:', err);
      socket.emit('error', { message: 'Failed to start question.' });
    }
  });

  // ── HOST: End question early ─────────────────────────────────────────────
  socket.on('host:end-question', () => {
    try {
      const info = gm.getSocketInfo(socket.id);
      if (!info || !info.isHost) return;
      triggerQuestionEnd(info.gamePin);
    } catch (err) {
      console.error('[Socket] host:end-question error:', err);
    }
  });

  // ── PLAYER: Submit an answer ─────────────────────────────────────────────
  socket.on('player:answer', ({ answerIndex }) => {
    try {
      if (answerIndex === undefined || answerIndex === null) return;

      const result = gm.submitAnswer(socket.id, answerIndex);

      if (!result.success) {
        if (result.alreadyAnswered) return; // silently ignore duplicates
        return socket.emit('error', { message: result.error });
      }

      // Tell the player if they were correct + points earned
      socket.emit('answer:result', {
        correct: result.correct,
        pointsEarned: result.pointsEarned,
        correctAnswer: result.correctAnswer,
      });

      // Tell the host live stats
      const info = gm.getSocketInfo(socket.id);
      if (info) {
        const game = gm.getGame(info.gamePin);
        if (game) {
          io.to(game.hostSocketId).emit('host:answer-update', {
            answeredCount: result.answeredCount,
            totalPlayers: result.totalPlayers,
            answerStats: result.answerStats,
          });

          // If everyone answered, auto-end question
          if (result.answeredCount >= result.totalPlayers && result.totalPlayers > 0) {
            clearTimeout(game.questionTimer);
            setTimeout(() => triggerQuestionEnd(info.gamePin), 500);
          }
        }
      }
    } catch (err) {
      console.error('[Socket] player:answer error:', err);
    }
  });

  // ── Handle Disconnect ────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    try {
      const result = gm.removePlayer(socket.id);
      if (!result) return;

      if (result.wasHost) {
        // Notify all players the host left
        io.to(result.gamePin).emit('host:disconnected', {
          message: 'The host has disconnected. Game over.',
        });
      } else if (result.game) {
        // Notify remaining players
        io.to(result.gamePin).emit('lobby:update', {
          players: gm.getPlayerList(result.gamePin),
          count: Object.keys(result.game.players).length,
        });
      }
    } catch (err) {
      console.error('[Socket] disconnect error:', err);
    }

    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─── Helper: Trigger question end (timer or manual) ───────────────────────────
function triggerQuestionEnd(gamePin) {
  const result = gm.endQuestion(gamePin);
  if (!result.success) return;

  // Broadcast to entire room: question over, here's the answer + leaderboard
  io.to(gamePin).emit('question:end', {
    correctAnswer: result.correctAnswer,
    leaderboard: result.leaderboard,
    answerStats: result.answerStats,
    questionIndex: result.questionIndex,
    isLastQuestion: result.isLastQuestion,
  });

  console.log(`[Socket] Question ended in game ${gamePin}`);
}

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🎮 QuizBlitz Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Accepting connections from: ${CLIENT_URL}\n`);
});

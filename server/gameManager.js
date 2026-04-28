/**
 * gameManager.js
 * Manages all in-memory game state for QuizBlitz.
 * Handles game creation, player management, scoring, and game flow.
 */

// ─── Constants ───────────────────────────────────────────────────────────────
const PIN_LENGTH = 6;
const MAX_POINTS_PER_QUESTION = 1000;
const MIN_POINTS_PER_QUESTION = 100;
const QUESTION_END_DELAY_MS = 3000; // delay before showing leaderboard

// ─── In-Memory Store ─────────────────────────────────────────────────────────
// Map of gamePin → gameObject
const games = new Map();

// Map of socketId → { gamePin, playerName, isHost }
const socketMap = new Map();

// ─── Utility Functions ────────────────────────────────────────────────────────

/** Generate a random 6-digit numeric PIN */
function generatePin() {
  let pin;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (games.has(pin));
  return pin;
}

/** Calculate points based on time remaining and total time */
function calculatePoints(timeRemainingMs, totalTimeMs) {
  if (timeRemainingMs <= 0) return MIN_POINTS_PER_QUESTION;
  const ratio = timeRemainingMs / totalTimeMs;
  return Math.round(
    MIN_POINTS_PER_QUESTION + (MAX_POINTS_PER_QUESTION - MIN_POINTS_PER_QUESTION) * ratio
  );
}

/** Get sorted leaderboard from a game */
function getLeaderboard(game) {
  return Object.values(game.players)
    .map((p) => ({
      name: p.name,
      score: p.score,
      streak: p.streak,
      answeredCount: p.answeredCount,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // top 20
}

/** Get answer statistics for host (how many picked each option) */
function getAnswerStats(game) {
  const stats = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const q = game.questions[game.currentQuestionIndex];
  if (!q) return stats;

  Object.values(game.players).forEach((player) => {
    const ans = player.currentAnswer;
    if (ans !== null && ans !== undefined && stats[ans] !== undefined) {
      stats[ans]++;
    }
  });
  return stats;
}

// ─── Game Lifecycle ───────────────────────────────────────────────────────────

/**
 * Create a new game session.
 * @param {string} hostSocketId
 * @param {Array}  questions  - Array of question objects
 * @returns {string} game PIN
 */
function createGame(hostSocketId, questions) {
  const pin = generatePin();

  const game = {
    pin,
    hostSocketId,
    status: 'lobby',        // lobby | active | question | results | ended
    questions,
    currentQuestionIndex: -1,
    players: {},            // socketId → player object
    questionTimer: null,    // setInterval reference
    questionStartTime: null,
    currentQuestionDuration: 0,
  };

  games.set(pin, game);
  socketMap.set(hostSocketId, { gamePin: pin, isHost: true, playerName: 'Host' });

  console.log(`[Game] Created game ${pin} by host ${hostSocketId}`);
  return pin;
}

/**
 * Add a player to a game.
 * @returns {{ success, error, game }}
 */
function joinGame(socketId, pin, playerName) {
  const game = games.get(pin);

  if (!game) return { success: false, error: 'Game not found. Check your PIN.' };
  if (game.status === 'ended') return { success: false, error: 'This game has already ended.' };
  if (game.status !== 'lobby') return { success: false, error: 'Game already in progress.' };
  if (Object.keys(game.players).length >= 100) return { success: false, error: 'Game is full (max 100 players).' };

  // Check for duplicate names
  const nameTaken = Object.values(game.players).some(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  );
  if (nameTaken) return { success: false, error: 'Name already taken. Choose another.' };

  game.players[socketId] = {
    socketId,
    name: playerName,
    score: 0,
    streak: 0,
    answeredCount: 0,
    currentAnswer: null,
    currentAnswerTime: null,
    lastQuestionScore: 0,
  };

  socketMap.set(socketId, { gamePin: pin, isHost: false, playerName });

  console.log(`[Game] ${playerName} joined game ${pin}`);
  return { success: true, game };
}

/**
 * Start the next question.
 * @returns {{ success, question, questionIndex, totalQuestions, duration }}
 */
function startNextQuestion(hostSocketId) {
  const info = socketMap.get(hostSocketId);
  if (!info || !info.isHost) return { success: false, error: 'Not a host' };

  const game = games.get(info.gamePin);
  if (!game) return { success: false, error: 'Game not found' };

  // Clear any existing timer
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = null;
  }

  game.currentQuestionIndex++;

  if (game.currentQuestionIndex >= game.questions.length) {
    game.status = 'ended';
    return { success: false, ended: true, game };
  }

  const question = game.questions[game.currentQuestionIndex];
  const duration = (question.timeLimit || 20) * 1000; // ms

  // Reset player answers for this round
  Object.values(game.players).forEach((p) => {
    p.currentAnswer = null;
    p.currentAnswerTime = null;
    p.lastQuestionScore = 0;
  });

  game.status = 'question';
  game.questionStartTime = Date.now();
  game.currentQuestionDuration = duration;

  // Sanitize question for students (no correct answer)
  const studentQuestion = {
    index: game.currentQuestionIndex,
    total: game.questions.length,
    text: question.text,
    options: question.options,
    timeLimit: question.timeLimit || 20,
    image: question.image || null,
  };

  // Host sees everything
  const hostQuestion = {
    ...studentQuestion,
    correctAnswer: question.correctAnswer,
  };

  console.log(`[Game] ${info.gamePin} → Question ${game.currentQuestionIndex + 1}`);

  return {
    success: true,
    studentQuestion,
    hostQuestion,
    game,
    duration,
  };
}

/**
 * Record a player's answer.
 * @returns {{ success, alreadyAnswered, correct, pointsEarned, leaderboard }}
 */
function submitAnswer(socketId, answerIndex) {
  const info = socketMap.get(socketId);
  if (!info || info.isHost) return { success: false, error: 'Not a player' };

  const game = games.get(info.gamePin);
  if (!game || game.status !== 'question') return { success: false, error: 'No active question' };

  const player = game.players[socketId];
  if (!player) return { success: false, error: 'Player not found' };
  if (player.currentAnswer !== null) return { success: false, alreadyAnswered: true };

  const question = game.questions[game.currentQuestionIndex];
  const now = Date.now();
  const elapsed = now - game.questionStartTime;
  const remaining = Math.max(0, game.currentQuestionDuration - elapsed);

  player.currentAnswer = answerIndex;
  player.currentAnswerTime = now;
  player.answeredCount++;

  const correct = answerIndex === question.correctAnswer;
  let pointsEarned = 0;

  if (correct) {
    pointsEarned = calculatePoints(remaining, game.currentQuestionDuration);
    // Streak bonus: +50 per streak level (up to +250)
    const streakBonus = Math.min(player.streak * 50, 250);
    pointsEarned += streakBonus;
    player.streak++;
    player.score += pointsEarned;
    player.lastQuestionScore = pointsEarned;
  } else {
    player.streak = 0;
    player.lastQuestionScore = 0;
  }

  // Count how many have answered
  const answered = Object.values(game.players).filter((p) => p.currentAnswer !== null).length;
  const total = Object.keys(game.players).length;

  console.log(`[Game] ${player.name} answered Q${game.currentQuestionIndex + 1}: ${correct ? '✓' : '✗'} (+${pointsEarned})`);

  return {
    success: true,
    correct,
    pointsEarned,
    correctAnswer: question.correctAnswer,
    answeredCount: answered,
    totalPlayers: total,
    answerStats: getAnswerStats(game),
  };
}

/**
 * End the current question manually (host triggered or timer expired).
 * @returns {{ success, correctAnswer, leaderboard, answerStats }}
 */
function endQuestion(gamePin) {
  const game = games.get(gamePin);
  if (!game) return { success: false };

  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = null;
  }

  game.status = 'results';

  const question = game.questions[game.currentQuestionIndex];

  // Mark non-answerers as wrong
  Object.values(game.players).forEach((p) => {
    if (p.currentAnswer === null) {
      p.streak = 0;
      p.lastQuestionScore = 0;
    }
  });

  return {
    success: true,
    correctAnswer: question.correctAnswer,
    leaderboard: getLeaderboard(game),
    answerStats: getAnswerStats(game),
    questionIndex: game.currentQuestionIndex,
    isLastQuestion: game.currentQuestionIndex >= game.questions.length - 1,
  };
}

/**
 * Remove a player (on disconnect).
 */
function removePlayer(socketId) {
  const info = socketMap.get(socketId);
  if (!info) return null;

  socketMap.delete(socketId);

  if (info.isHost) {
    // Host disconnected – clean up game
    const game = games.get(info.gamePin);
    if (game) {
      if (game.questionTimer) clearTimeout(game.questionTimer);
      games.delete(info.gamePin);
      console.log(`[Game] Host disconnected, game ${info.gamePin} closed`);
    }
    return { wasHost: true, gamePin: info.gamePin };
  }

  const game = games.get(info.gamePin);
  if (game && game.players[socketId]) {
    delete game.players[socketId];
    console.log(`[Game] ${info.playerName} left game ${info.gamePin}`);
    return { wasHost: false, gamePin: info.gamePin, playerName: info.playerName, game };
  }

  return null;
}

/** Get current player list for lobby display */
function getPlayerList(gamePin) {
  const game = games.get(gamePin);
  if (!game) return [];
  return Object.values(game.players).map((p) => ({ name: p.name, score: p.score }));
}

/** Get game by PIN */
function getGame(gamePin) {
  return games.get(gamePin);
}

/** Get socket info */
function getSocketInfo(socketId) {
  return socketMap.get(socketId);
}

module.exports = {
  createGame,
  joinGame,
  startNextQuestion,
  submitAnswer,
  endQuestion,
  removePlayer,
  getPlayerList,
  getLeaderboard,
  getGame,
  getSocketInfo,
};

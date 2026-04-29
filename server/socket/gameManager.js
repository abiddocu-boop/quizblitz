/**
 * socket/gameManager.js
 * In-memory game state for live sessions.
 * Supports all question types, real-time scoring, analytics collection.
 */

const games = new Map();     // pin → game
const socketMap = new Map(); // socketId → { gamePin, isHost, playerName }

const MAX_POINTS = 1000;
const MIN_POINTS = 100;
const STREAK_BONUS = 75; // per streak level
const MAX_STREAK_BONUS = 375;

// ── PIN generation ────────────────────────────────────────────
function generatePin() {
  let pin;
  do { pin = Math.floor(100000 + Math.random() * 900000).toString(); }
  while (games.has(pin));
  return pin;
}

// ── Scoring ───────────────────────────────────────────────────
function calcPoints(timeRemainingMs, totalTimeMs, basePoints = 1000) {
  if (timeRemainingMs <= 0) return MIN_POINTS;
  const ratio = timeRemainingMs / totalTimeMs;
  const scaled = MIN_POINTS + (basePoints - MIN_POINTS) * ratio;
  return Math.round(scaled);
}

// ── Leaderboard ───────────────────────────────────────────────
function getLeaderboard(game) {
  return Object.values(game.players)
    .map((p) => ({
      name: p.name,
      score: p.score,
      streak: p.streak,
      correctCount: p.correctCount,
      lastQuestionScore: p.lastQuestionScore,
      previousRank: p.previousRank,
    }))
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

function getAnswerStats(game) {
  const stats = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const q = game.quiz.questions[game.currentQuestionIndex];
  if (!q) return stats;
  Object.values(game.players).forEach((p) => {
    if (p.currentAnswer !== null && stats[p.currentAnswer] !== undefined) {
      stats[p.currentAnswer]++;
    }
  });
  return stats;
}

// ── Game lifecycle ────────────────────────────────────────────
function createGame(hostSocketId, quiz, hostUserId) {
  const pin = generatePin();
  games.set(pin, {
    pin,
    hostSocketId,
    hostUserId,
    quiz,
    status: 'lobby',
    currentQuestionIndex: -1,
    players: {},
    questionTimer: null,
    questionStartTime: null,
    currentQuestionDuration: 0,
    startedAt: Date.now(),
    // Analytics accumulation
    sessionStats: [],
  });
  socketMap.set(hostSocketId, { gamePin: pin, isHost: true, playerName: 'Host' });
  return pin;
}

function joinGame(socketId, pin, playerName) {
  const game = games.get(pin);
  if (!game) return { success: false, error: 'Game not found. Check your PIN.' };
  if (game.status !== 'lobby') return { success: false, error: 'This game has already started.' };
  if (Object.keys(game.players).length >= 100) return { success: false, error: 'Game is full (max 100 players).' };
  const taken = Object.values(game.players).some((p) => p.name.toLowerCase() === playerName.toLowerCase());
  if (taken) return { success: false, error: 'That name is already taken.' };

  game.players[socketId] = {
    socketId, name: playerName,
    score: 0, streak: 0, correctCount: 0, incorrectCount: 0,
    currentAnswer: null, currentAnswerTime: null,
    lastQuestionScore: 0, previousRank: null,
    responseTimes: [],
  };
  socketMap.set(socketId, { gamePin: pin, isHost: false, playerName });
  return { success: true, game };
}

function startNextQuestion(hostSocketId) {
  const info = socketMap.get(hostSocketId);
  if (!info?.isHost) return { success: false, error: 'Not a host' };
  const game = games.get(info.gamePin);
  if (!game) return { success: false, error: 'Game not found' };

  if (game.questionTimer) { clearTimeout(game.questionTimer); game.questionTimer = null; }

  // Store previous ranks before new question
  const prevLeaderboard = getLeaderboard(game);
  prevLeaderboard.forEach((p) => {
    if (game.players) {
      const playerEntry = Object.values(game.players).find((pl) => pl.name === p.name);
      if (playerEntry) playerEntry.previousRank = p.rank;
    }
  });

  game.currentQuestionIndex++;
  if (game.currentQuestionIndex >= game.quiz.questions.length) {
    game.status = 'ended';
    return { success: false, ended: true, game };
  }

  const q = game.quiz.questions[game.currentQuestionIndex];
  const duration = (q.timeLimit || 20) * 1000;

  // Reset player answers
  Object.values(game.players).forEach((p) => {
    p.currentAnswer = null;
    p.currentAnswerTime = null;
    p.lastQuestionScore = 0;
  });

  game.status = 'question';
  game.questionStartTime = Date.now();
  game.currentQuestionDuration = duration;

  // Shuffle options if enabled
  let options = q.options || [];
  if (q.shuffleOptions && options.length > 0) {
    options = [...options].sort(() => Math.random() - 0.5);
  }

  // Student question: no correct answer info
  const studentQ = {
    index: game.currentQuestionIndex,
    total: game.quiz.questions.length,
    text: q.text,
    type: q.type,
    options: options.map((o) => ({ text: o.text })), // strip isCorrect
    timeLimit: q.timeLimit || 20,
    imageUrl: q.imageUrl || null,
  };

  const hostQ = {
    ...studentQ,
    options: options,
    correctAnswer: options.findIndex((o) => o.isCorrect),
    explanation: q.explanation || '',
    points: q.points || 1000,
  };

  return { success: true, studentQ, hostQ, game, duration };
}

function submitAnswer(socketId, answerIndex) {
  const info = socketMap.get(socketId);
  if (!info || info.isHost) return { success: false };
  const game = games.get(info.gamePin);
  if (!game || game.status !== 'question') return { success: false };
  const player = game.players[socketId];
  if (!player || player.currentAnswer !== null) return { success: false, alreadyAnswered: true };

  const q = game.quiz.questions[game.currentQuestionIndex];
  const now = Date.now();
  const elapsed = now - game.questionStartTime;
  const remaining = Math.max(0, game.currentQuestionDuration - elapsed);

  player.currentAnswer = answerIndex;
  player.currentAnswerTime = now;
  player.responseTimes.push(elapsed);

  // Determine correctness based on question type
  let correct = false;
  let correctAnswerIndex = -1;

  if (q.type === 'multiple-choice' || q.type === 'true-false') {
    const shuffledOptions = q.options; // already shuffled at question start
    correctAnswerIndex = shuffledOptions.findIndex((o) => o.isCorrect);
    correct = answerIndex === correctAnswerIndex;
  } else if (q.type === 'poll') {
    correct = true; // polls always reward participation
    correctAnswerIndex = answerIndex;
  }

  let pointsEarned = 0;
  if (correct && q.type !== 'poll') {
    pointsEarned = calcPoints(remaining, game.currentQuestionDuration, q.points || 1000);
    const streakBonus = Math.min(player.streak * STREAK_BONUS, MAX_STREAK_BONUS);
    pointsEarned += streakBonus;
    player.streak++;
    player.correctCount++;
  } else if (q.type === 'poll') {
    pointsEarned = 100; // participation points
  } else {
    player.streak = 0;
    player.incorrectCount++;
  }

  player.score += pointsEarned;
  player.lastQuestionScore = pointsEarned;

  const answered = Object.values(game.players).filter((p) => p.currentAnswer !== null).length;
  const total = Object.keys(game.players).length;

  return {
    success: true, correct, pointsEarned, correctAnswerIndex,
    answeredCount: answered, totalPlayers: total,
    answerStats: getAnswerStats(game),
  };
}

function endQuestion(gamePin) {
  const game = games.get(gamePin);
  if (!game) return { success: false };
  if (game.questionTimer) { clearTimeout(game.questionTimer); game.questionTimer = null; }

  game.status = 'results';
  const q = game.quiz.questions[game.currentQuestionIndex];
  const correctIndex = q.options?.findIndex((o) => o.isCorrect) ?? -1;

  // Zero out non-answerers' streaks
  Object.values(game.players).forEach((p) => {
    if (p.currentAnswer === null && q.type !== 'poll') { p.streak = 0; }
  });

  // Collect question stats for analytics
  const stats = getAnswerStats(game);
  const totalResponses = Object.values(stats).reduce((a, b) => a + b, 0);
  const correctResponses = stats[correctIndex] || 0;

  game.sessionStats.push({
    questionIndex: game.currentQuestionIndex,
    questionText: q.text,
    questionType: q.type,
    correctAnswer: correctIndex,
    totalResponses,
    correctResponses,
    accuracyPercent: totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0,
    avgResponseTime: calcAvgResponseTime(game),
    optionBreakdown: stats,
  });

  return {
    success: true,
    correctAnswerIndex: correctIndex,
    explanation: q.explanation || '',
    leaderboard: getLeaderboard(game),
    answerStats: stats,
    questionIndex: game.currentQuestionIndex,
    isLastQuestion: game.currentQuestionIndex >= game.quiz.questions.length - 1,
  };
}

function calcAvgResponseTime(game) {
  const times = Object.values(game.players).flatMap((p) => p.responseTimes);
  if (times.length === 0) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

function getFinalSessionData(game) {
  const lb = getLeaderboard(game);
  const players = lb.map((p, i) => ({
    name: p.name,
    finalScore: p.score,
    finalRank: i + 1,
    correctCount: p.correctCount || 0,
    incorrectCount: p.incorrectCount || 0,
    avgResponseTime: (() => {
      const pl = Object.values(game.players).find((pl) => pl.name === p.name);
      const times = pl?.responseTimes || [];
      return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    })(),
  }));

  const avgScore = players.length
    ? Math.round(players.reduce((a, p) => a + p.finalScore, 0) / players.length) : 0;

  const avgAccuracy = game.sessionStats.length
    ? Math.round(game.sessionStats.reduce((a, s) => a + s.accuracyPercent, 0) / game.sessionStats.length) : 0;

  return {
    pin: game.pin,
    quizId: game.quiz._id,
    hostUserId: game.hostUserId,
    playerCount: players.length,
    questionsPlayed: game.currentQuestionIndex + 1,
    players,
    questionStats: game.sessionStats,
    avgScore,
    avgAccuracy,
    duration: Math.round((Date.now() - game.startedAt) / 1000),
    leaderboard: lb,
  };
}

function removePlayer(socketId) {
  const info = socketMap.get(socketId);
  if (!info) return null;
  socketMap.delete(socketId);

  if (info.isHost) {
    const game = games.get(info.gamePin);
    if (game) {
      if (game.questionTimer) clearTimeout(game.questionTimer);
      games.delete(info.gamePin);
    }
    return { wasHost: true, gamePin: info.gamePin };
  }

  const game = games.get(info.gamePin);
  if (game?.players[socketId]) {
    delete game.players[socketId];
    return { wasHost: false, gamePin: info.gamePin, playerName: info.playerName, game };
  }
  return null;
}

function getPlayerList(gamePin) {
  const game = games.get(gamePin);
  if (!game) return [];
  return Object.values(game.players).map((p) => ({ name: p.name }));
}

const getGame = (pin) => games.get(pin);
const getSocketInfo = (id) => socketMap.get(id);

module.exports = {
  createGame, joinGame, startNextQuestion, submitAnswer,
  endQuestion, removePlayer, getPlayerList, getLeaderboard,
  getGame, getSocketInfo, getFinalSessionData,
};

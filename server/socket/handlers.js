const jwt         = require('jsonwebtoken');
const Quiz        = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const gm          = require('./gameManager');

function registerHandlers(io, socket) {
  socket.on('host:create', async ({ quizId, token }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const quiz = await Quiz.findOne({ _id: quizId, host: decoded.id });
      if (!quiz) return socket.emit('error', { message: 'Quiz not found.' });
      if (!quiz.questions.length) return socket.emit('error', { message: 'Add at least one question first.' });

      const session = await GameSession.create({ quiz: quiz._id, host: decoded.id, pin: '000000', status: 'active' });
      const pin = gm.createGame(socket.id, quiz, session._id.toString());
      await GameSession.findByIdAndUpdate(session._id, { pin });

      socket.join(pin);
      socket.emit('game:created', { pin, quizTitle: quiz.title, questionCount: quiz.questions.length });
    } catch (err) {
      console.error('[Socket] host:create:', err.message);
      socket.emit('error', { message: 'Failed to create game.' });
    }
  });

  socket.on('player:join', ({ pin, name }) => {
    const cp = String(pin||'').trim(), cn = String(name||'').trim();
    if (!cp || !cn) return socket.emit('join:error', { message: 'PIN and name are required.' });
    if (cn.length < 2 || cn.length > 24) return socket.emit('join:error', { message: 'Name must be 2-24 characters.' });

    const result = gm.joinGame(socket.id, cp, cn);
    if (!result.success) return socket.emit('join:error', { message: result.error });

    socket.join(cp);
    socket.emit('join:success', { pin: cp, playerName: cn, quizTitle: result.game.quizTitle });
    io.to(cp).emit('lobby:update', { players: gm.getPlayerList(cp), count: Object.keys(result.game.players).length });
  });

  socket.on('host:next', () => {
    const result = gm.startNextQuestion(socket.id);
    if (!result.success) {
      if (result.ended) { finalizeGame(io, result.game); return; }
      return socket.emit('error', { message: result.error });
    }
    const { studentQ, hostQ, game, duration } = result;
    socket.emit('question:start', { question: hostQ, isHost: true });
    socket.to(game.pin).emit('question:start', { question: studentQ, isHost: false });
    game.questionTimer = setTimeout(() => triggerQuestionEnd(io, game.pin), duration);
  });

  socket.on('host:end-question', () => {
    const info = gm.getSocketInfo(socket.id);
    if (info?.isHost) triggerQuestionEnd(io, info.pin);
  });

  socket.on('player:answer', ({ answer }) => {
    if (answer === undefined || answer === null) return;
    const result = gm.submitAnswer(socket.id, answer);
    if (!result.success || result.alreadyAnswered) return;

    socket.emit('answer:result', { correct: result.correct, pointsEarned: result.pointsEarned, correctOptionIndex: result.correctOptionIndex });

    const info = gm.getSocketInfo(socket.id);
    if (info) {
      const game = gm.getGame(info.pin);
      if (game) {
        io.to(game.hostSocketId).emit('host:answer-update', { answeredCount: result.answeredCount, totalPlayers: result.totalPlayers, answerStats: result.answerStats });
        if (result.answeredCount >= result.totalPlayers && result.totalPlayers > 0) {
          clearTimeout(game.questionTimer);
          setTimeout(() => triggerQuestionEnd(io, info.pin), 800);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    const result = gm.removePlayer(socket.id);
    if (!result) return;
    if (result.wasHost) {
      io.to(result.pin).emit('host:disconnected', { message: 'The host disconnected.' });
    } else if (result.game) {
      io.to(result.pin).emit('lobby:update', { players: gm.getPlayerList(result.pin), count: Object.keys(result.game.players).length });
    }
  });
}

function triggerQuestionEnd(io, pin) {
  const result = gm.endQuestion(pin);
  if (!result.success) return;
  io.to(pin).emit('question:end', {
    correctOptionIndex: result.correctOptionIndex,
    explanation: result.explanation,
    leaderboard: result.leaderboard,
    answerStats: result.answerStats,
    questionIndex: result.questionIndex,
    isLastQuestion: result.isLastQuestion,
    questionType: result.questionType,
  });
}

async function finalizeGame(io, game) {
  const sessionData = gm.buildSessionData(game.pin);
  if (!sessionData) return;
  try {
    await GameSession.findByIdAndUpdate(game.sessionId, { ...sessionData, status: 'completed' });
    const avgScore = sessionData.players.length > 0
      ? Math.round(sessionData.players.reduce((a,p)=>a+p.score,0)/sessionData.players.length) : 0;
    await Quiz.findByIdAndUpdate(game.questions[0]?.quiz || game.pin, {
      $inc:{'stats.totalPlays':1,'stats.totalPlayers':sessionData.playerCount},
      $set:{'stats.lastPlayedAt':new Date(),'stats.avgScore':avgScore},
    }).catch(()=>{}); // non-critical
  } catch (err) { console.error('[Socket] finalizeGame:', err.message); }
  io.to(game.pin).emit('game:ended', { leaderboard: gm.getLeaderboard(game) });
}

module.exports = { registerHandlers };

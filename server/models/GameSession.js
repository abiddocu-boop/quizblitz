/**
 * models/GameSession.js
 * Stores completed game session data for analytics.
 * Written at the end of each game.
 */

const mongoose = require('mongoose');

const PlayerResultSchema = new mongoose.Schema({
  name: String,
  finalScore: Number,
  finalRank: Number,
  correctCount: Number,
  incorrectCount: Number,
  avgResponseTime: Number, // ms
});

const QuestionStatSchema = new mongoose.Schema({
  questionIndex: Number,
  questionText: String,
  questionType: String,
  correctAnswer: mongoose.Schema.Types.Mixed,
  totalResponses: Number,
  correctResponses: Number,
  accuracyPercent: Number,
  avgResponseTime: Number, // ms
  optionBreakdown: mongoose.Schema.Types.Mixed, // { 0: 5, 1: 2, ... }
});

const GameSessionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pin: {
      type: String,
      required: true,
    },
    playerCount: {
      type: Number,
      default: 0,
    },
    questionsPlayed: {
      type: Number,
      default: 0,
    },
    players: [PlayerResultSchema],
    questionStats: [QuestionStatSchema],
    avgScore: Number,
    avgAccuracy: Number,
    duration: Number, // seconds
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameSession', GameSessionSchema);

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['multiple_choice','true_false','short_answer','poll'], default: 'multiple_choice' },
  text: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: null },
  options: [{ text: { type: String, required: true }, isCorrect: { type: Boolean, default: false } }],
  acceptedAnswers: [{ type: String }],
  explanation: { type: String, default: '' },
  timeLimit: { type: Number, default: 20, min: 5, max: 120 },
  points: { type: Number, default: 1000, min: 0, max: 2000 },
  shuffleOptions: { type: Boolean, default: false },
});

const quizSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, default: '' },
  subject: { type: String, trim: true, default: '' },
  coverColor: { type: String, default: '#4F46E5' },
  questions: [questionSchema],
  isPublic: { type: Boolean, default: false },
  stats: {
    totalPlays:   { type: Number, default: 0 },
    totalPlayers: { type: Number, default: 0 },
    avgScore:     { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: null },
  },
}, { timestamps: true });

// Virtual for question count (used in list views)
quizSchema.virtual('questionCount').get(function() { return this.questions?.length || 0; });
quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Quiz', quizSchema);

const express     = require('express');
const Quiz        = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ host: req.user._id }).select('-questions').sort({ updatedAt: -1 });
    // Add questionCount virtual
    const withCount = quizzes.map(q => {
      const obj = q.toObject();
      return obj;
    });
    res.json({ quizzes: withCount });
  } catch { res.status(500).json({ message: 'Failed to fetch quizzes.' }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, subject, coverColor, questions } = req.body;
    if (!title) return res.status(400).json({ message: 'Quiz title is required.' });
    const quiz = await Quiz.create({ host: req.user._id, title, description, subject, coverColor, questions: questions || [] });
    res.status(201).json({ quiz });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to create quiz.' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, host: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    res.json({ quiz });
  } catch { res.status(500).json({ message: 'Failed to fetch quiz.' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'description', 'subject', 'coverColor', 'questions', 'isPublic'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const quiz = await Quiz.findOneAndUpdate({ _id: req.params.id, host: req.user._id }, updates, { new: true, runValidators: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    res.json({ quiz });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to update quiz.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, host: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    res.json({ message: 'Quiz deleted.' });
  } catch { res.status(500).json({ message: 'Failed to delete quiz.' }); }
});

router.post('/:id/import', async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ message: 'Provide an array of questions.' });
    const quiz = await Quiz.findOne({ _id: req.params.id, host: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    quiz.questions.push(...questions);
    await quiz.save();
    res.json({ quiz, imported: questions.length });
  } catch { res.status(500).json({ message: 'Import failed.' }); }
});

router.get('/:id/analytics', async (req, res) => {
  try {
    const sessions = await GameSession.find({ quiz: req.params.id, host: req.user._id, status: 'completed' }).sort({ createdAt: -1 }).limit(20);
    if (!sessions.length) return res.json({ sessions: [], summary: null });
    const summary = {
      totalSessions: sessions.length,
      totalPlayers: sessions.reduce((a, s) => a + s.playerCount, 0),
      avgPlayersPerSession: Math.round(sessions.reduce((a, s) => a + s.playerCount, 0) / sessions.length),
      avgScore: Math.round(sessions.reduce((a, s) => {
        const scores = s.players.map(p => p.score);
        return a + (scores.length ? scores.reduce((x,y)=>x+y,0)/scores.length : 0);
      }, 0) / sessions.length),
    };
    res.json({ sessions, summary });
  } catch { res.status(500).json({ message: 'Analytics failed.' }); }
});

module.exports = router;

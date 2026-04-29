/**
 * routes/auth.js
 * Registration and login endpoints.
 * Returns JWT token on success.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rate limit auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many attempts. Please wait 15 minutes.' },
});

// ── Helper: generate JWT ──────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── POST /api/auth/register ───────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, organization } = req.body;

    try {
      // Check for existing email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }

      // Create user (password hashed automatically via pre-save hook)
      const user = await User.create({ name, email, password, organization: organization || '' });

      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: user.toSafeObject(),
      });
    } catch (err) {
      console.error('[Auth] Register error:', err);
      res.status(500).json({ message: 'Server error. Please try again.' });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      // Find user and explicitly select password (normally excluded)
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        // Generic message — don't reveal whether email exists
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = generateToken(user._id);

      res.json({
        token,
        user: user.toSafeObject(),
      });
    } catch (err) {
      console.error('[Auth] Login error:', err);
      res.status(500).json({ message: 'Server error. Please try again.' });
    }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────
// Returns current user profile (requires valid token)
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = router;

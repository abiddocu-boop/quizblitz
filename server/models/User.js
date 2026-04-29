/**
 * models/User.js
 * Host user account — stores credentials and profile info.
 * Passwords are hashed with bcrypt before saving.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries by default
    },
    organization: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['teacher', 'admin'],
      default: 'teacher',
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
);

// ── Hash password before saving ───────────────────────────────
UserSchema.pre('save', async function (next) {
  // Only hash if password was modified (new user or password change)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12); // 12 rounds — secure but not too slow
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare password ────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: safe profile (no password) ──────────────
UserSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    organization: this.organization,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);

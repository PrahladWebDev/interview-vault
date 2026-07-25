import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// One entry per active refresh token / login session. The raw JWT is never
// stored - only its SHA-256 hash - so a database read can't be used to
// impersonate a session. Device/IP metadata powers the "active sessions" UI.
const sessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  userAgent: { type: String, default: '' },
  ip: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    avatarUrl: { type: String, default: '' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    sessions: { type: [sessionSchema], select: false },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    theme: this.theme,
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  hashToken,
  REFRESH_COOKIE_NAME,
} from '../utils/tokens.js';

const MAX_SESSIONS = 5;

function describeRequest(req) {
  return {
    userAgent: (req.headers['user-agent'] || '').slice(0, 300),
    ip: req.ip || req.socket?.remoteAddress || '',
  };
}

async function issueTokens(res, user, req) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const { userAgent, ip } = describeRequest(req);

  // Keep a rolling window of active sessions per user so logout / rotation
  // can invalidate one session without invalidating every device.
  user.sessions = [
    ...(user.sessions || []),
    { tokenHash: hashToken(refreshToken), userAgent, ip, createdAt: new Date(), lastUsedAt: new Date() },
  ].slice(-MAX_SESSIONS);
  await user.save();

  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password });
  const accessToken = await issueTokens(res, user, req);

  res.status(201).json({ success: true, accessToken, user: user.toSafeObject() });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +sessions');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const accessToken = await issueTokens(res, user, req);

  res.json({ success: true, accessToken, user: user.toSafeObject() });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token expired or invalid');
  }

  const tokenHash = hashToken(token);
  const user = await User.findById(payload.sub).select('+sessions');
  const matched = user?.sessions?.find((s) => s.tokenHash === tokenHash);
  if (!user || !matched) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token not recognized');
  }

  // Rotate: drop the used session entry, issue a new pair (and a fresh entry).
  user.sessions = user.sessions.filter((s) => s.tokenHash !== tokenHash);
  const accessToken = await issueTokens(res, user, req);

  res.json({ success: true, accessToken, user: user.toSafeObject() });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const tokenHash = hashToken(token);
      const user = await User.findById(payload.sub).select('+sessions');
      if (user) {
        user.sessions = (user.sessions || []).filter((s) => s.tokenHash !== tokenHash);
        await user.save();
      }
    } catch {
      // token already invalid - nothing to clean up
    }
  }

  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl, theme } = req.body;

  if (name !== undefined) req.user.name = name;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  if (theme !== undefined) req.user.theme = theme;

  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

// --- Session management ---------------------------------------------------

// Lists every active session (device/browser + IP + timestamps) for the
// signed-in user, flagging which one is the current browser session.
export const listSessions = asyncHandler(async (req, res) => {
  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const currentHash = currentToken ? hashToken(currentToken) : null;

  const user = await User.findById(req.user._id).select('+sessions');
  const sessions = (user.sessions || [])
    .map((s) => ({
      id: s._id,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      current: s.tokenHash === currentHash,
    }))
    .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt));

  res.json({ success: true, sessions });
});

// Revokes a single session by id. Revoking the current session logs this
// browser out too (its refresh cookie stops being recognized).
export const revokeSession = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+sessions');
  const before = user.sessions.length;
  user.sessions = user.sessions.filter((s) => s._id.toString() !== req.params.sessionId);

  if (user.sessions.length === before) throw ApiError.notFound('Session not found');

  await user.save();
  res.json({ success: true, message: 'Session revoked' });
});

// Revokes every session except the current browser's, i.e. "log out of all
// other devices".
export const revokeOtherSessions = asyncHandler(async (req, res) => {
  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const currentHash = currentToken ? hashToken(currentToken) : null;

  const user = await User.findById(req.user._id).select('+sessions');
  const removed = user.sessions.filter((s) => s.tokenHash !== currentHash).length;
  user.sessions = user.sessions.filter((s) => s.tokenHash === currentHash);
  await user.save();

  res.json({ success: true, message: `Revoked ${removed} other session(s)` });
});

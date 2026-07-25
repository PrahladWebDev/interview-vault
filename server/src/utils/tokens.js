import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Sessions store only this hash, never the raw refresh token, so a database
// leak alone can't be replayed as a valid session.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

const REFRESH_COOKIE_NAME = 'iv_refresh';

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

export { REFRESH_COOKIE_NAME };

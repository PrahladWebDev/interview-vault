import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Requires a valid access token in the Authorization header.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw ApiError.unauthorized('Missing access token');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Access token expired or invalid');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = user;
  next();
});

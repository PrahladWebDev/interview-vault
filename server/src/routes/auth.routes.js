import { Router } from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} from '../controllers/auth.controller.js';

const router = Router();

// Stricter limiter on auth endpoints to slow down credential stuffing / brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.patch(
  '/me',
  requireAuth,
  [
    body('name').optional().trim().isLength({ max: 80 }),
    body('avatarUrl').optional().trim().isURL().withMessage('avatarUrl must be a valid URL'),
    body('theme').optional().isIn(['dark', 'light']),
  ],
  validate,
  updateProfile
);

// Active-session listing + revocation ("log out this device" / "log out everywhere else").
router.get('/sessions', requireAuth, listSessions);
router.delete(
  '/sessions/other',
  requireAuth,
  revokeOtherSessions
);
router.delete(
  '/sessions/:sessionId',
  requireAuth,
  [param('sessionId').isMongoId().withMessage('Invalid session id')],
  validate,
  revokeSession
);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { executeCode } from '../controllers/execute.controller.js';

const router = Router();

// Running code hits a third-party sandbox, so it gets its own tighter limit
// on top of the global one in index.js.
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many run requests — slow down a bit and try again.' },
});

router.use(requireAuth);

router.post(
  '/',
  executeLimiter,
  [
    body('language').trim().notEmpty().withMessage('language is required'),
    body('code').isString().notEmpty().withMessage('code is required'),
    body('stdin').optional().isString(),
  ],
  validate,
  executeCode
);

export default router;

import { Router } from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { LANGUAGES, DIFFICULTIES } from '../models/Question.js';
import {
  explainCode,
  suggestSimilarQuestions,
  mockInterviewMessage,
  generateQuiz,
  summarizeNotes,
} from '../controllers/ai.controller.js';

const router = Router();

// Every AI feature calls out to Gemini, so all of them share one moderately
// tight limit on top of the global limiter in index.js.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests — slow down a bit and try again.' },
});

router.use(requireAuth, aiLimiter);

const idParam = [param('id').isMongoId().withMessage('Invalid question id')];

router.post(
  '/explain-code/:id',
  [...idParam, body('language').optional().isIn(LANGUAGES)],
  validate,
  explainCode
);

router.post('/similar-questions/:id', idParam, validate, suggestSimilarQuestions);

router.post(
  '/interview/:id',
  [
    ...idParam,
    body('message').trim().notEmpty().withMessage('message is required').isLength({ max: 4000 }),
    body('history').optional().isArray(),
  ],
  validate,
  mockInterviewMessage
);

router.post(
  '/quiz',
  [
    body('topic').optional().isString(),
    body('company').optional().isString(),
    body('difficulty').optional().isIn(DIFFICULTIES),
    body('count').optional().isInt({ min: 1, max: 10 }),
  ],
  validate,
  generateQuiz
);

router.post('/summarize-notes/:id', idParam, validate, summarizeNotes);

export default router;

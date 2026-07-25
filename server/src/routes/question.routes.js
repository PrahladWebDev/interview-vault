import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { DIFFICULTIES, EXPERIENCE_LEVELS, ROUNDS } from '../models/Question.js';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleFavorite,
  markSolved,
  reviewQuestion,
  getFacets,
} from '../controllers/question.controller.js';

const router = Router();

router.use(requireAuth);

const idParam = [param('id').isMongoId().withMessage('Invalid question id')];

router.get('/', listQuestions);
router.get('/facets', getFacets);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('difficulty').optional().isIn(DIFFICULTIES),
    body('experienceLevel').optional().isIn(EXPERIENCE_LEVELS),
    body('round').optional().isIn(ROUNDS),
    body('tags').optional().isArray(),
  ],
  validate,
  createQuestion
);

router.get('/:id', idParam, validate, getQuestion);
router.patch('/:id', idParam, validate, updateQuestion);
router.delete('/:id', idParam, validate, deleteQuestion);

router.post('/:id/favorite', idParam, validate, toggleFavorite);
router.post('/:id/solve', idParam, validate, markSolved);
router.post(
  '/:id/review',
  idParam,
  [body('remembered').optional().isBoolean()],
  validate,
  reviewQuestion
);

export default router;

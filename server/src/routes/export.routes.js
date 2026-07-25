import { Router } from 'express';
import { query, param, body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { exportQuestions, exportCollection, importQuestions } from '../controllers/export.controller.js';

// Mounted at /api in index.js, so routes below resolve to:
//   GET  /api/export/questions
//   GET  /api/export/collections/:id
//   POST /api/import/questions
const router = Router();

router.use(requireAuth);

router.get(
  '/export/questions',
  [query('format').optional().isIn(['json', 'markdown', 'pdf'])],
  validate,
  exportQuestions
);

router.get(
  '/export/collections/:id',
  [param('id').isMongoId().withMessage('Invalid collection id'), query('format').optional().isIn(['json', 'markdown', 'pdf'])],
  validate,
  exportCollection
);

router.post(
  '/import/questions',
  [body('questions').isArray({ min: 1 }).withMessage('questions array is required')],
  validate,
  importQuestions
);

export default router;

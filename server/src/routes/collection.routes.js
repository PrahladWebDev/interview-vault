import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
  addQuestionsToCollection,
  removeQuestionFromCollection,
  reorderCollectionQuestions,
  getCollectionsForQuestion,
} from '../controllers/collection.controller.js';

const router = Router();

router.use(requireAuth);

const idParam = [param('id').isMongoId().withMessage('Invalid collection id')];

router.get('/', listCollections);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('color').optional().isString(),
  ],
  validate,
  createCollection
);

router.get(
  '/for-question/:questionId',
  [param('questionId').isMongoId().withMessage('Invalid question id')],
  validate,
  getCollectionsForQuestion
);

router.get('/:id', idParam, validate, getCollection);

router.patch(
  '/:id',
  [
    ...idParam,
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('color').optional().isString(),
  ],
  validate,
  updateCollection
);

router.delete('/:id', idParam, validate, deleteCollection);

router.post(
  '/:id/questions',
  [...idParam, body('questionIds').isArray({ min: 1 }).withMessage('questionIds is required')],
  validate,
  addQuestionsToCollection
);

router.delete(
  '/:id/questions/:questionId',
  [...idParam, param('questionId').isMongoId().withMessage('Invalid question id')],
  validate,
  removeQuestionFromCollection
);

router.patch(
  '/:id/reorder',
  [...idParam, body('questionIds').isArray({ min: 1 }).withMessage('questionIds is required')],
  validate,
  reorderCollectionQuestions
);

export default router;

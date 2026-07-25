import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getSummary,
  getHeatmap,
  getTopicProgress,
  getCompanyProgress,
  getRecentActivity,
} from '../controllers/dashboard.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/heatmap', getHeatmap);
router.get('/topics', getTopicProgress);
router.get('/companies', getCompanyProgress);
router.get('/activity', getRecentActivity);

export default router;

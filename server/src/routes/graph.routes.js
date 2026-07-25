import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getGraph } from '../controllers/graph.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getGraph);

export default router;

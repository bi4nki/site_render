
import express from 'express';
import { optimizeTransport } from '../controllers/optimizationController.js';

const router = express.Router();

router.post('/optimize', optimizeTransport);

export default router;

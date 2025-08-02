import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Company routes - Coming soon' });
});

export default router;
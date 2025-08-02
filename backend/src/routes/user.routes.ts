import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// User management routes (placeholder)
router.get('/', authenticateToken, requireRole(['Super Admin', 'Company Admin']), (req, res) => {
  res.json({ message: 'User routes - Coming soon' });
});

export default router;
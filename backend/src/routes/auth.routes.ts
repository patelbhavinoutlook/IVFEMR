import express from 'express';
import { body } from 'express-validator';
import { 
  login, 
  logout, 
  refreshToken, 
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Validation rules
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const passwordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

// Routes
router.post('/login', loginValidation, asyncHandler(login));
router.post('/logout', authenticateToken, asyncHandler(logout));
router.post('/refresh-token', asyncHandler(refreshToken));
router.get('/profile', authenticateToken, asyncHandler(getProfile));
router.put('/profile', authenticateToken, asyncHandler(updateProfile));
router.put('/change-password', authenticateToken, passwordValidation, asyncHandler(changePassword));

export default router;
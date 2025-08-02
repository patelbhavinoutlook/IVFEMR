import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import { logger } from '../utils/logger';

interface LoginRequest {
  username: string;
  password: string;
  clinicId?: string;
  companyId?: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

const generateTokens = (payload: any) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { username, password } = req.body;

    // Get user with roles, companies, and clinics
    const userQuery = `
      SELECT 
        u.user_id, u.username, u.password_hash, u.is_active, u.official_email,
        u.phone1, u.profile_image_path, u.license_number,
        ARRAY_AGG(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) as roles,
        ARRAY_AGG(DISTINCT c.company_id) FILTER (WHERE c.company_id IS NOT NULL) as company_ids,
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as company_names,
        ARRAY_AGG(DISTINCT cl.clinic_id) FILTER (WHERE cl.clinic_id IS NOT NULL) as clinic_ids,
        ARRAY_AGG(DISTINCT cl.name) FILTER (WHERE cl.name IS NOT NULL) as clinic_names
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN user_companies uc ON u.user_id = uc.user_id
      LEFT JOIN companies c ON uc.company_id = c.company_id
      LEFT JOIN user_clinics ucl ON u.user_id = ucl.user_id
      LEFT JOIN clinics cl ON ucl.clinic_id = cl.clinic_id
      WHERE u.username = $1 AND u.is_active = true
      GROUP BY u.user_id, u.username, u.password_hash, u.is_active, u.official_email,
               u.phone1, u.profile_image_path, u.license_number
    `;

    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Prepare user data for token
    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      roles: user.roles || [],
      companies: user.company_ids || [],
      clinics: user.clinic_ids || [],
    };

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Log successful login
    logger.info(`User logged in: ${username}`, { userId: user.user_id });

    // Prepare response data
    const userData = {
      userId: user.user_id,
      username: user.username,
      email: user.official_email,
      phone: user.phone1,
      profileImage: user.profile_image_path,
      licenseNumber: user.license_number,
      roles: user.roles || [],
      companies: (user.company_ids || []).map((id: string, index: number) => ({
        id,
        name: user.company_names[index],
      })),
      clinics: (user.clinic_ids || []).map((id: string, index: number) => ({
        id,
        name: user.clinic_names[index],
      })),
    };

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: userData,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    logger.info(`User logged out: ${req.user?.username}`, { userId: req.user?.userId });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
};

export const refreshToken = async (req: Request<{}, {}, RefreshTokenRequest>, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token not provided',
      });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    // Get updated user data
    const userQuery = `
      SELECT 
        u.user_id, u.username, u.is_active,
        ARRAY_AGG(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) as roles,
        ARRAY_AGG(DISTINCT uc.company_id) FILTER (WHERE uc.company_id IS NOT NULL) as companies,
        ARRAY_AGG(DISTINCT ucl.clinic_id) FILTER (WHERE ucl.clinic_id IS NOT NULL) as clinics
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN user_companies uc ON u.user_id = uc.user_id
      LEFT JOIN user_clinics ucl ON u.user_id = ucl.user_id
      WHERE u.user_id = $1 AND u.is_active = true
      GROUP BY u.user_id, u.username, u.is_active
    `;

    const userResult = await pool.query(userQuery, [decoded.userId]);

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
      return;
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      roles: user.roles || [],
      companies: user.companies || [],
      clinics: user.clinics || [],
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userQuery = `
      SELECT 
        u.user_id, u.username, u.official_email, u.personal_email,
        u.phone1, u.phone2, u.profile_image_path, u.license_number, 
        u.license_image_path, u.created_at,
        ARRAY_AGG(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) as roles,
        ARRAY_AGG(DISTINCT c.company_id) FILTER (WHERE c.company_id IS NOT NULL) as company_ids,
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as company_names,
        ARRAY_AGG(DISTINCT cl.clinic_id) FILTER (WHERE cl.clinic_id IS NOT NULL) as clinic_ids,
        ARRAY_AGG(DISTINCT cl.name) FILTER (WHERE cl.name IS NOT NULL) as clinic_names
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN user_companies uc ON u.user_id = uc.user_id
      LEFT JOIN companies c ON uc.company_id = c.company_id
      LEFT JOIN user_clinics ucl ON u.user_id = ucl.user_id
      LEFT JOIN clinics cl ON ucl.clinic_id = cl.clinic_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, u.username, u.official_email, u.personal_email,
               u.phone1, u.phone2, u.profile_image_path, u.license_number, 
               u.license_image_path, u.created_at
    `;

    const result = await pool.query(userQuery, [req.user?.userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const user = result.rows[0];

    const profileData = {
      userId: user.user_id,
      username: user.username,
      officialEmail: user.official_email,
      personalEmail: user.personal_email,
      phone1: user.phone1,
      phone2: user.phone2,
      profileImage: user.profile_image_path,
      licenseNumber: user.license_number,
      licenseImage: user.license_image_path,
      createdAt: user.created_at,
      roles: user.roles || [],
      companies: (user.company_ids || []).map((id: string, index: number) => ({
        id,
        name: user.company_names[index],
      })),
      clinics: (user.clinic_ids || []).map((id: string, index: number) => ({
        id,
        name: user.clinic_names[index],
      })),
    };

    res.status(200).json({
      success: true,
      user: profileData,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personalEmail, phone1, phone2 } = req.body;
    const userId = req.user?.userId;

    const updateQuery = `
      UPDATE users 
      SET personal_email = $1, phone1 = $2, phone2 = $3, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
      RETURNING user_id, username, official_email, personal_email, phone1, phone2
    `;

    const result = await pool.query(updateQuery, [personalEmail, phone1, phone2, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    logger.info(`Profile updated for user: ${req.user?.username}`, { userId });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

export const changePassword = async (req: Request<{}, {}, ChangePasswordRequest>, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [newPasswordHash, userId]
    );

    logger.info(`Password changed for user: ${req.user?.username}`, { userId });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
};
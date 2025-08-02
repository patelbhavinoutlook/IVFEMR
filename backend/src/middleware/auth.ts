import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { logger } from '../utils/logger';

interface JWTPayload {
  userId: string;
  username: string;
  roles: string[];
  companies: string[];
  clinics: string[];
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    roles: string[];
    companies: string[];
    clinics: string[];
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        roles: string[];
        companies: string[];
        clinics: string[];
      };
    }
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verify user still exists and is active
    const userQuery = `
      SELECT u.user_id, u.username, u.is_active,
             ARRAY_AGG(DISTINCT r.role_name) as roles,
             ARRAY_AGG(DISTINCT uc.company_id) as companies,
             ARRAY_AGG(DISTINCT ucl.clinic_id) as clinics
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
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    const user = userResult.rows[0];

    req.user = {
      userId: user.user_id,
      username: user.username,
      roles: user.roles.filter((role: string) => role !== null),
      companies: user.companies.filter((id: string) => id !== null),
      clinics: user.clinics.filter((id: string) => id !== null),
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication service error' });
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    const isSuperAdmin = req.user.roles.includes('Super Admin');

    if (!hasRole && !isSuperAdmin) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.roles
      });
      return;
    }

    next();
  };
};

export const requireCompanyAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const companyId = req.params.companyId || req.body.companyId || req.headers['x-company-id'];
  
  if (!companyId) {
    res.status(400).json({ error: 'Company ID required' });
    return;
  }

  const isSuperAdmin = req.user.roles.includes('Super Admin');
  const hasCompanyAccess = req.user.companies.includes(companyId);

  if (!isSuperAdmin && !hasCompanyAccess) {
    res.status(403).json({ error: 'Access denied for this company' });
    return;
  }

  next();
};

export const requireClinicAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const clinicId = req.params.clinicId || req.body.clinicId || req.headers['x-clinic-id'];
  
  if (!clinicId) {
    res.status(400).json({ error: 'Clinic ID required' });
    return;
  }

  const isSuperAdmin = req.user.roles.includes('Super Admin');
  const hasClinicAccess = req.user.clinics.includes(clinicId);

  if (!isSuperAdmin && !hasClinicAccess) {
    res.status(403).json({ error: 'Access denied for this clinic' });
    return;
  }

  next();
};

// Middleware to validate license for doctors and embryologists
export const requireLicense = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const requiresLicense = req.user.roles.some(role => 
    ['Doctor', 'Embryologist'].includes(role)
  );

  if (requiresLicense) {
    try {
      const licenseQuery = `
        SELECT license_number, license_image_path 
        FROM users 
        WHERE user_id = $1 AND license_number IS NOT NULL AND license_image_path IS NOT NULL
      `;
      const licenseResult = await pool.query(licenseQuery, [req.user.userId]);

      if (licenseResult.rows.length === 0) {
        res.status(403).json({ 
          error: 'Valid license required for this role',
          message: 'Please upload your license number and certificate'
        });
        return;
      }
    } catch (error) {
      logger.error('License validation error:', error);
      res.status(500).json({ error: 'License validation failed' });
      return;
    }
  }

  next();
};

// Optional authentication - does not fail if no token
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    const userQuery = `
      SELECT u.user_id, u.username, u.is_active,
             ARRAY_AGG(DISTINCT r.role_name) as roles,
             ARRAY_AGG(DISTINCT uc.company_id) as companies,
             ARRAY_AGG(DISTINCT ucl.clinic_id) as clinics
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN user_companies uc ON u.user_id = uc.user_id
      LEFT JOIN user_clinics ucl ON u.user_id = ucl.user_id
      WHERE u.user_id = $1 AND u.is_active = true
      GROUP BY u.user_id, u.username, u.is_active
    `;

    const userResult = await pool.query(userQuery, [decoded.userId]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      req.user = {
        userId: user.user_id,
        username: user.username,
        roles: user.roles.filter((role: string) => role !== null),
        companies: user.companies.filter((id: string) => id !== null),
        clinics: user.clinics.filter((id: string) => id !== null),
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};
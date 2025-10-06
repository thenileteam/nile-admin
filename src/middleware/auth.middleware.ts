import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
        error: "MISSING_TOKEN",
      });
      return;
    }

    const decoded = AuthService.verifyAccessToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: "INVALID_TOKEN",
      });
      return;
    }

    // Get user from database to ensure they still exist
    const user = await AuthService.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: "AUTH_ERROR",
    });
  }
};

/**
 * Middleware to check if user's email is verified
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "NOT_AUTHENTICATED",
    });
    return;
  }

  // This would need to be enhanced to check the actual user's verification status
  // For now, we'll assume the user object has this information
  // In a real implementation, you'd fetch the user from the database
  next();
};

/**
 * Middleware to check if user has specific role/permission
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED",
      });
      return;
    }

    // This is a placeholder for role-based access control
    // In a real implementation, you'd check the user's roles/permissions
    // For now, we'll allow all authenticated users
    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = AuthService.verifyAccessToken(token);
      if (decoded) {
        const user = await AuthService.getUserById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

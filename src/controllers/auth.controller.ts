import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { EmailService } from "../services/email.service";
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from "../schemas/auth.schema";

export class AuthController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName }: RegisterInput = req.body;
    try {


      const { user, tokens } = await AuthService.register(email, password, firstName, lastName);

      // Send email verification
      try {
        await this.emailService.sendEmailVerification(
          user.email,
          user.firstName,
          user.emailVerificationToken as string
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail registration if email fails
      }
      res.cookie("accessToken", tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.status(201).json({
        success: true,
        message: "User registered successfully. Please check your email for verification.",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        },
      });
    } catch (error: any) { 
      if (error.code === "P2002" || error.message === "User with this email already exists") {
        // user already exists
        const user = await AuthService.getUserByEmail(email); // ✅ FIXED

        if (user) {
          try {
            if (user.emailVerificationToken) {
              await this.emailService.sendEmailVerification(
                user.email,
                user.firstName,
                user.emailVerificationToken
              );
            }
          } catch (emailError) {
            console.error("Failed to resend verification email:", emailError);
          }

          res.status(409).json({
            success: false,
            message: "User already exists. Verification email resent if needed.",
            data: { user },
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: error.message || "Registration failed",
          error: "REGISTRATION_ERROR",
        });
      }
    }
  }


  /**
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password }: LoginInput = req.body;

      const { user, tokens } = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({
        success: false,
        message: error.message || "Login failed",
        error: "LOGIN_ERROR",
      });
    }
  };

  /**
   * Change user password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword }: ChangePasswordInput = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
          error: "NOT_AUTHENTICATED",
        });
        return;
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);

      // Send confirmation email
      try {
        const user = await AuthService.getUserById(userId);
        if (user) {
          await this.emailService.sendPasswordChangeConfirmation(
            user.email,
            user.firstName
          );
        }
      } catch (emailError) {
        console.error("Failed to send password change confirmation:", emailError);
        // Don't fail the operation if email fails
      }

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Password change failed",
        error: "PASSWORD_CHANGE_ERROR",
      });
    }
  };

  /**
   * Initiate forgot password process
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email }: ForgotPasswordInput = req.body;

      const resetToken = await AuthService.forgotPassword(email);

      // Send password reset email
      try {
        // Get user info for email
        const user = await AuthService.getUserByEmail(
          // We need to get user by email first to send the email
          // This is a simplified version
          email
        );
        if (user) {
          await this.emailService.sendPasswordReset(
            email,
            user.firstName,
            resetToken
          );
        }
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        // Don't fail the operation if email fails
      }

      res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Forgot password failed",
        error: "FORGOT_PASSWORD_ERROR",
      });
    }
  };

  /**
   * Reset password using token
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword }: ResetPasswordInput = req.body;

      await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Password reset failed",
        error: "RESET_PASSWORD_ERROR",
      });
    }
  };

  /**
   * Verify email address
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token }: VerifyEmailInput = req.body;

      await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Email verification failed",
        error: "EMAIL_VERIFICATION_ERROR",
      });
    }
  };

  /**
   * Resend email verification
   */
  resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email }: ResendVerificationInput = req.body;

      const verificationToken = await AuthService.resendEmailVerification(email);

      // Send verification email
      try {
        const user = await AuthService.getUserByEmail(
          // We need to get user by email first
          email
        );
        if (user) {
          await this.emailService.sendEmailVerification(
            email,
            user.firstName,
            verificationToken
          );
        }
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail the operation if email fails
      }

      res.status(200).json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Resend verification failed",
        error: "RESEND_VERIFICATION_ERROR",
      });
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
          error: "NOT_AUTHENTICATED",
        });
        return;
      }

      const user = await AuthService.getUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
          error: "USER_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
          },
        },
      });
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user profile",
        error: "PROFILE_ERROR",
      });
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "Refresh token is required",
          error: "MISSING_REFRESH_TOKEN",
        });
        return;
      }

      const decoded = AuthService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
          error: "INVALID_REFRESH_TOKEN",
        });
        return;
      }

      const user = await AuthService.getUserById(decoded.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not found",
          error: "USER_NOT_FOUND",
        });
        return;
      }

      const tokens = AuthService.generateTokens(user);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: { tokens },
      });
    } catch (error: any) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to refresh token",
        error: "REFRESH_TOKEN_ERROR",
      });
    }
  };

  /**
   * Logout user (invalidate tokens)
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a more sophisticated implementation, you might want to:
      // 1. Add tokens to a blacklist
      // 2. Store refresh tokens in the database and invalidate them
      // For now, we'll just return success

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed",
        error: "LOGOUT_ERROR",
      });
    }
  };
}

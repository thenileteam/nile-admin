import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
  private static readonly JWT_EXPIRES_IN = "15m";
  private static readonly JWT_REFRESH_EXPIRES_IN = "7d";
  private static readonly BCRYPT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(user: AuthUser): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: "access"
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(user: AuthUser): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: "refresh"
      },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.JWT_REFRESH_EXPIRES_IN }
    );
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(user: AuthUser): AuthTokens {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      if (decoded.type !== "access") {
        return null;
      }
      return { userId: decoded.userId, email: decoded.email };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as any;
      if (decoded.type !== "refresh") {
        return null;
      }
      return { userId: decoded.userId, email: decoded.email };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a random token for email verification or password reset
   */
  static generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Register a new user
   */
  static async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = this.generateToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        emailVerificationToken,
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isEmailVerified: user.isEmailVerified,
    };

    const tokens = this.generateTokens(authUser);

    return { user: authUser, tokens };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isEmailVerified: user.isEmailVerified,
    };

    const tokens = this.generateTokens(authUser);

    return { user: authUser, tokens };
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  /**
   * Initiate forgot password process
   */
  static async forgotPassword(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return "If an account with that email exists, a password reset link has been sent.";
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    return resetToken;
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new Error("Invalid verification token");
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email is already verified");
    }

    // Generate new verification token
    const verificationToken = this.generateToken();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: verificationToken },
    });

    return verificationToken;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isEmailVerified: user.isEmailVerified,
      emailVerificationToken: user.emailVerificationToken || undefined,
    };
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isEmailVerified: user.isEmailVerified,
      emailVerificationToken: user.emailVerificationToken || undefined,
    };
  }
}

import nodemailer from "nodemailer";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
      port: parseInt(process.env.MAILTRAP_PORT || "2525"),
      auth: {
        user: process.env.MAILTRAP_USERNAME || "",
        pass: process.env.MAILTRAP_PASSWORD || "",
      },
    });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(email: string, firstName: string | undefined, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@nile-admin.com",
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Nile Admin Service!</h2>
          <p>Hello ${firstName || "there"},</p>
          <p>Thank you for registering with Nile Admin Service. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from Nile Admin Service. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, firstName: string | undefined, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@nile-admin.com",
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${firstName || "there"},</p>
          <p>We received a request to reset your password for your Nile Admin Service account. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from Nile Admin Service. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(email: string, firstName: string | undefined): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@nile-admin.com",
      to: email,
      subject: "Welcome to Nile Admin Service!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Nile Admin Service!</h2>
          <p>Hello ${firstName || "there"},</p>
          <p>Thank you for joining Nile Admin Service! Your account has been successfully created and verified.</p>
          <p>You can now access all the features of our admin service:</p>
          <ul>
            <li>Manage orders and customers</li>
            <li>Track inventory and sales</li>
            <li>Generate reports and analytics</li>
            <li>Configure system settings</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Nile Admin Team</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from Nile Admin Service. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmation(email: string, firstName: string | undefined): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@nile-admin.com",
      to: email,
      subject: "Password Changed Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Changed Successfully</h2>
          <p>Hello ${firstName || "there"},</p>
          <p>Your password has been successfully changed for your Nile Admin Service account.</p>
          <p>If you made this change, no further action is required.</p>
          <p>If you did not make this change, please contact our support team immediately as your account may have been compromised.</p>
          <p>Best regards,<br>The Nile Admin Team</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from Nile Admin Service. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email configuration test failed:", error);
      return false;
    }
  }
}

import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import AppError from '../../common/errors/AppError.js';
import AuthRepository from './auth.repository.js';
import {
  createAccessToken,
  generateRefreshToken,
  hashToken,
} from './auth.tokens.js';

const normalizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

class AuthService {
  static async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await AuthRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    const user = await AuthRepository.createUser({
      name,
      email: normalizedEmail,
      password,
    });

    const accessToken = createAccessToken(user);
    const refreshToken = generateRefreshToken();
    await AuthRepository.createRefreshToken(user._id, refreshToken, 'system');

    return {
      user: normalizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async login({ email, password, ip }) {
    const normalizedEmail = email.toLowerCase();
    const user = await AuthRepository.findByEmail(normalizedEmail);
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = createAccessToken(user);
    const refreshToken = generateRefreshToken();
    await AuthRepository.createRefreshToken(user._id, refreshToken, ip || 'unknown');

    return {
      user: normalizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async logout(refreshToken, ip) {
    if (!refreshToken) {
      return { message: 'Logout successful' };
    }

    const tokenDoc = await AuthRepository.findRefreshToken(refreshToken);
    if (!tokenDoc) {
      return { message: 'Logout successful' };
    }

    await AuthRepository.revokeRefreshToken(tokenDoc, ip || 'unknown', 'User requested logout');
    return { message: 'Logout successful' };
  }

  static async logoutAllSessions(userId, ip) {
    await AuthRepository.revokeAllRefreshTokensForUser(userId, ip || 'unknown');
    return { message: 'All sessions revoked' };
  }

  static async refreshToken(refreshToken, ip) {
    if (!refreshToken) {
      throw new AppError('Refresh token missing', 401);
    }

    const tokenDoc = await AuthRepository.findRefreshToken(refreshToken);
    if (!tokenDoc || !tokenDoc.isActive) {
      if (tokenDoc && tokenDoc.revokedAt) {
        await AuthRepository.revokeAllRefreshTokensForUser(tokenDoc.user._id, ip || 'unknown', 'Refresh token reuse detected');
      }
      throw new AppError('Invalid refresh token', 401);
    }

    if (tokenDoc.isExpired) {
      throw new AppError('Refresh token has expired', 401);
    }

    const user = tokenDoc.user;
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    const newRefreshToken = generateRefreshToken();
    await AuthRepository.revokeRefreshToken(tokenDoc, ip || 'unknown', 'Token rotated', hashToken(newRefreshToken));
    await AuthRepository.createRefreshToken(user._id, newRefreshToken, ip || 'unknown');

    const accessToken = createAccessToken(user);

    return {
      user: normalizeUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async forgotPassword({ email }) {
    const normalizedEmail = email.toLowerCase();
    const user = await AuthRepository.findByEmail(normalizedEmail);

    if (!user) {
      return {
        message: 'If the account exists, an OTP has been sent to the registered email address',
      };
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const hashedOtp = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await AuthRepository.setOtpForUser(user._id, hashedOtp, expiresAt);

    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.smtp.from,
      to: user.email,
      subject: 'Your password reset OTP',
      html: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    return {
      message: 'If the account exists, an OTP has been sent to the registered email address',
    };
  }

  static async verifyOtp({ email, otp }) {
    const normalizedEmail = email.toLowerCase();
    const user = await AuthRepository.findByEmail(normalizedEmail);
    if (!user || !user.otp || !user.otpExpires) {
      throw new AppError('Invalid OTP or email', 400);
    }

    if (user.otpExpires < new Date()) {
      throw new AppError('OTP has expired', 400);
    }

    const otpHash = hashToken(otp);
    if (otpHash !== user.otp) {
      throw new AppError('Invalid OTP', 400);
    }

    await AuthRepository.clearOtpForUser(user._id);
    return { message: 'OTP verified successfully' };
  }

  static async resetPassword({ email, newPassword, confirmPassword }) {
    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const normalizedEmail = email.toLowerCase();
    const user = await AuthRepository.findByEmail(normalizedEmail);
    if (!user || !user.otp || !user.otpExpires) {
      throw new AppError('Invalid password reset request', 400);
    }

    if (user.otpExpires < new Date()) {
      throw new AppError('OTP has expired', 400);
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    await AuthRepository.revokeAllRefreshTokensForUser(user._id, 'system', 'Password reset');

    return { message: 'Password has been reset successfully' };
  }

  static async googleOAuthCallback(profile, ip) {
    const user = await AuthRepository.findOrCreateGoogleUser(profile);
    const accessToken = createAccessToken(user);
    const refreshToken = generateRefreshToken();
    await AuthRepository.createRefreshToken(user._id, refreshToken, ip || 'unknown');

    return {
      user: normalizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async getCurrentUser(userId) {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return { user: normalizeUser(user) };
  }
}

export default AuthService;

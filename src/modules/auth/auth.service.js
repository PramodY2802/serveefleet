import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import AppError from '../../common/errors/AppError.js';
import AuthRepository from './auth.repository.js';
import {
  createAccessToken,
  generateRefreshToken,
  hashToken,
} from './auth.tokens.js';

const toPlainUser = (user) => {
  if (user?._doc) {
    return {
      ...user._doc,
      _id: user._doc._id ?? user._id ?? null,
      id: user._doc.id ?? user.id ?? user._doc._id ?? user._id ?? null,
    };
  }

  if (user?.toObject) {
    const plain = user.toObject({ getters: true, virtuals: false });
    return {
      ...plain,
      _id: plain._id ?? user._id ?? null,
      id: plain.id ?? user.id ?? plain._id ?? user._id ?? null,
    };
  }

  return user || {};
};

const getUserId = (user) => {
  const plainUser = toPlainUser(user);
  return plainUser._id || plainUser.id || null;
};

const getUserField = (user, field) => toPlainUser(user)?.[field] ?? null;

const normalizeUser = (user) => ({
  id: getUserId(user),
  name: getUserField(user, 'name'),
  email: getUserField(user, 'email'),
  role: getUserField(user, 'role'),
  avatar: getUserField(user, 'avatar'),
  createdAt: getUserField(user, 'createdAt'),
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
    const userCount = await AuthRepository.countByEmail(normalizedEmail);

    if (!user) {
      return {
        message: 'If the account exists, an OTP has been sent to the registered email address',
      };
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const hashedOtp = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log('[auth:forgotPassword] generating OTP', {
      email: normalizedEmail,
      userCount,
      now: new Date().toISOString(),
      otpExpiresAt: expiresAt.toISOString(),
    });
    await AuthRepository.setOtpForEmail(normalizedEmail, hashedOtp, expiresAt);

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
    const userCount = await AuthRepository.countByEmail(normalizedEmail);
    if (!user || !user.otp || !user.otpExpires) {
      console.log('[auth:verifyOtp] missing OTP record', {
        email: normalizedEmail,
        userCount,
        now: new Date().toISOString(),
        hasUser: Boolean(user),
        hasOtp: Boolean(user?.otp),
        hasOtpExpires: Boolean(user?.otpExpires),
      });
      throw new AppError('Invalid OTP or email', 400);
    }

    console.log('[auth:verifyOtp] comparing OTP expiry', {
      email: normalizedEmail,
      userCount,
      now: new Date().toISOString(),
      otpExpiresAt: user.otpExpires instanceof Date
        ? user.otpExpires.toISOString()
        : user.otpExpires,
      otpExpiresType: user.otpExpires?.constructor?.name || typeof user.otpExpires,
    });

    if (user.otpExpires < new Date()) {
      throw new AppError('OTP has expired', 400);
    }

    const otpHash = hashToken(otp);
    if (otpHash !== user.otp) {
      throw new AppError('Invalid OTP', 400);
    }

    const resetToken = generateRefreshToken();
    const resetTokenHash = hashToken(resetToken);
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    await AuthRepository.setPasswordResetTokenForEmail(normalizedEmail, resetTokenHash, resetTokenExpires);
    await AuthRepository.clearOtpForEmail(normalizedEmail);

    return {
      message: 'OTP verified successfully',
      resetToken,
    };
  }

  static async resetPassword({ email, newPassword, confirmPassword, resetToken }) {
    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const normalizedEmail = email.toLowerCase();
    const user = await AuthRepository.findByEmail(normalizedEmail);
    if (!user || !user.passwordResetToken || !user.passwordResetTokenExpires || !resetToken) {
      throw new AppError('Invalid password reset request', 400);
    }

    if (user.passwordResetTokenExpires < new Date()) {
      throw new AppError('Password reset session has expired', 400);
    }

    const providedTokenHash = hashToken(resetToken);
    if (providedTokenHash !== user.passwordResetToken) {
      throw new AppError('Invalid password reset request', 400);
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.otp = undefined;
    user.otpExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();
    await AuthRepository.clearPasswordResetTokenForEmail(normalizedEmail);
    await AuthRepository.revokeAllRefreshTokensForUser(user._id, 'system', 'Password reset');

    return { message: 'Password has been reset successfully' };
  }

  static async googleOAuthCallback(user, ip) {
    let resolvedUser = user;

    if (!getUserId(resolvedUser) && resolvedUser?.email) {
      resolvedUser = await AuthRepository.findByEmail(resolvedUser.email.toLowerCase());
      console.info('[auth:google] reloaded google user from email for token issuance', {
        email: user.email,
        found: Boolean(resolvedUser),
        userId: getUserId(resolvedUser),
      });
    }

    if (!getUserId(resolvedUser)) {
      console.error('[auth:google] Google user is missing after authentication', {
        hasEmail: Boolean(user?.email),
        email: user?.email,
        keys: user ? Object.keys(user) : [],
      });
      throw new AppError('Google user is missing after authentication', 500);
    }

    const plainUser = toPlainUser(resolvedUser);
    const userId = getUserId(plainUser);
    const accessToken = createAccessToken(plainUser);
    const refreshToken = generateRefreshToken();
    await AuthRepository.createRefreshToken(userId, refreshToken, ip || 'unknown');

    return {
      user: normalizeUser(plainUser),
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

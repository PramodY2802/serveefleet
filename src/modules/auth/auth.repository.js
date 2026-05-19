import crypto from 'crypto';
import User from '../../models/User.js';
import RefreshToken from '../../models/RefreshToken.js';
import config from '../../config/index.js';
import AppError from '../../common/errors/AppError.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

class AuthRepository {
  static async findByEmail(email) {
    return User.findOne({ email }).select('+password +otp');
  }

  static async findById(id) {
    return User.findById(id).select('+password +otp');
  }

  static async findByGoogleId(googleId) {
    return User.findOne({ googleId }).select('+password +otp');
  }

  static async createUser(payload) {
    return User.create(payload);
  }

  static async updateUser(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  static async createRefreshToken(userId, refreshToken, ip) {
    const hashed = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + AuthRepository.getRefreshTokenTTL());
    return RefreshToken.create({
      token: hashed,
      user: userId,
      expiresAt,
      createdByIp: ip,
    });
  }

  static getRefreshTokenTTL() {
    const value = config.refreshTokenExpiresIn;
    const match = /^([0-9]+)(d|h|m|s)$/i.exec(value);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const [, amount, unit] = match;
    const num = Number(amount);
    switch (unit.toLowerCase()) {
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'm':
        return num * 60 * 1000;
      case 's':
        return num * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  static async findRefreshToken(token) {
    const hashed = hashToken(token);
    return RefreshToken.findOne({ token: hashed }).populate('user');
  }

  static async revokeRefreshToken(tokenDoc, ip, reason, replacedByToken = null) {
    if (!tokenDoc || tokenDoc.revokedAt) return tokenDoc;
    tokenDoc.revokedAt = new Date();
    tokenDoc.revokedByIp = ip;
    tokenDoc.reason = reason;
    tokenDoc.replacedByToken = replacedByToken;
    return tokenDoc.save();
  }

  static async revokeAllRefreshTokensForUser(userId, ip, reason = 'User requested logout from all sessions') {
    return RefreshToken.updateMany(
      { user: userId, revokedAt: null, expiresAt: { $gt: new Date() } },
      { revokedAt: new Date(), revokedByIp: ip, reason }
    );
  }

  static async setOtpForUser(userId, hashedOtp, expiresAt) {
    return User.findByIdAndUpdate(
      userId,
      { otp: hashedOtp, otpExpires: expiresAt },
      { new: true, runValidators: true }
    );
  }

  static async clearOtpForUser(userId) {
    return User.findByIdAndUpdate(
      userId,
      { otp: undefined, otpExpires: undefined },
      { new: true, runValidators: true }
    );
  }

  static async findOrCreateGoogleUser(profile) {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      throw new AppError('Google account did not return an email address', 400);
    }

    let user = await AuthRepository.findByGoogleId(profile.id);
    if (user) {
      return user;
    }

    user = await AuthRepository.findByEmail(email);
    if (user) {
      return AuthRepository.updateUser(user._id, {
        googleId: profile.id,
        avatar: profile.photos?.[0]?.value || user.avatar,
      });
    }

    return AuthRepository.createUser({
      name: profile.displayName || 'Google User',
      email,
      googleId: profile.id,
      avatar: profile.photos?.[0]?.value || null,
    });
  }
}

export default AuthRepository;

import crypto from 'crypto';
import axios from 'axios';
import User from '../../models/User.js';
import RefreshToken from '../../models/RefreshToken.js';
import config from '../../config/index.js';
import AppError from '../../common/errors/AppError.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

class AuthRepository {
  static async findByEmail(email) {
    return User.findOne({ email }).select('+password +otp +passwordResetToken');
  }

  static async countByEmail(email) {
    return User.countDocuments({ email });
  }

  static async setOtpForEmail(email, hashedOtp, expiresAt) {
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          otp: hashedOtp,
          otpExpires: expiresAt,
        },
        $unset: {
          passwordResetToken: '',
          passwordResetTokenExpires: '',
        },
      },
      { new: true, runValidators: true }
    ).select('+password +otp +passwordResetToken');

    console.log('[authRepository:setOtpForEmail] saved OTP state', {
      email,
      userId: user?._id?.toString?.() || null,
      otpExpiresAt: user?.otpExpires?.toISOString?.() || user?.otpExpires || null,
    });

    return user;
  }

  static async clearOtpForEmail(email) {
    return User.findOneAndUpdate(
      { email },
      {
        $unset: {
          otp: '',
          otpExpires: '',
        },
      },
      { new: true, runValidators: true }
    );
  }

  static async setPasswordResetTokenForEmail(email, hashedToken, expiresAt) {
    return User.findOneAndUpdate(
      { email },
      {
        $set: {
          passwordResetToken: hashedToken,
          passwordResetTokenExpires: expiresAt,
        },
      },
      { new: true, runValidators: true }
    ).select('+password +otp +passwordResetToken');
  }

  static async clearPasswordResetTokenForEmail(email) {
    return User.findOneAndUpdate(
      { email },
      {
        $unset: {
          passwordResetToken: '',
          passwordResetTokenExpires: '',
        },
      },
      { new: true, runValidators: true }
    );
  }

  static async findById(id) {
    return User.findById(id).select('+password +otp +passwordResetToken');
  }

  static async findByGoogleId(googleId) {
    return User.findOne({ googleId }).select('+password +otp +passwordResetToken');
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
    if (!userId) {
      throw new AppError('User id missing while setting OTP', 500);
    }

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    user.otp = hashedOtp;
    user.otpExpires = expiresAt;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    const savedUser = await user.save();
    console.log('[authRepository:setOtpForUser] saved OTP state', {
      userId: String(userId),
      otpExpiresAt: savedUser.otpExpires?.toISOString?.() || savedUser.otpExpires,
    });
    return savedUser;
  }

  static async clearOtpForUser(userId) {
    if (!userId) {
      throw new AppError('User id missing while clearing OTP', 500);
    }

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    return user.save();
  }

  static async setPasswordResetToken(userId, hashedToken, expiresAt) {
    if (!userId) {
      throw new AppError('User id missing while setting password reset token', 500);
    }

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    user.passwordResetToken = hashedToken;
    user.passwordResetTokenExpires = expiresAt;
    return user.save();
  }

  static async clearPasswordResetToken(userId) {
    if (!userId) {
      throw new AppError('User id missing while clearing password reset token', 500);
    }

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    return user.save();
  }

  static async findOrCreateGoogleUser(profile, accessToken) {
    console.info('[auth:google] resolving google user profile', {
      profileId: profile?.id,
      displayName: profile?.displayName,
      emailCount: profile?.emails?.length || 0,
      photoCount: profile?.photos?.length || 0,
      hasAccessToken: Boolean(accessToken),
      profileKeys: profile ? Object.keys(profile) : [],
    });

    let email = profile.emails?.[0]?.value?.toLowerCase();
    let emailSource = email ? 'profile.emails[0]' : null;

    if (!email && accessToken) {
      try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 5000,
        });

        email = response.data?.email?.toLowerCase();
        emailSource = email ? 'google userinfo endpoint' : emailSource;
        console.info('[auth:google] userinfo response received', {
          hasEmail: Boolean(response.data?.email),
          emailSource,
        });
      } catch (error) {
        console.warn('[auth:google] failed to fetch Google userinfo', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    }

    if (!email && profile._json?.email) {
      email = profile._json.email.toLowerCase();
      emailSource = 'profile._json.email';
    }

    console.info('[auth:google] final email resolution', {
      emailFound: Boolean(email),
      emailSource,
    });

    if (!email) {
      console.error('[auth:google] google login failed because no email was returned', {
        profileId: profile?.id,
        displayName: profile?.displayName,
        emailCount: profile?.emails?.length || 0,
        photoCount: profile?.photos?.length || 0,
        profileJsonKeys: profile?._json ? Object.keys(profile._json) : [],
      });
      throw new AppError('Google account did not return an email address', 400);
    }

    let user = await AuthRepository.findByGoogleId(profile.id);
    if (user) {
      console.info('[auth:google] existing user found by google id', {
        userId: user._id?.toString?.(),
        email: user.email,
      });
      return user;
    }

    user = await AuthRepository.findByEmail(email);
    if (user) {
      console.info('[auth:google] existing user found by email, linking google id', {
        userId: user._id?.toString?.(),
        email: user.email,
      });
      return AuthRepository.updateUser(user._id, {
        googleId: profile.id,
        avatar: profile.photos?.[0]?.value || user.avatar,
      });
    }

    console.info('[auth:google] creating new google user', {
      email,
      displayName: profile.displayName,
    });
    return AuthRepository.createUser({
      name: profile.displayName || 'Google User',
      email,
      googleId: profile.id,
      avatar: profile.photos?.[0]?.value || null,
    });
  }
}

export default AuthRepository;

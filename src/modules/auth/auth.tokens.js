import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

const createAccessToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) => jwt.verify(token, config.jwtSecret);

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
});

const attachRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, getCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { ...getCookieOptions(), maxAge: 0 });
};

export {
  createAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
};

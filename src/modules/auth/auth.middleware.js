import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import User from '../../models/User.js';
import AuthError from '../../common/errors/AuthError.js';
import asyncHandler from '../../common/middlewares/asyncHandler.js';

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Authorization header missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    throw new AuthError('Invalid or expired access token');
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new AuthError('User no longer exists or is inactive');
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    throw new AuthError('Password changed after token issuance. Please log in again.');
  }

  req.user = {
    id: user._id,
    role: user.role,
    email: user.email,
  };
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw new AuthError('Authorization required', 401);
  }

  if (!roles.includes(req.user.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }

  next();
};

export { protect, restrictTo };

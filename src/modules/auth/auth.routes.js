import express from 'express';
import passport from 'passport';
import config from '../../config/index.js';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleOAuthCallback,
  getCurrentUser,
} from './auth.controller.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword,
} from './auth.validators.js';
import { protect } from './auth.middleware.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-otp', validateVerifyOtp, verifyOtp);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/me', protect, getCurrentUser);

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (error, user) => {
    if (error || !user) {
      console.error('[auth:google] callback rejected', {
        message: error?.message || 'No user returned from passport authenticate',
        stack: error?.stack,
        query: req.query,
      });
      return res.redirect(`${config.clientUrl}/login?error=google-auth-failed`);
    }

    console.info('[auth:google] callback accepted', {
      userId: user?._id?.toString?.() || user?.id,
      email: user?.email,
    });
    req.user = user;
    return googleOAuthCallback(req, res, next);
  })(req, res, next);
});

export default router;

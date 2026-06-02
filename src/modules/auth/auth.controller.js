import asyncHandler from '../../common/middlewares/asyncHandler.js';
import config from '../../config/index.js';
import AuthService from './auth.service.js';
import {
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
} from './auth.tokens.js';

const attachCookie = (res, refreshToken) => {
  attachRefreshTokenCookie(res, refreshToken);
};

export const register = asyncHandler(async (req, res) => {
  const result = await AuthService.register({ ...req.body, ip: req.ip });
  attachCookie(res, result.refreshToken);
  return res.status(201).json({ status: 'success', message: 'User registered', data: { user: result.user, accessToken: result.accessToken } });
});

export const login = asyncHandler(async (req, res) => {
  const result = await AuthService.login({ ...req.body, ip: req.ip });
  attachCookie(res, result.refreshToken);
  return res.status(200).json({ status: 'success', message: 'User authenticated', data: { user: result.user, accessToken: result.accessToken } });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const existingToken = req.cookies.refreshToken || req.body.refreshToken;
  const result = await AuthService.refreshToken(existingToken, req.ip);
  attachCookie(res, result.refreshToken);
  return res.status(200).json({ status: 'success', message: 'Token refreshed', data: { user: result.user, accessToken: result.accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  const existingToken = req.cookies.refreshToken;
  await AuthService.logout(existingToken, req.ip);
  clearRefreshTokenCookie(res);
  return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await AuthService.logoutAllSessions(req.user.id, req.ip);
  clearRefreshTokenCookie(res);
  return res.status(200).json({ status: 'success', message: 'All sessions revoked' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body);
  return res.status(200).json({ status: 'success', message: result.message });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await AuthService.verifyOtp(req.body);
  return res.status(200).json({
    status: 'success',
    message: result.message,
    data: { resetToken: result.resetToken },
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.resetPassword(req.body);
  return res.status(200).json({ status: 'success', message: result.message });
});

export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const result = await AuthService.googleOAuthCallback(req.user, req.ip);
  attachCookie(res, result.refreshToken);
  res.redirect(`${config.clientUrl}/google-auth-success?token=${result.accessToken}`);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const result = await AuthService.getCurrentUser(req.user.id);
  return res.status(200).json({ status: 'success', data: result.user });
});

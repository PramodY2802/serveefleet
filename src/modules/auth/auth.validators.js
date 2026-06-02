import { z } from 'zod';
import ValidationError from '../../common/errors/ValidationError.js';

const createValidator = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  req.body = result.data;
  next();
};

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).superRefine((payload, ctx) => {
  if (payload.password !== payload.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords must match',
    });
  }
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Valid email is required'),
  otp: z.string().length(4, 'OTP must have 4 digits'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).superRefine((payload, ctx) => {
  if (payload.newPassword !== payload.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords must match',
    });
  }
});

export const validateRegister = createValidator(registerSchema);
export const validateLogin = createValidator(loginSchema);
export const validateForgotPassword = createValidator(forgotPasswordSchema);
export const validateVerifyOtp = createValidator(verifyOtpSchema);
export const validateResetPassword = createValidator(resetPasswordSchema);

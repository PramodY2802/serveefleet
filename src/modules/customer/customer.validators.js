import { z } from 'zod';
import mongoose from 'mongoose';
import ValidationError from '../../common/errors/ValidationError.js';

const validate = (data, schema) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').optional(),
  address: z.string().max(256, 'Address must be 256 characters or less').optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(8).optional(),
  address: z.string().max(256).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be updated',
});

const customerIdSchema = z.object({
  id: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid resource identifier',
  }),
});

const customerListSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sort: z.string().default('-createdAt'),
  search: z.string().optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().optional(),
});

export const validateCreateCustomer = (req, res, next) => {
  req.body = validate(req.body, createCustomerSchema);
  next();
};

export const validateUpdateCustomer = (req, res, next) => {
  req.body = validate(req.body, updateCustomerSchema);
  next();
};

export const validateCustomerId = (req, res, next) => {
  req.params = validate(req.params, customerIdSchema);
  next();
};

export const validateCustomerList = (req, res, next) => {
  req.query = validate(req.query, customerListSchema);
  next();
};

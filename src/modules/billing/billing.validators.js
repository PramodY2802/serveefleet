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

const billIdSchema = z.object({
  id: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid bill identifier',
  }),
});

const billServiceSchema = z.object({
  serviceId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Valid serviceId is required',
  }),
});

const billListSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sort: z.string().default('-createdAt'),
  search: z.string().optional(),
  status: z.enum(['draft', 'issued', 'sent', 'viewed', 'paid', 'cancelled']).optional(),
  customerId: z.string().optional(),
  vehicleId: z.string().optional(),
  serviceId: z.string().optional(),
});

export const validateBillId = (req, res, next) => {
  req.params = validate(req.params, billIdSchema);
  next();
};

export const validateBillFromService = (req, res, next) => {
  req.params = validate(req.params, billServiceSchema);
  next();
};

export const validateBillList = (req, res, next) => {
  req.validatedQuery = validate(req.query, billListSchema);
  next();
};

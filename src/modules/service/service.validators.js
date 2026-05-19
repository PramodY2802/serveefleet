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

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
});

const createServiceSchema = z.object({
  vehicleId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Valid vehicleId is required',
  }),
  serviceDate: dateString.optional(),
  serviceType: z.string().min(2, 'Service type is required'),
  description: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  nextServiceDue: dateString.optional(),
});

const updateServiceSchema = z.object({
  vehicleId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'vehicleId must be a valid identifier',
  }).optional(),
  serviceDate: dateString.optional(),
  serviceType: z.string().min(2).optional(),
  description: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  nextServiceDue: dateString.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be updated',
});

const serviceIdSchema = z.object({
  id: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid resource identifier',
  }),
});

const serviceListSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sort: z.string().default('-serviceDate'),
  search: z.string().optional(),
  serviceType: z.string().optional(),
  vehicleId: z.string().optional(),
  customerId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  nextServiceDueFrom: z.string().optional(),
  nextServiceDueTo: z.string().optional(),
});

export const validateCreateService = (req, res, next) => {
  req.body = validate(req.body, createServiceSchema);
  next();
};

export const validateUpdateService = (req, res, next) => {
  req.body = validate(req.body, updateServiceSchema);
  next();
};

export const validateServiceId = (req, res, next) => {
  req.params = validate(req.params, serviceIdSchema);
  next();
};

export const validateServiceList = (req, res, next) => {
  req.query = validate(req.query, serviceListSchema);
  next();
};

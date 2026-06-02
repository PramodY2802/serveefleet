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

const createVehicleSchema = z.object({
  customerId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Valid customerId is required',
  }),
  registrationNumber: z.string().min(4, 'Registration number is required'),
  plateColor: z.enum(['white', 'yellow', 'black', 'green', 'red']).default('white'),
  make: z.string().min(1, 'Make is required').optional(),
  model: z.string().min(1, 'Model is required').optional(),
  year: z.coerce.number().int().positive().optional(),
  fuelType: z.string().optional(),
});

const updateVehicleSchema = z.object({
  registrationNumber: z.string().min(4).optional(),
  plateColor: z.enum(['white', 'yellow', 'black', 'green', 'red']).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().positive().optional(),
  fuelType: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be updated',
});

const vehicleIdSchema = z.object({
  id: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid resource identifier',
  }),
});

const vehicleListSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sort: z.string().default('-createdAt'),
  search: z.string().optional(),
  customerId: z.string().optional(),
  registrationNumber: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().positive().optional(),
});

export const validateCreateVehicle = (req, res, next) => {
  req.body = validate(req.body, createVehicleSchema);
  next();
};

export const validateUpdateVehicle = (req, res, next) => {
  req.body = validate(req.body, updateVehicleSchema);
  next();
};

export const validateVehicleId = (req, res, next) => {
  req.params = validate(req.params, vehicleIdSchema);
  next();
};

export const validateVehicleList = (req, res, next) => {
  req.validatedQuery = validate(req.query, vehicleListSchema);
  next();
};

import { z } from 'zod';
import mongoose from 'mongoose';
import ValidationError from '../../common/errors/ValidationError.js';
import { BILL_ITEM_TYPES } from '../billing/billing.utils.js';

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

const serviceBillItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  itemType: z.enum(BILL_ITEM_TYPES),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  lineTotal: z.coerce.number().min(0).optional(),
});

const pricingSummarySchema = z.object({
  subtotal: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  grandTotal: z.coerce.number().min(0).optional(),
  currency: z.string().trim().min(1).optional(),
  gstRate: z.coerce.number().min(0).optional(),
}).optional();

const taxBreakdownSchema = z.object({
  taxableAmount: z.coerce.number().min(0).optional(),
  gstRate: z.coerce.number().min(0).optional(),
  cgstAmount: z.coerce.number().min(0).optional(),
  sgstAmount: z.coerce.number().min(0).optional(),
  igstAmount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
}).optional();

const createServiceSchema = z.object({
  vehicleId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Valid vehicleId is required',
  }),
  serviceDate: dateString.optional(),
  serviceType: z.string().min(2, 'Service type is required'),
  description: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  billItems: z.array(serviceBillItemSchema).optional(),
  pricingSummary: pricingSummarySchema,
  taxBreakdown: taxBreakdownSchema,
  serviceOdometer: z.coerce.number().min(0).optional(),
  nextServiceDue: dateString.optional(),
  nextServiceOdometer: z.coerce.number().min(0).optional(),
});

const updateServiceSchema = z.object({
  vehicleId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'vehicleId must be a valid identifier',
  }).optional(),
  serviceDate: dateString.optional(),
  serviceType: z.string().min(2).optional(),
  description: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  billItems: z.array(serviceBillItemSchema).optional(),
  pricingSummary: pricingSummarySchema,
  taxBreakdown: taxBreakdownSchema,
  serviceOdometer: z.coerce.number().min(0).optional(),
  nextServiceDue: dateString.optional(),
  nextServiceOdometer: z.coerce.number().min(0).optional(),
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
  req.validatedQuery = validate(req.query, serviceListSchema);
  next();
};

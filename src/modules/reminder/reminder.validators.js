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

const reminderChannelSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
}).optional();

const reminderTypeSchema = z.enum(['FULL_SERVICE', 'PART']);
const reminderStatusSchema = z.enum(['SCHEDULED', 'DUE', 'SENT', 'ACKNOWLEDGED', 'SNOOZED', 'CANCELLED', 'EXPIRED']);
const booleanQuerySchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const reminderBaseSchema = z.object({
  reminderType: reminderTypeSchema,
  serviceId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Valid serviceId is required',
  }),
  vehicleId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Valid vehicleId is required',
  }),
  customerId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Valid customerId is required',
  }),
  remindAt: dateString,
  timezone: z.string().min(1, 'Timezone is required'),
  dueOdometer: z.coerce.number().min(0).optional(),
  title: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
  channel: reminderChannelSchema,
});

const createReminderSchema = reminderBaseSchema.extend({
  serviceItemKey: z.string().trim().min(1).optional(),
  sourceItemName: z.string().trim().min(1).optional(),
  sourceItemType: z.string().trim().optional(),
  sourceItemSnapshot: z.record(z.any()).optional(),
  sourceServiceSnapshot: z.record(z.any()).optional(),
}).refine((data) => data.reminderType !== 'PART' || (Boolean(data.serviceItemKey) && Boolean(data.sourceItemName)), {
  message: 'serviceItemKey and sourceItemName are required for PART reminders',
  path: ['serviceItemKey'],
}).refine((data) => data.reminderType !== 'PART' || Boolean(data.sourceItemName), {
  message: 'sourceItemName is required for PART reminders',
  path: ['sourceItemName'],
});

const updateReminderSchema = z.object({
  remindAt: dateString.optional(),
  timezone: z.string().min(1).optional(),
  dueOdometer: z.coerce.number().min(0).optional(),
  title: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
  channel: reminderChannelSchema,
  manualOverride: z.boolean().optional(),
  snoozedUntil: dateString.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be updated',
});

const reminderIdSchema = z.object({
  id: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid resource identifier',
  }),
});

const reminderListSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sort: z.string().default('remindAt'),
  search: z.string().optional(),
  reminderType: z.enum(['FULL_SERVICE', 'PART']).optional(),
  status: reminderStatusSchema.optional(),
  customerId: z.string().optional(),
  vehicleId: z.string().optional(),
  serviceId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  overdueOnly: booleanQuerySchema.optional(),
  dueToday: booleanQuerySchema.optional(),
});

const snoozeReminderSchema = z.object({
  snoozedUntil: dateString,
  notes: z.string().trim().max(1000).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be updated',
});

const cancelReminderSchema = z.object({
  cancelReason: z.enum(['SOURCE_ITEM_REMOVED', 'SERVICE_DELETED', 'USER_CANCELLED', 'COMPLETED', 'DUPLICATE', 'SYSTEM_CLEANUP']).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const validateCreateReminder = (req, res, next) => {
  req.body = validate(req.body, createReminderSchema);
  next();
};

export const validateUpdateReminder = (req, res, next) => {
  req.body = validate(req.body, updateReminderSchema);
  next();
};

export const validateReminderId = (req, res, next) => {
  req.params = validate(req.params, reminderIdSchema);
  next();
};

export const validateReminderList = (req, res, next) => {
  req.validatedQuery = validate(req.query, reminderListSchema);
  next();
};

export const validateSnoozeReminder = (req, res, next) => {
  req.body = validate(req.body, snoozeReminderSchema);
  next();
};

export const validateCancelReminder = (req, res, next) => {
  req.body = validate(req.body, cancelReminderSchema);
  next();
};

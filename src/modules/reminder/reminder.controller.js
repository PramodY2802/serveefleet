import asyncHandler from '../../common/middlewares/asyncHandler.js';
import { successResponse } from '../../common/utils/apiResponse.js';
import ReminderService from './reminder.service.js';

export const createReminder = asyncHandler(async (req, res) => {
  const result = await ReminderService.createReminder(req.body, req.user);
  return successResponse(res, result, 'Reminder created', 201);
});

export const getReminders = asyncHandler(async (req, res) => {
  const result = await ReminderService.getReminders(req.validatedQuery || req.query, req.user);
  return successResponse(res, result, 'Reminders retrieved');
});

export const processDueReminders = asyncHandler(async (req, res) => {
  const result = await ReminderService.processDueReminders(req.user);
  return successResponse(res, result, 'Due reminders processed');
});

export const getReminderById = asyncHandler(async (req, res) => {
  const result = await ReminderService.getReminderById(req.params.id, req.user);
  return successResponse(res, result, 'Reminder retrieved');
});

export const updateReminder = asyncHandler(async (req, res) => {
  const result = await ReminderService.updateReminder(req.params.id, req.body, req.user);
  return successResponse(res, result, 'Reminder updated');
});

export const deleteReminder = asyncHandler(async (req, res) => {
  const result = await ReminderService.deleteReminder(req.params.id, req.user);
  return successResponse(res, result, 'Reminder cancelled');
});

export const acknowledgeReminder = asyncHandler(async (req, res) => {
  const result = await ReminderService.acknowledgeReminder(req.params.id, req.user);
  return successResponse(res, result, 'Reminder acknowledged');
});

export const snoozeReminder = asyncHandler(async (req, res) => {
  const result = await ReminderService.snoozeReminder(req.params.id, req.body, req.user);
  return successResponse(res, result, 'Reminder snoozed');
});

export const cancelReminder = asyncHandler(async (req, res) => {
  const result = await ReminderService.cancelReminder(req.params.id, req.body, req.user);
  return successResponse(res, result, 'Reminder cancelled');
});

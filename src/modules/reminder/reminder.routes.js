import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  validateCancelReminder,
  validateCreateReminder,
  validateReminderId,
  validateReminderList,
  validateSnoozeReminder,
  validateUpdateReminder,
} from './reminder.validators.js';
import {
  acknowledgeReminder,
  cancelReminder,
  createReminder,
  deleteReminder,
  getReminderById,
  getReminders,
  processDueReminders,
  snoozeReminder,
  updateReminder,
} from './reminder.controller.js';

const router = express.Router();

router.post('/', protect, validateCreateReminder, createReminder);
router.post('/process-due', protect, processDueReminders);
router.get('/', protect, validateReminderList, getReminders);
router.get('/:id', protect, validateReminderId, getReminderById);
router.put('/:id', protect, validateReminderId, validateUpdateReminder, updateReminder);
router.delete('/:id', protect, validateReminderId, deleteReminder);
router.post('/:id/acknowledge', protect, validateReminderId, acknowledgeReminder);
router.post('/:id/snooze', protect, validateReminderId, validateSnoozeReminder, snoozeReminder);
router.post('/:id/cancel', protect, validateReminderId, validateCancelReminder, cancelReminder);

export default router;

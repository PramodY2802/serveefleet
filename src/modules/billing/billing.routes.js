import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  validateBillFromService,
  validateBillId,
  validateBillList,
} from './billing.validators.js';
import {
  generateBillFromService,
  getBills,
  getBillById,
  getBillByServiceId,
} from './billing.controller.js';

const router = express.Router();

router.post('/from-service/:serviceId', protect, validateBillFromService, generateBillFromService);
router.get('/by-service/:serviceId', protect, validateBillFromService, getBillByServiceId);
router.get('/', protect, validateBillList, getBills);
router.get('/:id', protect, validateBillId, getBillById);

export default router;

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateBillFromService, getBillById, getBillByServiceId, getBills, updateBill } from '../controllers/billingController.js';

const router = express.Router();

router.post('/from-service/:serviceId', protect, generateBillFromService);
router.get('/', protect, getBills);
router.get('/by-service/:serviceId', protect, getBillByServiceId);
router.get('/:id', protect, getBillById);
router.put('/:id', protect, updateBill);

export default router;

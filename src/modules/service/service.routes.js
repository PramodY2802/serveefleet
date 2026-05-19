import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  validateCreateService,
  validateServiceList,
  validateServiceId,
  validateUpdateService,
} from './service.validators.js';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from './service.controller.js';

const router = express.Router();

router.post('/', protect, validateCreateService, createService);
router.get('/', protect, validateServiceList, getServices);
router.get('/:id', protect, validateServiceId, getServiceById);
router.put('/:id', protect, validateServiceId, validateUpdateService, updateService);
router.delete('/:id', protect, validateServiceId, deleteService);

export default router;

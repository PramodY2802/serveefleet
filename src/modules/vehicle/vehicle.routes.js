import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  validateCreateVehicle,
  validateVehicleList,
  validateVehicleId,
  validateUpdateVehicle,
} from './vehicle.validators.js';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from './vehicle.controller.js';

const router = express.Router();

router.post('/', protect, validateCreateVehicle, createVehicle);
router.get('/', protect, validateVehicleList, getVehicles);
router.get('/:id', protect, validateVehicleId, getVehicleById);
router.put('/:id', protect, validateVehicleId, validateUpdateVehicle, updateVehicle);
router.delete('/:id', protect, validateVehicleId, deleteVehicle);

export default router;

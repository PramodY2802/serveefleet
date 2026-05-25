import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getCustomerVehicleSearchData 
  //getServicesByVehicleId
} from '../controllers/serviceController.js';

const router = express.Router();

// Service routes
router.get('/search/customers-vehicles', protect, getCustomerVehicleSearchData); 
router.post('/', protect, createService);           
router.get('/', protect, getAllServices);            
router.get('/:id', protect, getServiceById);         
router.put('/:id', protect, updateService);         
router.delete('/:id', protect, deleteService);
// router.get('/:vehicleId', getServicesByVehicleId);


export default router;

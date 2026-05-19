import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import {
  validateCreateCustomer,
  validateCustomerList,
  validateCustomerId,
  validateUpdateCustomer,
} from './customer.validators.js';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from './customer.controller.js';

const router = express.Router();

router.post('/', protect, validateCreateCustomer, createCustomer);
router.get('/', protect, validateCustomerList, getCustomers);
router.get('/:id', protect, validateCustomerId, getCustomerById);
router.put('/:id', protect, validateCustomerId, validateUpdateCustomer, updateCustomer);
router.delete('/:id', protect, validateCustomerId, deleteCustomer);

export default router;

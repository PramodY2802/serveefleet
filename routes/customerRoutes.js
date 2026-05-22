import express from 'express';
import { addCustomer, getCustomersByUser, getCurrentUserCustomers, deleteCustomer,updateCustomer,getCustomerById } from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Add customer
router.post('/', protect, addCustomer);

// Get customers for logged-in user. This matches the modular frontend contract.
router.get('/', protect, getCurrentUserCustomers);

// Get customers for logged-in user (by userId param)
router.get('/:userId', protect, getCustomersByUser);

// Delete customer by ID
router.delete('/:id', protect, deleteCustomer);


// Update customer by ID
router.put('/:id', protect, updateCustomer);


router.get('/single/:id', getCustomerById);



export default router;

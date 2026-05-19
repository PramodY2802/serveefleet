import asyncHandler from '../../common/middlewares/asyncHandler.js';
import { successResponse } from '../../common/utils/apiResponse.js';
import CustomerService from './customer.service.js';

export const createCustomer = asyncHandler(async (req, res) => {
  const result = await CustomerService.createCustomer(req.body, req.user);
  return successResponse(res, result, 'Customer created', 201);
});

export const getCustomers = asyncHandler(async (req, res) => {
  const result = await CustomerService.getCustomers(req.query, req.user);
  return successResponse(res, result, 'Customers retrieved');
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const result = await CustomerService.getCustomerById(req.params.id, req.user);
  return successResponse(res, result, 'Customer retrieved');
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const result = await CustomerService.updateCustomer(req.params.id, req.body, req.user);
  return successResponse(res, result, 'Customer updated');
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const result = await CustomerService.deleteCustomer(req.params.id, req.user);
  return successResponse(res, result, 'Customer deleted');
});

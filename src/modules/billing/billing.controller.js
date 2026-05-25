import asyncHandler from '../../common/middlewares/asyncHandler.js';
import { successResponse } from '../../common/utils/apiResponse.js';
import BillingService from './billing.service.js';

export const generateBillFromService = asyncHandler(async (req, res) => {
  const result = await BillingService.generateBillFromService(req.params.serviceId, req.user);
  return successResponse(res, result, 'Bill generated', 201);
});

export const getBills = asyncHandler(async (req, res) => {
  const result = await BillingService.getBills(req.query, req.user);
  return successResponse(res, result, 'Bills retrieved');
});

export const getBillById = asyncHandler(async (req, res) => {
  const result = await BillingService.getBillById(req.params.id, req.user);
  return successResponse(res, result, 'Bill retrieved');
});

export const getBillByServiceId = asyncHandler(async (req, res) => {
  const result = await BillingService.getBillByServiceId(req.params.serviceId, req.user);
  return successResponse(res, result, 'Bill retrieved');
});

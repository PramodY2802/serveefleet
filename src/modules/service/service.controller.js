import asyncHandler from '../../common/middlewares/asyncHandler.js';
import { successResponse } from '../../common/utils/apiResponse.js';
import ServiceService from './service.service.js';

export const createService = asyncHandler(async (req, res) => {
  const result = await ServiceService.createService(req.body, req.user);
  return successResponse(res, result, 'Service created', 201);
});

export const getServices = asyncHandler(async (req, res) => {
  const result = await ServiceService.getServices(req.validatedQuery || req.query, req.user);
  return successResponse(res, result, 'Services retrieved');
});

export const getServiceById = asyncHandler(async (req, res) => {
  const result = await ServiceService.getServiceById(req.params.id, req.user);
  return successResponse(res, result, 'Service retrieved');
});

export const updateService = asyncHandler(async (req, res) => {
  const result = await ServiceService.updateService(req.params.id, req.body, req.user);
  return successResponse(res, result, 'Service updated');
});

export const deleteService = asyncHandler(async (req, res) => {
  const result = await ServiceService.deleteService(req.params.id, req.user);
  return successResponse(res, result, 'Service deleted');
});

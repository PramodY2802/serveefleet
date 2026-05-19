import asyncHandler from '../../common/middlewares/asyncHandler.js';
import { successResponse } from '../../common/utils/apiResponse.js';
import VehicleService from './vehicle.service.js';

export const createVehicle = asyncHandler(async (req, res) => {
  const result = await VehicleService.createVehicle(req.body, req.user);
  return successResponse(res, result, 'Vehicle created', 201);
});

export const getVehicles = asyncHandler(async (req, res) => {
  const result = await VehicleService.getVehicles(req.query, req.user);
  return successResponse(res, result, 'Vehicles retrieved');
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const result = await VehicleService.getVehicleById(req.params.id, req.user);
  return successResponse(res, result, 'Vehicle retrieved');
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const result = await VehicleService.updateVehicle(req.params.id, req.body, req.user);
  return successResponse(res, result, 'Vehicle updated');
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const result = await VehicleService.deleteVehicle(req.params.id, req.user);
  return successResponse(res, result, 'Vehicle deleted');
});

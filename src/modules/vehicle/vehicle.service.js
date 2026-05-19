import AppError from '../../common/errors/AppError.js';
import { buildPaginatedResponse } from '../../common/utils/pagination.js';
import VehicleRepository from './vehicle.repository.js';
import CustomerRepository from '../customer/customer.repository.js';
import { toVehicleResponse } from './vehicle.mapper.js';
import { createVehicleDto, updateVehicleDto } from './vehicle.dto.js';

class VehicleService {
  static async createVehicle(payload, user) {
    const vehicleData = createVehicleDto(payload);
    const vehicleExists = await VehicleRepository.findByRegistrationNumber(vehicleData.registrationNumber);
    if (vehicleExists) {
      throw new AppError('Vehicle with this registration number already exists', 400);
    }

    const customer = await CustomerRepository.findById(vehicleData.customer);
    if (!customer) {
      throw new AppError('Customer not found for this vehicle', 404);
    }
    if (user.role !== 'admin' && String(customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to create a vehicle for this customer', 403);
    }

    const vehicle = await VehicleRepository.create(vehicleData);
    return toVehicleResponse(vehicle);
  }

  static async getVehicles(query, user) {
    const { items, total, page, limit } = await VehicleRepository.getList(query, user);
    return buildPaginatedResponse(items.map(toVehicleResponse), total, page, limit);
  }

  static async getVehicleById(id, user) {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    if (user.role !== 'admin' && String(vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to access this vehicle', 403);
    }

    return toVehicleResponse(vehicle);
  }

  static async updateVehicle(id, payload, user) {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    if (user.role !== 'admin' && String(vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to update this vehicle', 403);
    }

    if (payload.registrationNumber) {
      const existing = await VehicleRepository.findByRegistrationNumber(payload.registrationNumber);
      if (existing && String(existing._id) !== String(id)) {
        throw new AppError('Another vehicle already uses this registration number', 400);
      }
    }

    const updates = updateVehicleDto(payload);
    if (updates.customer) {
      const customer = await CustomerRepository.findById(updates.customer);
      if (!customer) {
        throw new AppError('Customer not found for this vehicle', 404);
      }
      if (user.role !== 'admin' && String(customer.user) !== String(user.id)) {
        throw new AppError('Not authorized to assign this vehicle to the requested customer', 403);
      }
    }

    const updated = await VehicleRepository.updateById(id, updates);
    return toVehicleResponse(updated);
  }

  static async deleteVehicle(id, user) {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    if (user.role !== 'admin' && String(vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to delete this vehicle', 403);
    }

    const deleted = await VehicleRepository.deactivateById(id);
    return toVehicleResponse(deleted);
  }
}

export default VehicleService;

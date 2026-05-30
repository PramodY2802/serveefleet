import AppError from '../../common/errors/AppError.js';
import { buildPaginatedResponse } from '../../common/utils/pagination.js';
import ServiceRepository from './service.repository.js';
import VehicleRepository from '../vehicle/vehicle.repository.js';
import BillingService from '../billing/billing.service.js';
import { toServiceResponse } from './service.mapper.js';
import { createServiceDto, updateServiceDto } from './service.dto.js';

class ServiceService {
  static async createService(payload, user) {
    const servicePayload = createServiceDto(payload);
    const vehicle = await VehicleRepository.findById(servicePayload.vehicle);
    if (!vehicle) {
      throw new AppError('Vehicle not found for this service', 404);
    }

    if (user.role !== 'admin' && String(vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to add service history for this vehicle', 403);
    }

    const service = await ServiceRepository.create(servicePayload);
    return toServiceResponse(service);
  }

  static async getServices(query, user) {
    const { items, total, page, limit } = await ServiceRepository.getList(query, user);
    return buildPaginatedResponse(items.map(toServiceResponse), total, page, limit);
  }

  static async getServiceById(id, user) {
    const service = await ServiceRepository.findById(id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (user.role !== 'admin' && String(service.vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to access this service record', 403);
    }

    return toServiceResponse(service);
  }

  static async updateService(id, payload, user) {
    const service = await ServiceRepository.findById(id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (user.role !== 'admin' && String(service.vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to modify this service record', 403);
    }

    if (payload.vehicleId) {
      const vehicle = await VehicleRepository.findById(payload.vehicleId);
      if (!vehicle) {
        throw new AppError('Vehicle not found for this service update', 404);
      }
      if (user.role !== 'admin' && String(vehicle.customer.user) !== String(user.id)) {
        throw new AppError('Not authorized to assign service to this vehicle', 403);
      }
    }

    const updated = await ServiceRepository.updateById(id, updateServiceDto(payload));
    if (updated) {
      await BillingService.syncBillFromService(updated, user);
    }
    return toServiceResponse(updated);
  }

  static async deleteService(id, user) {
    const service = await ServiceRepository.findById(id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (user.role !== 'admin' && String(service.vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to delete this service record', 403);
    }

    const deleted = await ServiceRepository.deactivateById(id);
    return toServiceResponse(deleted);
  }
}

export default ServiceService;

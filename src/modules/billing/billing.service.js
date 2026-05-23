import AppError from '../../common/errors/AppError.js';
import { buildPaginatedResponse } from '../../common/utils/pagination.js';
import ServiceRepository from '../service/service.repository.js';
import BillingRepository from './billing.repository.js';
import { toBillResponse } from './billing.mapper.js';
import {
  calculateBillTotals,
  buildBillItemsFromService,
  createAuditTrailEntry,
  generateBillNumber,
} from './billing.utils.js';

class BillingService {
  static async generateBillFromService(serviceId, user) {
    const service = await ServiceRepository.findById(serviceId);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (user.role !== 'admin' && String(service.vehicle.customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to generate a bill for this service record', 403);
    }

    const existingBill = await BillingRepository.findByServiceId(serviceId);
    if (existingBill) {
      return toBillResponse(existingBill);
    }

    const items = buildBillItemsFromService(service);
    const totals = calculateBillTotals(items);

    const bill = await BillingRepository.create({
      billNumber: generateBillNumber(),
      ownerUserId: service.vehicle.customer.user,
      service: service._id,
      customer: {
        id: service.vehicle.customer._id,
        userId: service.vehicle.customer.user,
        name: service.vehicle.customer.name,
        email: service.vehicle.customer.email,
        phone: service.vehicle.customer.phone,
      },
      vehicle: {
        id: service.vehicle._id,
        registrationNumber: service.vehicle.registrationNumber,
        plateColor: service.vehicle.plateColor || 'white',
        make: service.vehicle.make,
        model: service.vehicle.model,
        year: service.vehicle.year,
        fuelType: service.vehicle.fuelType,
      },
      serviceSnapshot: {
        serviceType: service.serviceType,
        description: service.description,
        serviceDate: service.serviceDate || new Date(),
        nextServiceDue: service.nextServiceDue,
      },
      items,
      totals,
      currency: 'INR',
      status: 'issued',
      payment: {
        status: 'pending',
      },
      auditTrail: [createAuditTrailEntry(user)],
    });

    return toBillResponse(bill);
  }

  static async getBills(query, user) {
    const { items, total, page, limit } = await BillingRepository.getList(query, user);
    return buildPaginatedResponse(items.map(toBillResponse), total, page, limit);
  }

  static async getBillById(id, user) {
    const bill = await BillingRepository.findById(id);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }

    if (user.role !== 'admin' && String(bill.ownerUserId) !== String(user.id)) {
      throw new AppError('Not authorized to access this bill', 403);
    }

    return toBillResponse(bill);
  }
}

export default BillingService;

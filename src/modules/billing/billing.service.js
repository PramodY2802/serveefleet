import AppError from '../../common/errors/AppError.js';
import { buildPaginatedResponse } from '../../common/utils/pagination.js';
import ServiceRepository from '../service/service.repository.js';
import BillingRepository from './billing.repository.js';
import { toBillResponse } from './billing.mapper.js';
import {
  buildBillSnapshotFromService,
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

    const billingData = buildBillSnapshotFromService(service);

    const bill = await BillingRepository.create({
      billNumber: generateBillNumber(),
      ownerUserId: billingData.ownerUserId,
      service: service._id,
      customer: billingData.customer,
      vehicle: billingData.vehicle,
      billItems: billingData.billItems,
      pricingSummary: billingData.pricingSummary,
      taxBreakdown: billingData.taxBreakdown,
      serviceSnapshot: billingData.serviceSnapshot,
      currency: billingData.currency,
      status: 'issued',
      payment: {
        status: 'pending',
      },
      auditTrail: [createAuditTrailEntry(user)],
    });

    return toBillResponse(bill);
  }

  static async syncBillFromService(serviceOrId, user) {
    const service =
      serviceOrId && typeof serviceOrId === 'object' && (serviceOrId._id || serviceOrId.id)
        ? serviceOrId
        : await ServiceRepository.findById(serviceOrId);
    if (!service) {
      return null;
    }

    const serviceId = service._id || service.id || serviceOrId;
    const existingBill = await BillingRepository.findByServiceId(serviceId);
    if (!existingBill) {
      return null;
    }

    const billingData = buildBillSnapshotFromService(service);
    const auditTrail = [
      ...(existingBill.auditTrail || []),
      createAuditTrailEntry(user, 'Bill synchronized after service update'),
    ];

    const updatedBill = await BillingRepository.updateByServiceId(serviceId, {
      ownerUserId: billingData.ownerUserId,
      customer: billingData.customer,
      vehicle: billingData.vehicle,
      billItems: billingData.billItems,
      pricingSummary: billingData.pricingSummary,
      taxBreakdown: billingData.taxBreakdown,
      currency: billingData.currency,
      serviceSnapshot: billingData.serviceSnapshot,
      auditTrail,
    });

    return toBillResponse(updatedBill || existingBill);
  }

  static async getBillByServiceId(serviceId, user) {
    const bill = await BillingRepository.findByServiceId(serviceId);
    if (!bill) {
      throw new AppError('Bill not found for this service record', 404);
    }

    if (user.role !== 'admin' && String(bill.ownerUserId) !== String(user.id)) {
      throw new AppError('Not authorized to access this bill', 403);
    }

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

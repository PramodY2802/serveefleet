import AppError from '../../common/errors/AppError.js';
import { buildPaginatedResponse } from '../../common/utils/pagination.js';
import ServiceRepository from '../service/service.repository.js';
import ReminderRepository from './reminder.repository.js';
import { toReminderResponse } from './reminder.mapper.js';

const toObjectIdString = (value) => (value?._id || value?.id || value ? String(value._id || value.id || value) : null);

const buildServiceSnapshot = (service) => {
  const customer = service.vehicle?.customer;
  const vehicle = service.vehicle;

  return {
    serviceType: service.serviceType,
    serviceDate: service.serviceDate,
    nextServiceDue: service.nextServiceDue,
    nextServiceOdometer: service.nextServiceOdometer,
    customerName: customer?.name,
    customerEmail: customer?.email,
    vehicleRegistrationNumber: vehicle?.registrationNumber,
  };
};

const buildCustomerSnapshot = (service) => {
  const customer = service.vehicle?.customer;
  if (!customer) return undefined;

  return {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
};

const buildVehicleSnapshot = (service) => {
  const vehicle = service.vehicle;
  if (!vehicle) return undefined;

  return {
    id: vehicle._id,
    registrationNumber: vehicle.registrationNumber,
    plateColor: vehicle.plateColor,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    fuelType: vehicle.fuelType,
  };
};

class ReminderService {
  static async createReminder(payload, user) {
    const service = await ServiceRepository.findById(payload.serviceId);
    if (!service) {
      throw new AppError('Service not found for this reminder', 404);
    }

    const serviceCustomerId = toObjectIdString(service.vehicle?.customer?._id || service.vehicle?.customer);
    const serviceVehicleId = toObjectIdString(service.vehicle?._id || service.vehicle);
    const serviceOwnerUserId = toObjectIdString(service.vehicle?.customer?.user);
    const payloadVehicleId = toObjectIdString(payload.vehicleId);
    const payloadCustomerId = toObjectIdString(payload.customerId);

    if (serviceOwnerUserId && user.role !== 'admin' && serviceOwnerUserId !== String(user.id)) {
      throw new AppError('Not authorized to create reminders for this service record', 403);
    }

    if (serviceVehicleId !== payloadVehicleId || serviceCustomerId !== payloadCustomerId) {
      throw new AppError('Service, vehicle, and customer must match the selected service record', 400);
    }

    const reminder = await ReminderRepository.create({
      ownerUserId: user.id,
      reminderType: payload.reminderType,
      status: 'SCHEDULED',
      serviceId: payload.serviceId,
      vehicleId: payload.vehicleId,
      customerId: payload.customerId,
      serviceItemKey: payload.reminderType === 'PART' ? payload.serviceItemKey : undefined,
      sourceItemName: payload.reminderType === 'PART' ? payload.sourceItemName : undefined,
      sourceItemType: payload.reminderType === 'PART' ? payload.sourceItemType : undefined,
      sourceItemSnapshot: payload.reminderType === 'PART' ? payload.sourceItemSnapshot : undefined,
      sourceServiceSnapshot: buildServiceSnapshot(service),
      customerSnapshot: buildCustomerSnapshot(service),
      vehicleSnapshot: buildVehicleSnapshot(service),
      remindAt: new Date(payload.remindAt),
      timezone: payload.timezone,
      dueOdometer: payload.dueOdometer,
      channel: payload.channel,
      title: payload.title,
      notes: payload.notes,
      manualOverride: false,
      createdBy: user.id,
    });

    return toReminderResponse(await ReminderRepository.findById(reminder._id));
  }

  static async getReminders(query, user) {
    const { items, total, page, limit } = await ReminderRepository.getList(query, user);
    return buildPaginatedResponse(items.map(toReminderResponse), total, page, limit);
  }

  static async getReminderById(id, user) {
    const reminder = await ReminderRepository.findByIdForOwner(id, user.id);
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }
    return toReminderResponse(reminder);
  }

  static async updateReminder(id, payload, user) {
    const reminder = await ReminderRepository.findByIdForOwner(id, user.id);
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }

    const updates = {};
    if (payload.remindAt !== undefined) updates.remindAt = new Date(payload.remindAt);
    if (payload.timezone !== undefined) updates.timezone = payload.timezone;
    if (payload.dueOdometer !== undefined) updates.dueOdometer = payload.dueOdometer;
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    if (payload.channel !== undefined) updates.channel = payload.channel;
    if (payload.manualOverride !== undefined) updates.manualOverride = payload.manualOverride;
    if (payload.snoozedUntil !== undefined) {
      updates.snoozedUntil = new Date(payload.snoozedUntil);
      updates.status = 'SNOOZED';
    }

    const updated = await ReminderRepository.updateById(id, user.id, updates);
    if (!updated) {
      throw new AppError('Reminder not found', 404);
    }
    return toReminderResponse(updated);
  }

  static async deleteReminder(id, user) {
    const cancelled = await ReminderRepository.cancelById(id, user.id, {
      cancelReason: 'USER_CANCELLED',
    });
    if (!cancelled) {
      throw new AppError('Reminder not found', 404);
    }
    return toReminderResponse(cancelled);
  }

  static async acknowledgeReminder(id, user) {
    const reminder = await ReminderRepository.findByIdForOwner(id, user.id);
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }

    const updated = await ReminderRepository.updateById(id, user.id, {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    });

    return toReminderResponse(updated);
  }

  static async snoozeReminder(id, payload, user) {
    const reminder = await ReminderRepository.findByIdForOwner(id, user.id);
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }

    const updated = await ReminderRepository.updateById(id, user.id, {
      status: 'SNOOZED',
      snoozedUntil: new Date(payload.snoozedUntil),
      notes: payload.notes !== undefined ? payload.notes : reminder.notes,
    });

    return toReminderResponse(updated);
  }

  static async cancelReminder(id, payload, user) {
    const cancelled = await ReminderRepository.cancelById(id, user.id, {
      cancelReason: payload.cancelReason || 'USER_CANCELLED',
      notes: payload.notes,
    });
    if (!cancelled) {
      throw new AppError('Reminder not found', 404);
    }
    return toReminderResponse(cancelled);
  }

  static async processDueReminders(user) {
    const includeAll = user?.role === 'admin';
    const result = await ReminderRepository.processDue({
      ownerUserId: user?.id,
      includeAll,
    });

    return {
      ...result,
      processedAt: new Date().toISOString(),
    };
  }
}

export default ReminderService;

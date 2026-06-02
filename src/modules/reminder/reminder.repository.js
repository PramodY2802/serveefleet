import mongoose from 'mongoose';
import Reminder from '../../models/Reminder.js';
import { buildPagination } from '../../common/utils/pagination.js';

const toDateRange = (fromDate, toDate) => {
  const query = {};
  if (fromDate) query.$gte = new Date(fromDate);
  if (toDate) query.$lte = new Date(toDate);
  return Object.keys(query).length ? query : null;
};

class ReminderRepository {
  static async create(payload) {
    return Reminder.create(payload);
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Reminder.findById(id)
      .populate('customerId', 'name email phone user')
      .populate('vehicleId', 'registrationNumber plateColor make model year fuelType customer')
      .populate({
        path: 'serviceId',
        populate: {
          path: 'vehicle',
          populate: { path: 'customer', select: 'name email phone user' },
        },
      })
      .lean();
  }

  static async findByIdForOwner(id, ownerUserId) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Reminder.findOne({ _id: id, ownerUserId })
      .populate('customerId', 'name email phone user')
      .populate('vehicleId', 'registrationNumber plateColor make model year fuelType customer')
      .populate({
        path: 'serviceId',
        populate: {
          path: 'vehicle',
          populate: { path: 'customer', select: 'name email phone user' },
        },
      })
      .lean();
  }

  static async getList({
    search,
    page,
    limit,
    sort,
    reminderType,
    status,
    customerId,
    vehicleId,
    serviceId,
    fromDate,
    toDate,
    overdueOnly,
    dueToday,
  } = {}, user) {
    const pagination = buildPagination({ page, limit, sort });
    const query = { ownerUserId: user.id };

    if (reminderType) query.reminderType = reminderType;
    if (status) query.status = status;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) query.customerId = new mongoose.Types.ObjectId(customerId);
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) query.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) query.serviceId = new mongoose.Types.ObjectId(serviceId);

    const dateRange = toDateRange(fromDate, toDate);
    if (dateRange) query.remindAt = dateRange;

    if (overdueOnly) {
      query.remindAt = { ...(query.remindAt || {}), $lt: new Date() };
      query.status = { $nin: ['CANCELLED', 'ACKNOWLEDGED', 'EXPIRED'] };
    }

    if (dueToday) {
      const now = new Date();
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setUTCHours(23, 59, 59, 999);
      query.remindAt = { ...(query.remindAt || {}), $gte: start, $lte: end };
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
      { title: regex },
      { notes: regex },
      { sourceItemName: regex },
      { serviceItemKey: regex },
      { 'sourceServiceSnapshot.serviceType': regex },
      { 'sourceServiceSnapshot.customerName': regex },
      { 'sourceServiceSnapshot.vehicleRegistrationNumber': regex },
      { 'customerSnapshot.name': regex },
      { 'customerSnapshot.email': regex },
      { 'vehicleSnapshot.registrationNumber': regex },
    ];
    }

    const [items, total] = await Promise.all([
      Reminder.find(query)
        .populate('customerId', 'name email phone user')
        .populate('vehicleId', 'registrationNumber plateColor make model year fuelType customer')
        .populate({
          path: 'serviceId',
          populate: {
            path: 'vehicle',
            populate: { path: 'customer', select: 'name email phone user' },
          },
        })
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Reminder.countDocuments(query),
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  static async updateById(id, ownerUserId, updates) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Reminder.findOneAndUpdate(
      { _id: id, ownerUserId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('customerId', 'name email phone user')
      .populate('vehicleId', 'registrationNumber plateColor make model year fuelType customer')
      .populate({
        path: 'serviceId',
        populate: {
          path: 'vehicle',
          populate: { path: 'customer', select: 'name email phone user' },
        },
      })
      .lean();
  }

  static async cancelById(id, ownerUserId, updates = {}) {
    return Reminder.findOneAndUpdate(
      { _id: id, ownerUserId },
      {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        ...updates,
      },
      { new: true, runValidators: true }
    )
      .populate('customerId', 'name email phone user')
      .populate('vehicleId', 'registrationNumber plateColor make model year fuelType customer')
      .populate({
        path: 'serviceId',
        populate: {
          path: 'vehicle',
          populate: { path: 'customer', select: 'name email phone user' },
        },
      })
      .lean();
  }

  static async processDue({ ownerUserId, includeAll = false, now = new Date() } = {}) {
    const query = {
      status: { $in: ['SCHEDULED', 'SNOOZED'] },
      $or: [
        { remindAt: { $lte: now } },
        { snoozedUntil: { $lte: now } },
      ],
    };

    if (!includeAll && ownerUserId) {
      query.ownerUserId = ownerUserId;
    }

    const result = await Reminder.updateMany(query, {
      $set: {
        status: 'DUE',
        lastNotifiedAt: now,
      },
    });

    return {
      matchedCount: result.matchedCount ?? result.n ?? 0,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
    };
  }
}

export default ReminderRepository;

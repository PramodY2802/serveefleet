import mongoose from 'mongoose';
import Service from '../../models/Service.js';
import Vehicle from '../../models/Vehicle.js';
import { buildSearchQuery } from '../../common/utils/queryBuilder.js';
import { buildPagination } from '../../common/utils/pagination.js';

class ServiceRepository {
  static async create(payload) {
    return Service.create(payload);
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Service.findOne({ _id: id, isActive: true })
      .populate({ path: 'vehicle', populate: { path: 'customer', select: 'name email phone user' } })
      .lean();
  }

  static async getList({
    search,
    filters = {},
    page,
    limit,
    sort,
    vehicleId,
    customerId,
    serviceType,
    fromDate,
    toDate,
    nextServiceDueFrom,
    nextServiceDueTo,
  } = {}, user) {
    const pagination = buildPagination({ page, limit, sort });
    const pipeline = [];
    const activeFilters = {
      ...filters,
      vehicleId,
      customerId,
      serviceType,
      fromDate,
      toDate,
      nextServiceDueFrom,
      nextServiceDueTo,
    };

    pipeline.push({ $match: { isActive: true } });
    pipeline.push({
      $lookup: {
        from: 'vehicles',
        localField: 'vehicle',
        foreignField: '_id',
        as: 'vehicle',
      },
    });
    pipeline.push({ $unwind: '$vehicle' });
    pipeline.push({ $match: { 'vehicle.isActive': true } });
    pipeline.push({
      $lookup: {
        from: 'customers',
        localField: 'vehicle.customer',
        foreignField: '_id',
        as: 'customer',
      },
    });
    pipeline.push({ $unwind: '$customer' });
    pipeline.push({ $match: { 'customer.isActive': true } });

    if (user.role !== 'admin') {
      pipeline.push({
        $match: {
          'customer.user': new mongoose.Types.ObjectId(user.id),
        },
      });
    }

    if (activeFilters.vehicleId && mongoose.Types.ObjectId.isValid(activeFilters.vehicleId)) {
      pipeline.push({ $match: { 'vehicle._id': new mongoose.Types.ObjectId(activeFilters.vehicleId) } });
    }

    if (activeFilters.customerId && mongoose.Types.ObjectId.isValid(activeFilters.customerId)) {
      pipeline.push({ $match: { 'customer._id': new mongoose.Types.ObjectId(activeFilters.customerId) } });
    }

    if (activeFilters.serviceType) {
      pipeline.push({ $match: { serviceType: activeFilters.serviceType } });
    }

    if (activeFilters.fromDate || activeFilters.toDate) {
      const dateQuery = {};
      if (activeFilters.fromDate) dateQuery.$gte = new Date(activeFilters.fromDate);
      if (activeFilters.toDate) dateQuery.$lte = new Date(activeFilters.toDate);
      pipeline.push({ $match: { serviceDate: dateQuery } });
    }

    if (activeFilters.nextServiceDueFrom || activeFilters.nextServiceDueTo) {
      const dueQuery = {};
      if (activeFilters.nextServiceDueFrom) dueQuery.$gte = new Date(activeFilters.nextServiceDueFrom);
      if (activeFilters.nextServiceDueTo) dueQuery.$lte = new Date(activeFilters.nextServiceDueTo);
      pipeline.push({ $match: { nextServiceDue: dueQuery } });
    }

    const searchQuery = buildSearchQuery(
      ['serviceType', 'description', 'vehicle.registrationNumber', 'customer.name', 'customer.email'],
      search
    );
    if (Object.keys(searchQuery).length) {
      pipeline.push({ $match: searchQuery });
    }

    const sortStage = { $sort: {} };
    const sortParts = pagination.sort.split(',').map((sortField) => sortField.trim());
    for (const part of sortParts) {
      if (!part) continue;
      if (part.startsWith('-')) {
        sortStage.$sort[part.substring(1)] = -1;
      } else {
        sortStage.$sort[part] = 1;
      }
    }

    pipeline.push({ $facet: {
      metadata: [{ $count: 'total' }],
      data: [{ ...sortStage }, { $skip: pagination.skip }, { $limit: pagination.limit }],
    }});

    pipeline.push({
      $unwind: {
        path: '$metadata',
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $project: {
        total: { $ifNull: ['$metadata.total', 0] },
        data: 1,
      },
    });

    const [result] = await Service.aggregate(pipeline).allowDiskUse(true);
    const items = result?.data || [];
    const total = result?.total || 0;

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  static async updateById(id, updates) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Service.findOneAndUpdate({ _id: id, isActive: true }, updates, {
      new: true,
      runValidators: true,
    })
      .populate({ path: 'vehicle', populate: { path: 'customer', select: 'name email phone user' } })
      .lean();
  }

  static async deactivateById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Service.findOneAndUpdate({ _id: id, isActive: true }, { isActive: false }, {
      new: true,
      runValidators: true,
    })
      .lean();
  }
}

export default ServiceRepository;

import mongoose from 'mongoose';
import Bill from '../../models/Bill.js';
import { buildPagination } from '../../common/utils/pagination.js';
import { buildSearchQuery } from '../../common/utils/queryBuilder.js';

class BillingRepository {
  static async create(payload) {
    return Bill.create(payload);
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Bill.findOne({ _id: id })
      .populate({
        path: 'service',
        populate: {
          path: 'vehicle',
          populate: {
            path: 'customer',
            select: 'name email phone user',
          },
        },
      })
      .lean();
  }

  static async findByServiceId(serviceId) {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) return null;
    return Bill.findOne({ service: serviceId })
      .populate({
        path: 'service',
        populate: {
          path: 'vehicle',
          populate: {
            path: 'customer',
            select: 'name email phone user',
          },
        },
      })
      .lean();
  }

  static async getList({
    search,
    status,
    customerId,
    vehicleId,
    serviceId,
    page,
    limit,
    sort,
  } = {}, user) {
    const pagination = buildPagination({ page, limit, sort: sort || '-createdAt' });
    const query = {};

    if (user.role !== 'admin') {
      query.ownerUserId = user.id;
    }

    if (status) query.status = status;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) query['customer.id'] = new mongoose.Types.ObjectId(customerId);
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) query['vehicle.id'] = new mongoose.Types.ObjectId(vehicleId);
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) query.service = new mongoose.Types.ObjectId(serviceId);

    const searchQuery = buildSearchQuery(
      [
        'billNumber',
        'customer.name',
        'customer.email',
        'vehicle.registrationNumber',
        'serviceSnapshot.serviceType',
        'serviceSnapshot.description',
        'billItems.name',
        'billItems.itemType',
        'items.name',
        'items.itemType',
      ],
      search
    );

    const finalQuery = Object.keys(searchQuery).length ? { ...query, ...searchQuery } : query;

    const [items, total] = await Promise.all([
      Bill.find(finalQuery)
        .populate({
          path: 'service',
          populate: {
            path: 'vehicle',
            populate: {
              path: 'customer',
              select: 'name email phone user',
            },
          },
        })
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Bill.countDocuments(finalQuery),
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit };
  }
}

export default BillingRepository;

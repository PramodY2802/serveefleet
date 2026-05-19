import mongoose from 'mongoose';
import Vehicle from '../../models/Vehicle.js';
import Customer from '../../models/Customer.js';
import { buildSearchQuery } from '../../common/utils/queryBuilder.js';
import { buildPagination } from '../../common/utils/pagination.js';

class VehicleRepository {
  static async create(payload) {
    return Vehicle.create(payload);
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Vehicle.findOne({ _id: id, isActive: true })
      .populate('customer', 'name email user')
      .lean();
  }

  static async findByRegistrationNumber(registrationNumber) {
    return Vehicle.findOne({
      registrationNumber: registrationNumber.trim().toUpperCase(),
      isActive: true,
    }).lean();
  }

  static async getList({ search, filters, page, limit, sort }, user) {
    const pagination = buildPagination({ page, limit, sort });
    const query = { isActive: true };

    if (user.role !== 'admin') {
      const allowedCustomerIds = await Customer.find({ user: user.id, isActive: true }).distinct('_id');
      query.customer = { $in: allowedCustomerIds };
    }

    if (filters.customerId && mongoose.Types.ObjectId.isValid(filters.customerId)) {
      query.customer = mongoose.Types.ObjectId(filters.customerId);
    }
    if (filters.registrationNumber) {
      query.registrationNumber = filters.registrationNumber.trim().toUpperCase();
    }
    if (filters.make) query.make = filters.make.trim();
    if (filters.model) query.model = filters.model.trim();
    if (filters.year) query.year = filters.year;

    const searchQuery = buildSearchQuery(
      ['registrationNumber', 'make', 'model', 'fuelType'],
      search
    );
    const finalQuery = Object.keys(searchQuery).length ? { ...query, ...searchQuery } : query;

    const [items, total] = await Promise.all([
      Vehicle.find(finalQuery)
        .populate('customer', 'name email')
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Vehicle.countDocuments(finalQuery),
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  static async updateById(id, updates) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Vehicle.findOneAndUpdate({ _id: id, isActive: true }, updates, {
      new: true,
      runValidators: true,
    })
      .populate('customer', 'name email')
      .lean();
  }

  static async deactivateById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Vehicle.findOneAndUpdate({ _id: id, isActive: true }, { isActive: false }, {
      new: true,
      runValidators: true,
    }).lean();
  }
}

export default VehicleRepository;

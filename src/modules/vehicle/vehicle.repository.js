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

  static async getList({ search, filters = {}, page, limit, sort, customerId, registrationNumber, make, model, year } = {}, user) {
    const pagination = buildPagination({ page, limit, sort });
    const query = { isActive: true };
    const activeFilters = { ...filters, customerId, registrationNumber, make, model, year };

    if (user.role !== 'admin') {
      const allowedCustomerIds = await Customer.find({ user: user.id, isActive: true }).distinct('_id');
      query.customer = { $in: allowedCustomerIds };
    }

    if (activeFilters.customerId && mongoose.Types.ObjectId.isValid(activeFilters.customerId)) {
      query.customer = new mongoose.Types.ObjectId(activeFilters.customerId);
    }
    if (activeFilters.registrationNumber) {
      query.registrationNumber = activeFilters.registrationNumber.trim().toUpperCase();
    }
    if (activeFilters.make) query.make = activeFilters.make.trim();
    if (activeFilters.model) query.model = activeFilters.model.trim();
    if (activeFilters.year) query.year = activeFilters.year;

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

import mongoose from 'mongoose';
import Customer from '../../models/Customer.js';
import { buildSearchQuery } from '../../common/utils/queryBuilder.js';
import { buildPagination } from '../../common/utils/pagination.js';

class CustomerRepository {
  static async create(payload) {
    return Customer.create(payload);
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findOne({ _id: id, isActive: true }).lean();
  }

  static async findByEmail(email, userId) {
    const query = { email: email.toLowerCase(), isActive: true };
    if (userId) query.user = userId;
    return Customer.findOne(query).lean();
  }

  static async getList({ search, filters = {}, page, limit, sort, email, phone } = {}, user) {
    const pagination = buildPagination({ page, limit, sort });
    const query = { isActive: true };
    const activeFilters = { ...filters, email, phone };

    if (user.role !== 'admin') {
      query.user = user.id;
    }

    if (activeFilters.email) query.email = activeFilters.email.toLowerCase();
    if (activeFilters.phone) query.phone = activeFilters.phone;

    const searchQuery = buildSearchQuery(['name', 'email', 'phone', 'address'], search);
    const finalQuery = Object.keys(searchQuery).length ? { ...query, ...searchQuery } : query;

    const [items, total] = await Promise.all([
      Customer.find(finalQuery)
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Customer.countDocuments(finalQuery),
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  static async updateById(id, updates) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findOneAndUpdate({ _id: id, isActive: true }, updates, {
      new: true,
      runValidators: true,
    }).lean();
  }

  static async deactivateById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findOneAndUpdate({ _id: id, isActive: true }, { isActive: false }, {
      new: true,
      runValidators: true,
    }).lean();
  }
}

export default CustomerRepository;

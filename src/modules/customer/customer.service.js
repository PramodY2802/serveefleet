import AppError from '../../common/errors/AppError.js';
import { buildPaginatedResponse } from '../../common/utils/pagination.js';
import CustomerRepository from './customer.repository.js';
import { toCustomerResponse } from './customer.mapper.js';
import { createCustomerDto, updateCustomerDto } from './customer.dto.js';

class CustomerService {
  static async createCustomer(payload, user) {
    const normalizedEmail = payload.email.toLowerCase();
    const existingCustomer = await CustomerRepository.findByEmail(normalizedEmail, user.id);
    if (existingCustomer) {
      throw new AppError('Customer email is already registered for this account', 400);
    }

    const customer = await CustomerRepository.create({
      ...createCustomerDto(payload),
      user: user.id,
    });

    return toCustomerResponse(customer);
  }

  static async getCustomers(query, user) {
    const { items, total, page, limit } = await CustomerRepository.getList(query, user);
    return buildPaginatedResponse(items.map(toCustomerResponse), total, page, limit);
  }

  static async getCustomerById(id, user) {
    const customer = await CustomerRepository.findById(id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (user.role !== 'admin' && String(customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to access this customer', 403);
    }

    return toCustomerResponse(customer);
  }

  static async updateCustomer(id, payload, user) {
    const customer = await CustomerRepository.findById(id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (user.role !== 'admin' && String(customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to modify this customer', 403);
    }

    if (payload.email) {
      const duplicate = await CustomerRepository.findByEmail(payload.email, user.id);
      if (duplicate && String(duplicate._id) !== String(id)) {
        throw new AppError('Email is already used by another customer', 400);
      }
    }

    const updated = await CustomerRepository.updateById(id, updateCustomerDto(payload));
    return toCustomerResponse(updated);
  }

  static async deleteCustomer(id, user) {
    const customer = await CustomerRepository.findById(id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (user.role !== 'admin' && String(customer.user) !== String(user.id)) {
      throw new AppError('Not authorized to delete this customer', 403);
    }

    const deleted = await CustomerRepository.deactivateById(id);
    return toCustomerResponse(deleted);
  }
}

export default CustomerService;

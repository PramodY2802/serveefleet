export const toCustomerResponse = (customer) => {
  if (!customer) return null;
  return {
    id: customer._id,
    userId: customer.user,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
};

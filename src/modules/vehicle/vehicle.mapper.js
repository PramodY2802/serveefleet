export const toVehicleResponse = (vehicle) => {
  if (!vehicle) return null;
  return {
    id: vehicle._id,
    customerId: vehicle.customer?._id || vehicle.customer,
    registrationNumber: vehicle.registrationNumber,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    fuelType: vehicle.fuelType,
    isActive: vehicle.isActive,
    customer: vehicle.customer
      ? {
          id: vehicle.customer._id,
          name: vehicle.customer.name,
          email: vehicle.customer.email,
        }
      : undefined,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
};

export const toServiceResponse = (service) => {
  if (!service) return null;
  const customer = service.vehicle?.customer || service.customer;
  const mappedCustomer = customer
    ? {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      }
    : undefined;

  return {
    id: service._id,
    vehicleId: service.vehicle?._id || service.vehicle,
    serviceType: service.serviceType,
    description: service.description,
    cost: service.cost,
    serviceDate: service.serviceDate,
    nextServiceDue: service.nextServiceDue,
    isActive: service.isActive,
    customer: mappedCustomer,
    vehicle: service.vehicle
      ? {
          id: service.vehicle._id,
          registrationNumber: service.vehicle.registrationNumber,
          plateColor: service.vehicle.plateColor || 'white',
          make: service.vehicle.make,
          model: service.vehicle.model,
          customer: mappedCustomer,
        }
      : undefined,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
};

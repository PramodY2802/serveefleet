export const toServiceResponse = (service) => {
  if (!service) return null;
  return {
    id: service._id,
    vehicleId: service.vehicle?._id || service.vehicle,
    serviceType: service.serviceType,
    description: service.description,
    cost: service.cost,
    serviceDate: service.serviceDate,
    nextServiceDue: service.nextServiceDue,
    isActive: service.isActive,
    vehicle: service.vehicle
      ? {
          id: service.vehicle._id,
          registrationNumber: service.vehicle.registrationNumber,
          make: service.vehicle.make,
          model: service.vehicle.model,
          customer: service.vehicle.customer
            ? {
                id: service.vehicle.customer._id,
                name: service.vehicle.customer.name,
                email: service.vehicle.customer.email,
              }
            : undefined,
        }
      : undefined,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
};

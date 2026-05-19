export const createServiceDto = ({ vehicleId, serviceDate, serviceType, description, cost, nextServiceDue }) => ({
  vehicle: vehicleId,
  serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
  serviceType: serviceType.trim(),
  description: description?.trim() || undefined,
  cost: cost !== undefined ? Number(cost) : undefined,
  nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : undefined,
});

export const updateServiceDto = ({ vehicleId, serviceDate, serviceType, description, cost, nextServiceDue }) => {
  const payload = {};
  if (vehicleId !== undefined) payload.vehicle = vehicleId;
  if (serviceDate !== undefined) payload.serviceDate = new Date(serviceDate);
  if (serviceType !== undefined) payload.serviceType = serviceType.trim();
  if (description !== undefined) payload.description = description.trim();
  if (cost !== undefined) payload.cost = Number(cost);
  if (nextServiceDue !== undefined) payload.nextServiceDue = new Date(nextServiceDue);
  return payload;
};

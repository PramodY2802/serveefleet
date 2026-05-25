import { buildItemizedBillingData } from '../billing/billing.utils.js';

export const createServiceDto = ({
  vehicleId,
  serviceDate,
  serviceType,
  description,
  cost,
  billItems,
  pricingSummary,
  taxBreakdown,
  serviceOdometer,
  nextServiceDue,
  nextServiceOdometer,
}) => ({
  vehicle: vehicleId,
  serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
  serviceType: serviceType.trim(),
  description: description?.trim() || undefined,
  ...buildItemizedBillingData({
    billItems,
    cost,
    description,
    serviceType,
    pricingSummary,
    taxBreakdown,
  }),
  serviceOdometer: serviceOdometer !== undefined ? Number(serviceOdometer) : undefined,
  nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : undefined,
  nextServiceOdometer: nextServiceOdometer !== undefined ? Number(nextServiceOdometer) : undefined,
});

export const updateServiceDto = ({
  vehicleId,
  serviceDate,
  serviceType,
  description,
  cost,
  billItems,
  pricingSummary,
  taxBreakdown,
  serviceOdometer,
  nextServiceDue,
  nextServiceOdometer,
}) => {
  const payload = {};
  if (vehicleId !== undefined) payload.vehicle = vehicleId;
  if (serviceDate !== undefined) payload.serviceDate = new Date(serviceDate);
  if (serviceType !== undefined) payload.serviceType = serviceType.trim();
  if (description !== undefined) payload.description = description.trim();
  if (serviceOdometer !== undefined) payload.serviceOdometer = Number(serviceOdometer);
  if (nextServiceDue !== undefined) payload.nextServiceDue = new Date(nextServiceDue);
  if (nextServiceOdometer !== undefined) payload.nextServiceOdometer = Number(nextServiceOdometer);
  if (billItems !== undefined || cost !== undefined || pricingSummary !== undefined || taxBreakdown !== undefined) {
    Object.assign(
      payload,
      buildItemizedBillingData({
        billItems,
        cost,
        description: description ?? '',
        serviceType: serviceType ?? '',
        pricingSummary,
        taxBreakdown,
      })
    );
  }
  return payload;
};

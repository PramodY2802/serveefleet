import { calculateBillTotals, normalizeBillItems } from '../billing/billing.utils.js';

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

  const billItems = normalizeBillItems(service.billItems || service.items || [], {
    name: service.description || service.serviceType || 'Service charge',
    itemType: 'service',
    unitPrice: service.cost ?? service.pricingSummary?.subtotal ?? 0,
    quantity: 1,
  });
  const calculated = calculateBillTotals(billItems, {
    discountAmount: service.pricingSummary?.discountAmount ?? service.totals?.discountAmount ?? 0,
    gstRate: service.pricingSummary?.gstRate ?? service.taxBreakdown?.gstRate ?? 0,
    currency: service.pricingSummary?.currency || 'INR',
  });

  return {
    id: service._id,
    vehicleId: service.vehicle?._id || service.vehicle,
    serviceType: service.serviceType,
    description: service.description,
    cost: service.cost ?? calculated.pricingSummary.subtotal ?? service.pricingSummary?.subtotal ?? 0,
    serviceDate: service.serviceDate,
    serviceOdometer: service.serviceOdometer,
    nextServiceDue: service.nextServiceDue,
    nextServiceOdometer: service.nextServiceOdometer,
    billItems,
    pricingSummary: service.pricingSummary || calculated.pricingSummary,
    taxBreakdown: service.taxBreakdown || calculated.taxBreakdown,
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

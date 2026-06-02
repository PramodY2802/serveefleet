import { calculateBillTotals, normalizeBillItems } from '../billing/billing.utils.js';

export const toServiceResponse = (service) => {
  if (!service) return null;
  const customerWithDetails = (value) =>
    value &&
    typeof value === 'object' &&
    (value.name || value.email || value.phone || value.fullName || value.companyName || value.businessName || value.contactName);
  const customer = customerWithDetails(service.customer)
    ? service.customer
    : customerWithDetails(service.vehicle?.customer)
      ? service.vehicle.customer
      : service.customer || service.vehicle?.customer;
  const customerId = customer?._id || customer?.id;
  const customerName = customer?.name || customer?.fullName || customer?.companyName || customer?.businessName || customer?.contactName;
  const mappedCustomer = customer
    ? {
        id: customerId,
        name: customerName || customer.name,
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
    customerId,
    customerName,
    customer: mappedCustomer,
    vehicle: service.vehicle
      ? {
          id: service.vehicle._id,
          registrationNumber: service.vehicle.registrationNumber,
          plateColor: service.vehicle.plateColor || 'white',
          make: service.vehicle.make,
          model: service.vehicle.model,
          customerId,
          customerName,
          customer: mappedCustomer,
        }
      : undefined,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
};

export const toBillResponse = (bill) => {
  if (!bill) return null;

  return {
    id: bill._id,
    billNumber: bill.billNumber,
    invoiceNumber: bill.billNumber,
    ownerUserId: bill.ownerUserId,
    serviceId: bill.service?._id || bill.service,
    service: bill.service
      ? {
          id: bill.service._id,
          vehicleId: bill.service.vehicle?._id || bill.service.vehicle,
          serviceType: bill.service.serviceType,
          description: bill.service.description,
          serviceDate: bill.service.serviceDate,
          nextServiceDue: bill.service.nextServiceDue,
        }
      : undefined,
    customer: bill.customer
      ? {
          id: bill.customer.id,
          userId: bill.customer.userId,
          name: bill.customer.name,
          email: bill.customer.email,
          phone: bill.customer.phone,
        }
      : undefined,
    vehicle: bill.vehicle
      ? {
          id: bill.vehicle.id,
          registrationNumber: bill.vehicle.registrationNumber,
          plateColor: bill.vehicle.plateColor,
          make: bill.vehicle.make,
          model: bill.vehicle.model,
          year: bill.vehicle.year,
          fuelType: bill.vehicle.fuelType,
        }
      : undefined,
    serviceSnapshot: bill.serviceSnapshot,
    items: bill.items || [],
    totals: bill.totals || {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
    },
    currency: bill.currency || 'INR',
    status: bill.status,
    payment: bill.payment,
    notes: bill.notes,
    auditTrail: bill.auditTrail || [],
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    createdDate: bill.createdAt,
  };
};

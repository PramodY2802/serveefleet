import { calculateBillTotals, sumBillItemsByType } from './billing.utils.js';

const normalizePricingSummary = (summary = {}, fallbackCurrency = 'INR') => {
  const subtotal = Number(summary.subtotal ?? summary.serviceCharge ?? 0) || 0;
  const discountAmount = Number(summary.discountAmount ?? 0) || 0;
  const taxAmount = Number(summary.taxAmount ?? 0) || 0;
  const grandTotal = Number(summary.grandTotal ?? summary.totalAmount ?? subtotal - discountAmount + taxAmount) || 0;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    currency: summary.currency || fallbackCurrency || 'INR',
    gstRate: Number(summary.gstRate ?? 0) || 0,
  };
};

const normalizeTaxBreakdown = (taxBreakdown = {}, pricingSummary = {}) => ({
  taxableAmount: Number(
    taxBreakdown.taxableAmount ?? (Number(pricingSummary.subtotal ?? 0) - Number(pricingSummary.discountAmount ?? 0))
  ) || 0,
  gstRate: Number(taxBreakdown.gstRate ?? pricingSummary.gstRate ?? 0) || 0,
  cgstAmount: Number(taxBreakdown.cgstAmount ?? 0) || 0,
  sgstAmount: Number(taxBreakdown.sgstAmount ?? 0) || 0,
  igstAmount: Number(taxBreakdown.igstAmount ?? 0) || 0,
  taxAmount: Number(taxBreakdown.taxAmount ?? pricingSummary.taxAmount ?? 0) || 0,
});

const buildCompatibilitySummary = (pricingSummary = {}, billItems = []) => {
  const subtotal = Number(pricingSummary.subtotal ?? 0) || 0;
  const discountAmount = Number(pricingSummary.discountAmount ?? 0) || 0;
  const taxAmount = Number(pricingSummary.taxAmount ?? 0) || 0;
  const totalAmount = Number(pricingSummary.grandTotal ?? 0) || subtotal - discountAmount + taxAmount;
  const partsCost = sumBillItemsByType(billItems, 'part');
  const labourCharge = sumBillItemsByType(billItems, 'labour');
  const serviceCharge = sumBillItemsByType(billItems, 'service');
  const accessoryCost = sumBillItemsByType(billItems, 'accessory');

  return {
    serviceCharge: serviceCharge || subtotal,
    partsCost,
    labourCharge,
    accessoryCost,
    taxAmount,
    discountAmount,
    subtotal,
    totalAmount,
    billItems,
  };
};

export const toBillResponse = (bill) => {
  if (!bill) return null;

  const billItems = bill.billItems || bill.items || bill.serviceSnapshot?.billItems || bill.service?.billItems || bill.service?.items || [];
  const calculated = calculateBillTotals(billItems, {
    discountAmount:
      bill.pricingSummary?.discountAmount ??
      bill.totals?.discountAmount ??
      bill.serviceSnapshot?.pricingSummary?.discountAmount ??
      bill.service?.pricingSummary?.discountAmount ??
      0,
    gstRate:
      bill.pricingSummary?.gstRate ??
      bill.taxBreakdown?.gstRate ??
      bill.serviceSnapshot?.pricingSummary?.gstRate ??
      bill.service?.pricingSummary?.gstRate ??
      0,
    currency: bill.pricingSummary?.currency || bill.currency || 'INR',
  });
  const normalizedBillItems = calculated.billItems;

  const pricingSummary = normalizePricingSummary(
    bill.pricingSummary || bill.totals || calculated.pricingSummary,
    bill.currency || calculated.pricingSummary.currency
  );
  const taxBreakdown = normalizeTaxBreakdown(
    bill.taxBreakdown || bill.serviceSnapshot?.taxBreakdown || calculated.taxBreakdown,
    pricingSummary
  );
  const serviceSnapshotSource = bill.serviceSnapshot || (bill.service
    ? {
        serviceType: bill.service.serviceType,
        description: bill.service.description,
        serviceDate: bill.service.serviceDate,
        serviceOdometer: bill.service.serviceOdometer,
        nextServiceDue: bill.service.nextServiceDue,
        nextServiceOdometer: bill.service.nextServiceOdometer,
        cost: bill.service.cost,
        billItems: bill.service.billItems || bill.service.items || [],
        pricingSummary: bill.service.pricingSummary,
        taxBreakdown: bill.service.taxBreakdown,
        currency: bill.service.currency,
      }
    : null);

  const serviceSnapshot = serviceSnapshotSource
    ? {
        ...serviceSnapshotSource,
        billItems: serviceSnapshotSource.billItems || normalizedBillItems,
        pricingSummary: serviceSnapshotSource.pricingSummary || pricingSummary,
        taxBreakdown: serviceSnapshotSource.taxBreakdown || taxBreakdown,
        cost:
          serviceSnapshotSource.cost ??
          serviceSnapshotSource.pricingSummary?.subtotal ??
          pricingSummary.subtotal ??
          0,
      }
    : undefined;

  const summary = buildCompatibilitySummary(pricingSummary, normalizedBillItems);

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
          serviceOdometer: bill.service.serviceOdometer,
          nextServiceDue: bill.service.nextServiceDue,
          nextServiceOdometer: bill.service.nextServiceOdometer,
          billItems: bill.service.billItems || bill.service.items || normalizedBillItems,
          pricingSummary: bill.service.pricingSummary || pricingSummary,
          taxBreakdown: bill.service.taxBreakdown || taxBreakdown,
          cost: bill.service.cost ?? bill.service.pricingSummary?.subtotal ?? pricingSummary.subtotal ?? 0,
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
    billItems: normalizedBillItems,
    items: normalizedBillItems,
    pricingSummary,
    taxBreakdown,
    totals: pricingSummary,
    summary,
    serviceSnapshot,
    currency: bill.currency || pricingSummary.currency || 'INR',
    status: bill.status,
    payment: bill.payment,
    notes: bill.notes,
    auditTrail: bill.auditTrail || [],
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    createdDate: bill.createdAt,
  };
};

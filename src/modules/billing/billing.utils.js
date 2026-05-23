import crypto from 'crypto';

export const generateBillNumber = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomSegment = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `INV-${yyyy}${mm}${dd}-${randomSegment}`;
};

export const normalizeMoney = (value) => Number((Number(value) || 0).toFixed(2));

export const buildBillItemsFromService = (service) => {
  const unitPrice = normalizeMoney(service.cost ?? 0);
  return [
    {
      description: service.description?.trim() || service.serviceType?.trim() || 'Service charge',
      quantity: 1,
      unitPrice,
      taxRate: 0,
      discountAmount: 0,
      totalAmount: unitPrice,
    },
  ];
};

export const calculateBillTotals = (items = []) => {
  const subtotal = normalizeMoney(
    items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity || 1)), 0)
  );
  const discountAmount = normalizeMoney(
    items.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0)
  );
  const taxAmount = normalizeMoney(
    items.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0)
  );
  const totalAmount = normalizeMoney(subtotal - discountAmount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
  };
};

export const createAuditTrailEntry = (user, note = 'Bill generated from service record') => ({
  action: 'bill_generated',
  note,
  at: new Date(),
  by: user
    ? {
        id: user.id,
        name: user.name,
        role: user.role,
      }
    : undefined,
});

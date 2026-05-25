import crypto from 'crypto';

export const BILL_ITEM_TYPES = ['part', 'labour', 'service', 'accessory'];
export const DEFAULT_CURRENCY = 'INR';

const normalizeMoney = (value) => Number((Number(value) || 0).toFixed(2));

const normalizeItemType = (value) => {
  const normalized = String(value || 'service').trim().toLowerCase();
  return BILL_ITEM_TYPES.includes(normalized) ? normalized : 'service';
};

const hasNumericValue = (value) => Number.isFinite(Number(value));

const resolveBillItemType = (item = {}, fallback = {}) =>
  normalizeItemType(item.itemType ?? item.type ?? item.category ?? fallback.itemType);

const resolveBillItemPrice = (item = {}, fallback = {}, quantity = 1) => {
  const explicitUnitPrice = item.unitPrice ?? item.price ?? item.amount ?? fallback.unitPrice ?? fallback.price ?? fallback.amount;
  if (hasNumericValue(explicitUnitPrice)) {
    return normalizeMoney(explicitUnitPrice);
  }

  const explicitLineTotal = item.lineTotal ?? item.totalAmount ?? item.total ?? fallback.lineTotal ?? fallback.totalAmount;
  if (hasNumericValue(explicitLineTotal)) {
    return normalizeMoney(Number(explicitLineTotal) / Math.max(1, quantity));
  }

  return 0;
};

export const generateBillNumber = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomSegment = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `INV-${yyyy}${mm}${dd}-${randomSegment}`;
};

export const normalizeBillItem = (item = {}, fallback = {}) => {
  const name = String(item.name ?? item.description ?? fallback.name ?? 'Service charge').trim() || 'Service charge';
  const itemType = resolveBillItemType(item, fallback);
  const quantity = Math.max(1, Number(item.quantity ?? fallback.quantity ?? 1) || 1);
  const unitPrice = resolveBillItemPrice(item, fallback, quantity);
  const lineTotal = hasNumericValue(item.lineTotal ?? item.totalAmount ?? item.total ?? fallback.lineTotal ?? fallback.totalAmount)
    ? normalizeMoney(item.lineTotal ?? item.totalAmount ?? item.total ?? fallback.lineTotal ?? fallback.totalAmount)
    : normalizeMoney(quantity * unitPrice);

  return {
    name,
    itemType,
    quantity,
    unitPrice,
    lineTotal,
  };
};

export const normalizeBillItems = (items = [], fallback = {}) => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => normalizeBillItem(item, fallback)).filter((item) => item.name)
    : [];

  if (normalizedItems.length > 0) {
    return normalizedItems;
  }

  if (hasNumericValue(fallback.unitPrice) || hasNumericValue(fallback.cost)) {
    return [
      normalizeBillItem({}, {
        name: fallback.name || fallback.description || fallback.serviceType || 'Service charge',
        itemType: fallback.itemType || 'service',
        unitPrice: fallback.unitPrice ?? fallback.cost ?? 0,
        quantity: fallback.quantity ?? 1,
      }),
    ];
  }

  return [];
};

export const calculateBillTotals = (items = [], options = {}) => {
  const billItems = Array.isArray(items) ? items.map((item) => normalizeBillItem(item)) : [];
  const subtotal = normalizeMoney(
    billItems.reduce((sum, item) => sum + item.lineTotal, 0)
  );
  const requestedDiscountAmount = normalizeMoney(options.discountAmount ?? 0);
  const discountAmount = normalizeMoney(Math.min(requestedDiscountAmount, subtotal));
  const taxableAmount = normalizeMoney(Math.max(0, subtotal - discountAmount));
  const gstRate = normalizeMoney(options.gstRate ?? 0);
  const taxAmount = normalizeMoney(taxableAmount * (gstRate / 100));
  const cgstAmount = normalizeMoney(taxAmount / 2);
  const sgstAmount = normalizeMoney(taxAmount - cgstAmount);
  const igstAmount = 0;
  const grandTotal = normalizeMoney(taxableAmount + taxAmount);
  const currency = options.currency || DEFAULT_CURRENCY;

  return {
    billItems,
    pricingSummary: {
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      currency,
      gstRate,
    },
    taxBreakdown: {
      taxableAmount,
      gstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount,
    },
  };
};

export const sumBillItemsByType = (billItems = [], itemType) =>
  normalizeMoney(
    billItems.reduce((sum, item) => (item.itemType === itemType ? sum + (Number(item.lineTotal) || 0) : sum), 0)
  );

export const buildItemizedBillingData = ({
  billItems,
  cost,
  description,
  serviceType,
  pricingSummary = {},
  taxBreakdown = {},
  currency,
} = {}) => {
  const fallbackItem = {
    name: description || serviceType || 'Service charge',
    itemType: 'service',
    unitPrice: cost,
    quantity: 1,
  };

  const normalizedBillItems = normalizeBillItems(billItems, fallbackItem);
  const calculated = calculateBillTotals(normalizedBillItems, {
    discountAmount: pricingSummary.discountAmount ?? taxBreakdown.discountAmount ?? 0,
    gstRate: pricingSummary.gstRate ?? taxBreakdown.gstRate ?? 0,
    currency: pricingSummary.currency || currency || DEFAULT_CURRENCY,
  });

  return {
    billItems: calculated.billItems,
    pricingSummary: calculated.pricingSummary,
    taxBreakdown: calculated.taxBreakdown,
    cost: calculated.pricingSummary.subtotal,
  };
};

export const buildBillItemsFromService = (service) =>
  buildItemizedBillingData({
    billItems: service.billItems || service.items || service.serviceSnapshot?.billItems,
    cost: service.cost,
    description: service.description,
    serviceType: service.serviceType,
    pricingSummary: service.pricingSummary,
    taxBreakdown: service.taxBreakdown,
    currency: service.pricingSummary?.currency || service.currency,
  });

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

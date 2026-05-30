import Service from '../models/Service.js';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';
import Bill from '../models/Bill.js';

const normalizeMoney = (value) => Number((Number(value) || 0).toFixed(2));

const buildWhatsAppMessage = (bill) => {
  const serviceType = bill.serviceSnapshot?.serviceType || 'Service';
  const totalAmount = normalizeMoney(bill.totals?.totalAmount);
  const nextDue = bill.serviceSnapshot?.nextServiceDue
    ? new Date(bill.serviceSnapshot.nextServiceDue).toLocaleDateString()
    : 'N/A';

  return [
    `Hello ${bill.customer?.name || 'Customer'},`,
    '',
    `Your invoice ${bill.billNumber} is ready.`,
    `Vehicle: ${bill.vehicle?.registrationNumber || 'N/A'}`,
    `Service: ${serviceType}`,
    `Amount: ₹${totalAmount}`,
    `Service Date: ${bill.serviceSnapshot?.serviceDate ? new Date(bill.serviceSnapshot.serviceDate).toLocaleDateString() : 'N/A'}`,
    `Next Service Due: ${nextDue}`,
    '',
    'Thank you for choosing our service.',
  ].join('\n');
};

const buildBillData = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service) return null;

  const vehicle = await Vehicle.findById(service.vehicleId);
  if (!vehicle) return null;

  const customer = await Customer.findById(vehicle.userId);
  if (!customer) return null;

  const normalizedBillItems = Array.isArray(service.billItems) && service.billItems.length > 0
    ? service.billItems.map((item) => ({
        name: item.name || item.description || service.description || service.serviceType || 'Service charge',
        description: item.description || item.name || service.description || service.serviceType || 'Service charge',
        itemType: item.itemType || item.type || 'service',
        quantity: Number(item.quantity) || 1,
        unitPrice: normalizeMoney(item.unitPrice ?? item.price ?? item.amount ?? item.totalAmount ?? service.cost),
        lineTotal: normalizeMoney(item.lineTotal ?? item.totalAmount ?? (Number(item.quantity) || 1) * Number(item.unitPrice ?? item.price ?? item.amount ?? item.totalAmount ?? service.cost)),
      }))
    : [
        {
          name: service.description || service.serviceType || 'Service charge',
          description: service.description || service.serviceType || 'Service charge',
          itemType: 'service',
          quantity: 1,
          unitPrice: normalizeMoney(service.cost),
          lineTotal: normalizeMoney(service.cost),
        },
      ];

  const pricingSummary = {
    subtotal: normalizeMoney(service.pricingSummary?.subtotal ?? normalizedBillItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0)),
    discountAmount: normalizeMoney(service.pricingSummary?.discountAmount ?? 0),
    taxAmount: normalizeMoney(service.pricingSummary?.taxAmount ?? 0),
    grandTotal: normalizeMoney(
      service.pricingSummary?.grandTotal ??
        (normalizeMoney(service.pricingSummary?.subtotal ?? normalizedBillItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0)) -
          normalizeMoney(service.pricingSummary?.discountAmount ?? 0) +
          normalizeMoney(service.pricingSummary?.taxAmount ?? 0))
    ),
    currency: service.pricingSummary?.currency || 'INR',
    gstRate: normalizeMoney(service.pricingSummary?.gstRate ?? service.taxBreakdown?.gstRate ?? 0),
  };

  const taxBreakdown = {
    taxableAmount: normalizeMoney(
      service.taxBreakdown?.taxableAmount ??
        Math.max(0, pricingSummary.subtotal - pricingSummary.discountAmount)
    ),
    gstRate: normalizeMoney(service.taxBreakdown?.gstRate ?? pricingSummary.gstRate),
    cgstAmount: normalizeMoney(service.taxBreakdown?.cgstAmount ?? pricingSummary.taxAmount / 2),
    sgstAmount: normalizeMoney(service.taxBreakdown?.sgstAmount ?? pricingSummary.taxAmount / 2),
    igstAmount: normalizeMoney(service.taxBreakdown?.igstAmount ?? 0),
    taxAmount: normalizeMoney(service.taxBreakdown?.taxAmount ?? pricingSummary.taxAmount),
  };

  const totals = {
    subtotal: pricingSummary.subtotal,
    discountAmount: pricingSummary.discountAmount,
    taxAmount: pricingSummary.taxAmount,
    totalAmount: pricingSummary.grandTotal,
  };

  return {
    service,
    vehicle,
    customer,
    normalizedBillItems,
    pricingSummary,
    taxBreakdown,
    totals,
    billNumber: `INV-${String(service._id).padStart(6, '0')}`,
  };
};

const buildBillPayload = async (serviceId) => {
  const existing = await Bill.findOne({ serviceId }).lean();
  if (existing) return existing;

  const billData = await buildBillData(serviceId);
  if (!billData) return null;

  const {
    service,
    vehicle,
    customer,
    normalizedBillItems,
    pricingSummary,
    taxBreakdown,
    totals,
    billNumber,
  } = billData;
  const bill = await Bill.create({
    billNumber,
    serviceId: service._id,
    customer: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    vehicle: {
      id: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      plateColor: vehicle.plateColor || 'white',
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType,
    },
    serviceSnapshot: {
      serviceType: service.serviceType,
      description: service.description,
      serviceDate: service.serviceDate,
      serviceOdometer: service.serviceOdometer,
      nextServiceDue: service.nextServiceDue,
      nextServiceOdometer: service.nextServiceOdometer,
      cost: service.cost ?? pricingSummary.subtotal,
      billItems: normalizedBillItems,
      pricingSummary,
      taxBreakdown,
      currency: pricingSummary.currency,
    },
    items: normalizedBillItems,
    billItems: normalizedBillItems,
    totals,
    pricingSummary,
    taxBreakdown,
    summary: {
      serviceCharge: pricingSummary.subtotal,
      partsCost: 0,
      labourCharge: 0,
      taxAmount: pricingSummary.taxAmount,
      discountAmount: pricingSummary.discountAmount,
      totalAmount: pricingSummary.grandTotal,
    },
    currency: pricingSummary.currency,
    status: 'issued',
    payment: {
      status: 'pending',
    },
    auditTrail: [
      {
        action: 'bill_generated',
        note: 'Bill generated from service record',
        by: {
          id: customer.userId,
          name: '',
          role: '',
        },
      },
    ],
  });

  return bill.toObject();
};

const syncBillFromService = async (serviceId) => {
  const bill = await Bill.findOne({ serviceId });
  if (!bill) return null;

  const billData = await buildBillData(serviceId);
  if (!billData) return null;

  const {
    service,
    vehicle,
    customer,
    normalizedBillItems,
    pricingSummary,
    taxBreakdown,
    totals,
  } = billData;

  bill.customer = {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
  bill.vehicle = {
    id: vehicle._id,
    registrationNumber: vehicle.registrationNumber,
    plateColor: vehicle.plateColor || 'white',
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    fuelType: vehicle.fuelType,
  };
  bill.serviceSnapshot = {
    serviceType: service.serviceType,
    description: service.description,
    serviceDate: service.serviceDate,
    serviceOdometer: service.serviceOdometer,
    nextServiceDue: service.nextServiceDue,
    nextServiceOdometer: service.nextServiceOdometer,
    cost: service.cost ?? pricingSummary.subtotal,
    billItems: normalizedBillItems,
    pricingSummary,
    taxBreakdown,
    currency: pricingSummary.currency,
  };
  bill.items = normalizedBillItems;
  bill.billItems = normalizedBillItems;
  bill.totals = totals;
  bill.pricingSummary = pricingSummary;
  bill.taxBreakdown = taxBreakdown;
  bill.currency = pricingSummary.currency;
  bill.updated_at = new Date();

  await bill.save();
  return bill.toObject();
};

const mapBill = (bill) => {
  if (!bill) return null;

  return {
    id: bill._id,
    billNumber: bill.billNumber,
    invoiceNumber: bill.billNumber,
    serviceId: bill.serviceId,
    customer: bill.customer,
    vehicle: bill.vehicle,
    serviceSnapshot: bill.serviceSnapshot,
    items: bill.items || bill.billItems || [],
    billItems: bill.billItems || bill.items || [],
    totals: bill.totals || {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
    },
    pricingSummary: bill.pricingSummary || {
      subtotal: bill.totals?.subtotal || 0,
      discountAmount: bill.totals?.discountAmount || 0,
      taxAmount: bill.totals?.taxAmount || 0,
      grandTotal: bill.totals?.totalAmount || 0,
      currency: bill.currency || 'INR',
      gstRate: 0,
    },
    taxBreakdown: bill.taxBreakdown || {
      taxableAmount: bill.totals?.subtotal || 0,
      gstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      taxAmount: bill.totals?.taxAmount || 0,
    },
    summary: bill.summary || {
      serviceCharge: bill.totals?.subtotal || 0,
      partsCost: 0,
      labourCharge: 0,
      taxAmount: bill.totals?.taxAmount || 0,
      discountAmount: bill.totals?.discountAmount || 0,
      totalAmount: bill.totals?.totalAmount || 0,
    },
    currency: bill.currency || 'INR',
    status: bill.status || 'issued',
    payment: bill.payment || { status: 'pending' },
    notes: bill.notes,
    auditTrail: bill.auditTrail || [],
    createdAt: bill.created_at || bill.createdAt,
    updatedAt: bill.updated_at || bill.updatedAt,
  };
};

const recomputeBillTotals = (bill) => {
  const summary = bill.summary || {};
  const serviceCharge = normalizeMoney(summary.serviceCharge);
  const partsCost = normalizeMoney(summary.partsCost);
  const labourCharge = normalizeMoney(summary.labourCharge);
  const taxAmount = normalizeMoney(summary.taxAmount);
  const discountAmount = normalizeMoney(summary.discountAmount);
  const totalAmount = normalizeMoney(serviceCharge + partsCost + labourCharge + taxAmount - discountAmount);
  const subtotal = normalizeMoney(serviceCharge + partsCost + labourCharge);
  const billItems = Array.isArray(bill.billItems) && bill.billItems.length
    ? bill.billItems
    : Array.isArray(bill.items) && bill.items.length
      ? bill.items
      : [
          {
            name: bill.serviceSnapshot?.description || bill.serviceSnapshot?.serviceType || 'Service charge',
            description: bill.serviceSnapshot?.description || bill.serviceSnapshot?.serviceType || 'Service charge',
            itemType: 'service',
            quantity: 1,
            unitPrice: serviceCharge,
            lineTotal: serviceCharge,
            taxRate: 0,
            discountAmount: 0,
            totalAmount: serviceCharge,
          },
        ];

  const pricingSummary = {
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal: totalAmount,
    currency: bill.pricingSummary?.currency || bill.currency || 'INR',
    gstRate: bill.pricingSummary?.gstRate || bill.taxBreakdown?.gstRate || 0,
  };

  const taxBreakdown = {
    taxableAmount: normalizeMoney(
      bill.taxBreakdown?.taxableAmount ?? Math.max(0, subtotal - discountAmount)
    ),
    gstRate: normalizeMoney(bill.taxBreakdown?.gstRate ?? pricingSummary.gstRate),
    cgstAmount: normalizeMoney(bill.taxBreakdown?.cgstAmount ?? taxAmount / 2),
    sgstAmount: normalizeMoney(bill.taxBreakdown?.sgstAmount ?? taxAmount / 2),
    igstAmount: normalizeMoney(bill.taxBreakdown?.igstAmount ?? 0),
    taxAmount: normalizeMoney(bill.taxBreakdown?.taxAmount ?? taxAmount),
  };

  return {
    summary: {
      serviceCharge,
      partsCost,
      labourCharge,
      taxAmount,
      discountAmount,
      totalAmount,
    },
    totals: {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    },
    items: billItems,
    billItems,
    pricingSummary,
    taxBreakdown,
    currency: pricingSummary.currency,
  };
};

export const generateBillFromService = async (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    if (Number.isNaN(serviceId)) {
      return res.status(400).json({ message: 'Invalid serviceId' });
    }

    const bill = await buildBillPayload(serviceId);
    if (!bill) {
      return res.status(404).json({ message: 'Service, vehicle, or customer not found' });
    }

    return res.status(201).json(mapBill(bill));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate bill', details: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const billId = Number(req.params.id);
    if (Number.isNaN(billId)) {
      return res.status(400).json({ message: 'Invalid bill id' });
    }

    const bill = await Bill.findById(billId).lean();
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    return res.status(200).json(mapBill(bill));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bill', details: error.message });
  }
};

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find().sort({ _id: -1 }).lean();
    return res.status(200).json(bills.map(mapBill));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bills', details: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    const billId = Number(req.params.id);
    if (Number.isNaN(billId)) {
      return res.status(400).json({ message: 'Invalid bill id' });
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (req.body.status) {
      bill.status = req.body.status;
    }

    if (req.body.payment?.status) {
      bill.payment = {
        ...(bill.payment || {}),
        ...req.body.payment,
      };
    }

    if (req.body.summary) {
      bill.summary = {
        ...(bill.summary || {}),
        ...req.body.summary,
      };
    }

    if (req.body.notes !== undefined) {
      bill.notes = req.body.notes;
    }

    if (Array.isArray(req.body.items)) {
      bill.items = req.body.items;
      bill.billItems = req.body.items;
    }

    if (Array.isArray(req.body.billItems)) {
      bill.billItems = req.body.billItems;
      bill.items = req.body.billItems;
    }

    if (req.body.pricingSummary) {
      bill.pricingSummary = {
        ...(bill.pricingSummary || {}),
        ...req.body.pricingSummary,
      };
    }

    if (req.body.taxBreakdown) {
      bill.taxBreakdown = {
        ...(bill.taxBreakdown || {}),
        ...req.body.taxBreakdown,
      };
    }

    const recomputed = recomputeBillTotals(bill);
    bill.summary = recomputed.summary;
    bill.totals = recomputed.totals;
    bill.items = recomputed.items;
    bill.billItems = recomputed.billItems;
    bill.pricingSummary = recomputed.pricingSummary;
    bill.taxBreakdown = recomputed.taxBreakdown;
    bill.currency = recomputed.currency;
    bill.updated_at = new Date();

    await bill.save();
    return res.status(200).json(mapBill(bill.toObject()));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update bill', details: error.message });
  }
};

export const getBillByServiceId = async (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    if (Number.isNaN(serviceId)) {
      return res.status(400).json({ message: 'Invalid serviceId' });
    }

    const bill = await Bill.findOne({ serviceId }).lean();
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found for this service' });
    }

    return res.status(200).json(mapBill(bill));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bill', details: error.message });
  }
};

export const syncBillForService = async (serviceId) => syncBillFromService(serviceId);

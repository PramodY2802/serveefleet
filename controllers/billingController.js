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

const buildBillPayload = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service) return null;

  const existing = await Bill.findOne({ serviceId }).lean();
  if (existing) return existing;

  const vehicle = await Vehicle.findById(service.vehicleId);
  if (!vehicle) return null;

  const customer = await Customer.findById(vehicle.userId);
  if (!customer) return null;

  const unitPrice = normalizeMoney(service.cost);
  const serviceCharge = unitPrice;
  const partsCost = 0;
  const labourCharge = 0;
  const taxAmount = 0;
  const discountAmount = 0;
  const totalAmount = serviceCharge + partsCost + labourCharge + taxAmount - discountAmount;
  const items = [
    {
      description: service.description || service.serviceType || 'Service charge',
      quantity: 1,
      unitPrice: serviceCharge,
      taxRate: 0,
      discountAmount: 0,
      totalAmount: serviceCharge,
    },
  ];

  const totals = {
    subtotal: serviceCharge + partsCost + labourCharge,
    discountAmount,
    taxAmount,
    totalAmount,
  };

  const billNumber = `INV-${String(service._id).padStart(6, '0')}`;
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
      nextServiceDue: service.nextServiceDue,
    },
    items,
    totals,
    summary: {
      serviceCharge,
      partsCost,
      labourCharge,
      taxAmount,
      discountAmount,
      totalAmount,
    },
    currency: 'INR',
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
    items: bill.items || [],
    totals: bill.totals || {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
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
      subtotal: normalizeMoney(serviceCharge + partsCost + labourCharge),
      discountAmount,
      taxAmount,
      totalAmount,
    },
    items: Array.isArray(bill.items) && bill.items.length
      ? bill.items
      : [
          {
            description: bill.serviceSnapshot?.description || bill.serviceSnapshot?.serviceType || 'Service charge',
            quantity: 1,
            unitPrice: serviceCharge,
            taxRate: 0,
            discountAmount: 0,
            totalAmount: serviceCharge,
          },
        ],
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
    }

    const recomputed = recomputeBillTotals(bill);
    bill.summary = recomputed.summary;
    bill.totals = recomputed.totals;
    bill.items = recomputed.items;
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

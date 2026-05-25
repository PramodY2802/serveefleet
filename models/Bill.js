import mongoose from 'mongoose';
import pkg from 'mongoose-sequence';

const AutoIncrement = pkg(mongoose);

const billItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    itemType: {
      type: String,
      trim: true,
      enum: ['part', 'labour', 'service', 'accessory'],
      default: 'service',
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    billNumber: { type: String, unique: true },
    serviceId: { type: Number, ref: 'Service', unique: true, index: true },
    customer: {
      id: Number,
      name: String,
      email: String,
      phone: String,
    },
    vehicle: {
      id: Number,
      registrationNumber: String,
      plateColor: String,
      make: String,
      model: String,
      year: Number,
      fuelType: String,
    },
    serviceSnapshot: {
      serviceType: String,
      description: String,
      serviceDate: Date,
      serviceOdometer: Number,
      nextServiceDue: Date,
      nextServiceOdometer: Number,
      cost: { type: Number, default: 0 },
      billItems: { type: [billItemSchema], default: [] },
      pricingSummary: {
        subtotal: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        gstRate: { type: Number, default: 0 },
      },
      taxBreakdown: {
        taxableAmount: { type: Number, default: 0 },
        gstRate: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
      },
      currency: { type: String, default: 'INR' },
    },
    items: { type: [billItemSchema], default: [] },
    billItems: { type: [billItemSchema], default: [] },
    totals: {
      subtotal: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
    },
    pricingSummary: {
      subtotal: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      gstRate: { type: Number, default: 0 },
    },
    taxBreakdown: {
      taxableAmount: { type: Number, default: 0 },
      gstRate: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
    },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'issued' },
    payment: {
      status: { type: String, default: 'pending' },
      method: String,
      transactionId: String,
      paidAt: Date,
    },
    summary: {
      serviceCharge: { type: Number, default: 0 },
      partsCost: { type: Number, default: 0 },
      labourCharge: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
    },
    notes: String,
    auditTrail: [
      {
        action: String,
        note: String,
        at: { type: Date, default: Date.now },
        by: {
          id: Number,
          name: String,
          role: String,
        },
      },
    ],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

billSchema.plugin(AutoIncrement, {
  id: 'bill_id_counter',
  inc_field: '_id',
});

export default mongoose.model('Bill', billSchema);

import mongoose from 'mongoose';
import pkg from 'mongoose-sequence';

const AutoIncrement = pkg(mongoose);

const serviceBillItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    itemType: {
      type: String,
      trim: true,
      enum: ['part', 'labour', 'service', 'accessory'],
      default: 'service',
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    lineTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const pricingSummarySchema = new mongoose.Schema(
  {
    subtotal: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    grandTotal: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: 'INR' },
    gstRate: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const taxBreakdownSchema = new mongoose.Schema(
  {
    taxableAmount: { type: Number, min: 0, default: 0 },
    gstRate: { type: Number, min: 0, default: 0 },
    cgstAmount: { type: Number, min: 0, default: 0 },
    sgstAmount: { type: Number, min: 0, default: 0 },
    igstAmount: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
    },
    vehicleId: { type: Number, ref: 'Vehicle', required: true },
    serviceDate: { type: Date, default: Date.now },
    serviceOdometer: { type: Number, min: 0 },
    serviceType: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    cost: { type: Number, min: 0, default: 0 },
    billItems: { type: [serviceBillItemSchema], default: [] },
    pricingSummary: { type: pricingSummarySchema, default: () => ({}) },
    taxBreakdown: { type: taxBreakdownSchema, default: () => ({}) },
    nextServiceDue: { type: Date },
    nextServiceOdometer: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    _id: false,
  }
);

serviceSchema.plugin(AutoIncrement, {
  id: 'service_id_counter',
  inc_field: '_id',
});

export default mongoose.model('Service', serviceSchema);

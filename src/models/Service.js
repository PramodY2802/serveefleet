import mongoose from 'mongoose';

const serviceBillItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    itemType: {
      type: String,
      enum: ['part', 'labour', 'service', 'accessory'],
      default: 'service',
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const pricingSummarySchema = new mongoose.Schema(
  {
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    gstRate: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const taxBreakdownSchema = new mongoose.Schema(
  {
    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    serviceDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    serviceOdometer: {
      type: Number,
      min: 0,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      min: 0,
    },
    billItems: {
      type: [serviceBillItemSchema],
      default: [],
    },
    pricingSummary: {
      type: pricingSummarySchema,
      default: () => ({}),
    },
    taxBreakdown: {
      type: taxBreakdownSchema,
      default: () => ({}),
    },
    nextServiceDue: {
      type: Date,
      index: true,
    },
    nextServiceOdometer: {
      type: Number,
      min: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ serviceType: 1, serviceDate: -1 });
serviceSchema.index({ vehicle: 1, nextServiceDue: 1 });
serviceSchema.index({ vehicle: 1, serviceOdometer: -1 });
serviceSchema.index({ vehicle: 1, nextServiceOdometer: 1 });

export default mongoose.model('Service', serviceSchema);

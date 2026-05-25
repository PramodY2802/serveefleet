import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema(
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

const billSnapshotCustomerSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const billSnapshotVehicleSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    plateColor: {
      type: String,
      trim: true,
      default: 'white',
    },
    make: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    fuelType: {
      type: String,
      trim: true,
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

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
      unique: true,
    },
    customer: {
      type: billSnapshotCustomerSchema,
      required: true,
    },
    vehicle: {
      type: billSnapshotVehicleSchema,
      required: true,
    },
    serviceSnapshot: {
      serviceType: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      serviceDate: {
        type: Date,
        required: true,
      },
      serviceOdometer: {
        type: Number,
        min: 0,
      },
      nextServiceDue: {
        type: Date,
      },
      nextServiceOdometer: {
        type: Number,
        min: 0,
      },
      cost: {
        type: Number,
        min: 0,
        default: 0,
      },
      billItems: {
        type: [billItemSchema],
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
      currency: {
        type: String,
        default: 'INR',
        trim: true,
      },
    },
    billItems: {
      type: [billItemSchema],
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
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'sent', 'viewed', 'paid', 'cancelled'],
      default: 'issued',
      index: true,
    },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      method: {
        type: String,
        trim: true,
      },
      transactionId: {
        type: String,
        trim: true,
      },
      paidAt: {
        type: Date,
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    auditTrail: [
      {
        action: {
          type: String,
          required: true,
          trim: true,
        },
        note: {
          type: String,
          trim: true,
        },
        at: {
          type: Date,
          default: Date.now,
        },
        by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          name: {
            type: String,
            trim: true,
          },
          role: {
            type: String,
            trim: true,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

billSchema.index({ ownerUserId: 1, createdAt: -1 });
billSchema.index({ 'customer.id': 1, createdAt: -1 });
billSchema.index({ 'vehicle.registrationNumber': 1, createdAt: -1 });
billSchema.index({ 'billItems.name': 1, createdAt: -1 });

export default mongoose.model('Bill', billSchema);

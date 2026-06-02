import mongoose from 'mongoose';

const reminderChannelSchema = new mongoose.Schema(
  {
    inApp: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: false,
    },
    push: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const reminderSourceSnapshotSchema = new mongoose.Schema(
  {
    serviceType: { type: String, trim: true },
    serviceDate: { type: Date },
    nextServiceDue: { type: Date },
    nextServiceOdometer: { type: Number, min: 0 },
    customerName: { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    vehicleRegistrationNumber: { type: String, trim: true, uppercase: true },
  },
  { _id: false }
);

const reminderItemSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    itemType: { type: String, trim: true },
    quantity: { type: Number, min: 0 },
    unitPrice: { type: Number, min: 0 },
    lineTotal: { type: Number, min: 0 },
    isBillable: { type: Boolean, default: false },
  },
  { _id: false }
);

const reminderSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reminderType: {
      type: String,
      enum: ['FULL_SERVICE', 'PART'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'DUE', 'SENT', 'ACKNOWLEDGED', 'SNOOZED', 'CANCELLED', 'EXPIRED'],
      default: 'SCHEDULED',
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    serviceItemKey: {
      type: String,
      trim: true,
      index: true,
    },
    sourceItemName: {
      type: String,
      trim: true,
      index: true,
    },
    sourceItemType: {
      type: String,
      trim: true,
      index: true,
    },
    sourceItemSnapshot: {
      type: reminderItemSnapshotSchema,
      default: undefined,
    },
    sourceServiceSnapshot: {
      type: reminderSourceSnapshotSchema,
      default: undefined,
    },
    customerSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    vehicleSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    remindAt: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
    },
    dueOdometer: {
      type: Number,
      min: 0,
      index: true,
    },
    channel: {
      type: reminderChannelSchema,
      default: () => ({ inApp: true, email: false, push: false }),
    },
    title: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    manualOverride: {
      type: Boolean,
      default: false,
      index: true,
    },
    snoozedUntil: {
      type: Date,
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    lastNotifiedAt: {
      type: Date,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      index: true,
    },
    cancelledAt: {
      type: Date,
      index: true,
    },
    cancelReason: {
      type: String,
      enum: ['SOURCE_ITEM_REMOVED', 'SERVICE_DELETED', 'USER_CANCELLED', 'COMPLETED', 'DUPLICATE', 'SYSTEM_CLEANUP'],
      index: true,
    },
    lastError: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

reminderSchema.index({ ownerUserId: 1, remindAt: 1 });
reminderSchema.index({ ownerUserId: 1, status: 1, remindAt: 1 });
reminderSchema.index({ ownerUserId: 1, reminderType: 1, remindAt: 1 });
reminderSchema.index({ ownerUserId: 1, serviceId: 1, reminderType: 1 });
reminderSchema.index({ ownerUserId: 1, vehicleId: 1, remindAt: 1 });
reminderSchema.index({ ownerUserId: 1, customerId: 1, remindAt: 1 });

export default mongoose.model('Reminder', reminderSchema);

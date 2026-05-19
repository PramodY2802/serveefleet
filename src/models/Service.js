import mongoose from 'mongoose';

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
    nextServiceDue: {
      type: Date,
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

export default mongoose.model('Service', serviceSchema);

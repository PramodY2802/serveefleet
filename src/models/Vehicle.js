import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
      unique: true,
    },
    make: {
      type: String,
      trim: true,
      index: true,
    },
    model: {
      type: String,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      index: true,
    },
    fuelType: {
      type: String,
      trim: true,
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

vehicleSchema.index({ customer: 1, registrationNumber: 1 });
vehicleSchema.index({ make: 1, model: 1, year: 1 });

export default mongoose.model('Vehicle', vehicleSchema);

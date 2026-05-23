import mongoose from 'mongoose';
import pkg from 'mongoose-sequence';
const AutoIncrement = pkg(mongoose);

const vehicleSchema = new mongoose.Schema({
  _id: {
    type: Number,
  },
  userId: { type: Number, ref: 'Customer' }, // Reference to Customer model
  registrationNumber: String,
  plateColor: {
    type: String,
    enum: ['white', 'yellow', 'black', 'green', 'red'],
    default: 'white',
  },
  make: String,
  model: String,
  year: Number,
  fuelType: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  _id: false // Disable default ObjectId
});

// Auto-increment _id
vehicleSchema.plugin(AutoIncrement, {
  id: 'vehicle_id_counter',
  inc_field: '_id'
});

export default mongoose.model('Vehicle', vehicleSchema);

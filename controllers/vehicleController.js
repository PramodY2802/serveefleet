import Vehicle from '../models/Vehicle.js';

// Get all vehicles for a specific user (by userId as integer)
export const getVehiclesByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId (not a number)" });
    }

    const vehicles = await Vehicle.find({ userId });
    res.status(200).json(vehicles);
  } catch (err) {
    console.error("Failed to fetch vehicles:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const customerId = req.query.customerId || req.user?.userId;
    const numericCustomerId = parseInt(customerId);

    if (isNaN(numericCustomerId)) {
      return res.status(400).json({ error: "Invalid customerId" });
    }

    const vehicles = await Vehicle.find({ userId: numericCustomerId });
    res.status(200).json(vehicles);
  } catch (err) {
    console.error("Failed to fetch vehicles:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

// Create a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      userId: req.body.userId || req.body.customerId,
    };
    delete payload.customerId;

    const newVehicle = new Vehicle(payload);
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (err) {
    console.error("Failed to create vehicle:", err);
    res.status(500).json({ error: "Failed to create vehicle", details: err.message });
  }
};

// Update a vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedVehicle);
  } catch (err) {
    console.error("Failed to update vehicle:", err);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
};

// Delete a vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    await Vehicle.findByIdAndDelete(id);
    res.status(200).json({ message: "Vehicle deleted" });
  } catch (err) {
    console.error("Failed to delete vehicle:", err);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
};

export const getVehicleById = async (req, res) => {
 try {
     const { id } = req.params;
 
     const vehicle = await Vehicle.findOne({ _id: id });
 
     if (!vehicle) {
       return res.status(404).json({ message: 'Vehicle not found' });
     }
 
     res.json(vehicle);
   } catch (err) {
     console.error('Get Vehicle by ID error:', err);
     res.status(500).json({ message: 'Server error' });
   }
};

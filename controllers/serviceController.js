import Service from '../models/Service.js';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';

const isValidDateValue = (value) =>
  value === undefined || value === null || value === '' || !Number.isNaN(Date.parse(value));

const normalizeServicePayload = (payload) => {
  const normalized = { ...payload };

  if (!isValidDateValue(normalized.serviceDate)) {
    return { error: 'Service date must be a valid date.' };
  }

  if (!isValidDateValue(normalized.nextServiceDue)) {
    return { error: 'Next service due must be a valid date.' };
  }

  if (normalized.serviceDate) {
    normalized.serviceDate = new Date(normalized.serviceDate);
  } else {
    delete normalized.serviceDate;
  }

  if (normalized.nextServiceDue) {
    normalized.nextServiceDue = new Date(normalized.nextServiceDue);
  } else {
    delete normalized.nextServiceDue;
  }

  return { data: normalized };
};

// Create a new service record
// export const createService = async (req, res) => {
//   try {
//     const {
//       vehicleId,
//       serviceDate,
//       serviceType,
//       description,
//       cost,
//       servicedBy,
//       nextServiceDue
//     } = req.body;

//     const newService = new Service({
//       vehicleId,
//       serviceDate,
//       serviceType,
//       description,
//       cost,
//       servicedBy,
//       nextServiceDue
//     });

//     await newService.save();
//     res.status(201).json(newService);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to create service', details: error.message });
//   }
// };

const mapServiceWithCustomer = (service) => {
  const record = service.toObject ? service.toObject() : service;
  const vehicle = record.vehicleId;
  const customer = vehicle?.userId;

  return {
    ...record,
    vehicleId: vehicle,
    vehicle: vehicle
      ? {
          ...vehicle,
          customer: customer
            ? {
                id: customer._id,
                name: customer.name,
                email: customer.email,
              }
            : undefined,
        }
      : undefined,
    customer: customer
      ? {
          id: customer._id,
          name: customer.name,
          email: customer.email,
        }
      : undefined,
  };
};

// Get all service records
export const getAllServices = async (req, res) => {
  try {
    const query = {};
    if (req.query.vehicleId) {
      const vehicleId = Number(req.query.vehicleId);
      if (Number.isNaN(vehicleId)) {
        return res.status(400).json({ message: 'Invalid vehicleId' });
      }
      query.vehicleId = vehicleId;
    }

    const services = await Service.find(query)
      .populate({ path: 'vehicleId', populate: { path: 'userId', model: 'Customer' } });

    res.status(200).json(services.map(mapServiceWithCustomer));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// Get service by ID
export const getServiceById = async (req, res) => {
  try {

    console.log('req.params:', req.params);

    const vehicleId = Number(req.params.id);
    console.log(vehicleId)

    if (isNaN(vehicleId)) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }

    const services = await Service.find({ vehicleId }).populate('vehicleId');
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services by vehicleId' });
  }
};

// Update service record
export const updateService = async (req, res) => {
  try {
    const { data, error } = normalizeServicePayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { ...data, updated_at: new Date() },
      { new: true }
    );

    if (!updatedService) return res.status(404).json({ message: 'Service not found' });

    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

// Delete service record
export const deleteService = async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Service not found' });

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};



export const createService = async (req, res) => {
  try {
    const { data, error } = normalizeServicePayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { vehicleId, serviceDate, serviceType, description, cost, servicedBy, nextServiceDue } = data;

    const newService = new Service({
      vehicleId,
      serviceDate,
      serviceType,
      description,
      cost,
      servicedBy,
      nextServiceDue
    });

    await newService.save();

    // Fetch vehicle and customer to send WhatsApp
    const vehicle = await Vehicle.findById(vehicleId);
    const customer = await Customer.findById(vehicle.userId);

    const message = `Hello ${customer.name}, your vehicle (${vehicle.registrationNumber}) was serviced.\n\nService: ${serviceType}\nCost: ₹${cost}\nDescription: ${description}\nNext Due: ${nextServiceDue ? new Date(nextServiceDue).toLocaleDateString() : 'N/A'}\n\nThank you!`;
    const whatsappUrl = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;

    res.status(201).json({ newService, whatsappUrl });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create service', details: error.message });
  }
};


// Get all customers with their vehicles (for search)
export const getCustomerVehicleSearchData = async (req, res) => {
  try {
    // Fetch all customers
    const customers = await Customer.find();

    // Fetch all vehicles
    const vehicles = await Vehicle.find();

    // Combine vehicles with their customer info
    const combinedData = [];

    for (const customer of customers) {
      const customerVehicles = vehicles.filter(
        (v) => v.userId.toString() === customer._id.toString()
      );

      if (customerVehicles.length === 0) {
        combinedData.push({
          customerId: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          vehicleNumber: "N/A",
          make: "-",
          model: "-",
          fuelType: "-",
        });
      } else {
        customerVehicles.forEach((vehicle) => {
          combinedData.push({
            customerId: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            vehicleNumber: vehicle.registrationNumber,
            make: vehicle.make,
            model: vehicle.model,
            fuelType: vehicle.fuelType,
          });
        });
      }
    }

    res.status(200).json(combinedData);
  } catch (error) {
    console.error("Search API error:", error.message);
    res.status(500).json({ error: "Failed to fetch customer and vehicle data" });
  }
};

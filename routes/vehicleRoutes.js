import express from "express";
import {
  getVehicles,
  getVehiclesByUserId,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById
} from "../controllers/vehicleController.js";
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get vehicles using the modular frontend contract: /api/vehicles?customerId=...
router.get("/", protect, getVehicles);

// Get all vehicles for a specific user (userId is integer)
router.get("/:userId", getVehiclesByUserId);

// Create a vehicle
router.post("/", createVehicle);

// Update a vehicle by vehicle ID
router.put("/:id", updateVehicle);

// Delete a vehicle by vehicle ID
router.delete("/:id", deleteVehicle);

router.get("/single/:id", getVehicleById);

export default router;

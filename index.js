// index.js (or server.js)
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import auth from './routes/auth.js';
import customerRoutes from './routes/customerRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import './config/passport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/autopluse';

// Middleware
app.use(express.json());

app.use(cors({
  origin: true, // your frontend origin
  credentials: true
}));


// Routes
app.use('/api/auth', auth);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bills', billingRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.send({ message: 'API is running' });
});

// Connect to MongoDB & start server
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('âœ… MongoDB connected');
    app.listen(PORT, () => {
      console.log(`ðŸš€ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('âŒ MongoDB connection error:', err);
    process.exit(1);
  });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import config from './config/index.js';
import './config/passport.js';
import connectDatabase from './database/index.js';
import { authLimiter, generalLimiter } from './common/middlewares/rateLimiter.js';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customer/customer.routes.js';
import vehicleRoutes from './modules/vehicle/vehicle.routes.js';
import serviceRoutes from './modules/service/service.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import errorHandler from './common/middlewares/errorHandler.js';
import notFoundHandler from './common/middlewares/notFoundHandler.js';
import requestLogger from './common/middlewares/requestLogger.js';
import requestId from './common/middlewares/requestId.js';

const app = express();

app.use(passport.initialize());

app.set('trust proxy', 1);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || config.clientUrls.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(hpp());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xssClean());
app.use(requestId);
app.use(requestLogger);
app.use(generalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bills', billingRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/metrics', (req, res) => res.status(200).json({ status: 'metrics placeholder' }));

app.use(notFoundHandler);
app.use(errorHandler);

await connectDatabase(config.mongoUri);

export default app;

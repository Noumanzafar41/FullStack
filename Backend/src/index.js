// src/index.js



import express from 'express';
import cors from 'cors';

// Now safe to import modules that use process.env
import { ensureSchema } from './database.js';
import authRoutes from './routes/auth.routes.js';
import parameterRoutes from './routes/parameter.routes.js';
import productInspectionRoutes from './routes/product-inspection.routes.js';
import incomingMaterialInspectionRoutes from './routes/incoming-material-inspection.routes.js';
import productInspectionPlanRoutes from './routes/product-inspection-plan.routes.js';
import incomingMaterialInspectionPlanRoutes from './routes/incoming-material-inspection-plan.routes.js';

// Allowed origins for CORS
const defaultAllowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3100'
];
const basOriginRegex = /^https:\/\/port\d+-workspaces-[\w-]+\.([\w-]+\.)*cloud\.sap$/;

const buildAllowedOrigins = () => {
  const allowed = [...defaultAllowedOrigins];
  if (process.env.ALLOWED_ORIGINS) {
    allowed.push(...process.env.ALLOWED_ORIGINS.split(',').map((entry) => entry.trim()));
  }
  return allowed;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = buildAllowedOrigins();
    if (allowedOrigins.includes(origin) || basOriginRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
const port = process.env.PORT || 3100;
const host = process.env.HOST || '0.0.0.0'; // CF requires 0.0.0.0

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/product-inspections', productInspectionRoutes);
app.use('/api/incoming-material-inspections', incomingMaterialInspectionRoutes);
app.use('/api/product-inspection-plans', productInspectionPlanRoutes);
app.use('/api/incoming-material-inspection-plans', incomingMaterialInspectionPlanRoutes);

// 404 handler
app.use((_, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// Global error handler (catch CORS errors and others)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Bootstrap app
const bootstrap = async () => {
  try {
    // Optional: log env vars for debugging
    console.log('HANA_HOST:', process.env.HANA_HOST);

    // Ensure HANA schema and tables exist
    await ensureSchema();

    // Start server
    app.listen(port, host, () => {
      console.log(`Backend API ready → http://${host}:${port}`);
      if (process.env.VCAP_APPLICATION) {
        console.log('Running on SAP BTP / Cloud Foundry');
      }
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error);
    process.exit(1);
  }
};

bootstrap();

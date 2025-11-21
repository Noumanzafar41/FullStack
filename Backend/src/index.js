const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { ensureSchema } = require('./database');

// Import routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const parameterRoutes = require('./routes/parameter.routes');
const productInspectionRoutes = require('./routes/product-inspection.routes');
const incomingMaterialInspectionRoutes = require('./routes/incoming-material-inspection.routes');
const productInspectionPlanRoutes = require('./routes/product-inspection-plan.routes');
const incomingMaterialInspectionPlanRoutes = require('./routes/incoming-material-inspection-plan.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/product-inspections', productInspectionRoutes);
app.use('/api/incoming-material-inspections', incomingMaterialInspectionRoutes);
app.use('/api/product-inspection-plans', productInspectionPlanRoutes);
app.use('/api/incoming-material-inspection-plans', incomingMaterialInspectionPlanRoutes);

app.use((_, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

const bootstrap = async () => {
  try {
    await ensureSchema();
    app.listen(port, () => {
      console.log(`Backend API ready → http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize database connection.', error);
    process.exit(1);
  }
};

bootstrap();

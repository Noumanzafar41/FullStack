// src/routes/incoming-material-inspection.routes.js
import express from 'express';
import {
  getIncomingMaterialInspections,
  createIncomingMaterialInspection
} from '../controllers/incoming-material-inspection.controller.js';

const router = express.Router();

// GET all incoming material inspections
router.get('/', getIncomingMaterialInspections);

// POST a new incoming material inspection
router.post('/', createIncomingMaterialInspection);

export default router;

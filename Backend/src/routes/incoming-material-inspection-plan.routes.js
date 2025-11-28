// src/routes/incoming-material-inspection-plan.routes.js
import express from 'express';
import {
  getIncomingMaterialInspectionPlans,
  createIncomingMaterialInspectionPlan
} from '../controllers/incoming-material-inspection-plan.controller.js';

const router = express.Router();

// GET all incoming material inspection plans
router.get('/', getIncomingMaterialInspectionPlans);

// POST a new incoming material inspection plan
router.post('/', createIncomingMaterialInspectionPlan);

export default router;

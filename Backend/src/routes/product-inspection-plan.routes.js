// src/routes/product-inspection-plan.routes.js
import express from 'express';
import { getProductInspectionPlans, createProductInspectionPlan } from '../controllers/product-inspection-plan.controller.js';

const router = express.Router();

// GET all product inspection plans
router.get('/', getProductInspectionPlans);

// POST a new product inspection plan
router.post('/', createProductInspectionPlan);

export default router;

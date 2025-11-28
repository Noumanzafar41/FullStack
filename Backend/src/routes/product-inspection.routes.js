// src/routes/product-inspection.routes.js
import express from 'express';
import { getProductInspections, createProductInspection } from '../controllers/product-inspection.controller.js';

const router = express.Router();

// GET all product inspections
router.get('/', getProductInspections);

// POST a new product inspection
router.post('/', createProductInspection);

export default router;

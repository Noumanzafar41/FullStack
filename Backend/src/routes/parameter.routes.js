// src/routes/parameter.routes.js
import express from 'express';
import { getParameters, createParameter } from '../controllers/parameter.controller.js';

const router = express.Router();

// GET all parameters
router.get('/', getParameters);

// POST a new parameter
router.post('/', createParameter);

export default router;

const express = require('express');
const router = express.Router();
const { getProductInspectionPlans, createProductInspectionPlan } = require('../controllers/product-inspection-plan.controller');

router.get('/', getProductInspectionPlans);
router.post('/', createProductInspectionPlan);

module.exports = router;

